import { BaseComponent } from "../../components/BaseComponent.js";
import { Modal } from "../../components/modal.js";
import { Dropzone } from "../../components/Dropzone.js";
import { puedeSolicitarCorrecion, EstadoCorreccion } from "../../utils/correcciones.js";
import { formatearFecha } from "../../utils/date.js";
import { formatearErroresHTML } from "../../utils/error.js";
import { SolicitudCorreccionService } from "../../api/solicitudCorreccion.api.js";

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

    const nombreUsuario = (usuario) => {
      if (!usuario) return 'Usuario desconocido';
      const nombre = usuario.nombre || usuario.nombreUsuario || '';
      const apellidos = usuario.apellidos || '';
      return `${nombre} ${apellidos}`.trim() || 'Usuario desconocido';
    };

    const solicitudPendiente = this.solicitudCorreccion;
    const item = document.createElement("div");
    item.classList.add("correccion-item");

    const estadoNombre = solicitudPendiente.estadoCorreccion.nombre;
    item.innerHTML = `<div class="correccion-header">
    <div>
    <strong>Solicitud de Corrección -</strong>
      <span class="fecha-solicitud">${formatearFecha(solicitudPendiente.fechaSolicitud)}</span>      
    <span class="estado-correccion-${estadoNombre}">${estadoNombre}</span>
    <div class="usuarios-correccion">
      <div class="usuario-solicita">Solicitado por: <strong>${nombreUsuario(solicitudPendiente.usuarioSolicita)}</strong></div>
      ${solicitudPendiente.usuarioCorrige ? `<div class="usuario-corrige">Corregido por: <strong>${nombreUsuario(solicitudPendiente.usuarioCorrige)}</strong></div>` : ''}
    </div>
    </div>

    </div>
    <div class="correccion-observacion">${this._renderObservacion()}</div>
    `;
    this.element.appendChild(item);
    if (puedeSolicitarCorrecion(solicitudPendiente.documento)) {
      this._renderAccionesParaSolicitante();
    } else {
      this._renderAccionesParaNoSolicitante();
    }
  }
  _renderObservacion() {
    const observaciones = this.solicitudCorreccion.observacion.split('|');
    const contenedor = document.createElement('ul');
    observaciones.forEach(obs => {
      const item = document.createElement('li');
      item.classList.add('observacion-item');
      item.textContent = obs;
      contenedor.appendChild(item);
    });
    return contenedor.outerHTML;
  }
  _renderAccionesParaSolicitante() {
    const item = this.element.querySelector(".correccion-header");
    switch (this.solicitudCorreccion.estadoCorreccionId) {
      case EstadoCorreccion.PENDIENTE:
        this.renderDeleteCorrectionButton(item);
        break;
      case EstadoCorreccion.RESPONDIDA:
        const wrapper = document.createElement("div");
        wrapper.classList.add("correccion-acciones");
        item.appendChild(wrapper);

        const btnVerCorreccion = document.createElement("button");
        btnVerCorreccion.classList.add("icon-btn");
        btnVerCorreccion.title = "Ver corrección";
        btnVerCorreccion.innerHTML = `<span class="material-icons btn-ver-correccion">visibility</span>`;
        btnVerCorreccion.addEventListener("click", () => this._verCorreccion());
        wrapper.appendChild(btnVerCorreccion);

        const btnAprobarCorreccion = document.createElement("button");
        btnAprobarCorreccion.classList.add("icon-btn");
        btnAprobarCorreccion.title = "Aprobar corrección";
        btnAprobarCorreccion.innerHTML = `<span class="material-icons btn-aprobar-correccion">check</span>`;
        btnAprobarCorreccion.addEventListener("click", () =>
          this._aprobarCorreccion()
        );
        wrapper.appendChild(btnAprobarCorreccion);

        const btnRechazarCorreccion = document.createElement("button");
        btnRechazarCorreccion.classList.add("icon-btn");
        btnRechazarCorreccion.title = "Rechazar corrección";
        btnRechazarCorreccion.innerHTML = `<span class="material-icons btn-rechazar-correccion">cancel</span>`;
        btnRechazarCorreccion.addEventListener("click", () =>
          this._rechazarCorreccion()
        );
        wrapper.appendChild(btnRechazarCorreccion);
        break;
      case EstadoCorreccion.RECHAZADA: 
      this.renderDeleteCorrectionButton(item);
      break;
      }
  }
  renderDeleteCorrectionButton(item) {
    const btnEliminarCorreccion = document.createElement("button");
    btnEliminarCorreccion.classList.add("icon-btn");
    btnEliminarCorreccion.title = "Eliminar corrección";
    btnEliminarCorreccion.innerHTML = `<span class="material-icons btn-eliminar-solicitud">delete</span>`;
    btnEliminarCorreccion.addEventListener("click", () => this._eliminarSolicitudCorreccion()
    );
    item.appendChild(btnEliminarCorreccion);
  }

  _renderAccionesParaNoSolicitante() {
    const item = this.element.querySelector(".correccion-header");
    switch (this.solicitudCorreccion.estadoCorreccionId) {
      case EstadoCorreccion.PENDIENTE:
        this.renderResponseButton(item);
        break;
      case EstadoCorreccion.RESPONDIDA:
        const estadoEsperando = document.createElement("span");
        estadoEsperando.classList.add("estado-esperando");
        estadoEsperando.innerText = "Esperando respuesta...";
        item.appendChild(estadoEsperando);
        break;
        case EstadoCorreccion.RECHAZADA:
          this.renderResponseButton(item);
        break;
    }
  }
  renderResponseButton(item) {
    const btnResponderCorreccion = document.createElement("button");
    btnResponderCorreccion.classList.add("icon-btn");
    btnResponderCorreccion.title = "Responder corrección";
    btnResponderCorreccion.innerHTML = `<span class="material-icons btn-responder">reply</span>`;
    btnResponderCorreccion.addEventListener("click", () => this._responderCorreccion(this.solicitudCorreccion)
    );
    item.appendChild(btnResponderCorreccion);
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

    const res = await SolicitudCorreccionService.eliminarSolicitudCorreccion(this.solicitudCorreccion.id);
    
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
    
    const extension = documento.tipoDocumento.extensionPermitida;
    if (extension) dropzone.inputFile.accept = `.${extension}`;

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
        this.solicitudCorreccion.estadoCorreccionId = EstadoCorreccion.RESPONDIDA;
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
      this.solicitudCorreccion.estadoCorreccionId = EstadoCorreccion.ACEPTADA;
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
  async _rechazarCorreccion() {
    const { value: observacion } = await Swal.fire({
      title: 'Rechazar solicitud de corrección',
      input: 'textarea',
      inputLabel: 'Observación',
      inputPlaceholder: 'Escribe la razón del rechazo...',
      inputAttributes: {
        'aria-label': 'Observación',
        maxlength: 500,
        rows: 4
      },
      showCancelButton: true,
      confirmButtonText: 'Rechazar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      inputValidator: (value) => {
        if (!value || value.trim().length < 10) {
          return 'La observación es obligatoria y debe tener al menos 10 caracteres.';
        }
        return null;
      }
    });

    if (!observacion) return;

    const res = await SolicitudCorreccionService.rechazarCorreccion(
      this.solicitudCorreccion.id,
      observacion
    );
    if (res.ok) {
      await Swal.fire({
        icon: 'success',
        title: 'Solicitud rechazada',
        timer: 1500,
        showConfirmButton: false
      });
      this.solicitudCorreccion.estadoCorreccionId = EstadoCorreccion.RECHAZADA;
      this.solicitudCorreccion.estadoCorreccion = res.result.estadoCorreccion;
      console.log(res.result);
      this.reMount();
    } else {
      const mensaje = res?.mensaje || 'No se pudo rechazar la solicitud.';
      const errores = formatearErroresHTML(res.errorMessages);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        html: `<p>${mensaje}</p>${errores}`
      });
    }
  }

}
