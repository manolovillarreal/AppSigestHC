import { apiDownloadBlob, apiGet, apiPost, apiUpload } from "../api/api.js";

function obtenerCorreccionesPorRol() {
  return apiGet("/SolicitudCorreccion/por-rol");
}

function responderSolicitudCorreccion(solicitudId, data) {
  return apiUpload(`/SolicitudCorreccion/${solicitudId}/responder`, data);
}

function visualizarCorreccion(solicitudId) {
  return apiDownloadBlob(`/SolicitudCorreccion/${solicitudId}/visualizar`);
}
function aprobarCorreccion(solicitudId, conservarDocumentoAnterior) {
  return apiPost(`/SolicitudCorreccion/${solicitudId}/aprobar`, { conservarDocumentoAnterior });
}

export const SolicitudCorreccionService = {
  obtenerCorreccionesPorRol,
  responderSolicitudCorreccion,
  visualizarCorreccion,
  aprobarCorreccion
};