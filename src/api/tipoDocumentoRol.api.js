import { apiGet, apiPost, apiPut, apiDelete } from '../core/api.js';

async function obtenerPorRol(rolId) {
  return await apiGet(`/TipoDocumentoRol/por-rol/${rolId}`);
}

async function obtenerPorTipo(tipoDocumentoId) {
  return await apiGet(`/TipoDocumentoRol/por-tipo/${tipoDocumentoId}`);
}

async function guardar(dto) {
  return await apiPost('/TipoDocumentoRol', dto);
}

async function actualizar(dto) {
  return await apiPut('/TipoDocumentoRol', dto);
}

async function eliminar(tipoDocumentoId, rolId) {
  return await apiDelete(`/TipoDocumentoRol?tipoDocumentoId=${tipoDocumentoId}&rolId=${rolId}`);
}

const TipoDocumentoRolService = {
  obtenerPorRol,
  obtenerPorTipo,
  guardar,
  actualizar,
  eliminar,
};

export default TipoDocumentoRolService;
