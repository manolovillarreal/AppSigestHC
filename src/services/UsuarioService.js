import { apiGet, apiPost, apiPut, apiDelete } from '../api/api.js';

async function obtenerUsuarios() {
  return await apiGet('/Usuarios');
}

async function guardarUsuario(usuario) {
  return await apiPost('/Usuarios', usuario);
}

async function editarUsuario(id, usuario) {
  return await apiPut(`/Usuarios/${id}`, usuario);
}

async function eliminarUsuario(id) {
  return await apiDelete(`/Usuarios/${id}`);
}

const usuarioService = {
    obtenerUsuarios,
    guardarUsuario,
    editarUsuario,
    eliminarUsuario
}

export default usuarioService;
