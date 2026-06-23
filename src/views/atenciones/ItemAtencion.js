import { BaseComponent } from "../../components/BaseComponent.js";
import { calcularEdad } from '../../utils/date.js';

export class ItemAtencion extends BaseComponent{

    constructor(atencion,clickHandler) {
        super();
        this.atencion = atencion;
        this.clickHandler = clickHandler;

    }

    render() {
        console.log('atencion:', this.atencion.id, 
          'tieneCorreccionesPendientes:', 
          this.atencion.tieneCorreccionesPendientes);
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
                <div class="badges-derecha">
                  <span class="badge-proc">PROC</span>
                  ${ubicacionPaciente ? `<span class="ubicacion">${ubicacionPaciente.codigo}</span>` : ''}
                </div>
                </div>
                <div class="atencion-detalles">
                <span class="fecha">${new Date(
                    this.atencion.fecha
                ).toLocaleString()}</span>
                </div>
                <div class="extra-info">
                    <span class="extra-label">${this.atencion.extraLabel}</span>
                    ${this.atencion.tieneCorreccionesPendientes ? 
                    `<span class="correcciones-pendientes material-symbols-outlined">quick_reference</span>` : ''}                
                </div>
                ${this.atencion.estadoAtencionId === 2 && this.atencion.nombreMedicoConsulta ? 
                  `<div class="medico-consulta" style="font-weight: 500; color: #1976d2; margin-top: 4px; font-size: 0.9em; display: flex; align-items: center; gap: 4px;">
                     <span class="material-icons" style="font-size: 16px;">person</span> 
                     ${this.atencion.nombreMedicoConsulta}
                   </div>` : ''}
            `;
        this.element = item;
    }

}