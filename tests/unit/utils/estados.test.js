import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/contexto/contexto.js', () => ({
  default: {
    estadosAtencion: [
      { id: 1, nombre: 'Registrada' },
      { id: 2, nombre: 'En Proceso' },
      { id: 3, nombre: 'Cerrada' }
    ]
  }
}));

const { obtenerNombreEstado, puedeAvanzarEstado } = await import('../../../src/utils/estados.js');

describe('utils/estados', () => {
  it('obtiene nombre de estado por id', () => {
    expect(obtenerNombreEstado(2)).toBe('En Proceso');
  });

  it('retorna Desconocido para estado inexistente', () => {
    expect(obtenerNombreEstado(999)).toBe('Desconocido');
  });

  it('permite avanzar cuando rol tiene permiso', () => {
    expect(puedeAvanzarEstado(1, 'Admisiones')).toBe(true);
  });

  it('niega avanzar cuando rol no tiene permiso', () => {
    expect(puedeAvanzarEstado(5, 'Medico')).toBe(false);
  });

  it('niega avanzar para rol inexistente', () => {
    expect(puedeAvanzarEstado(1, 'RolInexistente')).toBe(false);
  });
});
