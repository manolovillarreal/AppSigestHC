import { describe, expect, it } from 'vitest';
import { formatearErroresHTML } from '../../../src/utils/error.js';

describe('utils/error', () => {
  it('formatea objeto de errores en html', () => {
    const html = formatearErroresHTML({
      campoA: ['Error A1', 'Error A2'],
      campoB: ['Error B1']
    });

    expect(html).toContain('Error A1');
    expect(html).toContain('Error B1');
    expect(html).toContain('<br>');
  });

  it('retorna vacio para valor vacio o nulo', () => {
    expect(formatearErroresHTML(null)).toBe('');
    expect(formatearErroresHTML(undefined)).toBe('');
    expect(formatearErroresHTML('')).toBe('');
  });

  it('soporta mensajes como string en array', () => {
    const html = formatearErroresHTML({ campo: 'mensaje simple' });
    expect(html).toContain('mensaje simple');
  });
});
