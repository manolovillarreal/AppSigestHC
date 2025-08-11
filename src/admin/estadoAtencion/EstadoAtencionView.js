import { BaseComponent } from "../../base/BaseComponent.js";
import { DocumentosRequeridos } from "./DocumentosRequeridos.js";

export class EstadoAtencionView extends BaseComponent {
  constructor(estado) {
    super();
    this.estado = estado;
  }

  render() {
    const div = document.createElement("div");
    div.classList.add("estado-atencion-view");

    const header = document.createElement("h2");
    header.textContent = this.estado.nombre;
    div.appendChild(header);
    this.element = div;

    const documentosRequeridos = new DocumentosRequeridos(this.estado);
   documentosRequeridos.appendTo(this.element);

    return this.element;
  }
}
