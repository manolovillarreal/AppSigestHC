import { ListaAtenciones } from "./atenciones/listaAtenciones.js";
import { apiGet } from "./api/api.js";
import auth from "./auth/auth.js";
import debug from "./helpers/debug.js";
import contexto from "./contexto/contexto.js";
import { BuscarAtenciones } from "./atenciones/buscarAtenciones.js";
import { cargarCSS } from "./helpers/css.js";
import AtencionService from "./services/AtencionServices.js";
import EstadoAtencionService from './services/EstadoAtencionService.js';
import { PERFILES } from "./config/config.js";
import { SolicitudCorreccionService } from "./services/SolicitudCorreccionService.js";
import { ListaSolicitudesCorreccion } from "./solicitudesCorreccion/ListaSolicitudesCorreccion.js";

cargarCSS("main");

const opcionesMenuGenerales = [
  {
    id: "btnInicio",
    label: "Inicio",
    icon: "home",
    onclick: () => cargarInicio(),
    permisos: Object.values(PERFILES)
  },
  { id: "btnAtenciones", 
    label: "Atenciones", 
    icon: "folder_open",
    onclick: () => cargarBuscadorAtenciones(),
    permisos: [ 
            PERFILES.ADMISIONES,
            PERFILES.AUDITORIA,
            PERFILES.FACTURACION,
            PERFILES.ADMINISTRADOR
          ]
   },
  {   id:   "btnCorrecciones", 
      label: "Correciones", 
      icon: "quick_reference",
      permisos: Object.values(PERFILES),
      onclick: () => cargarCorrecciones()
   },
    { id: "btnAtenciones", 
    label: "Atenciones", 
    icon: "settings",
    onclick: () => window.location.href = "admin.html",
    permisos: [ 
            PERFILES.ADMINISTRADOR
          ]
   },
];
//patient-list para la viat de triage
export async function IniciarApp() {
  await SetAuth();
  configurarVistaPorRol();
  InicializarComponentes();
}
async function SetAuth() {
  // Configurar autenticación
  const perfil = await auth.iniciar();

  // Cargar perfil del usuario
  if (!perfil) {
    debug.log("Usuario no autenticado");
    document.location.href = "login.html";
    return;
  }

  // Configurar la aplicación con el perfil cargado
  debug.log("Perfil cargado:", perfil);
  contexto.perfil = perfil;
}
function configurarVistaPorRol() {

  const { perfil } = contexto;

  document.getElementById("nombreUsuario").textContent = perfil.nombreUsuario;
  document.getElementById("nombreCompletoUsuario").textContent = perfil.nombre;
  // Si el usuario es Administrador, agregar botón de Admin
  if (perfil.rol.nombre === "Admin") {
    const header = document.querySelector(".sidebar-header");

    const btnAdmin = document.createElement("button");
    btnAdmin.id = "btnAdmin";
    btnAdmin.classList.add("btn-icon");
    btnAdmin.title = "Panel de Administración";

    btnAdmin.innerHTML = `<span class="material-icons">settings</span>`;
    btnAdmin.addEventListener("click", () => {
      window.location.href = "admin.html";
    });

    
    // header.insertBefore(btnAdmin, btnLogout);
  }
}
function InicializarComponentes() {

  cargarTiposDocumentoAutorizados();
  cargarEstadosAtencion();
  cargarEstadosAtencionPermitidos();


  renderMenu();

  document.getElementById("btnLogout")?.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  });
}
function renderMenu() {
  const container = document.getElementById("menuHeader");
  container.innerHTML = ""; // Limpiar contenido previo

  const { perfil } = contexto;

  opcionesMenuGenerales.forEach((opcion) => {
    if (!opcion.permisos.includes(perfil.rol.nombre)) {
      return;
    }
    const span = document.createElement("span");
    span.id = opcion.id;
    span.title = opcion.label;
    span.classList.add("material-symbols-outlined","menu-icon");
    span.textContent = opcion.icon;
    span.onclick = opcion.onclick;
    container.appendChild(span);
  });
}
function clearPanels() {
  document.getElementById("sidebar-panel").innerHTML = "";
  document.getElementById("main-content-panel").innerHTML = "";
}
async function cargarTiposDocumentoAutorizados() {
  //TODO: Esta funcion deberia estar en otro archivo, algo como de Setup General
  const result = await apiGet("/TipoDocumento/Autorizados");
  if (!result.ok) {
    console.error("Error al cargar tipos de documento:", result.errorMessages);
    return;
  }
  contexto.tiposDocumentosPermitidos = result.result || [];
  console.log(contexto);
  
}
async function cargarEstadosAtencionPermitidos() {
  //TODO: Esta funcion deberia estar en otro archivo, algo como de Setup General
  const result = await apiGet("/EstadoAtencion/permitidos");
  if (!result.ok) {
    console.error("Error al cargar estados de atención:", result.errorMessages);
    return;
  }
  contexto.estadosAtencionPermitidos = result.result || [];
  console.log(contexto);
  
}
async function cargarEstadosAtencion() {
  const result = await EstadoAtencionService.obtenerEstadosAtencion();
  if (!result.ok) {
    console.error("Error al cargar estados de atención:", result.errorMessages);
    return;
  }
  contexto.estadosAtencion = result.result || [];
}

//INICIO
async function cargarInicio() {
  clearPanels();
  await renderListaAtenciones();

}
async function renderListaAtenciones() {
    const resAtenciones = await AtencionService.obtenerAtencionesVisibles();
    if (!resAtenciones.ok) {
      return;
    }
    const listaAtenciones = new ListaAtenciones(
      { 
        atenciones: resAtenciones.result || [], 
        contenedorId: "main-content-panel" 
      });
    listaAtenciones.appendTo("sidebar-panel");
   
}

// BUSCAR ATENCIONES
function cargarBuscadorAtenciones() {
  clearPanels();
  const container = document.getElementById("main-content-panel");
  const buscador = new BuscarAtenciones();
  buscador.mount(container);
}

// CARGAR CORRECCIONES  
async function cargarCorrecciones() {
  clearPanels();
  const resSolicitudesCorreccion = await SolicitudCorreccionService.obtenerCorreccionesPorRol();
  if (!resSolicitudesCorreccion.ok) {
    debug.logError("Error al cargar solicitudes de corrección:", resSolicitudesCorreccion.errorMessages);
    return;
  }
  console.log("Solicitudes de corrección cargadas:", resSolicitudesCorreccion.result);
  const documentos = new ListaSolicitudesCorreccion(resSolicitudesCorreccion.result || []);
  documentos.mount("sidebar-panel");
}

