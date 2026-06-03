// documentos/listaDocumentos.js
import { apiGet } from "../api/api.js";
import { BaseComponent } from "../base/BaseComponent.js";
import {GrupoDocumentosPorRol} from "./grupoDocumentosPorRol.js"
import { ItemDocumento } from "./itemDocumento.js";
import { DocumentoService } from "../api/documento.api.js";

export class ListaDocumentos extends BaseComponent {
  constructor(atencion, agruparDocumento = true, onEliminarSuccess = null) {
    super();
    this.atencion = atencion;
    this.documentos = [];
    this.agruparDocumento = agruparDocumento;
    this.documentosSeleccionados = new Set();
    this.onEliminarSuccess = onEliminarSuccess;
  }

  async load() {

    const { result: documentos } = await apiGet(`/Documentos/por-atencion/${this.atencion.id}`);
    this.documentos = documentos.map(doc => {
      doc.atencion = this.atencion;
      return doc;
    });
  }


  render() {
    this.element = document.createElement("div");
    if (!this.element) {
      console.error(`Container with id ${this.containerId} not found`);
      return;
    }

    // Renderizar botón de descarga (oculto inicialmente)
    this._renderBotonDescarga();
    
    if (this.agruparDocumento) {
      const documentosPorRol = agruparDocumentosPorRol(this.documentos);
      Object.entries(documentosPorRol).forEach(([rolNombre, docs]) => {
        const grupo = new GrupoDocumentosPorRol(rolNombre, docs, this.onEliminarSuccess);
        grupo.appendTo(this.element);
      });
    } else {
      this.documentos.forEach(doc => {
        const item = new ItemDocumento(doc, true, this.onEliminarSuccess);
        item.appendTo(this.element);
      });
    }

    // Vincular eventos de selección a los items
    this._vincularEventosSeleccion();
  }

  _renderBotonDescarga() {
    const btnContainer = document.createElement("div");
    btnContainer.id = "btn-descarga-multiple-container";
    btnContainer.className = "btn-descarga-multiple-container";
    btnContainer.style.display = "none";

    const btn = document.createElement("button");
    btn.id = "btn-descarga-multiple";
    btn.className = "btn-primary";
    btn.innerHTML = `<span class="material-icons">download</span> Descargar (<span id="contador-seleccionados">0</span>)`;
    btn.addEventListener("click", () => this._mostrarModalDescarga());

    btnContainer.appendChild(btn);
    this.element.appendChild(btnContainer);
  }

  _vincularEventosSeleccion() {
    const items = this.element.querySelectorAll(".documento-item");
    items.forEach((itemElement, index) => {
      const checkbox = itemElement.querySelector(".documento-checkbox");
      if (checkbox) {
        checkbox.addEventListener("change", (e) => {
          const documentoId = parseInt(checkbox.id.replace("doc-checkbox-", ""));
          const documento = this.documentos.find(d => d.id === documentoId);
          
          if (e.target.checked) {
            this.documentosSeleccionados.add(documento);
          } else {
            this.documentosSeleccionados.delete(documento);
          }
          
          this._actualizarBotonDescarga();
        });
      }
    });
  }

  _actualizarBotonDescarga() {
    const container = document.getElementById("btn-descarga-multiple-container");
    const contador = document.getElementById("contador-seleccionados");
    
    if (this.documentosSeleccionados.size > 0) {
      container.style.display = "block";
      contador.textContent = this.documentosSeleccionados.size;
    } else {
      container.style.display = "none";
    }
  }

  async _mostrarModalDescarga() {
    const result = await Swal.fire({
      icon: "question",
      title: "Descargar Documentos",
      html: `
        <p>Ha seleccionado ${this.documentosSeleccionados.size} documento(s)</p>
        <div style="text-align: left; margin-top: 20px;">
          <label style="display: block; margin: 10px 0; cursor: pointer;">
            <input type="radio" name="tipo-descarga" value="separados" checked style="margin-right: 10px;">
            Archivos separados
          </label>
          <label style="display: block; margin: 10px 0; cursor: pointer;">
            <input type="radio" name="tipo-descarga" value="zip" style="margin-right: 10px;">
            Unificar en ZIP
          </label>
          <label style="display: block; margin: 10px 0; cursor: pointer;">
            <input type="radio" name="tipo-descarga" value="pdf" style="margin-right: 10px;">
            Unificar en PDF
          </label>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Descargar",
      cancelButtonText: "Cancelar",
      preConfirm: () => {
        const tipoSeleccionado = document.querySelector('input[name="tipo-descarga"]:checked');
        return tipoSeleccionado ? tipoSeleccionado.value : null;
      }
    });

    if (result.isConfirmed && result.value) {
      await this._procesarDescarga(result.value);
    }
  }

  async _procesarDescarga(tipo) {
    const documentosArray = Array.from(this.documentosSeleccionados);
    
    Swal.fire({
      title: "Descargando...",
      text: "Por favor espere",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      await DocumentoService.descargarMultiples(documentosArray, tipo);

      Swal.close();
      await Swal.fire({
        icon: "success",
        title: "Descarga completada",
        timer: 1500,
        showConfirmButton: false
      });

      // Limpiar selección
      this._limpiarSeleccion();

    } catch (error) {
      console.error("Error al descargar:", error);
      await Swal.fire({
        icon: "error",
        title: "Error al descargar",
        text: error.message || "No se pudieron descargar los documentos"
      });
    }
  }

  _limpiarSeleccion() {
    this.documentosSeleccionados.clear();
    const checkboxes = this.element.querySelectorAll(".documento-checkbox");
    checkboxes.forEach(cb => cb.checked = false);
    this._actualizarBotonDescarga();
  }
}

function agruparDocumentosPorRol(documentos) {
  const documentosPorRol = {};

  documentos.forEach(doc => {
    const rol = doc.usuario?.rolNombre || 'Sin Categoria';
    if (!documentosPorRol[rol]) {
      documentosPorRol[rol] = [];
    }
    documentosPorRol[rol].push(doc);
  });

  return documentosPorRol;
}
