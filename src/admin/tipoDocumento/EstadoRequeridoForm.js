import { apiGet, apiPost, apiPut, apiDelete } from "../../api/api.js";
import { BaseComponent } from "../../base/BaseComponent.js";

export class EstadoRequeridoForm extends BaseComponent {
  /**
   * @param {Object|null} estadoRequerido - Objeto actual o null si se quiere crear uno nuevo.
   * @param {Object} tipoDocumento - TipoDocumento asociado.
   */
  constructor(estadoRequerido, tipoDocumento) {
    super();
    this.estadoRequerido = estadoRequerido;
    this.tipoDocumento = tipoDocumento;
    this.estadosDisponibles = [];
    this.creando = false; // si no hay estado, estamos en modo creación
  }

  async load() {
    const res = await apiGet("/estadoatencion");
    if (res.ok) {
      this.estadosDisponibles = res.result;
    }
  }

  render() {
    // Reutilizar el elemento o crearlo si no existe
    if (!this.element) {
      this.element = document.createElement("div");
      this.element.classList.add("estado-requerido-form");
    }

    this.element.innerHTML = ""; // Limpiar contenido anterior

    const title = document.createElement("h3");
    title.textContent = "Documento requerido en:";
    this.element.appendChild(title);

    if (!this.estadoRequerido) {
      if (!this.creando) {
        this._renderBtnAgregar();
      } else {
        this._renderFormCrear();
      }
    } else {
      this._renderItem();
    }
    return this.element;
  }
  _renderBtnAgregar() {
    const btnAgregar = document.createElement("button");
    btnAgregar.classList.add("btn", "btn-primary", "btn-agregar-estado");
    btnAgregar.innerHTML = `
                <span >Agegar</span>
              `;
    btnAgregar.title = "Asignar como documento requerido";

    btnAgregar.addEventListener("click", async () => {
      this.creando = true;
      this.render();
    });

    const wrapper = document.createElement("div");
    wrapper.classList.add("estado-requerido-add-wrapper");
    wrapper.appendChild(btnAgregar);
    this.element.appendChild(wrapper);
  }
  _renderFormCrear() {
    const grupo = document.createElement("div");
    grupo.classList.add("estado-edit-group");

    const select = document.createElement("select");
    select.name = "estado";
    select.classList.add("estado-select");

    this.estadosDisponibles.forEach((estado) => {
      const option = document.createElement("option");
      option.value = estado.id;
      option.textContent = estado.nombre;
      select.appendChild(option);
    });

    const actions = document.createElement("div");
    actions.classList.add("estado-acciones");

    // Botón guardar
    const btnGuardar = document.createElement("button");
    btnGuardar.classList.add("btn-icon", "guardar-estado");
    btnGuardar.innerHTML = `<span class="material-icons">check</span>`;
    btnGuardar.title = "Guardar";
    btnGuardar.addEventListener("click", () =>
      this._guardarEstado(select.value)
    );

    // Botón cancelar
    const btnCancelar = document.createElement("button");
    btnCancelar.classList.add("btn-icon", "cancelar-estado");
    btnCancelar.innerHTML = `<span class="material-icons">close</span>`;
    btnCancelar.title = "Cancelar";
    btnCancelar.addEventListener("click", () => {
      this.creando = false;
      this.render();
    });

    actions.appendChild(btnGuardar);
    actions.appendChild(btnCancelar);

    grupo.appendChild(select);
    grupo.appendChild(actions);

    this.element.appendChild(grupo);
  }
_renderItem(){
  const estadoNombre =
        this.estadoRequerido?.estadoAtencion?.nombre || "Sin estado";

      const header = document.createElement("div");
      header.classList.add("estado-requerido-header");

      const label = document.createElement("span");
      label.classList.add("estado-nombre");
      label.textContent = `${estadoNombre}`;
      header.appendChild(label);

      const actions = document.createElement("div");
      actions.classList.add("estado-acciones");

      const btnEliminar = document.createElement("button");
      btnEliminar.classList.add("btn-icon", "eliminar-estado");
      btnEliminar.innerHTML = `<span class="material-icons">delete</span>`;
      btnEliminar.title = "Eliminar";
      btnEliminar.addEventListener("click", () => this._eliminar());

      actions.appendChild(btnEliminar);
      header.appendChild(actions);

      this.element.appendChild(header);
}
  async _guardarEstado(estadoId) {
    const dto = {
      tipoDocumentoId: this.tipoDocumento.id,
      estadoAtencionId: Number(estadoId),
    };

    let res = await apiPost(`/DocumentosRequeridos`, dto);

    if (res.ok) {
      Swal.fire("Guardado", "Relación actualizada correctamente", "success");
      const estadoAtencion = this.estadosDisponibles.find(e=>e.id == estadoId);
      this.estadoRequerido = {
        ...dto,
        estadoAtencion
      }
      this.creando = false;
      this.render();
    } else {
      Swal.fire("Error", res.errorMessages.join(", "), "error");
    }
  }

  async _eliminar() {
    const confirm = await Swal.fire({
      title: "¿Eliminar?",
      text: "¿Estás seguro de eliminar este estado requerido?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
    });

    if (confirm.isConfirmed) {
      const res = await apiDelete(
        `/DocumentosRequeridos/${this.tipoDocumento.id}`
      );
      if (res.ok) {
        Swal.fire("Eliminado", "La relación fue eliminada.", "success");
        this.estadoRequerido = undefined;        
        this.render();
      } else {
        Swal.fire("Error", res.errorMessages.join(", "), "error");
      }
    }
  }
}
