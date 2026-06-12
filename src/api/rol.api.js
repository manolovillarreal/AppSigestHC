import { apiGet } from '../core/api.js';

async function obtenerRoles() {
  return await apiGet('/Roles');
}

const RolService = {
  obtenerRoles,
};

export default RolService;
