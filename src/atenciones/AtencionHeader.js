import { BaseComponent } from "../base/BaseComponent.js";
import contexto from "../contexto/contexto.js";
import { formatearFechaHora } from "../utils/date.js";
import { PERFILES } from "../config/config.js";
import { apiPut } from "../api/api.js";
import { formatearErroresHTML } from "../utils/error.js";

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
    this.element.className = "atencion-header";
    this.element.innerHTML = `
      <div class="atencion-info">
        <div>
          <strong>Atención ID:</strong> <span id="cabecera-id">${this.atencion.id}</span>
          <strong style="margin-left: 10px;">Paciente ID:</strong>
          <span id="cabecera-paciente-id">${this.atencion.paciente.id}</span>
        </div>
        <strong>Paciente:</strong>
        <span class="paciente-nombre-view">${this.atencion.paciente.primerNombre} ${this.atencion.paciente.primerApellido}</span><br />
        <strong>Fecha:</strong>
        <span id="cabecera-fecha">${formatearFechaHora(this.atencion.fecha)}</span><br />
        <strong>Administradora:</strong>
        <span id="cabecera-adm">${this.atencion.administradora.nombre}</span><br />
        <div id="estadoyTipoContainer">
          <div>
            <strong>Estado:</strong>
            <span id="estadoAtencion">${this.atencion.estadoAtencion.nombre}</span>
          </div>
        </div>
      </div>
    `;

    const tipoAtencionElement = this._setTipoAtencionElement();
    this.element.querySelector("#estadoyTipoContainer").appendChild(tipoAtencionElement);

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
    tipoAtencionElement.className = "fila-horizontal";

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

      const title = document.createElement("strong");
      title.textContent = "Tipo Atención:";
      tipoAtencionElement.appendChild(title);
      tipoAtencionElement.appendChild(select);

      const btnGuardar = document.createElement("button");
      btnGuardar.id = "btnGuardarTipoAtencion";
      btnGuardar.className = "btn-guardar-tipo-atencion";
      btnGuardar.title = "Guardar tipo de atención";
      btnGuardar.innerHTML = `<span class="material-icons">save</span>`;
      btnGuardar.style.marginLeft = "8px";
      tipoAtencionElement.appendChild(btnGuardar);

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
        <strong>Tipo Atención:</strong>
        <span id="tipoAtencion">${this.atencion.tipoAtencionId == 1 ? "Urgencias" : "Hospitalización"}</span>
      `;
    }

    return tipoAtencionElement;
  }
}
