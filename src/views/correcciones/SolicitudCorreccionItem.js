import { BaseComponent } from "../../components/BaseComponent.js";
import { Modal } from "../../components/modal.js";
import { Dropzone } from "../../components/Dropzone.js";
import { puedeSolicitarCorrecion, EstadoCorreccion } from "../../utils/correcciones.js";
import { formatearFecha } from "../../utils/date.js";
import { formatearErroresHTML } from "../../utils/error.js";
import { SolicitudCorreccionService } from "../../api/solicitudCorreccion.api.js";
import { descargarMiniaturas } from "../documentos/acciones/RenderDocumento.js";

export class SolicitudCorreccionItem extends BaseComponent {  
  constructor(solicitudCorreccion, onAction) {
    super();
    this.solicitudCorreccion = solicitudCorreccion;
    this.onAction = onAction;
  }

  render() {
    this.element = document.createElement("div");
    this.element.classList.add("solicitud-card");

    const fechaSegura = (valor) => {
      if (!valor) return 'Fecha no disponible';
      const d = new Date(valor);
      return isNaN(d.getTime()) ? 'Fecha no disponible' : formatearFecha(valor);
    };

    const nombreUsuario = (usuario) => {
      if (!usuario) return 'Usuario desconocido';
      const nombre = usuario.nombre || usuario.nombreUsuario || '';
      const apellidos = usuario.apellidos || '';
      return `${nombre} ${apellidos}`.trim() || 'Usuario desconocido';
    };

    const solicitudPendiente = this.solicitudCorreccion;
    const documento = solicitudPendiente.documento;
    const estadoNombre = solicitudPendiente.estadoCorreccion.nombre;
    const estadoClase = estadoNombre.toLowerCase();

    // CARD HEADER (Siempre visible)
    const cardHeader = document.createElement("div");
    cardHeader.classList.add("correccion-card-header");

    // CARD SUPERIOR — info del documento
    const docHeader = document.createElement("div");
    docHeader.classList.add("solicitud-doc-header");

    const thumbnailContainer = document.createElement("div");
    thumbnailContainer.classList.add("solicitud-doc-thumbnail");
    descargarMiniaturas(documento, thumbnailContainer, () => this._verCorreccion());

    const docInfo = document.createElement("div");
    docInfo.classList.add("solicitud-doc-info");
    
    const fechaDocRender = fechaSegura(documento.fechaDocumento) !== 'Fecha no disponible' 
      ? fechaSegura(documento.fechaDocumento) 
      : fechaSegura(documento.fechaCreacion);

    docInfo.innerHTML = `
      <h3 class="solicitud-doc-titulo">${documento.tipoDocumento.nombre}</h3>
      <span class="solicitud-doc-fecha">Fecha del documento: ${fechaDocRender}</span>
      <span class="solicitud-doc-cargado">Cargado el ${fechaSegura(documento.fechaCreacion)} por ${nombreUsuario({nombre: documento.usuario?.nombre, apellidos: documento.usuario?.apellidos})}</span>
      <span class="badge-estado ${estadoClase}">${estadoNombre}</span>
      <span class="solicitud-doc-solicitud-fecha">Solicitado el: ${fechaSegura(solicitudPendiente.fechaSolicitud)}</span>
    `;

    docHeader.appendChild(thumbnailContainer);
    docHeader.appendChild(docInfo);
    cardHeader.appendChild(docHeader);

    // SECCIÓN MOTIVO
    const motivoSeccion = document.createElement("div");
    motivoSeccion.classList.add("solicitud-motivo-seccion");
    motivoSeccion.innerHTML = `
      <h4 class="solicitud-seccion-titulo">Motivo de corrección</h4>
      <div class="solicitud-motivo-box">${this._renderObservacionHTML()}</div>
    `;
    cardHeader.appendChild(motivoSeccion);

    // BOTÓN TOGGLE TIMELINE
    const btnToggle = document.createElement("button");
    btnToggle.classList.add("btn-toggle-timeline");
    btnToggle.innerHTML = `▼ Ver historial`;
    cardHeader.appendChild(btnToggle);

    this.element.appendChild(cardHeader);

    // TIMELINE BODY (Colapsable)
    const timelineBody = document.createElement("div");
    timelineBody.classList.add("correccion-timeline-body");
    timelineBody.style.display = "none";

    btnToggle.addEventListener("click", () => {
        const isHidden = timelineBody.style.display === "none";
        timelineBody.style.display = isHidden ? "block" : "none";
        btnToggle.innerHTML = isHidden ? `▲ Ocultar historial` : `▼ Ver historial`;
    });

    // TIMELINE
    const timelineSeccion = document.createElement("div");
    timelineSeccion.classList.add("solicitud-timeline-seccion");
    
    // Determinar texto estado
    let textoEstado = "Esperando respuesta del médico.";
    if (solicitudPendiente.estadoCorreccionId === EstadoCorreccion.RESPONDIDA) {
        textoEstado = "Respuesta recibida. Pendiente de revisión.";
    } else if (solicitudPendiente.estadoCorreccionId === EstadoCorreccion.ACEPTADA) {
        textoEstado = "Corrección aprobada.";
    } else if (solicitudPendiente.estadoCorreccionId === EstadoCorreccion.RECHAZADA) {
        textoEstado = "Corrección rechazada.";
    }

    const htmlTimeline = `
      <h4 class="solicitud-timeline-titulo">Historial de la Solicitud</h4>
      <div class="timeline-container">
        <!-- Nodo 1 -->
        <div class="timeline-nodo">
          <div class="timeline-icono bg-amber">
            <span class="material-icons">person</span>
          </div>
          <div class="timeline-contenido">
            <div class="timeline-cabecera">
              <h5 class="timeline-titulo">Solicitud de corrección</h5>
              <span class="badge-rol">${solicitudPendiente.usuarioSolicita?.rol?.nombre || 'Administración'}</span>
            </div>
            <span class="timeline-fecha">${fechaSegura(solicitudPendiente.fechaSolicitud)}</span>
            <div class="timeline-box-motivo">${this._renderObservacionHTML()}</div>
          </div>
        </div>

        <!-- Nodo 2 -->
        <div class="timeline-nodo" id="nodo-respuesta-${solicitudPendiente.id}">
          <div class="timeline-icono bg-blue">
            <span class="material-icons">medical_services</span>
          </div>
          <div class="timeline-contenido" id="contenido-respuesta-${solicitudPendiente.id}">
            <div class="timeline-cabecera">
              <h5 class="timeline-titulo">Respuesta del Corrector</h5>
              <span class="badge-rol">${solicitudPendiente.usuarioCorrige?.rol?.nombre || 'Médico'}</span>
            </div>
            <div class="timeline-acciones" id="acciones-respuesta-${solicitudPendiente.id}">
            </div>
          </div>
        </div>

        <!-- Nodo 3 -->
        <div class="timeline-nodo">
          <div class="timeline-icono ${solicitudPendiente.estadoCorreccionId === EstadoCorreccion.PENDIENTE ? 'bg-gray' : (solicitudPendiente.estadoCorreccionId === EstadoCorreccion.ACEPTADA ? 'bg-green' : (solicitudPendiente.estadoCorreccionId === EstadoCorreccion.RECHAZADA ? 'bg-red' : 'bg-blue'))}">
            <span class="material-icons">flag</span>
          </div>
          <div class="timeline-contenido">
            <div class="timeline-cabecera">
              <h5 class="timeline-titulo">Estado actual</h5>
              <span class="badge-estado ${estadoClase}">${estadoNombre}</span>
            </div>
            <span class="timeline-texto">${textoEstado}</span>
          </div>
        </div>
      </div>
    `;
    timelineSeccion.innerHTML = htmlTimeline;
    timelineBody.appendChild(timelineSeccion);

    // ACCIONES (pie de la card)
    const accionesFooter = document.createElement("div");
    accionesFooter.classList.add("solicitud-acciones-footer");
    timelineBody.appendChild(accionesFooter);

    this.element.appendChild(timelineBody);

    // Rellenar dinámicamente según estado y permisos
    setTimeout(() => {
        const accionesRespuesta = this.element.querySelector(`#acciones-respuesta-${solicitudPendiente.id}`);
        
        if (solicitudPendiente.estadoCorreccionId === EstadoCorreccion.RESPONDIDA || solicitudPendiente.estadoCorreccionId === EstadoCorreccion.ACEPTADA) {
             const btnVerCorreccionTimeline = document.createElement("button");
             btnVerCorreccionTimeline.className = "btn-accion-outline";
             btnVerCorreccionTimeline.innerHTML = `<span class="material-icons">visibility</span> Ver corrección`;
             btnVerCorreccionTimeline.onclick = () => this._verCorreccion();
             accionesRespuesta.appendChild(btnVerCorreccionTimeline);
        } else {
             const textoNoRespuesta = document.createElement("span");
             textoNoRespuesta.className = "timeline-texto";
             textoNoRespuesta.innerText = "Aún no hay respuesta registrada.";
             accionesRespuesta.appendChild(textoNoRespuesta);
             
             if (!puedeSolicitarCorrecion(solicitudPendiente.documento) && solicitudPendiente.estadoCorreccionId === EstadoCorreccion.PENDIENTE) {
                 const btnResponderTimeline = document.createElement("button");
                 btnResponderTimeline.className = "btn-accion-outline";
                 btnResponderTimeline.innerHTML = `<span class="material-icons">reply</span> Responder`;
                 btnResponderTimeline.onclick = () => this._responderCorreccion();
                 accionesRespuesta.appendChild(btnResponderTimeline);
             }
        }

        if (puedeSolicitarCorrecion(solicitudPendiente.documento)) {
             if (solicitudPendiente.estadoCorreccionId === EstadoCorreccion.PENDIENTE || solicitudPendiente.estadoCorreccionId === EstadoCorreccion.RECHAZADA) {
                 const btnEliminar = document.createElement("button");
                 btnEliminar.className = "btn-accion-peligro";
                 btnEliminar.innerHTML = `<span class="material-icons">delete</span> Eliminar solicitud`;
                 btnEliminar.onclick = () => this._eliminarSolicitudCorreccion();
                 accionesFooter.appendChild(btnEliminar);
             } else if (solicitudPendiente.estadoCorreccionId === EstadoCorreccion.RESPONDIDA) {
                 const btnRechazar = document.createElement("button");
                 btnRechazar.className = "btn-accion-peligro";
                 btnRechazar.innerHTML = `<span class="material-icons">cancel</span> Rechazar`;
                 btnRechazar.onclick = () => this._rechazarCorreccion();
                 accionesFooter.appendChild(btnRechazar);
                 
                 const btnAprobar = document.createElement("button");
                 btnAprobar.className = "btn-accion-success";
                 btnAprobar.innerHTML = `<span class="material-icons">check</span> Aprobar`;
                 btnAprobar.onclick = () => this._aprobarCorreccion();
                 accionesFooter.appendChild(btnAprobar);
             }
        } else {
             if (solicitudPendiente.estadoCorreccionId === EstadoCorreccion.PENDIENTE || solicitudPendiente.estadoCorreccionId === EstadoCorreccion.RECHAZADA) {
                 const btnResponder = document.createElement("button");
                 btnResponder.className = "btn-accion-solido";
                 btnResponder.innerHTML = `<span class="material-icons">send</span> Responder solicitud`;
                 btnResponder.onclick = () => this._responderCorreccion();
                 accionesFooter.appendChild(btnResponder);
             }
        }
    }, 0);
  }

  _renderObservacionHTML() {
    const observaciones = this.solicitudCorreccion.observacion.split('|');
    let html = '<ul>';
    observaciones.forEach(obs => {
      html += `<li>${obs}</li>`;
    });
    html += '</ul>';
    return html;
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

    if (confirmacion.dismiss === Swal.DismissReason.cancel) return;

    let conservarDocumentoAnterior = confirmacion.isDenied;

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
