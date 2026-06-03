import { apiGet, apiPost, apiPut } from '../core/api.js';

async function obtenerAtenciones(filtros) {
    const params = new URLSearchParams();
    if (filtros) {
        if (filtros.atencionId) params.append('atencionId', filtros.atencionId);
        if (filtros.estadoAtencionId) params.append('estadoAtencionId', filtros.estadoAtencionId);
        if (filtros.terceroId) params.append('terceroId', filtros.terceroId);
        if (filtros.pacienteId) params.append('pacienteId', filtros.pacienteId);
        if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
        if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);
        if (filtros.page) params.append('page', filtros.page);
        if (filtros.pageSize) params.append('pageSize', filtros.pageSize);
    }
    return await apiGet(`/Atenciones?${params.toString()}`);
}
async function obtenerAtencionesVisibles() {    
  return await apiGet('/Atenciones/visibles');
}

async function guardarAtencion(atencion) {
  return await apiPost('/Atenciones', atencion);
}
async function avanzarAtencion(payload) {
  return await apiPost(`/Atenciones/cambiar-estado`, payload);
}

async function editarAtencion(id, atencion) {
  return await apiPut(`/Atenciones/${id}`, atencion);
}

async function anularAtencion(id,payload) {
  return await apiPost(`/Atenciones/${id}/anular`, payload);
}

const AtencionService = {
    obtenerAtenciones,
    obtenerAtencionesVisibles,
    guardarAtencion,
    editarAtencion,
    anularAtencion
}

export default AtencionService;
