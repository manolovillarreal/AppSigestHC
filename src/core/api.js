import { API_URL } from './config.js';
import auth from './auth.js';


function getAuthHeaders() {
  return { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
}

export function getTokenHeader() {
  return getAuthHeaders();
}

function isLoginPage() {
  return window.location.pathname.endsWith('/login.html') || window.location.pathname.endsWith('login.html');
}

function handleUnauthorized(res) {
  if (res.status !== 401) {
    return false;
  }

  if (!isLoginPage()) {
    auth.logout();
    window.location.href = '/login.html';
  }

  return true;
}

async function manejarRespuesta(res) {
  try {
    // console.log(res);
    const contentLength = res.headers.get('Content-Length');
    if (res.status === 204 || contentLength === '0') {
      const response = { ok: true, result: null };
      Object.defineProperty(response, 'status', {
        value: res.status,
        enumerable: false,
        configurable: true,
        writable: true,
      });
      return response;
    }

    const raw = await res.text();
    if (!raw || !raw.trim()) {
      return { ok: true, result: null, status: res.status };
    }

    const data = JSON.parse(raw);
    
  
  if (!res.ok)  {
    const mensaje = data?.mensaje || 'Error desconocido';
    const errores = data?.data?.ErrorMessages || null;

   
    console.warn(`❗ Error API: ${mensaje}`);
    if (errores) console.warn('Detalles:', errores);
  }

  Object.defineProperty(data, 'status', {
    value: res.status,
    enumerable: false,
    configurable: true,
    writable: true,
  });
  return data;
  } catch (error) {
    console.error('Error al manejar respuesta:', error);
    return {
      ok: false,
      errorMessages: ['Error al procesar la respuesta del servidor']
    };
  }
  
}

// --- Métodos genéricos --- //

export async function apiGet(path) {  
  const res = await fetch(`${API_URL}${path}`, {
    headers: getAuthHeaders()
  });

  if (handleUnauthorized(res)) {
    return { ok: false, errorMessages: ['No autorizado'] };
  }
  
  if(res.error)
    console.log(res.error);
  
  
  return await manejarRespuesta(res);
}

export async function apiPost(path, body ) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (handleUnauthorized(res)) {
    return { ok: false, errorMessages: ['No autorizado'] };
  }

  return await manejarRespuesta(res);
}
export async function apiPut(path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method:  'PUT',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (handleUnauthorized(res)) {
    return { ok: false, errorMessages: ['No autorizado'] };
  }

  return await manejarRespuesta(res);
}

export async function apiPatch(path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method:  'PATCH',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (handleUnauthorized(res)) {
    return { ok: false, errorMessages: ['No autorizado'] };
  }

  return await manejarRespuesta(res);
}

export async function apiDownloadBlob(path) {
    const res = await fetch(`${API_URL}${path}`, {
      headers: getAuthHeaders(),
      mode: 'cors'
    });

    if (handleUnauthorized(res)) {
      return res;
    }

    if (!res.ok) 
      debug.log(res.error)

    return res;
}
export async function apiUpload(path, formData) {
  console.log(`${API_URL}${path}`);
  
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData
  });

  if (handleUnauthorized(res)) {
    return { ok: false, errorMessages: ['No autorizado'] };
  }

  return await manejarRespuesta(res);
}
export async function apiDelete(path,body) {
  const res = await fetch(API_URL + path, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (handleUnauthorized(res)) {
    return { ok: false, errorMessages: ['No autorizado'] };
  }

   return await manejarRespuesta(res);
}

// --- Funciones específicas --- //

export async function buscarPacienteAPI(pacienteId) {
  const res = await fetch(`${API_URL}/api/Pacientes?pacienteId=${pacienteId}`, {
    headers: getAuthHeaders()
  });

  if (handleUnauthorized(res)) {
    return null;
  }

  const data = await res.json();
  if (!res.ok && DEBUG_API) {
    console.warn('❗ Error al buscar paciente:', data?.ErrorMessages || 'Sin mensaje');
  }

  return res.ok ? data.result : null;
}

export async function crearAtencionAPI(pacienteId,terceroId) {
  const payload = {
    pacienteId,
    terceroId
  };
  return await apiPost('/api/Atenciones', payload);
}
