import { apiDownloadBlob, apiGet,apiPut,apiPost, apiUpload } from "../core/api.js";
import { downloadBlobFile, generarNombreArchivo } from "../utils/files.js";

function EnviarDocumentoFirmado(documentId, data) {
    return apiUpload(`/Documentos/firmar/${documentId}`, data);
}

async function descargarMultiples(documentos, tipo) {
    if (tipo === 'separados') {
        return await descargarSeparados(documentos);
    } else if (tipo === 'zip') {
        return await descargarComoZip(documentos);
    } else if (tipo === 'pdf') {
        return await descargarComoPdf(documentos);
    }
}

async function descargarSeparados(documentos) {
    // Descargar cada documento individualmente
    for (const doc of documentos) {
        const res = await apiDownloadBlob(`/Documentos/ver/${doc.id}`);
        if (res.ok) {
            await downloadBlobFile(res, doc);
            // Pequeña pausa entre descargas
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }
    return { ok: true };
}

async function descargarDocumentosParalelo(documentos) {
    const descargas = documentos.map(async (doc) => {
        const res = await apiDownloadBlob(`/Documentos/ver/${doc.id}`);
        if (res.ok) {
            const blob = await res.blob();
            const extension = obtenerExtension(doc);
            const nombreArchivo = generarNombreArchivo(doc, res, `.${extension}`);
            return { blob, nombre: nombreArchivo, success: true, doc };
        }
        return { success: false, doc };
    });

    const resultados = await Promise.all(descargas);
    const exitosos = resultados.filter(r => r.success);

    if (exitosos.length === 0) {
        throw new Error("No se pudo descargar ningún documento");
    }

    return exitosos;
}

function obtenerNombreUnico(nombre, nombresUsados) {
    let nombreFinal = nombre;
    
    if (nombresUsados.has(nombre)) {
        const contador = nombresUsados.get(nombre) + 1;
        nombresUsados.set(nombre, contador);
        
        const puntoIndex = nombre.lastIndexOf('.');
        if (puntoIndex > 0) {
            nombreFinal = `${nombre.substring(0, puntoIndex)} (${contador})${nombre.substring(puntoIndex)}`;
        } else {
            nombreFinal = `${nombre} (${contador})`;
        }
    } else {
        nombresUsados.set(nombre, 1);
    }
    
    return nombreFinal;
}

async function crearZipDesdeBlobs(archivos) {
    const JSZip = window.JSZip;
    if (!JSZip) {
        throw new Error("JSZip no está disponible. Incluye la librería en tu proyecto.");
    }

    const zip = new JSZip();
    const nombresUsados = new Map();
    
    archivos.forEach(({ blob, nombre }) => {
        const nombreFinal = obtenerNombreUnico(nombre, nombresUsados);
        zip.file(nombreFinal, blob);
    });

    return await zip.generateAsync({ type: "blob" });
}

function descargarBlob(blob, nombreArchivo) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

async function descargarComoZip(documentos) {
    const exitosos = await descargarDocumentosParalelo(documentos);
    const zipBlob = await crearZipDesdeBlobs(exitosos);
    descargarBlob(zipBlob, `documentos_${Date.now()}.zip`);
    return { ok: true, descargados: exitosos.length, total: documentos.length };
}

async function descargarComoPdf(documentos) {
    // Descargar todos los documentos en paralelo
    const descargas = documentos.map(async (doc) => {
        const res = await apiDownloadBlob(`/Documentos/ver/${doc.id}`);
        if (res.ok) {
            const blob = await res.blob();
            return { blob, doc, success: true };
        }
        return { success: false, doc };
    });

    const resultados = await Promise.all(descargas);
    const exitosos = resultados.filter(r => r.success);

    if (exitosos.length === 0) {
        throw new Error("No se pudo descargar ningún documento");
    }

    // Unificar PDFs usando pdf-lib
    const { PDFDocument } = window.PDFLib;
    if (!PDFDocument) {
        throw new Error("pdf-lib no está disponible. Incluye la librería en tu proyecto.");
    }

    const pdfUnificado = await PDFDocument.create();

    // Procesar cada documento
    for (const { blob, doc } of exitosos) {
        try {
            const arrayBuffer = await blob.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const pages = await pdfUnificado.copyPages(pdfDoc, pdfDoc.getPageIndices());
            pages.forEach(page => pdfUnificado.addPage(page));
        } catch (error) {
            console.warn(`No se pudo procesar el documento ${doc.tipoDocumento.nombre}:`, error);
        }
    }

    // Generar el PDF unificado
    const pdfBytes = await pdfUnificado.save();
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

    // Descargar el PDF
    const url = window.URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `documentos_unificados_${Date.now()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    return { ok: true, descargados: exitosos.length, total: documentos.length };
}

function obtenerExtension(doc) {
    // Obtener extensión del documento según su tipo
    const extension = doc.tipoDocumento?.extensionPermitida;
    if (extension) return extension;
    
    // Fallback basado en mimeType
    const mimeType = doc.tipoDocumento?.mimeType || '';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('xml')) return 'xml';
    if (mimeType.includes('json')) return 'json';
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
    if (mimeType.includes('png')) return 'png';
    
    return 'bin'; // Extensión genérica
}

async function obtenerPapelera(atencionId) {
    return apiGet(`/Documentos/papelera/${atencionId}`);
}

async function restaurarDocumento(id) {
    return apiPost(`/Documentos/${id}/restaurar`, {});
}

export async function importarDocumentoIdentidad(atencionId) {
    return await apiPost(`/Documentos/importar-documento-identidad/${atencionId}`);
}

export const DocumentoService = {
    EnviarDocumentoFirmado,
    descargarMultiples,
    descargarSeparados,
    descargarComoZip,
    descargarComoPdf,
    obtenerPapelera,
    restaurarDocumento,
    importarDocumentoIdentidad
};
