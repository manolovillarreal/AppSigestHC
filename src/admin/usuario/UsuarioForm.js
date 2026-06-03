import { BaseComponent } from "../../base/BaseComponent.js";
import { apiPost, apiPut, apiGet } from "../../api/api.js";
import { formatearErroresHTML } from "../../utils/error.js";
import usuarioService from '../../api/usuario.api.js'

export class UsuarioForm extends BaseComponent {
  constructor(usuario, onSave) {
    super();
    this.usuario = usuario ?? this._crearUsuarioPorDefecto();
    this.onSave = onSave;
    this.roles = [];
  }

  async load() {
    const res = await apiGet("/roles");
    if (res.ok) {
      this.roles = res.result;
    } else {
      console.error("Error al cargar roles", res.errorMessages);
    }
  }

  render() {
    const { nombre, correo, rol, estaActivo, nombreUsuario, apellidos,dni } = this.usuario;

    const form = document.createElement("form");
    form.classList.add("usuario-form");

    const opcionesRoles = this.roles
      .map(
        (r) =>
          `<option value="${r.id}" ${rol?.id === r.id ? "selected" : ""}>
            ${r.nombre}
          </option>`
      )
      .join("");

    form.innerHTML = `
      <div class="campo">
        <label>Nombre</label>
        <input name="nombre" required value="${nombre ?? ""}" />
      </div>
      <div class="campo">
        <label>Apellidos</label>
        <input name="apellidos" value="${apellidos ?? ""}" />
      </div>
       <div class="campo">
        <label>Dni</label>
        <input name="dni" value="${dni ?? ""}" />
      </div>
      <div class="campo">
        <label>Usuario</label>
        <input name="nombreUsuario" required value="${nombreUsuario ?? ""}" />
      </div>   
          <div class="campo">
            <label> Contraseña</label>
            <input type="password" name="password" ${!this.usuario.id?"required":""}  autocomplete="new-password"/>
          </div>
      <div class="campo">
        <label>Email</label>
        <input type="email" name="correo" required value="${correo ?? ""}" />
      </div>
      <div class="campo">
        <label>Rol</label>
        <select name="rolId" required>
          <option value="">-- Selecciona un rol --</option>
          ${opcionesRoles}
        </select>
      </div>      

        <div class="acciones">
          <div class="acciones-izquierda">
            <button class="icon-btn toggle-estado-btn" type="button" title="Ocultar / Mostrar">
              <span class="material-icons">${estaActivo ? "visibility" : "visibility_off"}</span>
            </button>
            <button class="icon-btn btn-eliminar" type="button" title="Eliminar">
              <span class="material-icons">delete</span>
            </button>
          </div>
          <div class="acciones-derecha">
            <button type="submit" class="btn-primary">Guardar</button>
          </div>
        </div>
    `;
    this._configurarEstadoInicialYToggle(form, estaActivo);


    form.addEventListener("submit", (e) => this._handleSubmit(e, form));
    this.element = form;
  }

  async _handleSubmit(e, form) {
    e.preventDefault();

    const dto = {
      id: this.usuario.id,
      nombre: form.nombre.value.trim(),
      apellidos: form.apellidos.value.trim(),
      dni: form.dni.value.trim(),
      nombreUsuario: form.nombreUsuario.value.trim(),
      correo: form.correo.value.trim(),
      rolId: form.rolId.value ? parseInt(form.rolId.value) : null,
      estaActivo: this.visible
    };
    console.log(dto);
    
    if (!dto.nombre || !dto.correo || !dto.nombreUsuario || !dto.rolId) {
      Swal.fire("Error", "Todos los campos obligatorios deben completarse", "warning");
      return;
    }
     if (!this.usuario.id && form.password.value.trim()) {
      dto.password = form.password.value.trim();
    }

    const accion = dto.id? "actualizado":"creado";
    const res = dto.id  ? await usuarioService.editarUsuario(dto.id,dto) 
                        : await usuarioService.guardarUsuario(dto);

    if (res.ok) {
      Swal.fire("Guardado", "Usuario "+accion+" correctamente", "success");
      this.onSave?.(res.result);
    } else {
      console.log(res);            
      Swal.fire("Error", formatearErroresHTML(res.errorMessages), "error");
    }
  }

  _crearUsuarioPorDefecto() {
    return {
      id: null,
      nombre: "",
      apellidos: "",
      nombreUsuario: "",
      correo: "",
      rol: null,
      estaActivo: true,
    };
  }
  _configurarEstadoInicialYToggle(form, activo) {
  this.visible = activo;
  form.classList.toggle('inactivo', !this.visible);

  if (!this.usuario.id) {
    form.querySelector('.acciones-izquierda').style.display = 'none';
  } else {
    const toggleBtn = form.querySelector('.toggle-estado-btn');
    toggleBtn?.addEventListener('click', () => {
      this.visible = !this.visible;
      const icon = toggleBtn.querySelector('span');
      icon.textContent = this.visible ? 'visibility' : 'visibility_off';
      form.classList.toggle('inactivo', !this.visible);
    });

    const btnEliminar = form.querySelector('.btn-eliminar');
    if (btnEliminar) {
      btnEliminar.onclick = async () => await this.eliminarUsuario();
    }
  }
}
async eliminarUsuario() {
  const confirmado = await Swal.fire({
    title: "¿Estás seguro?",
    text: "Esta acción no se puede deshacer",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar"
  });

  if (confirmado.isConfirmed) {
    await usuarioService.eliminarUsuario(this.usuario.id);
    this.onSave?.();
  }
}


}
