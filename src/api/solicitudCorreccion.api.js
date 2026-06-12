import { apiDownloadBlob, apiGet, apiPost,apiDelete ,apiUpload } from "../core/api.js";
import { PAGE_SIZE } from "../core/config.js";

async function obtenerCorreccionesPorRol(filtros = {}) {
  const params = new URLSearchParams();
  if (filtros.pacienteId) params.append('pacienteId', filtros.pacienteId);
  if (filtros.estadoCorreccionId) params.append('estadoCorreccionId', filtros.estadoCorreccionId);
  if (filtros.fechaInicial) params.append('fechaInicial', filtros.fechaInicial);
  if (filtros.fechaFinal) params.append('fechaFinal', filtros.fechaFinal);
  if (filtros.tipoDocumentoId) params.append('tipoDocumentoId', filtros.tipoDocumentoId);
  if (filtros.numeroRelacion) params.append('numeroRelacion', filtros.numeroRelacion);
  params.append('page', filtros.page || 1);
  params.append('pageSize', filtros.pageSize || PAGE_SIZE);

  const query = params.toString();
  return await apiGet(`/SolicitudCorreccion/por-rol${query ? '?' + query : ''}`);
}

function obtenerEnviadasPorRol() {
  return apiGet("/SolicitudCorreccion/enviadas-por-rol");
}

function solicitarCorreccion(payload) {
  return apiPost("/SolicitudCorreccion/", payload);
}

function responderSolicitudCorreccion(solicitudId, data) {
  return apiUpload(`/SolicitudCorreccion/${solicitudId}/responder`, data);
}

function visualizarCorreccion(solicitudId) {
  return apiDownloadBlob(`/SolicitudCorreccion/${solicitudId}/visualizar`);
}
function obtenerThumbnail(solicitudId) {
  return apiGet(`/SolicitudCorreccion/thumbnails/${solicitudId}`);
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
  obtenerEnviadasPorRol,
  solicitarCorreccion,
  responderSolicitudCorreccion,
  visualizarCorreccion,
  obtenerThumbnail,
  aprobarCorreccion,
  rechazarCorreccion,
  eliminarSolicitudCorreccion
};
