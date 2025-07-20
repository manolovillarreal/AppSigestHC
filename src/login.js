import { apiPost } from "./api/api.js";



// js/login.js
const form = document.getElementById('loginForm');
const errorMsg = document.getElementById('loginError');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  
  const nombreUsuario = document.getElementById('usuario').value;
  const password = document.getElementById('contrasena').value;

  const res = await apiPost('/Usuarios/login',{ nombreUsuario, password: password });

  if (!res.ok) {    
    errorMsg.classList.remove('hidden');
    return;
  }

  const { token } = res.result;

  localStorage.setItem('token', token);
  window.location.href = 'index.html';
});

