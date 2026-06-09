import { BaseComponent } from "../../components/BaseComponent.js";
import contexto from "../../core/store.js";
import { formatearFecha } from '../../utils/date.js';

export class PacienteCorreccionItem extends BaseComponent {
  constructor({ paciente, atencion, administradora, solicitudes }) {
    super();
    this.paciente = paciente;
    this.atencion = atencion;
    this.administradora = administradora;
    this.solicitudes = solicitudes;
  }

  render() {
    const item = document.createElement("div");
    item.classList.add("correccion-paciente-bloque");

    // Identificar el estado de la corrección más reciente
    // Asumimos que la primera o última tiene el estado relevante, ordenaremos o tomaremos el primero:
    const solicitudReciente = this.solicitudes[0]; 
    const estadoNombre = solicitudReciente?.estadoCorreccion?.nombre || 'PENDIENTE';
    const estadoClase = estadoNombre.toLowerCase();

    // Contenedor Info
    const info = document.createElement("div");
    info.classList.add("correccion-paciente-info");
    
    const nombre = [
      this.paciente?.primerNombre,
      this.paciente?.segundoNombre,
      this.paciente?.primerApellido,
      this.paciente?.segundoApellido
    ].filter(Boolean).join(' ') || 'Paciente sin nombre';

    info.innerHTML = `
      <div class="correccion-paciente-nombre">${nombre}</div>
      <div class="correccion-paciente-metadata">
        <span class="correccion-paciente-fecha">${formatearFecha(this.atencion.fecha) || "Sin fecha"}</span>
        <span class="correccion-paciente-eps">${this.administradora?.nombre || "Sin EPS"}</span>
      </div>
      <div class="correccion-paciente-footer">
        <span class="badge-estado ${estadoClase}">${estadoNombre}</span>
        <span class="material-symbols-outlined correccion-alerta-icon">quick_reference</span>
      </div>
    `;

    // Contador Circular
    const contador = document.createElement("div");
    contador.classList.add("correccion-contador-circular");
    contador.textContent = this.solicitudes.length;

    item.appendChild(info);
    item.appendChild(contador);

    this.element = item;
    return item;
  }
}
