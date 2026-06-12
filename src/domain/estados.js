import contexto from '../core/store.js';

export const ordenEstados = [1, 2, 3, 4, 5, 6, 7];

export function obtenerNombreEstado(estadoId) {
  const { estadosAtencion } = contexto;
  const estado = estadosAtencion.find((e) => e.id === estadoId);
  return estado ? estado.nombre : 'Desconocido';
}

const reglasCambioEstado = {
  Admisiones: [1, 4],
  Medico: [2],
  Enfermeria: [3],
  Auditoria: [4, 5],
  Facturacion: [6],
  Administrador: [1, 2, 3, 4, 5, 6]
};

export function puedeAvanzarEstado(estadoId, rolNombre) {
  const permitidos = reglasCambioEstado[rolNombre] || [];
  return permitidos.includes(estadoId);
}

export function obtenerSiguienteEstado(estadoActualId) {
  const { estadosAtencion } = contexto;
  if (!estadosAtencion) return null;
  const actual = estadosAtencion.find(e => e.id === estadoActualId);
  if (!actual) return null;
  return estadosAtencion.find(e => e.orden === actual.orden + 1) || null;
}
