// modalNuevaAtencion.js
import { Modal } from "../components/modal.js";
import { apiPost, apiGet } from "../api/api.js";
import {
  calcularEdadTexto,
  formatearFecha,
  formatearFechaHora,
} from "../utils/date.js";
import { formatearErroresHTML } from "../utils/error.js";

export class ModalNuevaAtencion extends Modal {
  constructor(onSuccess) {
    super();
    this.onSuccess = onSuccess;
    this.render();
    this._bindEventos();
  }

  render() {
    this.modal = document.createElement("div");
    this.modal.classList.add("modal-overlay");

    this.modal.innerHTML = `
      <div class="modal-contenido modal-md">
        <button class="btn-cerrar">&times;</button>
        <h2>Nueva Atención</h2>

        <form id="formNuevaAtencion">
          <div class="paciente-select-group">
            <label for="pacienteSelect">Seleccionar Paciente:</label>
            <div class="select-con-botones">
              <select id="selectPaciente" required>
                <option value="" disabled selected>— Selecciona o busca —</option>
              </select>
              <div class="select-btns">
                <button type="button" id="btnUltimoPaciente" title="Último paciente ingresado" class="icon-btn">
                  <span class="material-icons">person_pin</span>
                </button>
                <button type="button" id="btnLimpiarPaciente" title="Limpiar" class="icon-btn hidden">
                  <span class="material-icons">clear</span>
                </button>
              </div>
            </div>
          </div>

          <div id="pacienteInfo" class="hidden">
            <div class="paciente-card">
              <div class="paciente-card-header">
                <span class="material-icons">person</span>
                <span>Información del Paciente</span>
              </div>
              <div class="paciente-card-body">
                <div class="paciente-fila">
                  <div class="paciente-campo">
                    <span class="campo-label">Nombres</span>
                    <span class="campo-valor" id="pacienteNombres"></span>
                  </div>
                  <div class="paciente-campo">
                    <span class="campo-label">Apellidos</span>
                    <span class="campo-valor" id="pacienteApellidos"></span>
                  </div>
                </div>
                <div class="paciente-fila">
                  <div class="paciente-campo">
                    <span class="campo-label">Fecha de Nacimiento</span>
                    <span class="campo-valor" id="pacienteFechaNacimiento"></span>
                  </div>
                  <div class="paciente-campo">
                    <span class="campo-label">Edad</span>
                    <span class="campo-valor" id="pacienteEdad"></span>
                  </div>
                </div>
                <div class="paciente-fila ingreso-destacado">
                  <div class="paciente-campo">
                    <span class="campo-label">Ingreso a Urgencias</span>
                    <span class="campo-valor" id="pacienteFechaIngreso"></span>
                  </div>
                </div>
              </div>
            </div>

            <div class="campo-grupo">
              <label for="administradoraSelect">Administradora</label>
              <select id="administradoraSelect" name="terceroId" required></select>
            </div>
          </div>

          <div class="modal-acciones">
            <button type="submit" class="btn-primario">Crear Atención</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(this.modal);

    // Referencias
    this.form = this.modal.querySelector("#formNuevaAtencion");
    this.selectPaciente = this.modal.querySelector("#selectPaciente");
    this.btnUltimo = this.modal.querySelector("#btnUltimoPaciente");
    this.btnLimpiar = this.modal.querySelector("#btnLimpiarPaciente");

    this.infoPaciente = this.modal.querySelector("#pacienteInfo");
    this.nombreSpan = this.modal.querySelector("#pacienteNombres");
    this.apellidoSpan = this.modal.querySelector("#pacienteApellidos");
    this.nacimientoSpan = this.modal.querySelector("#pacienteFechaNacimiento");
    this.edadSpan = this.modal.querySelector("#pacienteEdad");
    this.ingresoSpan = this.modal.querySelector("#pacienteFechaIngreso");
    this.selectAdm = this.modal.querySelector("#administradoraSelect");

    this.btnCerrar = this.modal.querySelector(".btn-cerrar");
  }
  _bindEventos() {
    this.btnCerrar.addEventListener("click", () => this.cerrar());
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) this.cerrar();
    });

    this.btnUltimo.addEventListener("click", () => this.cargarUltimoPaciente());
    this.btnLimpiar.addEventListener("click", () => this.resetFormulario());

    this.form.addEventListener("submit", (e) => {
      e.preventDefault(e);
      this.enviarFormulario();
    });

    this.cargarPacientes();
  }

  async cargarPacientes() {
    const result = await apiGet("/Pacientes/ingresos");

    if (!result.ok) {
      return Swal.fire({
        icon: "error",
        title: "Error al cargar pacientes recientes",
      });
    }
    const ingresos = result.result || [];
    this.ingresos = ingresos;
    
    this.selectPaciente.innerHTML =
      '<option value="" disabled selected>— Selecciona —</option>';
    ingresos.forEach((ingreso) => {
      const paciente = ingreso.paciente || {};
      const opt = document.createElement("option");
      opt.value = ingreso.id;
      opt.textContent = `${paciente.primerNombre || ""} ${paciente.primerApellido || ""} (${paciente.id || ""})`;
      this.selectPaciente.appendChild(opt);
    });

    this.selectPaciente.addEventListener("change", async () => {
      const ingresoId = this.selectPaciente.value;
      if (ingresoId) {
        const ingreso = ingresos.find((item) => item.id == ingresoId);
        if (ingreso) {
          this.ingresoSeleccionado = ingreso;
          this.cargarPacienteEnFormulario(ingreso);
        } else {
          Swal.fire({ icon: "error", title: "Paciente no encontrado" });
        }
      }
    });
  }

  async cargarUltimoPaciente() {
    const respuesta = await apiGet("/Pacientes/ultimo");

    if (respuesta.ok) {
      const ingreso = respuesta.result;
      if (ingreso) {
        const paciente = ingreso.paciente || {};
        this.ingresoSeleccionado = ingreso;
        this.cargarPacienteEnFormulario(ingreso);
        this.selectPaciente.innerHTML = `<option selected value="${ingreso.id}">${paciente.primerNombre || ""} ${paciente.primerApellido || ""} - ${paciente.id || ""}</option>`;
      } else {
        Swal.fire({
          icon: "info",
          title: "No hay pacientes recuentes",
        });
      }
    } else {
      const erroresHtml = respuesta.errorMessages
        ? formatearErroresHTML(respuesta.errorMessages)
        : "";
      Swal.fire({
        icon: "error",
        title: "Error",
        html: erroresHtml,
      });
    }
  }
  resetFormulario() {
    this.selectPaciente.value = "";
    this.infoPaciente.classList.add("hidden");
    this.btnLimpiar.classList.add("hidden");
    this.selectAdm.innerHTML = "";
    this.ingresoSeleccionado = null;
    this.cargarPacientes();
  }

  cargarPacienteEnFormulario(ingreso) {
    const paciente = ingreso.paciente || {};
    this.infoPaciente.classList.remove("hidden");
    this.nombreSpan.textContent = paciente.primerNombre;
    this.apellidoSpan.textContent = paciente.primerApellido;
    this.nacimientoSpan.textContent = formatearFecha(paciente.fechaNacimiento);
    this.edadSpan.textContent = calcularEdadTexto(paciente.fechaNacimiento);
    this.ingresoSpan.textContent = formatearFechaHora(
      ingreso.fechaIngreso || ingreso.fecha
    );
    this.selectAdm.innerHTML = "";
    (paciente.administradoras || []).forEach((adm) => {
      const opt = document.createElement("option");
      opt.value = adm.nit;
      opt.textContent = adm.nombre;
      this.selectAdm.appendChild(opt);
    });

    this.btnLimpiar.classList.remove("hidden");
  }
  async enviarFormulario() {
    const ingresoId = this.selectPaciente.value;
    const terceroId = this.selectAdm.value;

    if (!ingresoId || !terceroId || !this.ingresoSeleccionado) return;

    const payload = {
      pacienteId: this.ingresoSeleccionado.pacienteId || this.ingresoSeleccionado.paciente?.id,
      terceroId,
      tipoAtencionId: 1
    };

    const res = await apiPost("/Atenciones", payload);

    if (res.ok) {
      Swal.fire({ icon: "success", title: "Atención creada" });   
      if (typeof this.onSuccess === "function") this.onSuccess(res.result);
      this.cerrar();
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        html: formatearErroresHTML(res.errorMessages),
      });
    }
  }

  cerrar() {
    this.modal.remove();
  }
}
