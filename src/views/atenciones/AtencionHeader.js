import { BaseComponent } from '../../components/BaseComponent.js';
import contexto from '../../core/store.js';
import { formatearFechaHora } from '../../utils/date.js';
import { PERFILES } from '../../core/config.js';
import { apiPut } from '../../core/api.js';
import { formatearErroresHTML } from '../../utils/error.js';

export class AtencionHeader extends BaseComponent {
  constructor(atencion, onClose, onSuccess) {
    super();
    this.atencion = atencion;
    this.onClose = onClose;
    this.onSuccess = onSuccess;
  }

  render() {
    this.element = document.createElement("div");
    this.element.id = "panel-cabecera-atencion";
    this.element.className = "atencion-header-card";

    const p = this.atencion.paciente;
    const inicialesPaciente = `${p.primerNombre.charAt(0)}${p.primerApellido.charAt(0)}`.toUpperCase();
    const estadoNombre = this.atencion.estadoAtencion?.nombre || 'Desconocido';
    const estadoStr = estadoNombre.toLowerCase().replace(/ /g, '-').replace('ó', 'o');
    const administradoraNombre = this.atencion.administradora?.nombre || 'Desconocido';
    this.element.innerHTML = `
      <div class="header-datos-grid">
        <div class="grid-dato">
          <span class="grid-label">Atención ID:</span>
          <span class="grid-valor">${this.atencion.id}</span>
        </div>
        <div class="grid-dato">
          <span class="grid-label">Administradora:</span>
          <span class="grid-valor">${administradoraNombre}</span>
        </div>
        <div class="grid-dato">
          <span class="grid-label">Paciente ID:</span>
          <span class="grid-valor">${p.id}</span>
        </div>
        <div class="grid-dato">
          <span class="grid-label">Estado:</span>
          <span class="grid-valor badge-estado estado-${estadoStr}" style="margin-left:8px;">${estadoNombre}</span>
        </div>
        <div class="grid-dato">
          <span class="grid-label">Paciente:</span>
          <span class="grid-valor paciente-link">${p.primerNombre} ${p.primerApellido}</span>
        </div>
        <div class="grid-dato" id="tipoAtencionContainer">
        </div>
        <div class="grid-dato">
          <span class="grid-label">Fecha:</span>
          <span class="grid-valor">${formatearFechaHora(this.atencion.fecha)}</span>
        </div>
      </div>
      <div class="wave-bg"></div>
    `;

    const tipoAtencionElement = this._setTipoAtencionElement();
    this.element.querySelector("#tipoAtencionContainer").appendChild(tipoAtencionElement);

    const btnCerrar = document.createElement("button");
    btnCerrar.id = "btnCerrarPanelAtencion";
    btnCerrar.className = "btn-cerrar-atencion";
    btnCerrar.title = "Cerrar panel";
    btnCerrar.innerHTML = `<span class="material-icons">close</span>`;
    btnCerrar.addEventListener("click", () => {
      if (typeof this.onClose === "function") {
        this.onClose();
      } else {
        this.element.remove();
      }
    });

    this.element.appendChild(btnCerrar);
  }

  _setTipoAtencionElement() {
    const tipoAtencionElement = document.createElement("div");
    tipoAtencionElement.className = "tipo-atencion-wrapper";

    const { perfil } = contexto;

    if (perfil.rol.nombre === PERFILES.ENFERMERIA) {
      const select = document.createElement("select");
      select.id = "tipoAtencionSelect";
      const opciones = [
        { value: 1, label: "Urgencias" },
        { value: 2, label: "Hospitalización" },
      ];

      opciones.forEach((op) => {
        const option = document.createElement("option");
        option.value = op.value;
        option.textContent = op.label;
        if (this.atencion.tipoAtencionId == op.value) {
          option.selected = true;
        }
        select.appendChild(option);
      });

      const title = document.createElement("span");
      title.className = "grid-label";
      title.textContent = "Tipo Atención";
      
      const valorWrapper = document.createElement("div");
      valorWrapper.className = "grid-valor select-con-botones";
      
      tipoAtencionElement.appendChild(title);
      valorWrapper.appendChild(select);
      tipoAtencionElement.appendChild(valorWrapper);

      const btnGuardar = document.createElement("button");
      btnGuardar.id = "btnGuardarTipoAtencion";
      btnGuardar.className = "icon-btn";
      btnGuardar.title = "Guardar tipo de atención";
      btnGuardar.innerHTML = `<span class="material-icons">save</span>`;
      valorWrapper.appendChild(btnGuardar);

      select.addEventListener("change", () => {
        if (select.value == this.atencion.tipoAtencionId) {
          btnGuardar.style.display = "none";
        } else {
          btnGuardar.style.display = "";
        }
      });

      if (select.value == this.atencion.tipoAtencionId) {
        btnGuardar.style.display = "none";
      }

      btnGuardar.addEventListener("click", async () => {
        const nuevoTipo = select.value;
        if (nuevoTipo === this.atencion.tipoAtencionId) return;
        btnGuardar.style.display = "none";

        try {
          const dto = {
            id: this.atencion.id,
            tipoAtencionId: nuevoTipo,
            terceroId: this.atencion.terceroId,
          };

          const res = await apiPut(`/Atenciones/${this.atencion.id}`, dto);

          if (res.ok) {
            this.atencion.tipoAtencionId = nuevoTipo;
            await Swal.fire({
              icon: "success",
              title: "Tipo de atención actualizado",
              timer: 1200,
              showConfirmButton: false,
            });
            if (typeof this.onSuccess === "function") {
              this.onSuccess("actualizada");
            }
          } else {
            const errores = formatearErroresHTML(res.errorMessages);
            await Swal.fire({
              icon: "error",
              title: res.message || "Error al actualizar tipo de atención",
              html: errores,
            });
            btnGuardar.disabled = false;
          }
        } catch (err) {
          console.error(err);
          await Swal.fire({
            icon: "error",
            title: "Error inesperado",
            text: "No se pudo actualizar el tipo de atención.",
          });
          btnGuardar.disabled = false;
        }
      });
    } else {
      tipoAtencionElement.innerHTML = `
        <span class="grid-label">Tipo Atención</span>
        <span class="grid-valor" id="tipoAtencion">${this.atencion.tipoAtencionId == 1 ? "Urgencias" : "Hospitalización"}</span>
      `;
    }

    return tipoAtencionElement;
  }
}
