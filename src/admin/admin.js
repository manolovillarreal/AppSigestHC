import auth from "../auth/auth.js";
import debug from "../helpers/debug.js";
import contexto from "../contexto/contexto.js";
import {ListaTipoDocumentos} from './tipoDocumento/ListaTipoDocumento.js'
import { cargarCSS } from "../helpers/css.js";


cargarCSS("admin");

const modulos = [
  { id: "moduloTipoDocumento", nombre: "Tipos de Documento", icono: "description" },
  { id: "moduloUsuarios", nombre: "Usuarios", icono: "person" },
  { id: "moduloRoles", nombre: "Roles", icono: "shield" },
  { id: "moduloEstados", nombre: "Estados", icono: "timeline" },
];


document.addEventListener("DOMContentLoaded", () => {
  IniciarAdminApp();
});

async function IniciarAdminApp() {
  await verificarAutenticacion();
  configurarLogout();
  mostrarNombreUsuario();
  setModulosAdmin();
}

async function verificarAutenticacion() {
  const perfil = await auth.iniciar();

  if (!perfil) {
    debug.log("Usuario no autenticado");
    location.href = "../login.html";
    return;
  }

  if (perfil.rol.nombre !== "Admin") {
    debug.log("Usuario no autorizado para el panel de admin");
    location.href = "../index.html";
    return;
  }

  debug.log("Perfil cargado:", perfil);
  contexto.perfil = perfil;
}

function configurarLogout() {
  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      localStorage.removeItem("token");
      location.href = "../login.html";
    });
  }
}

function mostrarNombreUsuario() {
  const { perfil } = contexto;
  if (!perfil) return;
  document.getElementById("nombreUsuario").textContent = perfil.nombreUsuario;
}

function setModulosAdmin() {
  const contenedor = document.getElementById("modulosAdmin");

  modulos.forEach((modulo) => {
    const btn = document.createElement("button");
    btn.className = "modulo-card";
    btn.id = modulo.id;
    btn.innerHTML = `
      <span class="material-icons">${modulo.icono}</span>
      <span>${modulo.nombre}</span>
    `;
    contenedor.appendChild(btn);
  });
  configurarEventos()

}
function configurarEventos() {
  document.getElementById("moduloTipoDocumento")?.addEventListener("click", () => {
    const lista = new ListaTipoDocumentos();
    lista.mount("vistaContenido");
  });
}