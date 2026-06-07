import { apiGet, apiPut } from '../core/api.js';

export async function obtenerRutaDocumentos() {
  const res = await apiGet('/Configuracion');
  if (!res.ok) return res;
  // Filtra la configuración de ruta_base_documentos del array
  const config = res.result?.find(c => c.clave === 'ruta_base_documentos');
  return { ...res, result: config };
}

export async function actualizarRutaDocumentos(valor) {
  return await apiPut('/Configuracion/ruta_base_documentos', { valor });
}
