import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  formatearFecha,
  formatearFechaHora,
  calcularEdad,
  calcularEdadTexto
} from '../../../src/utils/date.js';

describe('utils/date', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-27T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formatearFecha retorna string para fecha valida', () => {
    const result = formatearFecha('2026-05-27T00:00:00Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('formatearFecha y formatearFechaHora no lanzan con null/undefined', () => {
    expect(() => formatearFecha(null)).not.toThrow();
    expect(() => formatearFecha(undefined)).not.toThrow();
    expect(() => formatearFechaHora(null)).not.toThrow();
    expect(() => formatearFechaHora(undefined)).not.toThrow();
  });

  it('calcularEdad calcula edad en caso normal', () => {
    expect(calcularEdad('2000-01-01T00:00:00Z')).toBe(26);
  });

  it('calcularEdad contempla borde antes de cumplir anos', () => {
    expect(calcularEdad('2000-12-31T00:00:00Z')).toBe(25);
  });

  it('calcularEdadTexto retorna dias para recien nacido', () => {
    const text = calcularEdadTexto('2026-05-20T00:00:00Z');
    expect(text).toContain('dia');
  });

  it('calcularEdadTexto retorna meses para menor de 1 ano', () => {
    const text = calcularEdadTexto('2026-01-01T00:00:00Z');
    expect(text).toContain('mes');
  });

  it('calcularEdadTexto retorna anos para mayor de 1 ano', () => {
    const text = calcularEdadTexto('2000-01-01T00:00:00Z');
    expect(text).toContain('ano');
  });
});
