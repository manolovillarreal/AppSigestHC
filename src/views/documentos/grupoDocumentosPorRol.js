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

    const leftPart = document.createElement("div");
    leftPart.className = "grupo-doc-left";
    leftPart.innerHTML = `
      <span class="material-icons grupo-doc-icon" style="color: #64748b; font-size: 20px;">person</span>
      <span class="grupo-doc-title">${this.rolNombre}</span>
      <span class="badge-contador">${this.documentos.length}</span>
    `;

    const rightPart = document.createElement("div");
    rightPart.className = "grupo-doc-right";
    const chevron = document.createElement("span");
    chevron.className = "material-icons chevron-icon";
    chevron.textContent = "expand_more";
    rightPart.appendChild(chevron);

    header.appendChild(leftPart);
    header.appendChild(rightPart);

    const contenido = document.createElement("div");
    contenido.classList.add("doc-panel-content");

    // Toggle colapsable
    header.addEventListener("click", () => {
      contenido.classList.toggle("hidden");
      header.classList.toggle("collapsed");
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
