import { BaseComponent } from '../../../components/BaseComponent.js'

export class RolForm extends BaseComponent {
  constructor(rol,onSave) {
    super()
    this.rol = rol ??this._crearRolPorDefecto();
    this.onSave = onSave
  }

 

  render() {
    const { id, nombre } = this.rol;
    const form = document.createElement("form");
    form.className = "rol-form";
    form.innerHTML = `
      <div class="formulario">
          <label>Nombre</label>
          <input type="text" name="nombre" value="${nombre}" required />

         <div class="acciones">
          <div class="acciones-izquierda">
            <!-- Solo se muestran si el form NO es de creación -->
            <button class="icon-btn" type="button" title="Eliminar">
              <span class="material-icons">delete</span>
            </button>
          </div>

      <div class="acciones-derecha">
        <button type="submit" class="btn-primary">Guardar</button>
      </div>
      </div>
    `;

    this._configurarEstadoInicial(form);
    this._form = form;
    this._form.addEventListener('submit', e => this._handleSubmit(e));

    this.element = form;
  }

  _configurarEstadoInicial(form) {

  if (this.rol.id == null) {
    form.querySelector('.acciones-izquierda').style.display = 'none';
  } else {    
     const btnEliminar = form.querySelector('.btn-eliminar');
    if (btnEliminar) {
      btnEliminar.onclick = async () => await this.eliminarTipoDocumento();
    }
  }
  } 

  async _handleSubmit(e) {
    e.preventDefault()
    const formData = new FormData(e.target)
    const rol = {
      nombre: formData.get('nombre')
    }

    let url = '/api/roles'
    let method = 'POST'

    if (this.data?.id) {
      rol.id = this.data.id
      method = 'PUT'
      url += `/${rol.id}`
    }

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rol)
    })

    if (response.ok) {
      this.dispatchEvent(new CustomEvent('guardado', { bubbles: true }))
      this.modal?.cerrar()
    }
  }

  async _eliminarRol() {
    if (!this.rol.id) return;

    const confirmado = await Swal.fire({
    title: "¿Estás seguro?",
    text: "Esta acción no se puede deshacer",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar"
  });

  if (!confirmado.isConfirmed) return;

    const response = await fetch(`/api/roles/${this.rol.id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      this.onSave?.();
    } else {
      console.error("Error al eliminar rol");
    }
  }

  _crearRolPorDefecto() {
    return {
      nombre: '',
      permisos: []
    }
  }
}

customElements.define('rol-form', RolForm)
