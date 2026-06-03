import { apiDownloadBlob, apiPost } from "../api/api.js";
import { formatearErroresHTML } from "../utils/error.js";
import { BaseComponent } from "../base/BaseComponent.js";
import { DocumentoService } from "../services/DocumentoService.js";
import { firmarPdf } from "../helpers/firmaPdf.js";
import {
  renderCheckbox,
  renderContent,
  renderAcciones,
  renderCorrecciones,
  descargarMiniaturas,
} from "./acciones/RenderDocumento.js";
import {
  verDocumento as verDocumentoAccion,
  descargarDocumento as descargarDocumentoAccion,
} from "./acciones/DescargarDocumento.js";
import { eliminarDocumento as eliminarDocumentoAccion } from "./acciones/EliminarDocumento.js";
import { editarDocumento as editarDocumentoAccion } from "./acciones/EditarDocumento.js";
import { EstadoCorreccion } from "../helpers/correcciones.js";

export class ItemDocumento extends BaseComponent {
  constructor(documento, esCorreccion = false, onEliminarSuccess = null) {
    super();
    this.documento = documento;
    this.esCorreccion = esCorreccion;
    this.onEliminarSuccess = onEliminarSuccess;
  }

  render() {
    this.element = document.createElement("div");
    this.element.classList.add("documento-item");

    if (!this.esCorreccion) {
      renderCheckbox(this.element, this.documento, this.onSelectionChange);
    }

    renderContent(this.element, this.documento, (docId) => this.verDocumento(docId));

    if (!this.esCorreccion) {
      renderAcciones({
        element: this.element,
        documento: this.documento,
        onEliminar: async () => this.eliminarDocumento(this.documento.id, async () => {
          this.element.remove();
          if (this.onEliminarSuccess) await this.onEliminarSuccess();
        }),
        onDescargar: () => this.descargarDocumento(this.documento),
        onEditar: () => this.editarDocumento(this.documento, () => this.render()),
        onSolicitarCorreccion: () => this.solicitarCorreccion(),
        onFirmarDocumento: () => this.firmarDocumento(),
        tieneSolicitudesPendientes: () => this._tieneSolicitudesPendientes(),
      });
    }

    if (this.documento.solicitudesCorreccion.some((sc) => sc?.estadoAtencionId !== 3)) {
      if (!this.esCorreccion) this.element.classList.add("documento-item-correcciones");
      renderCorrecciones(this.element, this.documento, () => this.reMount());
    }

    descargarMiniaturas(
      this.documento,
      this.element.querySelector(".thumbnail-container"),
      (docId) => this.verDocumento(docId)
    );
  }

  async verDocumento(docId) {
    return verDocumentoAccion(docId);
  }

  async descargarDocumento(doc) {
    return descargarDocumentoAccion(doc);
  }

  async eliminarDocumento(docId, onSuccess = null) {
    return eliminarDocumentoAccion(docId, onSuccess);
  }

  async editarDocumento(doc, onSuccess = null) {
    return editarDocumentoAccion(doc, onSuccess);
  }

  async solicitarCorreccion() {
    const { value: observacion, isConfirmed } = await Swal.fire({
      title: "Solicitar Correcci�n",
      input: "textarea",
      inputLabel: "Observaci�n",
      inputPlaceholder: "Describe el motivo de la correcci�n...",
      showCancelButton: true,
      confirmButtonText: "Solicitar",
      cancelButtonText: "Cancelar",
      inputAttributes: {
        maxlength: 500,
        autocapitalize: "off",
        autocorrect: "off",
      },
      preConfirm: (value) => {
        if (!value || value.trim().length < 10) {
          Swal.showValidationMessage("La observaci�n es obligatoria y debe tener al menos 10 caracteres.");
          return false;
        }
        return value.trim();
      },
    });

    if (!isConfirmed || !observacion?.trim() || observacion.trim().length < 10) return;

    const payload = {
      documentoId: this.documento.id,
      observacion: observacion.trim(),
    };

    const res = await apiPost("/SolicitudCorreccion/", payload);

    if (res.ok) {
      await Swal.fire({
        icon: "success",
        title: "Solicitud enviada",
        text: "La correcci�n fue solicitada correctamente.",
        timer: 1500,
        showConfirmButton: false,
      });

      this.documento.solicitudesCorreccion.push(res.result);
      this.reMount();
      return;
    }

    const errores = formatearErroresHTML(res.errorMessages);
    await Swal.fire({
      icon: "error",
      title: "Error al solicitar correcci�n",
      html: errores,
    });
  }

  _tieneSolicitudesPendientes() {
    return this.documento.solicitudesCorreccion.some(
      (sc) => sc?.estadoCorreccionId !== EstadoCorreccion.ACEPTADA
    );
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
      Swal.fire({
        title: "Cargando documento...",
        text: "Por favor espere",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await apiDownloadBlob(`/Documentos/ver/${this.documento.id}`);
      if (!res.ok) throw new Error("No se pudo cargar el documento");

      const blob = await res.blob();
      Swal.close();

      const pdfFirmado = await firmarPdf(blob);
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
    } catch (error) {
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
