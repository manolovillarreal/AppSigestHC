import { BaseComponent } from "../base/BaseComponent.js";
import { Modal } from "../components/modal.js";
import { Dropzone } from "../components/Dropzone.js";
import { puedeSolicitarCorrecion } from "../helpers/correcciones.js";
import { formatearErroresHTML, formatearFecha } from "../helpers/utils.js";
import { SolicitudCorreccionService } from "../services/SolicitudCorreccionService.js";

export class SolicitudCorreccionItem extends BaseComponent {
  constructor(solicitudCorreccion, onAction) {
    super();
    console.log(solicitudCorreccion);

    this.solicitudCorreccion = solicitudCorreccion;
    this.onAction = onAction;
  }

  render() {
    this.element = document.createElement("div");
    this.element.classList.add("correcciones-container");

    const solicitudPendiente = this.solicitudCorreccion;
    const item = document.createElement("div");
    item.classList.add("correccion-item");
    item.innerHTML = `<div class="correccion-header">
    <div>
    <strong>
      Solicitud de Corrección - ${solicitudPendiente.estadoCorreccion.nombre}
    </strong>
    <span class="fecha-solicitud">${formatearFecha(solicitudPendiente.fechaSolicitud)}</span>
    </div>
    </div>
    <div class="correccion-observacion">${solicitudPendiente.observacion}</div>
    `;
    this.element.appendChild(item);
    if (puedeSolicitarCorrecion(solicitudPendiente.documento)) {
      this._renderAccionesParaSolicitante();
    } else {
      this._renderAccionesParaNoSolicitante();
    }
  }
  _renderAccionesParaSolicitante() {
    const item = this.element.querySelector(".correccion-header");
    switch (this.solicitudCorreccion.estadoCorreccionId) {
      case 1:
        const btnEliminarCorreccion = document.createElement("button");
        btnEliminarCorreccion.classList.add("icon-btn");
        btnEliminarCorreccion.title = "Eliminar corrección";
        btnEliminarCorreccion.innerHTML = `<span class="material-icons">delete</span>`;
        btnEliminarCorreccion.addEventListener("click", () =>
          this._eliminarSolicitudCorreccion()
        );
        item.appendChild(btnEliminarCorreccion);
        break;
      case 2:
        const wrapper = document.createElement("div");
        wrapper.classList.add("correccion-acciones");
        item.appendChild(wrapper);

        const btnVerCorreccion = document.createElement("button");
        btnVerCorreccion.classList.add("icon-btn");
        btnVerCorreccion.title = "Ver corrección";
        btnVerCorreccion.innerHTML = `<span class="material-icons">visibility</span>`;
        btnVerCorreccion.addEventListener("click", () => this._verCorreccion());
        wrapper.appendChild(btnVerCorreccion);

        const btnAprobarCorreccion = document.createElement("button");
        btnAprobarCorreccion.classList.add("icon-btn");
        btnAprobarCorreccion.title = "Aprobar corrección";
        btnAprobarCorreccion.innerHTML = `<span class="material-icons">check</span>`;
        btnAprobarCorreccion.addEventListener("click", () =>
          this._aprobarCorreccion()
        );
        wrapper.appendChild(btnAprobarCorreccion);

        const btnRechazarCorreccion = document.createElement("button");
        btnRechazarCorreccion.classList.add("icon-btn");
        btnRechazarCorreccion.title = "Rechazar corrección";
        btnRechazarCorreccion.innerHTML = `<span class="material-icons">cancel</span>`;
        btnRechazarCorreccion.addEventListener("click", () =>
          this._rechazarCorreccion()
        );
        wrapper.appendChild(btnRechazarCorreccion);
        break;
    }
  }
  _renderAccionesParaNoSolicitante() {
    const item = this.element.querySelector(".correccion-header");
    switch (this.solicitudCorreccion.estadoCorreccionId) {
      case 1:
        const btnResponderCorreccion = document.createElement("button");
        btnResponderCorreccion.classList.add("icon-btn");
        btnResponderCorreccion.title = "Responder corrección";
        btnResponderCorreccion.innerHTML = `<span class="material-icons">reply</span>`;
        btnResponderCorreccion.addEventListener("click", () =>
          this._responderCorreccion(this.solicitudCorreccion)
        );
        item.appendChild(btnResponderCorreccion);
        break;
      case 2:
        const estadoEsperando = document.createElement("span");
        estadoEsperando.classList.add("estado-esperando");
        estadoEsperando.innerText = "Esperando respuesta...";
        item.appendChild(estadoEsperando);
        break;
    }
  }
  async _verCorreccion() {
    console.log("ver");

    const res = await SolicitudCorreccionService.visualizarCorreccion(
      this.solicitudCorreccion.id
    );

    if (!res.ok) {
      console.log(res);
      return;
    }

    const blob = await res.blob();
    const pdfViewer = document.createElement("embed");
    pdfViewer.type = "application/pdf";
    pdfViewer.src = URL.createObjectURL(blob);
    pdfViewer.style.width = "100%";
    pdfViewer.style.height = "100%";

    const modal = new Modal("Ver Corrección", true);
    const content = document.createElement("div");
    content.appendChild(pdfViewer);
    modal.show(content);
  }
  async _eliminarSolicitudCorreccion() {
    const confirmacion = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar solicitud de corrección?",
      text: "Esta acción no se puede deshacer.",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
    });

    if (!confirmacion.isConfirmed) return;

    const res = await apiDelete(
      `/SolicitudCorreccion/${this.solicitudCorreccion.id}`
    );
    if (res.ok) {
      await Swal.fire({
        icon: "success",
        title: "Solicitud eliminada",
        timer: 1500,
        showConfirmButton: false,
      });
      this.solicitudCorreccion = undefined;
      this.onAction?.("delete");
    } else {
      const mensaje = res?.mensaje || "No se pudo eliminar la solicitud.";
      const errores = formatearErroresHTML(res.errorMessages);
      await Swal.fire({
        icon: "error",
        title: "Error",
        html: `<p>${mensaje}</p>${errores}`,
      });
    }
  }
  async _responderCorreccion() {
    const modal = new Modal("Responder Solicitud de Corrección");
    const container = document.createElement("div");

    const { documento } = this.solicitudCorreccion;
    const { atencion } = documento;
    container.innerHTML = `
        <p>${atencion.paciente.primerNombre} ${atencion.paciente.primerApellido}</p>
        <p>${documento.tipoDocumento.nombre}</p>
        `;

    const form = document.createElement("form");
    const dropzone = new Dropzone(false);
    dropzone.mount(form);

    const btnEnviar = document.createElement("button");
    btnEnviar.classList.add("btn-primario", "btn-enviar-correccion");
    btnEnviar.type = "submit";
    btnEnviar.textContent = "Enviar";
    form.appendChild(btnEnviar);

    form.onsubmit = async (e) => {
      e.preventDefault();
      if (!dropzone.file) {
        await Swal.fire({
          icon: "warning",
          title: "No hay archivos",
          text: "Por favor, agrega archivos para enviar.",
        });
        return;
      }
      const formData = new FormData(form);
      const res = await SolicitudCorreccionService.responderSolicitudCorreccion(
        this.solicitudCorreccion.id,
        formData
      );

      if (res.ok) {
        await Swal.fire({
          icon: "success",
          title: "Solicitud enviada",
          text: "La corrección fue solicitada correctamente.",
          timer: 1500,
          showConfirmButton: false,
        });
        this.solicitudCorreccion.estadoCorreccionId = 2; // Actualizar estado a respondido
        this.reMount();
        modal.close();
      } else {
        console.log(res);

        const erroresHTML = formatearErroresHTML(res.errorMessages);
        await Swal.fire({
          icon: "error",
          title: "Error",
          html: `<p>Error al responder solicitud de corrección</p>
                    ${
                      erroresHTML
                        ? `<div class="swal-errores">${erroresHTML}</div>`
                        : ""
                    }`,
        });
      }
    };
    container.appendChild(form);
    modal.show(container);
  }
  async _aprobarCorreccion() {
    const confirmacion = await Swal.fire({
      icon: "question",
      title: "¿Aprobar solicitud de corrección?",
      text: "¿Desea reemplazar el documento anterior, conservarlo o cancelar?",
      showDenyButton: true,
      showCancelButton: true,
      cancelButtonText: "Cancelar",
      confirmButtonText: "Reemplazar documento",
      denyButtonText: "Conservar documento",
      confirmButtonColor: "#3085d6",
      denyButtonColor: "#6c757d",
      cancelButtonColor: "#d33",
    });

    // Si el usuario cancela, no hacer nada
    if (confirmacion.dismiss === Swal.DismissReason.cancel) return;

    // Determinar si conservar el documento anterior
    let conservarDocumentoAnterior = confirmacion.isDenied;

    // Si el usuario no confirmó ni negó, salir
    if (!confirmacion.isConfirmed && !confirmacion.isDenied) return;

    const res = await SolicitudCorreccionService.aprobarCorreccion(
      this.solicitudCorreccion.id,
      conservarDocumentoAnterior
    );
    if (res.ok) {
      await Swal.fire({
        icon: "success",
        title: "Solicitud aprobada",
        timer: 1500,
        showConfirmButton: false,
      });
      this.solicitudCorreccion.estadoCorreccionId = 3; // Actualizar estado a aprobado
      this.onAction?.("update");
    } else {
      const mensaje = res?.mensaje || "No se pudo aprobar la solicitud.";
      const errores = formatearErroresHTML(res.errorMessages);
      await Swal.fire({
        icon: "error",
        title: "Error",
        html: `<p>${mensaje}</p>${errores}`,
      });
    }
  }
}
