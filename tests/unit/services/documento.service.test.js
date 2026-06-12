import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { API_URL } from '../../../src/core/config.js';

function mockJsonResponse({ ok = true, status = 200, body = { ok: true, result: { id: 1 } } } = {}) {
  return {
    ok,
    status,
    headers: {
      get: (name) => (name === 'Content-Length' ? null : null)
    },
    text: async () => JSON.stringify(body)
  };
}

function mockBlobResponse({ ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    headers: {
      get: () => null,
      entries: function* entries() {}
    },
    blob: async () => new Blob(['test'], { type: 'application/pdf' })
  };
}

describe('api/documento.api', () => {
  let DocumentoService;

  beforeEach(async () => {
    vi.resetModules();

    vi.stubGlobal('window', {
      __APP_CONFIG__: { API_URL: 'http://localhost:5000' },
      location: { pathname: '/index.html', href: '' },
      URL: {
        createObjectURL: vi.fn(() => 'blob:mock'),
        revokeObjectURL: vi.fn()
      }
    });

    vi.stubGlobal('document', {
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
      createElement: vi.fn(() => ({ click: vi.fn() }))
    });

    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => 'fake-jwt-token'),
      setItem: vi.fn(),
      removeItem: vi.fn()
    });

    vi.stubGlobal('fetch', vi.fn());

    ({ DocumentoService } = await import('../../../src/api/documento.api.js'));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('EnviarDocumentoFirmado usa endpoint /Documentos en PascalCase', async () => {
    fetch.mockResolvedValue(mockJsonResponse({ body: { ok: true, result: { id: 100 } } }));

    const fd = new FormData();
    fd.append('file', new Blob(['pdf'], { type: 'application/pdf' }), 'a.pdf');
    const result = await DocumentoService.EnviarDocumentoFirmado(100, fd);

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe(`${API_URL}/Documentos/firmar/100`);
    expect(options.method).toBe('POST');
    expect(result).toEqual({ ok: true, result: { id: 100 } });
  });

  it('EnviarDocumentoFirmado propaga respuesta fallida', async () => {
    fetch.mockResolvedValue(mockJsonResponse({ ok: false, status: 400, body: { ok: false, result: null } }));

    const fd = new FormData();
    fd.append('file', new Blob(['pdf'], { type: 'application/pdf' }), 'a.pdf');
    const result = await DocumentoService.EnviarDocumentoFirmado(9, fd);

    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe(`${API_URL}/Documentos/firmar/9`);
    expect(options.method).toBe('POST');
    expect(result.ok).toBe(false);
  });
});
