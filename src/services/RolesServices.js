import { apiGet, apiPost, apiPut, apiDelete } from '../api/api.js';

async function obtenerRoles() {
  return await apiGet('/usuarios');
}

async function guardarRol(usuario) {
  return await apiPost('/usuarios', usuario);
}

async function editarRol(id, usuario) {
  return await apiPut(`/usuarios/${id}`, usuario);
}

async function eliminarRol(id) {
  return await apiDelete(`/usuarios/${id}`);
}

const RolService = {
    obtenerRoles,
    guardarRol,
    editarRol,
    eliminarRol
}

export default RolService;
