import { ListaAtenciones } from "./atenciones/listaAtenciones.js";
import { apiGet } from "./api/api.js";
import auth from "./auth/auth.js";
import debug from "./helpers/debug.js";
import contexto from "./contexto/contexto.js";
import { ModalNuevaAtencion } from "./atenciones/modalNuevaAtencion.js";

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

function InicializarComponentes() {
  const atenciones = new ListaAtenciones("atenciones-container");

  btnNuevaAtencion?.addEventListener("click", () => {
    const modal = new ModalNuevaAtencion(() => {
      console.log("success");
      atenciones.cargarAtenciones();
    });

    document.getElementById('btnLogout')?.addEventListener('click', () => {
      localStorage.removeItem('token');
      window.location.href = 'login.html';
    });
  });

  document.getElementById('btnLogout')?.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
  });
}

function configurarVistaPorRol() {
  const btnNuevaAtencion = document.getElementById("btnNuevaAtencion");
  cargarTiposDocumentoAutorizados();
  const { perfil } = contexto;

  if (!perfil) {
    return
  }
  if (
    perfil.rol.nombre === "Admisiones" ||
    perfil.rol.nombre === "Administrador"
  ) {
    btnNuevaAtencion.classList.remove("hidden");
  } else {
    btnNuevaAtencion.classList.add("hidden");
  }

  
   document.getElementById('nombreUsuario').textContent = perfil.nombreUsuario;
   document.getElementById('nombreCompletoUsuario').textContent = perfil.nombre;
}


async function cargarTiposDocumentoAutorizados() {
  const result = await apiGet("/TipoDocumento/Autorizados");
  if (!result.ok) {
    Swal.fire({
      icon: "error",
      title: "Error al cargar tipos de documento",
      text:
        result.errorMessages || "No se pudieron cargar los tipos de documento.",
    });
    console.error("Error al cargar tipos de documento:", result.errorMessages);
    return;
  }
  contexto.tiposDocumentosPermitidos = result.result || [];
}
