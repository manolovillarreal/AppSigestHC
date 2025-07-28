import { BaseComponent } from "../../base/BaseComponent.js";
import { apiGet, apiPost } from "../../api/api.js";

/**
 * Formulario para agregar un permiso de rol a un tipo de documento.
 */
export class AgregarPermisoRolForm extends BaseComponent {
  /**
   * @param {Object} tipoDocumento - Objeto del tipo de documento.
   * @param {Array} existingPermisos - Lista de permisos actuales (para excluir roles ya asignados).
   * @param {Function} onSuccess - Callback a ejecutar después de guardar.
   */
  constructor(tipoDocumento, existingPermisos = [], onSuccess = null) {
    super();
    this.tipoDocumento = tipoDocumento;
    this.existingPermisos = existingPermisos;
    this.onSuccess = onSuccess;
    this.roles = [];

  }

  /**
   * Carga la lista de roles disponibles desde el backend.
   * @returns {Promise<void>}
   */
  async load() {
    const res = await apiGet("/roles");
    if (res.ok) {
      const usados = this.existingPermisos.map(p => p.rolId);
      this.roles = res.result.filter(r => !usados.includes(r.id));
    } else {
      console.warn("Error cargando roles", res.errorMessages);
    }
  }

  /**
   * Renderiza el formulario de selección de rol y permisos.
   * @returns {HTMLElement}
   */
  render() {
    const form = document.createElement("form");
    form.classList.add("form-agregar-permiso");

    const title = document.createElement("h4");
    title.textContent = "Asignar Permiso a un Rol";
    form.appendChild(title);

    // Select de roles
    const select = document.createElement("select");
    select.name = "rolId";
    select.required = true;

    const defaultOption = document.createElement("option");
    defaultOption.disabled = true;
    defaultOption.selected = true;
    defaultOption.textContent = "Seleccione un rol...";
    select.appendChild(defaultOption);

    this.roles.forEach(rol => {
      const option = document.createElement("option");
      option.value = rol.id;
      option.textContent = rol.nombre;
      select.appendChild(option);
    });

    form.appendChild(select);

    // Checkbox de permisos
    const permisosContainer = document.createElement("div");
    permisosContainer.classList.add("checkbox-group");

    const checkVer = this._crearCheckbox("puedeVer", "Puede Ver");
    const checkCargar = this._crearCheckbox("puedeCargar", "Puede Cargar");

    permisosContainer.appendChild(checkVer);
    permisosContainer.appendChild(checkCargar);
    form.appendChild(permisosContainer);

    // Botón guardar
    const btnGuardar = document.createElement("button");
    btnGuardar.type = "submit";
    btnGuardar.classList.add("btn", "btn-primary");
    btnGuardar.textContent = "Guardar";

    form.appendChild(btnGuardar);

    form.addEventListener("submit", this._guardarPermisoSubmit.bind(this));

    this.element = form;
    return this.element;
  }

  _crearCheckbox(name, labelText) {
    const label = document.createElement("label");
    label.classList.add("checkbox-permiso");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = name;

    label.appendChild(checkbox);
    label.append(` ${labelText}`);
    return label;
  }

  /**
 * Maneja el envío del formulario para guardar un nuevo permiso por rol.
 * @param {SubmitEvent} e 
 */
async _guardarPermisoSubmit(e) {
  e.preventDefault();

  const formData = new FormData(this.element);
  const rolId = Number(formData.get("rolId"));
  const puedeVer = formData.get("puedeVer") === "on";
  const puedeCargar = formData.get("puedeCargar") === "on";

  if (!rolId) {
    Swal.fire("Rol requerido", "Debe seleccionar un rol válido.", "warning");
    return;
  }

  console.log(this.tipoDocumento);
  
  const dto = {
    tipoDocumentoId: this.tipoDocumento.id,
    rolId,
    puedeVer,
    puedeCargar,
  };

  console.log(dto)
  const res = await apiPost("/TipoDocumentoRol", dto);

  if (res.ok) {
    Swal.fire("Guardado", "Permiso agregado correctamente", "success");
    this.onSuccess?.();
  } else {
    Swal.fire("Error", res.errorMessages?.join(", ") || "No se pudo guardar", "error");
  }
}

}
