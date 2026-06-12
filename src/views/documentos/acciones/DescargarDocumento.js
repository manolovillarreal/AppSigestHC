import { DocumentoService } from "../../../api/documento.api.js";
import { downloadBlobFile } from "../../../utils/files.js";

export async function verDocumento(docId) {
  try {
    const res = await DocumentoService.descargar(docId);

    if (!res.ok) {
      alert("No se pudo cargar el documento");
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    window.open(url, "_blank");
  } catch (error) {
    alert("No se pudo cargar el documento");
  }
}

export async function descargarDocumento(doc) {
  const res = await DocumentoService.descargar(doc.id);

  if (!res.ok) {
    alert("No se pudo descargar el documento");
    return;
  }

  await downloadBlobFile(res, doc);
}
