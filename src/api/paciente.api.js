import { apiGet } from '../core/api.js';

async function obtenerIngresos() {
  return await apiGet('/Pacientes/ingresos');
}

async function obtenerUltimoIngreso() {
  return await apiGet('/Pacientes/ultimo');
}

const PacienteService = {
  obtenerIngresos,
  obtenerUltimoIngreso,
};

export default PacienteService;
