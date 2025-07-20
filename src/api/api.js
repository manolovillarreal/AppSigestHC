import { API_URL } from '../config/config.js';



export function getTokenHeader() {
  const token = localStorage.getItem('token');
   return {
     'Authorization': `Bearer ${token}`
};
 }

async function manejarRespuesta(res) {
  const data = await res.json();

  if (!res.ok)  {
    const mensaje = data?.mensaje || 'Error desconocido';
    const errores = data?.data?.ErrorMessages || null;

    console.log(data);
    
    console.warn(`❗ Error API: ${mensaje}`);
    if (errores) console.warn('Detalles:', errores);
  }

  return data;
}

// --- Métodos genéricos --- //

export async function apiGet(path) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: getTokenHeader()
  });
  return await manejarRespuesta(res);
}

export async function apiPost(path, body ) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      ...getTokenHeader(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  return await manejarRespuesta(res);
}
export async function apiPut(path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method:  'PUT',
    headers: {
      ...getTokenHeader(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  return await manejarRespuesta(res);
}

export async function apiDownloadBlob(path) {
    const res = await fetch(`${API_URL}${path}`, {
      headers: getTokenHeader(),
      mode: 'cors'
    });
    if (!res.ok) 
      debug.log(res.error)

    return res;
}
export async function apiUpload(path, formData) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: getTokenHeader(),
    body: formData
  });
  return await manejarRespuesta(res);
}
export async function apiDelete(path) {
  const res = await fetch(API_URL + path, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
   return await manejarRespuesta(res);
}

// --- Funciones específicas --- //

export async function buscarPacienteAPI(pacienteId) {
  const res = await fetch(`${API_URL}/api/Pacientes?pacienteId=${pacienteId}`, {
    headers: getTokenHeader()
  });

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
