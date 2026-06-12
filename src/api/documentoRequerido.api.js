import { apiGet, apiPost, apiDelete } from '../core/api.js';

async function obtenerPorEstado(estadoAtencionId) {
  return await apiGet(`/DocumentosRequeridos/por-estado/${estadoAtencionId}`);
}

async function obtenerPorTipo(tipoDocumentoId) {
  return await apiGet(`/DocumentosRequeridos/por-tipo/${tipoDocumentoId}`);
}

async function guardar(dto) {
  return await apiPost('/DocumentosRequeridos', dto);
}

async function eliminar(id) {
  return await apiDelete(`/DocumentosRequeridos/${id}`);
}

const DocumentoRequeridoService = {
  obtenerPorEstado,
  obtenerPorTipo,
  guardar,
  eliminar,
};

export default DocumentoRequeridoService;
