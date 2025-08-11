import { apiGet } from "../../api/api.js";
import { BaseComponent } from "../../base/BaseComponent.js";
import debug from '../../helpers/debug.js';
import { DocumentoRequeridoItem } from "./DocumentoRequeridoItem.js";
import { DocumentoRequeridoForm } from "./DocumentoRequeridoForm.js";
import { Modal } from "../../components/modal.js";

/**
 * Componente para mostrar una lista de tipos de documentos requeridos para un estado de atención.
 */
export class DocumentosRequeridos extends BaseComponent {
  /**
   * @param {Array} tipoDocumentos - Lista de tipos de documento requeridos.
   */
  constructor(estadoAtencion) {
    super();
    this.estadoAtencion = estadoAtencion;
    this.documentosRequeridos = [];
  }

  async load() {
    // Simulación de carga de datos
    const res = await apiGet(`/DocumentosRequeridos/por-estado/${this.estadoAtencion.id}` );

    if (!res.ok) {
      debug.logError("Error al cargar documentos requeridos:", res.errorMessages);
      this.element = document.createElement("div");
      this.element.innerHTML = `<p class="error">No se pudieron cargar los documentos requeridos.</p>`;
      return;
    }
    console.log("Documentos requeridos cargados:", res.result);

    this.documentosRequeridos = res.result;

  }

  render() {
    const container = document.createElement("div");
    container.classList.add("documentos-requeridos-list");

    const title = document.createElement("h3");
    title.textContent = "Documentos Requeridos";
    container.appendChild(title);

    this.documentosRequeridos.forEach(doc => {
      const item = new DocumentoRequeridoItem(doc);
      item.appendTo(container);
    });

    // Botón para agregar nuevo documento requerido
    const btnAgregar = document.createElement("button");
    btnAgregar.classList.add("btn", "btn-primary", "btn-agregar-documento-requerido");
    btnAgregar.textContent = "Agregar documento requerido";
    btnAgregar.onclick = async () => {
        const modal = new Modal("Agregar Documento Requerido -"+this.estadoAtencion.nombre);
      const form = new DocumentoRequeridoForm(this.estadoAtencion, this.documentosRequeridos, async () => {
      await this.reMount();
      modal.close();
      });

      modal.show(form);
    };
    container.appendChild(btnAgregar);

    this.element = container;
    return this.element;
  }
}
