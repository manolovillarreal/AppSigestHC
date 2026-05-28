const extensionPorTipo = {
  'application/pdf': '.pdf',
  'application/xml': '.xml',
  'application/json': '.json',
  'text/plain': '.txt'
};

export function generarNombreArchivo(doc, response = null, extension = null) {
  let filename = null;

  if (response) {
    const disposition = response.headers.get('Content-Disposition');
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename=\"?(.+?)\"?$/);
      if (match) filename = decodeURIComponent(match[1]);
    }
  }

  if (!filename) {
    let ext = extension;
    if (!ext && response) {
      const contentType = response.headers.get('Content-Type');
      ext = extensionPorTipo[contentType] || '';
    }
    if (!ext && doc.tipoDocumento?.extensionPermitida) {
      ext = `.${doc.tipoDocumento.extensionPermitida}`;
    }
    if (!ext) ext = '';

    const { tipoDocumento, atencion } = doc;
    const { paciente } = atencion;

    let nombreBase = `${tipoDocumento.codigo}_${paciente.primerNombre} ${paciente.primerApellido}`;

    if (tipoDocumento.requiereNumeroRelacion && doc.numeroRelacion) {
      const numeroFormateado = String(doc.numeroRelacion).padStart(5, '0');
      nombreBase += `_${numeroFormateado}`;
    }

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

export async function downloadBlobFile(response, doc) {
  let url = null;
  let anchor = null;

  try {
    const blob = await response.blob();
    const filename = generarNombreArchivo(doc, response);

    url = window.URL.createObjectURL(blob);
    anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
  } catch (err) {
    console.log(err);
  } finally {
    if (anchor && anchor.parentNode) {
      anchor.parentNode.removeChild(anchor);
    }
    if (url) {
      window.URL.revokeObjectURL(url);
    }
  }
}
