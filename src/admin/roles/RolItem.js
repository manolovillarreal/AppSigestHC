import { BaseComponent } from '../../base/BaseComponent.js'

export class RolItem extends BaseComponent {
  constructor(rol,onClick) {
    super()
    this.rol = rol;
    this.onClick = onClick;
  }

  render() {
    const {id,nombre} = this.rol;

    const item = document.createElement("div");
    item.className = `rol-item`;
    item.innerHTML = `
          <div class="rol-header">
            <span class="rol-nombre">${nombre}</span>
            <span class="rol-id">#${id}</span>
          </div>          
        `;
    item.addEventListener("click", () => {
          if (typeof this.onClick === "function") {
            this.onClick(this.rol);
          }
        });
    this.element = item;
    
  }
}

customElements.define('rol-item', RolItem)
