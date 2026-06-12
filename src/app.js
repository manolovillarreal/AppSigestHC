import { ListaAtenciones } from "./views/atenciones/listaAtenciones.js";
import { apiGet } from "./core/api.js";
import auth from "./core/auth.js";
import debug from "./utils/debug.js";
import contexto from "./core/store.js";
import { BuscarAtenciones } from "./views/atenciones/buscarAtenciones.js";
import { cargarCSS } from "./utils/css.js";
import AtencionService from "./api/atencion.api.js";
import EstadoAtencionService from './api/estadoAtencion.api.js';
import { PERFILES } from "./core/config.js";
import { SolicitudCorreccionService } from "./api/solicitudCorreccion.api.js";
import { ListaSolicitudesCorreccion } from "./views/correcciones/ListaSolicitudesCorreccion.js";
import { HomeView } from "./views/home/HomeView.js";

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
    icon: "folder",
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
      icon: "note_add",
      permisos: Object.values(PERFILES),
      onclick: () => cargarCorrecciones()
   },
    { id: "btnAdmin", 
    label: "Administración", 
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
  const welcomeH1 = document.getElementById("nombreCompletoUsuario")?.parentElement;
  if (welcomeH1) welcomeH1.style.display = "none";
  const home = new HomeView();
  home.mount("main-content-panel");

  // Si el usuario es Administrador, agregar botón de Atenciones en el sidebar
  if (perfil.rol.nombre === PERFILES.ADMINISTRADOR) {
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
    span.onclick = () => {
      document.querySelectorAll(".menu-icon").forEach(el => el.classList.remove("menu-icon-active"));
      span.classList.add("menu-icon-active");
      opcion.onclick();
    };
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
  const home = new HomeView();
  home.mount("main-content-panel");
}
async function renderListaAtenciones(page = 1) {
    const resAtenciones = await AtencionService.obtenerAtencionesVisibles(page);
    if (!resAtenciones.ok) {
      return;
    }
    const pagina = resAtenciones.result || {};

    // Al cambiar de página solo se refresca el panel izquierdo.
    const sidebar = document.getElementById("sidebar-panel");
    if (sidebar) sidebar.innerHTML = "";

    const listaAtenciones = new ListaAtenciones(
      {
        atenciones: pagina.data || [],
        contenedorId: "main-content-panel",
        paginacion: {
          page: pagina.page,
          pageSize: pagina.pageSize,
          total: pagina.total,
          totalPages: pagina.totalPages,
          onPageChange: (p) => renderListaAtenciones(p)
        }
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
  const [recibidas, enviadas] = await Promise.all([
    SolicitudCorreccionService.obtenerCorreccionesPorRol(),
    SolicitudCorreccionService.obtenerEnviadasPorRol()
  ]);

  const home = new HomeView();
  await home.mount("main-content-panel");

  const paginaRecibidas = recibidas.result || {};
  const documentos = new ListaSolicitudesCorreccion({
    recibidas: paginaRecibidas.data || [],
    enviadas: enviadas.result || [],
    paginacion: {
      page: paginaRecibidas.page,
      pageSize: paginaRecibidas.pageSize,
      total: paginaRecibidas.total,
      totalPages: paginaRecibidas.totalPages
    }
  });
  documentos.mount("sidebar-panel");
}

