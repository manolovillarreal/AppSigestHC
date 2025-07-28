import { apiGet, apiPost, apiPut, apiDelete } from "./api"; // o como se llame tu helper para fetch

const BASE_URL = "/TipoDocumento";

/**
 * Obtiene la lista de tipos de documento.
 */
export async function obtenerTiposDocumento() {
  return await apiGet(`${BASE_URL}`);
}
/**
 * Crea un nuevo tipo de documento.
 * @param {Object} data
 */
export async function crearTipoDocumento(data) {
  return await apiPost(`${BASE_URL}`, data);
}

/**
 * Actualiza un tipo de documento existente.
 * @param {number} id
 * @param {Object} data
 */
export async function actualizarTipoDocumento(id, data) {
  return await apiPut(`${BASE_URL}/${id}`, data);
}

/**
 * Elimina un tipo de documento.
 * @param {number} id
 */
export async function eliminarTipoDocumento(id) {
  return await apiDelete(`${BASE_URL}/${id}`);
}
