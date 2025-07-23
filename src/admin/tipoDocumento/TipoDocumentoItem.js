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
      nombre,
      extensionPermitida,
      requiereNumeroRelacion,
      esAsistencial,
      permiteMultiplesArchivos,
      limiteDePaginas,
      activo
    } = this.tipoDocumento;

    const item = document.createElement("div");
    item.className = `tipo-doc-item ${!activo?"inactivo":""} `;
    item.innerHTML = `
      <div class="tipo-doc-header">
        <span class="tipo-doc-nombre">${nombre}</span>
        <span class="tipo-doc-id">#${id}</span>
      </div>
      <div class="tipo-doc-detalles-linea">
        <span><strong>Ext:</strong> ${extensionPermitida || "N/A"}</span>
        <span><strong>Relación:</strong> ${requiereNumeroRelacion ? "Sí" : "No"}</span>
        <span><strong>Asistencial:</strong> ${esAsistencial ? "Sí" : "No"}</span>
        <span><strong>Multiples:</strong> ${permiteMultiplesArchivos ? "Sí" : "No"}</span>
        <span><strong>Páginas:</strong> ${limiteDePaginas==0?"-":limiteDePaginas}</span>
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
