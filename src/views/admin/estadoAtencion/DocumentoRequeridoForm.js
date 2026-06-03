import { BaseComponent } from "../../../components/BaseComponent.js";
import { apiGet, apiPost } from "../../../core/api.js";
import { SelectConBuscador } from "../../../components/SelectConBuscador.js";

export class DocumentoRequeridoForm extends BaseComponent {
  constructor(estadoAtencion, requeridosExistentes = [], onSuccess = null) {
    super();
    this.estadoAtencion = estadoAtencion;
    this.requeridosExistentes = requeridosExistentes;
    this.tipoDocumentos = [];
    this.onSuccess = onSuccess;
  }

  async load() {
    const res = await apiGet("/TipoDocumento");
    if (res.ok) {
        console.log("Tipos de documentos cargados:", res.result);

        const usados = this.requeridosExistentes.map(p => p.tipoDocumentoId);
      this.tipoDocumentos = res.result.filter(td => !usados.includes(td.id));
    } else {
      console.error("Error al cargar tipos de documentos:", res.errorMessages);
    }
  }

  render() {
    const form = document.createElement("form");
    form.classList.add("form-agregar-documento-requerido");


    // SelectConBuscador con appendTo y onSelect
    const select = new SelectConBuscador({
      required: true,
      placeholder: "Seleccione un tipo de documento...",
      options: this.tipoDocumentos.map(td => ({
        value: td.id,
        label: td.nombre
      })),
      onSelect: (selected) => {
        console.log("Tipo de documento seleccionado:", selected);
        this.tipoDocumentoId = selected.value;
      }
    });
    select.appendTo(form);

    const btnGuardar = document.createElement("button");
    btnGuardar.type = "submit";
    btnGuardar.classList.add("btn", "btn-primary");
    btnGuardar.textContent = "Guardar";
    form.appendChild(btnGuardar);

  form.addEventListener("submit", (e) => this._handleSubmit(e));
    this.element = form;
    return this.element;
  }

  async _handleSubmit(e) {
    e.preventDefault();
    const tipoDocumentoId = Number(this.tipoDocumentoId);
    if (!tipoDocumentoId) {
      Swal.fire("Tipo requerido", "Debe seleccionar un tipo de documento válido.", "warning");
      return;
    }
    const dto = {
      estadoAtencionId: this.estadoAtencion.id,
      tipoDocumentoId
    };
    const res = await apiPost("/DocumentosRequeridos", dto);
    if (res.ok) {
      Swal.fire("Guardado", "Documento requerido agregado correctamente", "success");
      this.onSuccess?.();
    } else {
      Swal.fire("Error", res.errorMessages?.join(", ") || "No se pudo guardar", "error");
    }
  }
}
