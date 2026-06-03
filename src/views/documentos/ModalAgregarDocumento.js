// modalAgregarDocumento.js
import contexto from "../../core/store.js";
import { Modal } from "../../components/modal.js";
import { apiUpload } from "../../core/api.js";
import { formatearErroresHTML } from "../../utils/error.js";
import { Dropzone } from "../../components/Dropzone.js";

export class ModalAgregarDocumento extends Modal {
  constructor(atencion, onSuccess) {
    super();
    this.atencion = atencion;
    this.onSuccess = onSuccess; 
    this.render();
    this._bindEventos();
    this.cargarTipos();
  }

  render() {

    const {paciente} = this.atencion;
    this.modal = document.createElement("div");
    this.modal.classList.add("modal-overlay");

    this.modal.innerHTML = `
  <div class="modal-contenido modal-md">
        <button class="btn-cerrar">&times;</button>
        <h2>Agregar Documento - 
          ${paciente.primerNombre} ${paciente.primerApellido}</h2>
        <form id="formAgregarDoc">
          <label for="tipoDocumento">Tipo de Documento</label>
          <select id="tipoDocumento" name="tipoDocumentoId" required></select>

          <div class="campo-relacion hidden" >
            <label for="numeroRelacion">N° de Relación</label>
            <input type="text" id="numeroRelacion" name="NumeroRelacion" />
          </div>

          <div class="campo-fecha hidden" >
            <label for="fecha">Fecha del Documento</label>
            <div style="display: flex; gap: 10px;">
              <input type="date" id="fecha" name="fecha" style="flex: 1;" />
              <input type="time" id="hora" name="hora" style="width: 120px;" />
            </div>
          </div>

          <label for="archivo">Archivo</label>
          <div id="dropzoneContainer"></div>
          <div class="modal-acciones">
            <button type="submit" class="btn-primario">Subir</button>
          </div>
        </form>
      </div>
`;

    document.body.appendChild(this.modal);

    // Referencias
    this.form = this.modal.querySelector("#formAgregarDoc");
    this.selectTipo = this.modal.querySelector("#tipoDocumento");
    // this.inputArchivo = this.modal.querySelector("#archivo");
  // Deshabilitar el input de archivo inicialmente
    // this.inputArchivo.disabled = true;
    this.inputFecha = this.modal.querySelector("#fecha");
    this.inputHora = this.modal.querySelector("#hora");
    this.inputRelacion = this.modal.querySelector("#numeroRelacion");
    this.btnCerrar = this.modal.querySelector(".btn-cerrar");
    
    // Establecer fecha y hora actual
    const ahora = new Date();
    this.inputFecha.valueAsDate = ahora;
    this.inputHora.value = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;


    this.dropZoneContainer = this.modal.querySelector("#dropzoneContainer");
    this.dropZone = new Dropzone();
    this.dropZoneContainer.appendChild(this.dropZone.render());

  }

  _bindEventos() {
    this.btnCerrar.addEventListener("click", () => this.cerrar());

    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) this.cerrar();
    });

    this.selectTipo?.addEventListener("change", () => {
      const tipo = this.selectTipo.selectedOptions[0];
      if (!tipo || !tipo.value || tipo.disabled) {
        this.dropZone.inputFile.value = "";
        this.dropZone.inputFile.disabled = true;
        return;
      }
      this.dropZone.inputFile.disabled = false;
      const extension = tipo?.dataset.extensionPermitida;
      if (extension) this.dropZone.inputFile.accept = `.${extension}`;

      const requiereRelacion = tipo?.dataset.requiereRelacion === "true";
      const esAsistencial = tipo?.dataset.esAsistencial === "true";

      // Mostrar u ocultar campos según el tipo
      this.inputRelacion.closest(".campo-relacion").classList.toggle("hidden", !requiereRelacion);
      this.inputFecha.closest(".campo-fecha").classList.toggle("hidden", !esAsistencial);
        
      this.inputRelacion.required = requiereRelacion;
      this.inputFecha.required = esAsistencial;
      this.inputHora.required = esAsistencial;
    });

    // Submit propio
    this.form.addEventListener("submit",(e) => this.enviarFormulario(e));
  }
  async enviarFormulario(e){
    e.preventDefault();
      const dropZone = this.dropZone.dropzone;
      const archivo = this.dropZone.inputFile.files[0];

      if (!archivo) {
        dropZone.classList.add("dropzone-error");
        dropZone.textContent = "Debes seleccionar un archivo";
        return;
      }

      dropZone.classList.remove("dropzone-error");

      const formData = new FormData(this.form);
      
      // Combinar fecha y hora si ambos están presentes
      if (this.inputFecha.value && this.inputHora.value) {
        const fechaHora = `${this.inputFecha.value}T${this.inputHora.value}:00`;
        formData.set("fecha", fechaHora);
        formData.delete("hora"); // Remover el campo hora separado
      }
      
      formData.append("atencionId", this.atencion.id);

      const res = await apiUpload("/Documentos/cargar", formData);

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Documento cargado",
          text: "El archivo se ha subido correctamente.",
        });    
        console.log("documento cargado",res);
          
        if (typeof this.onSuccess === "function") {
          this.onSuccess(res.result); // Recargar documentos, etc.
        }
        this.cerrar();
      } else {
        const erroresHTML = formatearErroresHTML(res.errorMessages);        
        Swal.fire({
          icon: "error",
          title: "Error al guardar",
          html: `<p>Error al cargar documento</p>${
            erroresHTML ? `<div class="swal-errores">${erroresHTML}</div>` : ""
          }`,
        });
         this.cerrar();
      }
  }
  cargarTipos() {
    const {tiposDocumentosPermitidos} = contexto;

    const tipos = tiposDocumentosPermitidos.filter(
      tipo => Number(tipo.estadoAtencionInicialId) <= Number(this.atencion.estadoAtencionId)
    );
    this.selectTipo.innerHTML = "<option disabled selected>Seleccione un tipo</option>";
    tipos.forEach((tipo) => {
      const opt = document.createElement("option");
      opt.value = tipo.id;
      opt.textContent = tipo.nombre;
      opt.dataset.extensionPermitida = tipo.extensionPermitida;
      opt.dataset.requiereRelacion = tipo.requiereNumeroRelacion;
      opt.dataset.esAsistencial = tipo.esAsistencial;
      this.selectTipo.appendChild(opt);
    });

  }
  resetDropzone() {
    const dropZone = this.modal.querySelector("#dropzone");

    dropZone.classList.remove("dropzone-error");
    dropZone.innerHTML = "Arrastra y suelta un archivo aquí o haz clic para seleccionar uno.";
    const canvas = document.querySelector(".preview-pdf");
    if (canvas) {
      canvas.remove();
    }
  }
//  mostrarPreview(file, container) {
//       console.log("mostrarPreview");

//       container.innerHTML = "";
//       if (file.type === "application/pdf") {
//         // PDF: usar generarThumbnailPdf
//         const canvas = document.createElement("canvas");
//         canvas.className = "preview-pdf";
//         canvas.title = file.name;
//         container.appendChild(canvas);
//         const name = document.createElement("div");
//         name.textContent = file.name;
//         name.style.textAlign = "center";
//         name.style.fontSize = "0.9em";
//         container.appendChild(name);
//         const reader = new FileReader();
//         reader.onload = async (e) => {
//           const blob = new Blob([e.target.result], { type: "application/pdf" });
//           // importar la función si no está en el scope
//           const { generarThumbnailPdf } = await import("../../utils/pdf.js");
//           await generarThumbnailPdf(blob, canvas);
//         };
//         reader.readAsArrayBuffer(file);
//       } else {
//         container.textContent = file.name;
//       }
//     }
  cerrar() {
    this.modal.remove(); // Se destruye completamente del DOM
  }
}
