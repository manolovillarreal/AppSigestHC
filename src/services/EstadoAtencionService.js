import { apiGet, apiPost, apiPut, apiDelete } from '../api/api.js';

async function obtenerEstadosAtencion() {
  return await apiGet('/EstadoAtencion');
}



const EstadoAtencionService = {
    obtenerEstadosAtencion
}

export default EstadoAtencionService;
