import { BaseComponent } from "../../components/BaseComponent.js";
import { ItemDocumento } from "./itemDocumento.js";



export class GrupoDocumentosPorRol extends BaseComponent {
  constructor(rolNombre, documentos, onEliminarSuccess = null) {
    super();
    this.rolNombre = rolNombre;
    this.documentos = documentos;
    this.onEliminarSuccess = onEliminarSuccess;
  }
  render() {

    this.element = document.createElement("div");
    this.element.classList.add("doc-panel");

    const header = document.createElement("div");
    header.classList.add("doc-panel-header");
    header.textContent = `${this.rolNombre} (${this.documentos.length})`;

    const contenido = document.createElement("div");
    contenido.classList.add("doc-panel-content");

    // Toggle colapsable
    header.addEventListener("click", () => {
      contenido.classList.toggle("hidden");
    });
    
    // Renderizar los documentos de este grupo
    this.documentos.forEach(doc => {
      const item = new ItemDocumento(doc, false, this.onEliminarSuccess);
      item.appendTo(contenido);
    });

    this.element.appendChild(header);
    this.element.appendChild(contenido);    
  }
 
}
