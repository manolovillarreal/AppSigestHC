import { apiGet, apiPost, apiPut, apiDelete } from '../api/api.js';

async function obtenerRoles() {
  return await apiGet('/Roles');
}

async function guardarRol(usuario) {
  return await apiPost('/Roles', usuario);
}

async function editarRol(id, usuario) {
  return await apiPut(`/Roles/${id}`, usuario);
}

async function eliminarRol(id) {
  return await apiDelete(`/Roles/${id}`);
}

const RolService = {
    obtenerRoles,
    guardarRol,
    editarRol,
    eliminarRol
}

export default RolService;
