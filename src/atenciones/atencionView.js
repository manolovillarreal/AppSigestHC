import debug from "../helpers/debug.js";
import { puedeAvanzarEstado } from "../helpers/estados.js";
import { formatearFechaHora,formatearErroresHTML  } from "../helpers/utils.js";
import { ListaDocumentos } from "../documentos/listaDocumentos.js";
import contexto from "../contexto/contexto.js"; // Asegúrate de que el perfil esté importado correctamente
import { ModalAgregarDocumento } from "../documentos/ModalAgregarDocumento.js";
import {apiPost} from '../api/api.js'
export class AtencionView {
  constructor() {
    this.atencion = null; // Inicializar atencion como null
    this.container = document.getElementById("atencion-panel");
    this.listaDocumentos = new ListaDocumentos("documentos-list");
  }

  setAtencionSeleccionada(atencion, onSuccess) {
    this.atencion = atencion;
    this.onSuccess = onSuccess;
    this.render();    
  }
  render() {
    this.container.innerHTML = ""; // Limpiar contenido previo
    if (this.atencion) {
      this.container.classList.remove("hidden");
      this.container.appendChild(
        this.ConstruirCabecera()
      );

      const {perfil} = contexto
      if (
        puedeAvanzarEstado(this.atencion.estadoAtencion.id, perfil.rol.nombre)
      ) {
        this.container.appendChild(this.ConstruirContenedorAvanzar());
      }
      const h3 = document.createElement("h3");
      h3.textContent = "Documentos de la Atención";
      this.container.appendChild(h3);
      const contenedorDocumentos = document.createElement("ul");
      contenedorDocumentos.id = "documentos-list";
      contenedorDocumentos.className = "list-view";

      const btnAgregarDocumento = document.createElement("button");
      btnAgregarDocumento.id = "btn-agregar-documento";
      btnAgregarDocumento.className = "btn-primary";
      btnAgregarDocumento.textContent = " Agregar Documento";
      btnAgregarDocumento?.addEventListener("click", () => {
        const modal = new ModalAgregarDocumento(this.atencion.id, () => {
          this.render();
        });
      });
      this.container.appendChild(btnAgregarDocumento);
      this.listaDocumentos.CargaDocumentos(this.atencion);
      this.container.appendChild(contenedorDocumentos);
    } else {
      this.container.classList.add("hidden");
    }
  }

  ConstruirCabecera() {
    const header = document.createElement("div");
    header.id = "panel-cabecera-atencion";
    header.className = "atencion-header";
    header.innerHTML = `
          <div class="atencion-info">
              <strong>Atención ID:</strong> <span id="cabecera-id">${
                this.atencion.id
              }</span><br />
              <strong>Fecha:</strong> <span id="cabecera-fecha">${formatearFechaHora(
                this.atencion.fecha
              )}</span><br />
              <strong>Administradora:</strong> <span id="cabecera-adm">${
                this.atencion.administradora.nombre
              }</span
              ><br />
              <strong>Paciente:</strong> <span id="nombrePaciente">${
                this.atencion.paciente.primerNombre
              } ${this.atencion.paciente.primerApellido}</span><br />
              <strong>Estado:</strong> <span id="estadoAtencion">${
                this.atencion.estadoAtencion.nombre
              }</span>
          </div>       
          `;
    const btnCerrar = document.createElement("button");
    btnCerrar.id = "btnCerrarPanelAtencion";
    btnCerrar.className = "btn-cerrar-atencion";
    btnCerrar.title = "Cerrar panel";
    btnCerrar.innerHTML = `<span class="material-icons">close</span>`;

    const _container = this.container;
    btnCerrar.addEventListener("click", () => {
      _container.classList.add("hidden");
    });
    header.appendChild(btnCerrar);

    if (this.atencion.estadoAtencion.id == 1) {
      const btnAnular = document.createElement("button");
      btnAnular.id = "btnAnularAtencion";
      btnAnular.className = "btn-anular-atencion";
      btnAnular.title = "Cerrar panel";
      btnAnular.innerHTML = `<span class="material-icons">delete</span>`;

      btnAnular.addEventListener("click", () => {
        this.anularAtencion(this.atencion.id, () => {
          this.contenedor.classList.add("hidden");
        });
      });
      header.appendChild(btnAnular);
    }

    return header;
  }

  ConstruirContenedorAvanzar() {
  // Contenedor botón avanzar
  const contenedorAvanzar = document.createElement("div");
  contenedorAvanzar.className = "contenedor-avanzar";

  const btnAvanzar = document.createElement("button");
  btnAvanzar.id = "btnAvanzarEstado";
  btnAvanzar.className = "btn-avanzar";

  const iconAvanzar = document.createElement("span");
  iconAvanzar.className = "material-icons";
  iconAvanzar.textContent = "arrow_forward";

  btnAvanzar.appendChild(iconAvanzar);
  btnAvanzar.appendChild(document.createTextNode(" Avanzar Estado"));
  btnAvanzar.addEventListener("click", () => {
    this.AvanzarEstado();
  });

  contenedorAvanzar.appendChild(btnAvanzar);

  return contenedorAvanzar;
}
async AvanzarEstado() {
  const { isConfirmed, value: observacion } = await Swal.fire({
    icon: "question",
    title: "¿Avanzar estado de esta atención?",
    html: `
      <p>Esta acción cambiará el estado de la atención según el flujo definido para tu rol.</p>
      <textarea id="obs-cambio-estado" class="swal2-textarea " placeholder="Observación (opcional)" name="observacion"></textarea>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Sí, continuar",
    cancelButtonText: "Cancelar",
    preConfirm: () => {
      return document.getElementById("obs-cambio-estado").value.trim();
    },
  });

  if (!isConfirmed) return;

  const payload = {
    observacion: observacion || null,
    Atencionid: this.atencion.id,
  };
  try {
    console.log("payload: ", payload);

    const res = await apiPost(`/Atenciones/cambiar-estado`, payload);

    if (res.ok) {
      const atencionActualizada = res.result || {};

      await Swal.fire({
        icon: "success",
        title: "Atención actualizada",
        text: `Nuevo estado: ${atencionActualizada.estadoAtencion?.nombre || "actualizado"}`,
      });
      console.log(atencionActualizada);
      
      
      this.atencion.estadoAtencion = atencionActualizada.estadoAtencion;      
      this.atencion.estadoAtencionId = atencionActualizada.estadoAtencionId;      

      this.render();
      
      if (this.onSuccess) this.onSuccess();

    } else {
      console.log(res);
      
      const errores = formatearErroresHTML(res.errorMessages);
      await Swal.fire({
        icon: "error",
        title: res.message || "Error al avanzar estado",
        html: errores,
      });
    }
  } catch (err) {
    console.error(err);
    await Swal.fire({
      icon: "error",
      title: "Error inesperado",
      text: "No se pudo avanzar el estado.",
    });
  }
}
async anularAtencion(onSuccess = null) {
  const confirmacion = await Swal.fire({
    icon: "warning",
    title: "¿Anular atencion?",
    text: "Esta acción no se puede deshacer.",
    showCancelButton: true,
    confirmButtonText: "Sí, anular",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#d33",
  });

  if (!confirmacion.isConfirmed) return;

  const res = await apiDelete(`/Atenciones/${this.atencion.id}`);

  if (res.ok) {
    await Swal.fire({
      icon: "success",
      title: "Atención eliminada",
      timer: 1500,
      showConfirmButton: false,
    });

    if (onSuccess) onSuccess();
  } else {
    const mensaje = res?.mensaje || "No se pudo anular la atención.";
    const errores = formatearErroresHTML(res.errores);

    await Swal.fire({
      icon: "error",
      title: "Error",
      html: `<p>${mensaje}</p>${errores}`,
    });
  }
}

}

