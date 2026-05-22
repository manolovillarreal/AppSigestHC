import { apiGet, apiPost, apiPut, apiDelete } from '../api/api.js';

async function obtenerRoles() {
  return await apiGet('/roles');
}

async function guardarRol(usuario) {
  return await apiPost('/roles', usuario);
}

async function editarRol(id, usuario) {
  return await apiPut(`/roles/${id}`, usuario);
}

async function eliminarRol(id) {
  return await apiDelete(`/roles/${id}`);
}

const RolService = {
    obtenerRoles,
    guardarRol,
    editarRol,
    eliminarRol
}

export default RolService;
