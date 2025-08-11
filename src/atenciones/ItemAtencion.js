import { BaseComponent } from "../base/BaseComponent.js";

export class ItemAtencion extends BaseComponent{

    constructor(atencion,clickHandler) {
        super();
        this.atencion = atencion;
        this.clickHandler = clickHandler;

    }

    render() {
        const {paciente,ubicacionPaciente} = this.atencion;
        const item = document.createElement('li');
        item.classList.add("atencion-item");
        item.dataset.id = this.atencion.id;
        item.addEventListener('click', () => this.clickHandler(this.atencion.id));
        item.innerHTML = `
                <div class="paciente-info">
                <strong>${paciente.primerNombre} ${paciente.primerApellido}</strong>
                ${ubicacionPaciente ? `<span class="ubicacion">${ubicacionPaciente.codigo}</span>` : ''}
                </div>
                <div class="atencion-detalles">
                <span class="fecha">${new Date(
                    this.atencion.fecha
                ).toLocaleString()}</span>
                </div>
            `;
        this.element = item;
    }

}