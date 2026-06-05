import { apiGet, apiPut } from '../core/api.js';

export async function obtenerRutaDocumentos() {
  return await apiGet('/Configuracion/ruta-documentos');
}

export async function actualizarRutaDocumentos(valor) {
  return await apiPut('/Configuracion/ruta-documentos', { valor });
}
