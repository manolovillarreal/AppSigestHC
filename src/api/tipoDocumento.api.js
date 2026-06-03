
import { apiGet, apiPost, apiPut, apiDelete } from '../core/api.js';

async function obtenerTodos() {
  return await apiGet('/TipoDocumento');
}

async function guardar(tipoDocumento) {
  return await apiPost('/TipoDocumento', tipoDocumento);
}

async function editar(id, tipoDocumento) {
  return await apiPut(`/TipoDocumento/${id}`, tipoDocumento);
}

async function eliminar(id) {
  return await apiDelete(`/TipoDocumento/${id}`);
}

const tipoDocumentoService = {
    obtenerTodos,
    guardar,
    editar,
    eliminar
}

export default tipoDocumentoService;

