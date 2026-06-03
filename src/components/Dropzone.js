import { BaseComponent } from "./BaseComponent.js";

export class Dropzone extends BaseComponent {
  constructor(disable=true) {
    super();
    this.disable = disable;
  }

  render() {
    this.element = document.createElement("div");

    this.dropzone = document.createElement("div");
    this.dropzone.classList.add("dropzone");
    this.dropzone.innerHTML = `
            <p>Arrastra y suelta tu archivo aquí o haz clic para seleccionar</p>
        `;

    this.inputFile = document.createElement("input");
    this.inputFile.type = "file";
    this.inputFile.id = "archivo";
    this.inputFile.name = "archivo";
    this.inputFile.style.display = "none";
    this.inputFile.disabled = this.disable;

    this.element.appendChild(this.dropzone);
    this.element.appendChild(this.inputFile);

    this._bindEvents();

    return this.element;
  }

  _bindEvents() {
    const dropZone = this.dropzone;

    // Dragover
    dropZone.addEventListener("dragover", (e) => {
        if (this.inputFile.disabled) {
            e.preventDefault();
            dropZone.classList.add("dropzone-error");
            dropZone.textContent = "Primero selecciona el tipo de documento";
            setTimeout(() => {
            dropZone.classList.remove("dropzone-error");
            dropZone.textContent =
                "Arrastra tu archivo aquí o haz clic para seleccionar";
            }, 1800);
            return;
        }
        e.preventDefault();
        dropZone.classList.add("dropzone-hover");
    });
    // Drag leave
    dropZone.addEventListener("dragleave", () => {
      dropZone.classList.remove("dropzone-hover");
    });
    // Drop
    dropZone.addEventListener("drop", (e) => {
      if (this.inputFile.disabled) {
        e.preventDefault();
        dropZone.classList.remove("dropzone-hover");
        dropZone.classList.add("dropzone-error");
        dropZone.textContent = "Primero selecciona el tipo de documento";
        setTimeout(() => {
          dropZone.classList.remove("dropzone-error");
          dropZone.textContent =
            "Arrastra tu archivo aquí o haz clic para seleccionar";
        }, 1800);
        return;
      }
      e.preventDefault();
      dropZone.classList.remove("dropzone-hover");
      this.file = e.dataTransfer.files[0];
      if (this.file) {
        this.inputFile.files = e.dataTransfer.files;
        this._renderMiniatura();
      }
    });
    // Click
    dropZone.addEventListener("click", () => {
        console.log("Click en dropzone");

      if (this.inputFile.disabled) {
        dropZone.classList.add("dropzone-error");
        dropZone.textContent = "Primero selecciona el tipo de documento";
        setTimeout(() => {
          dropZone.classList.remove("dropzone-error");
          dropZone.textContent =
            "Arrastra tu archivo aquí o haz clic para seleccionar";
        }, 1800);
        return;
      }
      this.inputFile.click();
    });

    // Input file change
    this.inputFile.addEventListener("change", () => {
        if (this.inputFile.disabled) {
            dropZone.classList.add("dropzone-error");
            dropZone.textContent = "Primero selecciona el tipo de documento";
            setTimeout(() => {
            dropZone.classList.remove("dropzone-error");
            dropZone.textContent =
                "Arrastra tu archivo aquí o haz clic para seleccionar";
            }, 1800);
            this.inputFile.value = "";
            return;
        }
        this.file = this.inputFile.files[0];
        if (this.file) {
            this._renderMiniatura(this.file, dropZone);
            dropZone.classList.remove("dropzone-error");
        } else {
            this.resetDropzone();
        }
    });
  }

   _renderMiniatura() {
      const container = this.dropzone;
      container.innerHTML = "";
      if (this.file.type === "application/pdf") {
        // PDF: usar generarThumbnailPdf
        const canvas = document.createElement("canvas");
        canvas.className = "preview-pdf";
        canvas.title = this.file.name;
        container.appendChild(canvas);
        const name = document.createElement("div");
        name.textContent = this.file.name;
        name.style.textAlign = "center";
        name.style.fontSize = "0.9em";
        container.appendChild(name);
        const reader = new FileReader();
        reader.onload = async (e) => {
          const blob = new Blob([e.target.result], { type: "application/pdf" });
          // importar la función si no está en el scope
          const { generarThumbnailPdf } = await import("../utils/pdf.js");
          await generarThumbnailPdf(blob, canvas);
        };
        reader.readAsArrayBuffer(this.file);
      } else {
        container.textContent = this.file.name;
      }
    }
    _mostrarPreview(){
        if(this.file){
            this._renderMiniatura();
            
        }
    }
}
