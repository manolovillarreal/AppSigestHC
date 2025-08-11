import { BaseComponent } from "../../base/BaseComponent.js";

export class UsuarioItem extends BaseComponent {
  constructor(usuario, onClick) {
    super();
    this.usuario = usuario;
    this.onClick = onClick;
  }

  render() {
    const { id, nombre, apellidos, correo, rol, estaActivo } = this.usuario;
    const check = (valor) => (valor ? "✅" : "❌");

    const item = document.createElement("div");
    item.className = `usuario-item ${!estaActivo ? "inactivo" : ""}`;

    item.innerHTML = `
      <div class="usuario-header">
        <span class="usuario-nombre">${nombre} ${apellidos}</span>
        <span class="usuario-id">#${id}</span>
      </div>
      <div class="usuario-detalles-linea">
        <span><strong>Email:</strong> ${correo}</span>
        <span><strong>Rol:</strong> ${rol?.nombre || "Sin rol"}</span>
        <span><strong>Activo:</strong> ${check(estaActivo)}</span>
      </div>
    `;

    item.addEventListener("click", () => {
      if (typeof this.onClick === "function") {
        this.onClick(this.usuario);
      }
    });

    this.element = item;
  }
}
