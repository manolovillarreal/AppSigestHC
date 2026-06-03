import { BaseComponent } from "../../components/BaseComponent.js";
import { calcularEdad } from '../../utils/date.js';

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
        if(this.atencion.tieneCorreccionesPendientes) {
            item.classList.add("atencion-item-correcciones");
        }
        item.dataset.id = this.atencion.id;
        item.addEventListener('click', () => {
            console.log(this.atencion);
            document.querySelectorAll('.atencion-item').forEach(el => el.classList.remove('atencion-item-selected'));
            this.element.classList.add("atencion-item-selected");
            this.clickHandler(this.atencion);
        });
        item.innerHTML = `
                <div class="paciente-info">
                <div>
                    <strong>${paciente.primerNombre} ${paciente.primerApellido}</strong>
                    <span>${calcularEdad(paciente.fechaNacimiento)} años</span>
                </div>
                ${ubicacionPaciente ? `<span class="ubicacion">${ubicacionPaciente.codigo}</span>` : ''}
                </div>
                <div class="atencion-detalles">
                <span class="fecha">${new Date(
                    this.atencion.fecha
                ).toLocaleString()}</span>
                
                </div>
                <div class="extra-info">
                    <span class="extra-label">${this.atencion.extraLabel}</span>
                    ${this.atencion.tieneCorreccionesPendientes ? 
                    `<span id="correcciones-pendientes" class="material-symbols-outlined">quick_reference</span>` : ''}                
                </div>
            `;
        this.element = item;
    }

}