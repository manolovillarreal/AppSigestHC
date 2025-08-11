import { apiGet, apiPost, apiPut, apiDelete } from '../api/api.js';

async function obtenerUsuarios() {
  return await apiGet('/usuarios');
}

async function guardarUsuario(usuario) {
  return await apiPost('/usuarios', usuario);
}

async function editarUsuario(id, usuario) {
  return await apiPut(`/usuarios/${id}`, usuario);
}

async function eliminarUsuario(id) {
  return await apiDelete(`/usuarios/${id}`);
}

const usuarioService = {
    obtenerUsuarios,
    guardarUsuario,
    editarUsuario,
    eliminarUsuario
}

export default usuarioService;
