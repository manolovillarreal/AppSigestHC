import debug from "../helpers/debug.js";
import { puedeAvanzarEstado } from "../helpers/estados.js";
import { formatearFechaHora, formatearErroresHTML } from "../helpers/utils.js";
import { ListaDocumentos } from "../documentos/listaDocumentos.js";
import contexto from "../contexto/contexto.js"; // Asegúrate de que el perfil esté importado correctamente
import { ModalAgregarDocumento } from "../documentos/ModalAgregarDocumento.js";
import { apiDelete, apiPost, apiPut } from "../api/api.js";
import { PERFILES } from "../config/config.js";
import { BaseComponent } from "../base/BaseComponent.js";
import atencionesService from '../services/AtencionServices.js'; 
export class AtencionView extends BaseComponent {
  constructor(atencion, onSuccess) {
    super();
    this.atencion = atencion;
    this.onSuccess = onSuccess;
  }
  render() {
    this.element = document.createElement("div");
    if (!this.atencion) return;

    this._renderCabecera();

    const { perfil } = contexto;
    if (puedeAvanzarEstado(this.atencion.estadoAtencion.id, perfil.rol.nombre)){
      this._renderContenedorAvanzar();
    }    

    this._renderPanelDocumentos();
   
  }
  _renderCabecera() {
    const header = document.createElement("div");
    header.id = "panel-cabecera-atencion";
    header.className = "atencion-header";
    header.innerHTML = `
          <div class="atencion-info">
          <div>
              <strong>Atención ID:</strong> <span id="cabecera-id">${
                this.atencion.id
              }</span>
             <strong style="margin-left: 10px;">Paciente ID:</strong> <span id="cabecera-id">${
               this.atencion.paciente.id
             }</span>
          </div>
          <strong>Paciente:</strong> <span class="paciente-nombre-view">${
            this.atencion.paciente.primerNombre
          } ${this.atencion.paciente.primerApellido}</span><br />
              <strong>Fecha:</strong> <span id="cabecera-fecha">${formatearFechaHora(
                this.atencion.fecha
              )}</span><br />
              <strong>Administradora:</strong> <span id="cabecera-adm">${
                this.atencion.administradora.nombre
              }</span
              ><br />
              <div id="estadoyTipoContainer">
                <div>
                  <strong>Estado:</strong> 
                  <span id="estadoAtencion">${
                    this.atencion.estadoAtencion.nombre
                  }</span>
                </div>
              </div>              
          </div>
          `;
    const tipoAtencionElement = this._setTipoAtencionElement();
    header
      .querySelector("#estadoyTipoContainer")
      .appendChild(tipoAtencionElement);

    const btnCerrar = document.createElement("button");
    btnCerrar.id = "btnCerrarPanelAtencion";
    btnCerrar.className = "btn-cerrar-atencion";
    btnCerrar.title = "Cerrar panel";
    btnCerrar.innerHTML = `<span class="material-icons">close</span>`;

    const _container = this.container;
    btnCerrar.addEventListener("click", () => {
      this.element.remove();
    });
    header.appendChild(btnCerrar);

    const { perfil } = contexto;
    if (
      this.atencion.estadoAtencion.id == 1 &&
      perfil.rol.nombre == PERFILES.ADMISIONES
    ) {
      const btnAnular = document.createElement("button");
      btnAnular.id = "btnAnularAtencion";
      btnAnular.className = "btn-anular-atencion";
      btnAnular.title = "Cerrar panel";
      btnAnular.innerHTML = `<span class="material-icons">delete</span>`;

      btnAnular.addEventListener("click", () => {
        this._anularAtencion();
      });
      header.appendChild(btnAnular);
    }

    this.element.appendChild(header);
  } 
  _renderContenedorAvanzar() {
    // Contenedor botón avanzar
    const contenedorAvanzar = document.createElement("div");
    contenedorAvanzar.className = "contenedor-avanzar";

    const { perfil } = contexto;
    if (this.atencion.estadoAtencionId == 2 && perfil.rol.nombre == PERFILES.MEDICO) {
      console.log("Renderizando botón cerrar atención");

      const btnCerrar = document.createElement("button");
      btnCerrar.id = "btnCerrarAtencion";
      btnCerrar.title = "Cerrar atención";
      btnCerrar.className = "btn-salida";
      btnCerrar.innerHTML = `<span class="material-icons">exit_to_app</span>`;
      btnCerrar.appendChild(document.createTextNode(" Cerrar Atención"));
      btnCerrar.addEventListener("click", this.cerrarAtencion.bind(this));
      contenedorAvanzar.appendChild(btnCerrar);
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
      this.PreguntarSiAvanzarEstado();
    });

    contenedorAvanzar.appendChild(btnAvanzar);

    this.element.appendChild(contenedorAvanzar);
  }
  _renderPanelDocumentos(){
    const h3 = document.createElement("h3");
    h3.textContent = "Documentos de la Atención";
    this.element.appendChild(h3);
    const contenedorDocumentos = document.createElement("ul");
    contenedorDocumentos.id = "documentos-list";
    contenedorDocumentos.className = "list-view";

    const listaDocumentos = new ListaDocumentos(this.atencion);
    console.log(listaDocumentos);
    
    listaDocumentos.mount(contenedorDocumentos);
    
    const btnAgregarDocumento = document.createElement("button");
    btnAgregarDocumento.id = "btn-agregar-documento";
    btnAgregarDocumento.className = "btn-primary";
    btnAgregarDocumento.textContent = " Agregar Documento";
    btnAgregarDocumento?.addEventListener("click", () => {
      const modal = new ModalAgregarDocumento(this.atencion, (documento) => {
        listaDocumentos.documentos.push(documento);
          listaDocumentos.reMount(false); // No recargar desde el servidor
          console.log(documento);
          
          //ESTO NO ESTA BIEN, HAY QUE HACER MODIFICACIONES PARA QUE 
          //NO DEPENDA DE QUE EL DOCUMENTO SEA FACTURA, 
          //SINO QUE CUALQUIER DOCUMENTO PUEDA AVANZAR EL ESTADO SI ASI LO REQUIERE EL FLUJO
          if(documento.tipoDocumento.id==12){ // Si es una Factura
            this.avanzarEstado('Estado avanzado automáticamente al registrar la factura');
          }
          
      });
    });

    this.element.appendChild(btnAgregarDocumento);    
    this.element.appendChild(contenedorDocumentos);
  }  
  _onSuccess(accion){ 

    if (this.onSuccess) this.onSuccess(accion);    

    accion=="anulada"?this.element.remove():this.reMount();

  }
  _setTipoAtencionElement() {
    const tipoAtencionElement = document.createElement("div");
    tipoAtencionElement.className = "fila-horizontal";

    const { perfil } = contexto;

    if (perfil.rol.nombre == PERFILES.ENFERMERIA) {
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
        console.log("change");

        if (select.value == this.atencion.tipoAtencionId) {
          btnGuardar.style.display = "none";
        } else {
          btnGuardar.style.display = "";
        }
      });
      // Inicializa el estado del botón al cargar
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

          this._onSuccess("actualizada");
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
          console.log(err);

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
      <strong>Tipo Atención:</strong> <span id="tipoAtencion">
        ${this.atencion.tipoAtencionId == 1 ? "Urgencias" : "Hospitalización"}
      </span>
    `;
    }

    return tipoAtencionElement;
  }
  async PreguntarSiAvanzarEstado() {
    const { isConfirmed, value: observacion } = await Swal.fire({
      icon: "question",
      title: "¿Avanzar estado de esta atención?",
      html: `
      <p>Esta acción cambiará el estado de la atención según el flujo definido para tu rol.</p>
      <textarea id="obs-cambio-estado" class="swal2-textarea " placeholder="Observación (opcional)" name="observacion"></textarea>
    `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Sí, continuar",
      cancelButtonText: "Cancelar",
      preConfirm: () => {
        return document.getElementById("obs-cambio-estado").value.trim();
      },
    });

    if (!isConfirmed) return;

    this.avanzarEstado(observacion);

    
  }
  async avanzarEstado(observacion) {
    const payload = {
      observacion: observacion || null,
      Atencionid: this.atencion.id,
    };

    try {
      console.log("payload: ", payload);
  
      const res = await apiPost(`/Atenciones/cambiar-estado`, payload);

      if (res.ok) {
        const atencionActualizada = res.result || {};

        await Swal.fire({
          icon: "success",
          title: "Atención actualizada",
          text: `Nuevo estado: ${
            atencionActualizada.estadoAtencion?.nombre || "actualizado"
          }`,
        });
        console.log("Avanza estado:",atencionActualizada);

        this.atencion.estadoAtencion = atencionActualizada.estadoAtencion;
        this.atencion.estadoAtencionId = atencionActualizada.estadoAtencionId;

        this.render();

        this._onSuccess("actualizada");
      } else {
        console.log(res);

        const errores = formatearErroresHTML(res.errorMessages);
        await Swal.fire({
          icon: "error",
          title: res.message || "Error al avanzar estado",
          html: errores,
        });
      }
    } catch (err) {
      console.error(err);
      await Swal.fire({
        icon: "error",
        title: "Error inesperado",
        text: "No se pudo avanzar el estado.",
      });
    }
  }
  async cerrarAtencion(){
    const { isConfirmed, value: observacion } = await Swal.fire({
      icon: "question",
      title: "Cerrar atención",
      html: `<p>¿Estás seguro de que deseas cerrar esta atención?</p>
      <textarea id="obs-cierre-atencion" class="swal2-textarea" placeholder="Observación (opcional)"></textarea>`,
      showCancelButton: true,
      confirmButtonText: "Sí, cerrar",
      cancelButtonText: "Cancelar",
      preConfirm: () => {
        return document.getElementById("obs-cierre-atencion").value.trim();
      },
    });

    if (!isConfirmed) return;

    try {
        const payload = {
      observacion: observacion || null,
      Atencionid: this.atencion.id,
    };

      const res = await apiPost(`/Atenciones/cerrar`, payload);

      if (res.ok) {
        const atencionActualizada = res.result || {};
        await Swal.fire({
          icon: "success",
          title: "Atención cerrada",
          text: "La atención ha sido cerrada correctamente.",
        });

        this.atencion.estadoAtencion = atencionActualizada.estadoAtencion;
        this.atencion.estadoAtencionId = atencionActualizada.estadoAtencionId;

        this.render();

        this._onSuccess("actualizada");
      } else {
        const errores = formatearErroresHTML(res.errorMessages);
        await Swal.fire({
          icon: "error",
          title: res.message || "Error al cerrar atención",
          html: errores,
        });
      }
    } catch (err) {
      console.error(err);
      await Swal.fire({
        icon: "error",
        title: "Error inesperado",
        text: "No se pudo cerrar la atención.",
      });
    }
  }
  async _anularAtencion() {
    // Motivos de anulación (puedes adaptar estos valores)
    const motivos = [
      { value: "1", label: "Paciente abandono el servicio" },
      { value: "2", label: "Paciente redireccionado" },
      { value: "3", label: "Paciente suspendido en la eps" },
      { value: "4", label: "Error ingreso doble" },
      { value: "5", label: "Otro motivo" }
    ];
    const html = `
      <label for="motivo-anulacion">Motivo de anulación</label>
      <select id="motivo-anulacion" class="swal2-select" style="width:80%;margin-bottom:10px;">
        ${motivos.map(m => `<option value="${m.value}">${m.label}</option>`).join("")}
      </select>
      <label for="obs-anulacion">Observación</label>
      <textarea id="obs-anulacion" class="swal2-textarea" placeholder="Observación adicional" style="width:80%;"></textarea>
    `;

    const result = await Swal.fire({
      icon: "warning",
      title: "Anular atención",
      html,
      showCancelButton: true,
      confirmButtonText: "Sí, anular",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
      focusConfirm: false,
      preConfirm: () => {
        const motivo = document.getElementById("motivo-anulacion").value;
        const observacion = document.getElementById("obs-anulacion").value.trim();
        if (!motivo) {
          Swal.showValidationMessage("Debes seleccionar un motivo");
          return false;
        }
        if (motivo === "5" && !observacion) {
          Swal.showValidationMessage("La observación es obligatoria para el motivo 'Otro motivo'.");
          return false;
        }
        return { motivo, observacion };
      }
    });

    if (!result.isConfirmed || !result.value) return;

    // Enviar motivo y observación junto con la petición
    const payload = {
      motivoAnulacionAtencionId: result.value.motivo,
      observacion: result.value.observacion
    };

    const res = await atencionesService.anularAtencion(this.atencion.id, payload);

    if (res.ok) {
      await Swal.fire({
        icon: "success",
        title: "Atención eliminada",
        timer: 1500,
        showConfirmButton: false,
      });
      this.atencion.estaAnulada = true;
      this._onSuccess("anulada");
    } else {
      const mensaje = res?.mensaje || "No se pudo anular la atención.";
      const errores = formatearErroresHTML(res.errores);

      await Swal.fire({
        icon: "error",
        title: "Error",
        html: `<p>${mensaje}</p>${errores}`,
      });
    }
  }
}
