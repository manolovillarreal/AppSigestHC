import { apiGet } from "../api/api.js";
import debug from "../helpers/debug.js";

// auth.js
export let Perfil = null;

let autenticado = false;

 async function iniciar() {
  // Aquí puedes agregar la lógica de inicialización de autenticación
  debug.log('Autenticación iniciada');

  const token = localStorage.getItem('token');
  if (!token) {    
    return;
  }
  const res = await apiGet('/usuarios/perfil');  

   if (!res.ok) {
    localStorage.removeItem('token');    
    return;
  }

  Perfil = res.result;
  autenticado= true;
  
  return Perfil;
}

 async function getPerfilUsuario() {
  if (Perfil) return Perfil;
}



 function logout() {
  localStorage.removeItem('token');
  Perfil = null;
  window.location.href = 'login.html';
}

const auth = {
  iniciar,
  getPerfilUsuario,
  logout,
  autenticado
};
export default auth;
