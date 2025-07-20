// src/helpers/estados.js

export const ordenEstados = [1, 2, 3, 4, 5, 6, 7];

export const nombreEstados = {
  1: 'Admisión',
  2: 'Consulta',
  3: 'Ingreso',
  4: 'Cierre',
  5: 'Auditoría',
  6: 'Facturación',
  7: 'Archivado'
};

export function obtenerNombreEstado(estadoId) {
  return nombreEstados[estadoId] || 'Desconocido';
}

const reglasCambioEstado = {
  Admisiones: [1, 4],
  Medico: [1, 2],
  Enfermeria: [3],
  Auditoria: [4, 5],
  Facturacion: [6],
  Administrador: [1, 2, 3, 4, 5, 6]
};

export function puedeAvanzarEstado(estadoId, rolNombre) {
  console.log("estadoId:",estadoId);
  console.log("rolNombre:",rolNombre);
  
  const permitidos = reglasCambioEstado[rolNombre] || [];
  console.log(permitidos);
  
  return permitidos.includes(estadoId);
}
