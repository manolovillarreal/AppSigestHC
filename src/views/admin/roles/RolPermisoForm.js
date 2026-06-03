
import { BaseComponent } from "../../../components/BaseComponent.js";
import { apiGet, apiPost } from "../../../core/api.js";
import { SelectConBuscador } from "../../../components/SelectConBuscador.js";

/**
 * Formulario para agregar un permiso de tipo documento a un rol.
 */
export class RolPermisoForm extends BaseComponent {
  /**
   * @param {Object} rol - Objeto del rol.
   * @param {Array} existingPermisos - Lista de permisos actuales (para excluir tipos ya asignados).
   * @param {Function} onSuccess - Callback a ejecutar después de guardar.
   */
  constructor(rol, existingPermisos = [], onSuccess = null) {
    super();
    this.rol = rol;
    this.existingPermisos = existingPermisos;
    this.onSuccess = onSuccess;
    this.tiposDocumento = [];
  }

  /**
   * Carga la lista de tipos de documento disponibles desde el backend.
   * @returns {Promise<void>}
   */
  async load() {
    const res = await apiGet("/TipoDocumento");
    if (res.ok) {
      const usados = this.existingPermisos.map(p => p.tipoDocumentoId);
      this.tiposDocumento = res.result.filter(td => !usados.includes(td.id));
    } else {
      console.warn("Error cargando tipos de documento", res.errorMessages);
    }
    console.log("Tipos de documento disponibles:", this.tiposDocumento);
    
  }

  /**
   * Renderiza el formulario de selección de tipo documento y permisos.
   * @returns {HTMLElement}
   */
  render() {
    const form = document.createElement("form");
    form.classList.add("form-agregar-permiso");

    const title = document.createElement("h4");
    title.textContent = "Asignar Permiso a un Tipo de Documento";
    form.appendChild(title);

    // Select de tipos de documento con buscador

    const select = new SelectConBuscador({
        required: true,
        placeholder: "Seleccione un tipo de documento...",
        options: this.tiposDocumento.map(td => ({
            value: td.id,
            label: td.nombre
        })),
        onSelect: (selected) => {
            console.log("Tipo de documento seleccionado:", selected);
            this.tipoDocumentoId = selected.value;
        }
    });
    select.appendTo(form);

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
   * Maneja el envío del formulario para guardar un nuevo permiso por tipo documento.
   * @param {SubmitEvent} e
   */
  async _guardarPermisoSubmit(e) {
    e.preventDefault();

    const formData = new FormData(this.element);
    const puedeVer = formData.get("puedeVer") === "on";
    const puedeCargar = formData.get("puedeCargar") === "on";

    if (!this.tipoDocumentoId) {
      Swal.fire("Tipo requerido", "Debe seleccionar un tipo de documento válido.", "warning");
      return;
    }

    const dto = {
      tipoDocumentoId: this.tipoDocumentoId,
      rolId: this.rol.id,
      puedeVer,
      puedeCargar,
      activo: true, // Por defecto, al crear un permiso, se asume que está activo
    };

    console.log(dto);
    
    const res = await apiPost("/TipoDocumentoRol", dto);

    if (res.ok) {
      Swal.fire("Guardado", "Permiso agregado correctamente", "success");
      this.onSuccess?.();
    } else {
      Swal.fire("Error", res.errorMessages?.join(", ") || "No se pudo guardar", "error");
    }
  }
}

