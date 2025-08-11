import { BaseComponent } from "../../base/BaseComponent.js";

export class EstadoAtencionItem extends BaseComponent {
  constructor(estado,onClick) {
    super();
    this.estado = estado;
    this.onClick = onClick;
  }

  render() {
    const div = document.createElement("div");
    div.classList.add("estado-atencion-item");
    div.textContent = this.estado.nombre;
    div.addEventListener("click", () => this.onClick(this.estado));
    this.element = div;
    return this.element;
  }
}

