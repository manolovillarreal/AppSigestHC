import { apiDownloadBlob, apiGet, apiPost,apiDelete ,apiUpload } from "../core/api.js";

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
function rechazarCorreccion(solicitudId,observacion) {
  return apiPost(`/SolicitudCorreccion/${solicitudId}/rechazar`,observacion);
}
export async function eliminarSolicitudCorreccion(solicitudId) {
     return await apiDelete(`/SolicitudCorreccion/${solicitudId}`);
   }

export const SolicitudCorreccionService = {
  obtenerCorreccionesPorRol,
  responderSolicitudCorreccion,
  visualizarCorreccion,
  aprobarCorreccion,
  rechazarCorreccion,
  eliminarSolicitudCorreccion
};
