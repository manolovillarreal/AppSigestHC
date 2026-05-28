import { describe, expect, it } from 'vitest';
import { generarNombreArchivo } from '../../../src/utils/files.js';

describe('utils/files', () => {
  const docBase = {
    tipoDocumento: {
      codigo: 'HC',
      extensionPermitida: 'pdf',
      requiereNumeroRelacion: true,
      esAsistencial: true
    },
    numeroRelacion: 12,
    fecha: '2026-05-27T08:15:00Z',
    atencion: {
      paciente: {
        primerNombre: 'Ana',
        primerApellido: 'Gomez'
      }
    }
  };

  it('usa filename de Content-Disposition cuando existe', () => {
    const response = {
      headers: {
        get: (key) => (key === 'Content-Disposition' ? 'attachment; filename="archivo.pdf"' : null)
      }
    };

    const name = generarNombreArchivo(docBase, response);
    expect(name).toBe('archivo.pdf');
  });

  it('genera nombre con relacion y fecha cuando no hay header', () => {
    const response = {
      headers: {
        get: () => null
      }
    };

    const name = generarNombreArchivo(docBase, response);
    expect(name).toContain('HC_Ana Gomez_00012_');
    expect(name.endsWith('.pdf')).toBe(true);
  });

  it('respeta extension explicita', () => {
    const response = {
      headers: {
        get: () => null
      }
    };

    const name = generarNombreArchivo(docBase, response, '.xml');
    expect(name.endsWith('.xml')).toBe(true);
  });
});
