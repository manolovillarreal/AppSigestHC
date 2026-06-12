import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { API_URL } from '../../../src/core/config.js';

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

describe('api/solicitudCorreccion.api', () => {
  let SolicitudCorreccionService;

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

    ({ SolicitudCorreccionService } = await import('../../../src/api/solicitudCorreccion.api.js'));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('aprobarCorreccion llama endpoint correcto y retorna {ok,result}', async () => {
    fetch.mockResolvedValue(mockResponse({ body: { ok: true, result: { estado: 'aprobada' } } }));

    const result = await SolicitudCorreccionService.aprobarCorreccion(7, true);

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe(`${API_URL}/SolicitudCorreccion/7/aprobar`);
    expect(options.method).toBe('POST');
    expect(result).toEqual({ ok: true, result: { estado: 'aprobada' } });
  });

  it('rechazarCorreccion propaga respuesta fallida', async () => {
    fetch.mockResolvedValue(mockResponse({ ok: false, status: 400, body: { ok: false, result: null } }));

    const result = await SolicitudCorreccionService.rechazarCorreccion(9, { observacion: 'invalido' });

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url] = fetch.mock.calls[0];
    expect(url).toBe(`${API_URL}/SolicitudCorreccion/9/rechazar`);
    expect(result.ok).toBe(false);
  });
});
