import { apiGet } from '../core/api.js';

/**
 * Obtiene las métricas del dashboard para el usuario autenticado.
 * El backend devuelve { rol, global, porRol } según el rol del token.
 * @returns {Promise<{ok:boolean, result?:object, errorMessages?:string[]}>}
 */
async function obtenerDashboard() {
  return await apiGet('/Dashboard');
}

const DashboardService = {
  obtenerDashboard
};

export default DashboardService;
