// 🔍 Extensiones comunes por tipo MIME
const extensionPorTipo = {
  "application/pdf": ".pdf",
  "application/xml": ".xml",
  "application/json": ".json",
  "text/plain": ".txt",
};

/**
 * Genera un nombre de archivo para un documento
 * @param {Object} doc - Objeto documento con tipoDocumento y atencion
 * @param {Response} response - Response del fetch (opcional)
 * @param {string} extension - Extensión del archivo (opcional)
 * @returns {string} Nombre del archivo
 */
export function generarNombreArchivo(doc, response = null, extension = null) {
  let filename = null;

  // Intentar obtener nombre desde cabecera Content-Disposition
  if (response) {
    const disposition = response.headers.get("Content-Disposition");
    if (disposition && disposition.includes("filename=")) {
      const match = disposition.match(/filename="?(.+?)"?$/);
      if (match) filename = decodeURIComponent(match[1]);
    }
  }

  // Si no hay nombre, generamos uno
  if (!filename) {
    // Determinar extensión
    let ext = extension;
    if (!ext && response) {
      const contentType = response.headers.get("Content-Type");
      ext = extensionPorTipo[contentType] || "";
    }
    if (!ext && doc.tipoDocumento?.extensionPermitida) {
      ext = `.${doc.tipoDocumento.extensionPermitida}`;
    }
    if (!ext) ext = "";

    const { tipoDocumento, atencion } = doc;
    const { paciente } = atencion;
    
    // Construir nombre base
    let nombreBase = `${tipoDocumento.codigo}_${paciente.primerNombre} ${paciente.primerApellido}`;
    
    // Agregar número de relación si es requerido
    if (tipoDocumento.requiereNumeroRelacion && doc.numeroRelacion) {
      const numeroFormateado = String(doc.numeroRelacion).padStart(5, '0');
      nombreBase += `_${numeroFormateado}`;
    }
    
    // Agregar fecha si es asistencial
    if (tipoDocumento.esAsistencial && doc.fecha) {
      const fecha = new Date(doc.fecha);
      const dd = String(fecha.getDate()).padStart(2, '0');
      const MM = String(fecha.getMonth() + 1).padStart(2, '0');
      const yyyy = fecha.getFullYear();
      const HH = String(fecha.getHours()).padStart(2, '0');
      const mm = String(fecha.getMinutes()).padStart(2, '0');
      nombreBase += `_${dd}-${MM}-${yyyy}-${HH}:${mm}`;
    }
    
    filename = `${nombreBase}${ext}`;
  }

  return filename;
}

export async function downloadBlobFile(response,doc) {

    try{
        const blob = await response.blob();

        
    const contentType = response.headers.get("Content-Type");
    const disposition = response.headers.get("Content-Disposition");

    for (let [key, value] of response.headers.entries()) {
  console.log(`${key}: ${value}`);
  }

    // Generar nombre de archivo
    const filename = generarNombreArchivo(doc, response);

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
    }
    catch(err){
        console.log(err);
        
    }
    
    
}