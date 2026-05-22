import debug from "../helpers/debug.js";
import { apiDownloadBlob, apiGet, apiPut, apiDelete, apiPost } from "../api/api.js";
import {
  formatearFechaHora,
  generarThumbnailPdf,
  formatearFecha,
  formatearErroresHTML,
} from "../helpers/utils.js";
import { downloadBlobFile } from "../helpers/files.js";
import { BaseComponent } from "../base/BaseComponent.js";
import contexto from "../contexto/contexto.js";
import { SolicitudCorreccionItem } from "../solicitudesCorreccion/SolicitudCorreccionItem.js";
import { puedeSolicitarCorrecion, EstadoCorreccion } from "../helpers/correcciones.js";
import {DocumentoService} from '../services/DocumentoService.js'
import { firmarPdf } from "../helpers/firmaPdf.js";

export class ItemDocumento extends BaseComponent{
  constructor(documento,esCorreccion=false) {
    super();
    this.documento = documento;
    this.esCorreccion = esCorreccion;    
  }

  render() {
    this.element = document.createElement("div");
    this.element.classList.add("documento-item");    

    if(!this.esCorreccion)
      this._renderCheckbox();

    this._renderContent();

    if(!this.esCorreccion)
      this._renderAcciones();   
    if (this.documento.solicitudesCorreccion.some(sc => sc?.estadoAtencionId != 3)) {      
      !this.esCorreccion && this.element.classList.add("documento-item-correcciones");
      this._renderCorrecciones();
    }

    descargarMiniaturas(this.documento,this.element.querySelector(".thumbnail-container"), this.verDocumento);
  }
  _renderCheckbox() {
    const checkboxContainer = document.createElement("div");
    checkboxContainer.classList.add("documento-checkbox-container");
    
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.classList.add("documento-checkbox");
    checkbox.id = `doc-checkbox-${this.documento.id}`;
    checkbox.addEventListener("change", (e) => {
      this.onSelectionChange && this.onSelectionChange(this.documento, e.target.checked);
    });
    
    checkboxContainer.appendChild(checkbox);
    this.element.appendChild(checkboxContainer);
  }

  _renderContent(){
    const wrapper = document.createElement("div");
    wrapper.classList.add("documento-item-wrapper");
    this.element.appendChild(wrapper);

    // Thumbnail (se carga después de forma async)
    const thumbnailContainer = document.createElement("div");
    thumbnailContainer.classList.add("thumbnail-container");
    thumbnailContainer.textContent = "...";

    thumbnailContainer.addEventListener("click", () =>
      this.verDocumento(this.documento.id)
    );
    const detalles = document.createElement("div");
    detalles.classList.add("documento-detalles");

    const titulo = document.createElement("div");
    titulo.classList.add("doc-nombre");
    titulo.textContent = this.documento.tipoDocumento.nombre;
    titulo.addEventListener("click", () => {
        this.verDocumento(this.documento.id);
      });
    detalles.appendChild(titulo);

    if (this.documento.tipoDocumento.esAsistencial) {
      const fechaDoc = document.createElement("div");
      fechaDoc.classList.add("doc-fecha");
      fechaDoc.textContent = `Fecha del documento: ${formatearFechaHora(
        this.documento.fecha
      )}`;
      detalles.appendChild(fechaDoc);
    }

    if (this.documento.numeroRelacion) {
      const relacion = document.createElement("div");
      relacion.classList.add("doc-relacion");
      relacion.textContent = `N° Relación: ${this.documento.numeroRelacion}`;
      detalles.appendChild(relacion);
    }

    // Metadata del cargue
    const metadata = document.createElement("div");
    metadata.classList.add("doc-meta");
    const usuario = this.documento.usuario || {};
    metadata.innerHTML = `
    <div>Cargado el ${formatearFechaHora(this.documento.fechaCarga)}</div> 
    <div>por ${usuario.nombre || "—"} ${usuario.apellidos || ""}</div>`;
    detalles.appendChild(metadata);

     wrapper.appendChild(thumbnailContainer);
    wrapper.appendChild(detalles);
  }
  _renderAcciones(){
    // Acciones
    const container = this.element.querySelector(".documento-detalles");
    const acciones = document.createElement("div");
    acciones.classList.add("doc-acciones");

    // Botón Eliminar

    if (this.documento.puedeCargar) {
      const btnEliminar = document.createElement("button");
      btnEliminar.classList.add("icon-btn");
      btnEliminar.title = "Eliminar";
      btnEliminar.innerHTML = `<span class="material-icons">delete</span>`;
      btnEliminar.addEventListener("click", async () => {
        await this.eliminarDocumento(this.documento.id, () => this.element.remove());
      });
      acciones.appendChild(btnEliminar);
    }

    // Botón Descargar
    const btnDescargar = document.createElement("button");
    btnDescargar.classList.add("icon-btn");
    btnDescargar.title = "Descargar";
    btnDescargar.innerHTML = `<span class="material-icons">download</span>`;
    btnDescargar.addEventListener("click", () =>
      this.descargarDocumento(this.documento)
    );

    acciones.appendChild(btnDescargar);

    // Botón Editar (si aplica)
    if (
      (this.documento.tipoDocumento.requiereNumeroRelacion ||
        this.documento.tipoDocumento.esAsistencial) &&
      this.documento.puedeCargar
    ) {
      const btnEditar = document.createElement("button");
      btnEditar.classList.add("icon-btn");
      btnEditar.title = "Editar";
      btnEditar.innerHTML = `<span class="material-icons">edit</span>`;
      btnEditar.addEventListener("click", () =>
        this.editarDocumento(this.documento, () => {
          this.render();
        })
      );
      acciones.prepend(btnEditar);
    }
   
    
    
    if (puedeSolicitarCorrecion(this.documento) && !this._tieneSolicitudesPendientes()) {
      const btnSolicitarCorreccion = document.createElement("button");
      btnSolicitarCorreccion.classList.add("icon-btn");
      btnSolicitarCorreccion.title = "Solicitar Corrección";
      btnSolicitarCorreccion.innerHTML = `<span class="material-symbols-outlined">quick_reference</span>`;
      btnSolicitarCorreccion.addEventListener("click", async () => {
      this.solicitarCorreccion();
      });
      acciones.appendChild(btnSolicitarCorreccion);
    }

    // Botón Firmar (si el tipo de documento permite firma)
    if (this.documento.tipoDocumento?.permiteFirma) {
      const btnFirmar = document.createElement("button");
      btnFirmar.classList.add("icon-btn");
      btnFirmar.title = "Firmar";
      btnFirmar.innerHTML = `<span class="material-symbols-outlined">
signature
</span>`;
      btnFirmar.addEventListener("click", async () => {
        this.firmarDocumento();
      });
      acciones.appendChild(btnFirmar);
    }


    container.appendChild(acciones);

  }
  _renderCorrecciones() {
    const solicitudPendiente = this.documento.solicitudesCorreccion
                        .find(sc => sc?.estadoCorreccionId != EstadoCorreccion.ACEPTADA);
   if (solicitudPendiente) {
    solicitudPendiente.documento = solicitudPendiente.documento || this.documento;
    const solicitudItem = new SolicitudCorreccionItem(solicitudPendiente,(action)=>{
     this.element.classList.remove("documento-item-correcciones");
      this.reMount();
    });
    const container = document.createElement("div");
    solicitudItem.mount(container);

    this.element.appendChild(container);
   }
  }
  async verDocumento(docId) {
    console.log("ver");

    try {
      const res = await apiDownloadBlob(`/Documentos/ver/${docId}`);

      if (!res.ok) {
        alert("No se pudo cargar el documento");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      window.open(url, "_blank");
    } catch (error) {
      alert("No se pudo cargar el documento");
    }
  }
  async descargarDocumento(doc) {
    console.log("descargar");
    console.log(doc);

    const res = await apiDownloadBlob(`/Documentos/ver/${doc.id}`);

    if (!res.ok) {
      alert("No se pudo descargar el documento");
      return;
    }

    await downloadBlobFile(res, doc);
  }
  async eliminarDocumento(docId, onSuccess = null) {
    const confirmacion = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar documento?",
      text: "Esta acción no se puede deshacer.",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
    });

    if (!confirmacion.isConfirmed) return;

    const res = await apiDelete(`/Documentos/${docId}`);

    if (res.ok) {
      await Swal.fire({
        icon: "success",
        title: "Documento eliminado",
        timer: 1500,
        showConfirmButton: false,
      });

      if (onSuccess) onSuccess();
    } else {
      const mensaje = res?.mensaje || "No se pudo eliminar el documento.";
      const errores = formatearErroresHTML(res.errorMessages);

      await Swal.fire({
        icon: "error",
        title: "Error",
        html: `<p>${mensaje}</p>${errores}`,
      });
    }
  }
  async editarDocumento(doc, onSuccess = null) {
    const { result, payload } = await FormularioEditar(doc);

    if (!result.isConfirmed) return;

    const response = await apiPut(`/Documentos/editar`, payload);

    if (response.ok) {
      await Swal.fire({
        icon: "success",
        title: "Documento actualizado",
        timer: 1500,
        showConfirmButton: false,
      });

      doc.numeroRelacion = payload.numeroRelacion || doc.numeroRelacion;
      doc.fecha = payload.fecha || doc.fecha;

      if (onSuccess) onSuccess();
    } else {
      const errores = formatearErroresHTML(response.full?.errores);
      await Swal.fire({
        icon: "error",
        title: response.full?.mensaje || "Error al editar",
        html: errores,
      });
    }
  }
  async solicitarCorreccion() {

    const { value: observacion, isConfirmed } = await Swal.fire({
      title: "Solicitar Corrección",
      input: "textarea",
      inputLabel: "Observación",
      inputPlaceholder: "Describe el motivo de la corrección...",
      showCancelButton: true,
      confirmButtonText: "Solicitar",
      cancelButtonText: "Cancelar",
      inputAttributes: {
        maxlength: 500,
        autocapitalize: "off",
        autocorrect: "off"
      },
      preConfirm: (value) => {
        if (!value || value.trim().length < 10) {
          Swal.showValidationMessage("La observación es obligatoria y debe tener al menos 10 caracteres.");
          return false;
        }
        return value.trim();
      }
    });

    if (!isConfirmed || !observacion?.trim() || observacion.trim().length < 10) return;

    const payload = {
      documentoId: this.documento.id,
      observacion: observacion.trim()
    };

    const res = await apiPost("/SolicitudCorreccion/", payload);

    if (res.ok) {
      await Swal.fire({
        icon: "success",
        title: "Solicitud enviada",
        text: "La corrección fue solicitada correctamente.",
        timer: 1500,
        showConfirmButton: false
      });

      this.documento.solicitudesCorreccion.push(res.result);
      this.reMount();
    } else {
      const errores = formatearErroresHTML(res.errorMessages);
      await Swal.fire({
        icon: "error",
        title: "Error al solicitar corrección",
        html: errores
      });
    }
  }
  _tieneSolicitudesPendientes() {
    return this.documento.solicitudesCorreccion.some(sc => sc?.estadoCorreccionId != EstadoCorreccion.ACEPTADA);
  }
  
  async firmarDocumento() {
    const confirmacion = await Swal.fire({
      icon: "question",
      title: "Firmar Documento",
      text: "¿Desea firmar este documento?",
      showCancelButton: true,
      confirmButtonText: "Sí, firmar",
      cancelButtonText: "Cancelar",
    });

    if (!confirmacion.isConfirmed) return;

    try {
      // Mostrar indicador de carga
      Swal.fire({
        title: "Cargando documento...",
        text: "Por favor espere",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Descargar el PDF actual
      const res = await apiDownloadBlob(`/Documentos/ver/${this.documento.id}`);

      if (!res.ok) {
        throw new Error("No se pudo cargar el documento");
      }

      const blob = await res.blob();

      // Cerrar el loading
      Swal.close();

      // Abrir el modal de firma
      const pdfFirmado = await firmarPdf(blob);

      // Aquí puedes implementar la lógica para subir el PDF firmado
      // Por ejemplo, usar FormData y enviarlo al servidor
      const formData = new FormData();
      formData.append("archivo", pdfFirmado, `${this.documento.tipoDocumento.nombre}_firmado.pdf`);
      formData.append("documentoId", this.documento.id);

      await Swal.fire({
        icon: "success",
        title: "Documento firmado",
        text: "El documento ha sido firmado correctamente.",
        timer: 2000,
        showConfirmButton: false,
      });
      await DocumentoService.EnviarDocumentoFirmado(this.documento.id, formData);

      // Opcional: recargar o actualizar el documento
      // this.reMount();

    } catch (error) {
      console.error("Error al firmar documento:", error);
      
      // Solo mostrar el error si no fue cancelado por el usuario
      if (error.message !== "Cancelado por el usuario") {
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message || "No se pudo firmar el documento",
        });
      }
    }
  }
}

async function FormularioEditar(doc) {
  const { requiereNumeroRelacion, esAsistencial } = doc.tipoDocumento;
  let html = "";

  if (requiereNumeroRelacion) {
    html += `
      <label for="edit-relacion">N° Relación</label>
      <input id="edit-relacion" class="swal2-input" value="${
        doc.numeroRelacion || ""
      }">
    `;
  }

  if (esAsistencial) {
    const fecha =
      doc.fecha?.substring(0, 10) || new Date().toISOString().substring(0, 10);
    html += `
      <label for="edit-fecha">Fecha del Documento</label>
      <input id="edit-fecha" type="date" class="swal2-input" value="${fecha}">
    `;
  }

  // Campo de observación obligatorio
  html += `
    <label for="edit-observacion">Observación</label>
    <textarea id="edit-observacion" class="swal2-textarea" placeholder="Observación (mínimo 10 caracteres)" style="width:100%;"></textarea>
  `;

  let payload = {};

  const result = await Swal.fire({
    title: "Editar Documento",
    html,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Guardar",
    cancelButtonText: "Cancelar",
    preConfirm: () => {
      const relInput = document.getElementById("edit-relacion");
      const fechaInput = document.getElementById("edit-fecha");
      const obsInput = document.getElementById("edit-observacion");

      if (requiereNumeroRelacion) {
        payload.numeroRelacion = relInput?.value.trim() || null;
      }

      if (esAsistencial) {
        payload.fecha = fechaInput?.value || null;
      }

      const observacion = obsInput?.value.trim() || "";
      if (!observacion || observacion.length < 10) {
        Swal.showValidationMessage("La observación es obligatoria y debe tener al menos 10 caracteres.");
        return false;
      }
      payload.observacion = observacion;
      payload.id = doc.id;
      return true;
    },
  });

  return { result, payload };
}

async function descargarMiniaturas(doc, thumbnailContainer, verDocumento) {
  // Descargar thumbnails en paralelo
  const thumb = thumbnailContainer;
  if (!thumb) return;

  try {
    // Si el documento es PDF, usa la nueva ruta de miniaturas
    
    if (doc.tipoDocumento && doc.tipoDocumento.extensionPermitida === "pdf") {
      
      const res = await apiGet(`/Documentos/thumbnails/${doc.id}`);
      if (!res.ok || !res.result || !Array.isArray(res.result) || res.result.length === 0) {
        thumb.textContent = "[Error]";
        return;
      }
      // Usamos la primera miniatura (puedes adaptar si hay varias páginas)
      const base64 = res.result[0];
      const img = document.createElement("img");
      img.classList.add("thumbnail");
      img.title = "Click para ver";
      img.src = `data:image/png;base64,${base64}`;
      img.addEventListener("click", () => {
        verDocumento(doc.id);
      });
      thumb.replaceWith(img);
    } else {
      // Para otros tipos, sigue mostrando texto
      thumb.textContent = doc.tipoDocumento?.mimeType?.includes("xml")
        ? "[XML]"
        : doc.tipoDocumento?.mimeType?.includes("json")
        ? "[JSON]"
        : "[Archivo]";
    }
  } catch (error) {
    console.log(error);
    thumb.textContent = "[Error]";
  }
}
