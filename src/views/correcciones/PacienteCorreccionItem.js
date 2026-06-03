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

    // Cabecera paciente
    const cabecera = document.createElement("div");
    cabecera.classList.add("correccion-paciente-cabecera");
    cabecera.innerHTML = `
      <strong>${this.paciente.primerNombre} ${this.paciente.primerApellido}</strong>
      <span class="correccion-contador">${this.solicitudes.length}</span>
    `;
    item.appendChild(cabecera);

    // Datos de atención
    const datos = document.createElement("div");
    datos.classList.add("correccion-paciente-datos");
    
    const {perfil} = contexto;
    
    datos.innerHTML = `
      <span>${formatearFecha(this.atencion.fecha) || ""}</span>
      <div class="correccion-linea-baja">
      <div>${this.administradora?.nombre || ""}</div>
      ${this.solicitudes.some(({documento})=> documento.usuarioId == perfil.id)?
            "<span class='material-symbols-outlined'>person_alert</span>":""}
      </div>
    `;
    item.appendChild(datos);

    this.element = item;
    return item;
  }
}
