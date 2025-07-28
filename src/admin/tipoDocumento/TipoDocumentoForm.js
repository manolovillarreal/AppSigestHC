import { BaseComponent } from "../../base/BaseComponent.js";
import { apiPost,apiPut,apiDelete } from "../../api/api.js";

/**
 * Formulario editable para un Tipo de Documento.
 * Incluye propiedades como nombre, extensión, relación, asistencialidad,
 * múltiples archivos y límite de páginas.
 */
export class TipoDocumentoForm extends BaseComponent {
  /**
   * @param {Object} tipoDocumento - Datos del tipo de documento.
   * @param {Function} onSave - Callback al guardar exitosamente.
   */
  constructor(tipoDocumento, onSave) {
    super();
     this.tipoDocumento = tipoDocumento ?? this._crearTipoPorDefecto();
      this.onSave = onSave;
  }

  /**
   * Renderiza el formulario en this.element.
   */
  render() {
    const {
      codigo,
      nombre,
      descripcion,
      extensionPermitida,
      requiereNumeroRelacion,
      esAsistencial,
      permiteMultiples,
      limiteDePaginas,
      pesoPorPagina,
      activo
    } = this.tipoDocumento;

    const form = document.createElement("form");
    form.classList.add("tipo-doc-form");

    
    form.innerHTML = `
    <div class="fila-horizontal">
    <div class="campo" id="campo_nombre">
          <label>Nombre</label>
          <input name="nombre" required value="${nombre}" />
        </div>
        <div class="campo">
          <label>Codigo</label>
          <input name="codigo" required value="${codigo}" />
        </div>
      </div>      
      <div class="fila-horizontal">
        <div class="campo">
          <label>Extensión</label>
          <input name="extensionPermitida" value="${extensionPermitida || ""}" />
        </div>
        <div class="campo">
          <label>Límite de páginas</label>
          <input type="number" name="limiteDePaginas" min="0" value="${limiteDePaginas ?? ""}" />
        </div>
        <div class="campo">
          <label>Peso por página</label>
          <input type="number" name="pesoPorPagina" min="200" value="${pesoPorPagina ?? ""}" />
        </div>
      </div>
      <label>Descripción</label>
      <textArea name="descripcion" >${descripcion} </textArea>
      <div class="fila-horizontal">
      <div class="campo">
        <label>
          <input type="checkbox" name="requiereNumeroRelacion" ${requiereNumeroRelacion ? "checked" : ""} />
          Requiere Relación
        </label>
      </div>
      <div class="campo">
        <label>
          <input type="checkbox" name="esAsistencial" ${esAsistencial ? "checked" : ""} />
          Es Asistencial
        </label>
      </div>
      <div class="campo">
        <label>
          <input type="checkbox" name="permiteMultiples" ${permiteMultiples ? "checked" : ""} />
          Permite múltiples
        </label>
      </div>
    </div>
    <div class="acciones">
      <div class="acciones-izquierda">
        <!-- Solo se muestran si el form NO es de creación -->
        <button class="icon-btn toggle-estado-btn" type="button" title="Ocultar / Mostrar">
          <span class="material-icons">${activo ? "visibility":"visibility_off"}</span>
        </button>
        <button class="icon-btn" type="button" title="Eliminar">
          <span class="material-icons">delete</span>
        </button>
      </div>

  <div class="acciones-derecha">
    <button type="submit" class="btn-primary">Guardar</button>
  </div>
</div>
    `;
  this._configurarEstadoInicialYToggle(form, activo);

  

   form.addEventListener("submit", (e) => this._handleSubmit(e, form));  
 

    this.element = form;
  }
  async _handleSubmit(e, form) {
  e.preventDefault();

  const dto = {
    id: this.tipoDocumento.id,
    codigo: form.codigo.value.trim(),
    nombre: form.nombre.value.trim(),
    descripcion: form.descripcion.value.trim(),
    extensionPermitida: form.extensionPermitida.value.trim(),
    requiereNumeroRelacion: form.requiereNumeroRelacion.checked,
    esAsistencial: form.esAsistencial.checked,
    permiteMultiples: form.permiteMultiples.checked,
    limiteDePaginas: form.limiteDePaginas.value ? parseInt(form.limiteDePaginas.value) : null,
    pesoPorPagina: form.pesoPorPagina.value ? parseInt(form.pesoPorPagina.value) : null,
    activo: this.visible
  };

  if (!dto.nombre) {
    Swal.fire("Error", "El nombre es obligatorio", "warning");
    return;
  }

  const { id } = this.tipoDocumento;
  const ruta = id ? `/TipoDocumento/${id}` : "/TipoDocumento";
  const res = id ? await apiPut(ruta, dto) : await apiPost(ruta, dto);

  if (res.ok) {
    Swal.fire("Actualizado", "El tipo de documento fue actualizado", "success");
    this.onSave?.(res.result);
  } else {
    Swal.fire("Error", res.errorMessages.join(", "), "error");
  }
}
  _configurarEstadoInicialYToggle(form, activo) {
    
  this.visible = activo;
  form.classList.toggle('inactivo', !this.visible);

  if (this.tipoDocumento.id == null) {
    form.querySelector('.acciones-izquierda').style.display = 'none';
  } else {
    const toggleBtn = form.querySelector('.toggle-estado-btn');

    toggleBtn?.addEventListener('click', () => {
      this.visible = !this.visible;
      const icon = toggleBtn.querySelector('span');
      icon.textContent = this.visible ? 'visibility' : 'visibility_off';
      
      // Aplica o quita la clase inactivo
      form.classList.toggle('inactivo', !this.visible);
    });

     const btnEliminar = form.querySelector('.btn-eliminar');
    if (btnEliminar) {
      btnEliminar.onclick = async () => await this.eliminarTipoDocumento();
    }
  }
}
 async eliminarTipoDocumento() {
    const confirmado = await Swal.fire({
    title: "¿Estás seguro?",
    text: "Esta acción no se puede deshacer",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar"
  });

  if (confirmado.isConfirmed) {
    // Aquí podrías llamar un servicio para eliminar
    await tipoDocumentoService.eliminar(this.tipoDocumento.id);
    this.onSave?.();
  }
  }
   _crearTipoPorDefecto() {
    return {
      id: null,
      codigo: "",
      nombre: "",
      descripcion: "",
      extensionPermitida: "",
      requiereNumeroRelacion: false,
      esAsistencial: false,
      permiteMultiples: false,
      limiteDePaginas: null,
      pesoPorPagina: null,
      activo: true
    };
  }
}
