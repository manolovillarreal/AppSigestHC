import { BaseComponent } from "../../../components/BaseComponent.js";
import { apiDelete } from "../../../core/api.js";

export class DocumentoRequeridoItem extends BaseComponent {
  constructor(documentoRequerido, onDelete = null) {
    super();
    this.documentoRequerido = documentoRequerido;
    this.onDelete = onDelete;
  }

  render() {
    const header = document.createElement("div");
    header.classList.add("documento-requerido-header");

    const label = document.createElement("span");
    label.classList.add("documento-nombre");
    label.textContent = this.documentoRequerido.tipoDocumento?.nombre || "Sin nombre";
    header.appendChild(label);

    const actions = document.createElement("div");
    actions.classList.add("documento-acciones");

    const btnEliminar = document.createElement("button");
    btnEliminar.classList.add("btn-icon", "eliminar-documento");
    btnEliminar.innerHTML = `<span class="material-icons">delete</span>`;
    btnEliminar.title = "Eliminar";
    btnEliminar.addEventListener("click", () => this._eliminar());
    actions.appendChild(btnEliminar);
    header.appendChild(actions);

    this.element = header;
    return this.element;
  }

  async _eliminar() {
    const confirmado = await Swal.fire({
      title: "¿Eliminar?",
      text: "¿Estás seguro de eliminar este documento requerido?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
    });

    if (confirmado.isConfirmed) {
      const res = await apiDelete(`/DocumentosRequeridos/${this.documentoRequerido.tipoDocumentoId}`);
      if (res.ok) {
        Swal.fire("Eliminado", "El documento requerido fue eliminado.", "success");
        this.element.remove();
        this.onDelete?.();
      } else {
        Swal.fire("Error", res.errorMessages?.join(", ") || "No se pudo eliminar", "error");
      }
    }
  }
}
