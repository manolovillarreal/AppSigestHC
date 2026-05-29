import { BaseComponent } from "../base/BaseComponent.js";
import contexto from "../contexto/contexto.js";
import { puedeAvanzarEstado } from "../utils/estados.js";
import { PERFILES } from "../config/config.js";

export class AtencionEstado extends BaseComponent {
  constructor(atencion, onAvanzar, onCerrar) {
    super();
    this.atencion = atencion;
    this.onAvanzar = onAvanzar;
    this.onCerrar = onCerrar;
  }

  render() {
    const perfil = contexto.perfil;
    const puedeAvanzar = puedeAvanzarEstado(this.atencion.estadoAtencionId, perfil.rol.nombre);

    this.element = document.createElement("div");
    if (!puedeAvanzar) return;

    this.element.className = "contenedor-avanzar";

    if (this.atencion.estadoAtencionId == 2 && perfil.rol.nombre === PERFILES.MEDICO) {
      const btnCerrar = document.createElement("button");
      btnCerrar.id = "btnCerrarAtencion";
      btnCerrar.title = "Cerrar atención";
      btnCerrar.className = "btn-salida";
      btnCerrar.innerHTML = `<span class="material-icons">exit_to_app</span>`;
      btnCerrar.appendChild(document.createTextNode(" Cerrar Atención"));
      btnCerrar.addEventListener("click", () => {
        if (typeof this.onCerrar === "function") {
          this.onCerrar();
        }
      });
      this.element.appendChild(btnCerrar);
    }

    const btnAvanzar = document.createElement("button");
    btnAvanzar.id = "btnAvanzarEstado";
    btnAvanzar.className = "btn-avanzar";

    const iconAvanzar = document.createElement("span");
    iconAvanzar.className = "material-icons";
    iconAvanzar.textContent = "arrow_forward";

    btnAvanzar.appendChild(iconAvanzar);
    btnAvanzar.appendChild(document.createTextNode(" Avanzar Estado"));
    btnAvanzar.addEventListener("click", () => {
      if (typeof this.onAvanzar === "function") {
        this.onAvanzar();
      }
    });

    this.element.appendChild(btnAvanzar);
  }
}
