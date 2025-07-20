// modalNuevaAtencion.js
import { Modal } from "../modales/modal.js";
import { apiPost, apiGet } from "../api/api.js";
import {
  calcularEdadTexto,
  formatearErroresHTML,
  formatearFecha,
} from "../helpers/utils.js";

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
            <p><strong>Nombres:</strong> <span id="pacienteNombres"></span></p>
            <p><strong>Apellidos:</strong> <span id="pacienteApellidos"></span></p>
            <p><strong>Fecha de Nacimiento:</strong> <span id="pacienteFechaNacimiento"></span> <strong>Edad:</strong> <span id="pacienteEdad"></span></p>

            <label for="administradoraSelect"><strong>Administradora:</strong></label>
            <select id="administradoraSelect" name="terceroId" required></select>
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
    const pacientes = result.result || [];
    
    this.selectPaciente.innerHTML =
      '<option value="" disabled selected>— Selecciona —</option>';
    pacientes.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = `${p.primerNombre} ${p.primerApellido} (${p.id})`;
      this.selectPaciente.appendChild(opt);
    });

    this.selectPaciente.addEventListener("change", async () => {
      const pacienteId = this.selectPaciente.value;
      if (pacienteId) {
        const paciente = pacientes.find((p) => p.id == pacienteId);
        if (paciente) {
          this.cargarPacienteEnFormulario(paciente);
        } else {
          Swal.fire({ icon: "error", title: "Paciente no encontrado" });
        }
      }
    });
  }

  async cargarUltimoPaciente() {
    const respuesta = await apiGet("/Pacientes/ultimo");

    if (respuesta.ok) { 
      
      
      const paciente = respuesta.result;
        if (paciente) {
          this.cargarPacienteEnFormulario(paciente);
          this.selectPaciente.innerHTML = `<option selected value="${paciente.id}">${paciente.primerNombre} ${paciente.primerApellido} - ${paciente.id}</option>`;
        }
        else{
          Swal.fire({
            icon: "info",
            title: "No hay pacientes recuentes",
            html: erroresHtml,
          });
        }
     
    } else {
      const erroresHtml = res.errorMessages
        ? formatearErroresHTML(res.errorMessages)
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
    this.cargarPacientes();
  }

  cargarPacienteEnFormulario(paciente) {
    this.infoPaciente.classList.remove("hidden");
    this.nombreSpan.textContent = paciente.primerNombre;
    this.apellidoSpan.textContent = paciente.primerApellido;
    this.nacimientoSpan.textContent = formatearFecha(paciente.fechaNacimiento);
    this.edadSpan.textContent = calcularEdadTexto(paciente.fechaNacimiento);
    this.selectAdm.innerHTML = "";
    paciente.administradoras.forEach((adm) => {
      const opt = document.createElement("option");
      opt.value = adm.nit;
      opt.textContent = adm.nombre;
      this.selectAdm.appendChild(opt);
    });

    this.btnLimpiar.classList.remove("hidden");
  }
  async enviarFormulario() {
    const pacienteId = this.selectPaciente.value;

    const terceroId = this.selectAdm.value;

    if (!pacienteId || !terceroId) return;

    const payload = {
      pacienteId,
      terceroId,
    };

    const res = await apiPost("/Atenciones", payload);

    if (res.ok) {
      Swal.fire({ icon: "success", title: "Atención creada" });
      console.log(this.onSuccess);
      
      if (typeof this.onSuccess === "function") this.onSuccess();
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
