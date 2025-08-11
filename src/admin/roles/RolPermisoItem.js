import { apiDelete, apiPut } from "../../api/api.js";
import { BaseComponent } from "../../base/BaseComponent.js";

/**
 * Componente editable para mostrar y modificar un permiso de tipo documento asignado a un rol.
 */
export class RolPermisoItem extends BaseComponent {
  /**
   * @param {Object} permiso - Objeto permiso (de tipoDocumentoRol).
   */
  constructor(permiso) {
    super();
    this.permiso = permiso;
    this.original = { ...permiso };
  }

  render() {
    const card = document.createElement("div");
    card.classList.add("permiso-rol-card");

    // Nombre del tipo de documento
    const nombreTipo = document.createElement("div");
    nombreTipo.classList.add("permiso-rol-nombre");
    nombreTipo.textContent = this.permiso.tipoDocumento?.nombre || `Tipo ${this.permiso.tipoDocumentoId}`;

    // Contenedor de checkboxes
    const opciones = document.createElement("div");
    opciones.classList.add("permiso-rol-opciones");

    const chkVer = this._crearCheckbox("Puede Ver", "puedeVer", this.permiso.puedeVer);
    const chkCargar = this._crearCheckbox("Puede Cargar", "puedeCargar", this.permiso.puedeCargar);

    opciones.appendChild(chkVer.label);
    opciones.appendChild(chkCargar.label);

    // Botones de acción
    const acciones = document.createElement("div");
    acciones.classList.add("permiso-rol-acciones");

    const btnGuardar = document.createElement("button");
    btnGuardar.classList.add("btn", "btn-guardar", "hidden");
    btnGuardar.title = "Guardar cambios";
    btnGuardar.innerHTML = `<span class="material-icons">save</span>`;
    btnGuardar.addEventListener("click", () => this._guardarCambios());

    const btnEliminar = document.createElement("button");
    btnEliminar.classList.add("btn", "btn-eliminar");
    btnEliminar.title = "Eliminar permiso";
    btnEliminar.innerHTML = `<span class="material-icons">delete</span>`;
    btnEliminar.addEventListener("click", () => this._eliminarPermiso());

    acciones.appendChild(btnGuardar);
    acciones.appendChild(btnEliminar);

    card.appendChild(nombreTipo);
    card.appendChild(opciones);
    card.appendChild(acciones);

    this.chkVer = chkVer.input;
    this.chkCargar = chkCargar.input;
    this.btnGuardar = btnGuardar;
    this.element = card;

    this.chkVer.addEventListener("change", () => this._detectarCambios());
    this.chkCargar.addEventListener("change", () => this._detectarCambios());

    this.element = card;
  }

  _crearCheckbox(labelText, key, checked) {
    const label = document.createElement("label");
    label.classList.add("checkbox-permiso");

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = !!checked;
    input.dataset.key = key;

    label.appendChild(input);
    label.append(` ${labelText}`);

    return { label, input };
  }

  _detectarCambios() {
    const cambiado =
      this.chkVer.checked !== this.original.puedeVer ||
      this.chkCargar.checked !== this.original.puedeCargar;

    this.btnGuardar.classList.toggle("hidden", !cambiado);
  }

  async _guardarCambios() {
    const dto = {
      tipoDocumentoId: this.permiso.tipoDocumentoId,
      rolId: this.permiso.rolId,
      puedeVer: this.chkVer.checked,
      puedeCargar: this.chkCargar.checked,
    };

    const res = await apiPut(`/TipoDocumentoRol`, dto);

    if (res.ok) {
      this.original = { ...dto };
      this.btnGuardar.classList.add("hidden");
      Swal.fire("Guardado", "Los permisos fueron actualizados", "success");
    } else {
      Swal.fire("Error", res.errorMessages.join(", "), "error");
    }
  }

  async _eliminarPermiso() {
    const confirmado = await Swal.fire({
      title: "¿Eliminar permiso?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (confirmado.isConfirmed) {
      const { tipoDocumentoId, rolId } = this.permiso;
      const res = await apiDelete(`/TipoDocumentoRol?tipoDocumentoId=${tipoDocumentoId}&rolId=${rolId}`);

      if (res.ok) {
        this.element.remove();
        Swal.fire("Eliminado", "El permiso fue eliminado", "success");
      } else {
        Swal.fire("Error", res.errorMessages.join(", "), "error");
      }
    }
  }
}
