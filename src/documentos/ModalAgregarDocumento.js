// modalAgregarDocumento.js
import contexto from "../contexto/contexto.js";
import { Modal } from "../modales/modal.js";
import { apiUpload } from "../api/api.js";
import { formatearErroresHTML } from "../helpers/utils.js";

export class ModalAgregarDocumento extends Modal {
  constructor(atencionId, onSuccess) {
    super();
    this.atencionId = atencionId;
    this.onSuccess = onSuccess; // Callback para recargar lista de documentos u otras acciones
    this.render();
    this._bindEventos();
    this.cargarTipos();
  }

  render() {
    this.modal = document.createElement("div");
    this.modal.classList.add("modal-overlay");

    this.modal.innerHTML = `
  <div class="modal-contenido modal-md">
        <button class="btn-cerrar">&times;</button>
        <h2>Agregar Documento</h2>
        <form id="formAgregarDoc">
          <label for="tipoDocumento">Tipo de Documento</label>
          <select id="tipoDocumento" name="tipoDocumentoId" required></select>

          <div class="campo-relacion hidden" >
            <label for="numeroRelacion">N° de Relación</label>
            <input type="text" id="numeroRelacion" name="NumeroRelacion" />
          </div>

          <div class="campo-fecha hidden" >
            <label for="fecha">Fecha del Documento</label>
            <input type="date" id="fecha" name="fecha" />
          </div>

          <label for="archivo">Archivo</label>
          <div id="dropzone" class="dropzone">Arrastra tu archivo aquí o haz clic para seleccionar</div>
          <input type="file" id="archivo" name="archivo" />
          

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
    this.inputArchivo = this.modal.querySelector("#archivo");
    this.inputFecha = this.modal.querySelector("#fecha");
    this.inputRelacion = this.modal.querySelector("#numeroRelacion");
    this.btnCerrar = this.modal.querySelector(".btn-cerrar");

    this.inputFecha.valueAsDate = new Date();
  }

  _bindEventos() {
    this.btnCerrar.addEventListener("click", () => this.cerrar());

    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) this.cerrar();
    });

    this.selectTipo?.addEventListener("change", () => {
      const tipo = this.selectTipo.selectedOptions[0];
      if(!tipo.value)
        return;
      
      console.log(tipo.dataset);
      
      const extension = tipo?.dataset.extensionPermitida;
      if (extension) this.inputArchivo.accept = `.${extension}`;

      const requiereRelacion = tipo?.dataset.requiereRelacion === "true";
      const esAsistencial = tipo?.dataset.esAsistencial === "true";

    console.log();
    
        // Mostrar u ocultar campos según el tipo
    this.inputRelacion.closest(".campo-relacion").classList.toggle("hidden", !requiereRelacion);
    this.inputFecha.closest(".campo-fecha").classList.toggle("hidden", !esAsistencial);
        
      this.inputRelacion.required = requiereRelacion;
      this.inputFecha.required = esAsistencial;
    });

    // Submit propio
    this.form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const archivo = this.inputArchivo.files[0];
      if (!archivo) {
        dropZone.classList.add("dropzone-error");
        dropZone.textContent = "Debes seleccionar un archivo";
        return;
      }

      dropZone.classList.remove("dropzone-error");


      const formData = new FormData(this.form);
      formData.append("atencionId", this.atencionId);

      const res = await apiUpload("/Documentos/cargar", formData);

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Documento cargado",
          text: "El archivo se ha subido correctamente.",
        });
        if (typeof this.onSuccess === "function") {
          this.onSuccess(); // Recargar documentos, etc.
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
    });

    const dropZone = this.modal.querySelector("#dropzone");

    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("dropzone-hover");
    });

    dropZone.addEventListener("dragleave", () => {
      dropZone.classList.remove("dropzone-hover");
    });

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.classList.remove("dropzone-hover");

      const file = e.dataTransfer.files[0];
      if (file) {
        this.inputArchivo.files = e.dataTransfer.files;
        dropZone.textContent = file.name;
      }
    });

    dropZone.addEventListener("click", () => {
      this.inputArchivo.click();
    });

    this.inputArchivo.addEventListener("change", () => {
      const file = this.inputArchivo.files[0];
      if (file) {
        dropZone.textContent = file.name;
         dropZone.classList.remove("dropzone-error");
      }
    });
    this.inputArchivo.style.display = "none";
  }

  cargarTipos() {
    const tipos = contexto.tiposDocumentosPermitidos;
    console.log(tipos);
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

  cerrar() {
    this.modal.remove(); // Se destruye completamente del DOM
  }
}
