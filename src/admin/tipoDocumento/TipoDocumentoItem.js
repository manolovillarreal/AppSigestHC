import {BaseComponent} from '../../base/BaseComponent.js'

export class TipoDocumentoItem extends BaseComponent {
  constructor(tipoDocumento, onClick) {
    super();
    this.tipoDocumento = tipoDocumento;
    this.onClick = onClick;
    this.element = null;
  }

  render() {
    const {
      id,
      codigo,
      nombre,
      extensionPermitida,
      requiereNumeroRelacion,
      esAsistencial,
      permiteMultiples,
      limiteDePaginas,
      activo
    } = this.tipoDocumento;

    const item = document.createElement("div");
    item.className = `tipo-doc-item ${!activo?"inactivo":""} `;

    const check = (valor) => valor ? "✅" : "❌";

    item.innerHTML = `
  <div class="tipo-doc-header">
    <span class="tipo-doc-nombre">${nombre}</span>
    <span class="tipo-doc-id">#${id}-${codigo}</span>
  </div>
  <div class="tipo-doc-detalles-linea">
    <span><strong>Ext:</strong> ${extensionPermitida || "N/A"}</span>
    <span><strong>Relación:</strong> ${check(requiereNumeroRelacion)}</span>
    <span><strong>Asistencial:</strong> ${check(esAsistencial)}</span>
    <span><strong>Múltiples:</strong> ${check(permiteMultiples)}</span>
    <span><strong>Páginas:</strong> ${limiteDePaginas == 0 ? "-" : limiteDePaginas}</span>
  </div>
`;

    item.addEventListener("click", () => {
      if (typeof this.onClick === "function") {
        this.onClick(this.tipoDocumento);
      }
    });

    this.element = item;
  }

}
