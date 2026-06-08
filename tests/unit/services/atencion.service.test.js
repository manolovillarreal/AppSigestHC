import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

function mockResponse({ ok = true, status = 200, body = { ok: true, result: [] } } = {}) {
  return {
    ok,
    status,
    headers: {
      get: (name) => (name === 'Content-Length' ? null : null)
    },
    text: async () => JSON.stringify(body)
  };
}

describe('api/atencion.api', () => {
  let AtencionService;

  beforeEach(async () => {
    vi.resetModules();

    vi.stubGlobal('window', {
      __APP_CONFIG__: { API_URL: 'http://localhost:5000' },
      location: { pathname: '/index.html', href: '' }
    });

    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => 'fake-jwt-token'),
      setItem: vi.fn(),
      removeItem: vi.fn()
    });

    vi.stubGlobal('fetch', vi.fn());

    ({ default: AtencionService } = await import('../../../src/api/atencion.api.js'));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('obtenerAtenciones llama URL PascalCase y retorna resultado normalizado', async () => {
    fetch.mockResolvedValue(mockResponse({ body: { ok: true, result: [{ id: 1 }] } }));

    const result = await AtencionService.obtenerAtenciones({ estadoAtencionId: 3 });

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url] = fetch.mock.calls[0];
    expect(url).toContain('/api/Atenciones?');
    expect(result).toEqual({ ok: true, result: [{ id: 1 }] });
  });

  it('guardarAtencion usa URL PascalCase y propaga respuesta fallida', async () => {
    fetch.mockResolvedValue(
      mockResponse({ ok: false, status: 400, body: { ok: false, result: null, errorMessages: { nombre: ['Requerido'] } } })
    );

    const payload = { pacienteId: 10, terceroId: '9001' };
    const result = await AtencionService.guardarAtencion(payload);

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe('http://10.10.1.1:8002/api/Atenciones');
    expect(options.method).toBe('POST');
    expect(result.ok).toBe(false);
  });
});
