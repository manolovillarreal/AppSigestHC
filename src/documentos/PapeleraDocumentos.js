import { BaseComponent } from "../base/BaseComponent.js";
import { DocumentoService } from "../api/documento.api.js";
import { formatearFechaHora } from "../utils/date.js";
import { descargarMiniaturas, renderContent } from "./acciones/RenderDocumento.js";
import { verDocumento, descargarDocumento } from "./acciones/DescargarDocumento.js";

export class PapeleraDocumentos extends BaseComponent {
  constructor(atencionId, onRestaurar) {
    super();
    this.atencionId = atencionId;
    this.onRestaurar = onRestaurar;
    this.documentos = [];
  }

  async load() {
    const { result } = await DocumentoService.obtenerPapelera(this.atencionId);
    this.documentos = Array.isArray(result) ? result : [];
  }

  render() {
    if (!this.documentos || this.documentos.length === 0) {
      this.element = document.createElement("div");
      this.element.innerHTML = "";
      return;
    }

    this.element = document.createElement("div");
    this.element.className = "papelera-documentos";

    const details = document.createElement("details");
    details.className = "papelera-documentos-colapsable";
    details.open = true;

    const summary = document.createElement("summary");
    summary.textContent = `Papelera (${this.documentos.length})`;
    details.appendChild(summary);

    const lista = document.createElement("ul");
    lista.className = "papelera-documentos-list";

    this.documentos.forEach((documento) => {
      const item = document.createElement("div");
      item.className = "documento-item";

      renderContent(item, documento, (docId) => verDocumento(docId));

      const thumbnailContainer = item.querySelector(".thumbnail-container");
      if (thumbnailContainer) {
        thumbnailContainer.innerHTML = "";
        console.log('documento papelera:', documento);
        descargarMiniaturas(documento, thumbnailContainer, (docId) => verDocumento(docId));
      }

      const metadataExtra = document.createElement("div");
      metadataExtra.className = "doc-meta";
      metadataExtra.innerHTML = `
        <div>Eliminado el ${formatearFechaHora(documento.fechaEliminacion || "")}</div>
        <div>por ${documento.usuarioEliminador?.nombre || "—"} ${documento.usuarioEliminador?.apellidos || ""}</div>
      `;

      const detalles = item.querySelector(".documento-detalles");
      if (detalles) {
        detalles.appendChild(metadataExtra);

        const acciones = document.createElement("div");
        acciones.className = "doc-acciones";

        const btnRestaurar = document.createElement("button");
        btnRestaurar.className = "icon-btn";
        btnRestaurar.type = "button";
        btnRestaurar.title = "Restaurar";
        btnRestaurar.innerHTML = `<span class="material-icons">restore</span>`;
        btnRestaurar.addEventListener("click", () => this._restaurarDocumento(documento.id));
        acciones.appendChild(btnRestaurar);

        const btnDescargar = document.createElement("button");
        btnDescargar.className = "icon-btn";
        btnDescargar.title = "Descargar";
        btnDescargar.innerHTML = `<span class="material-icons">download</span>`;
        btnDescargar.addEventListener("click", () => descargarDocumento(documento));
        acciones.appendChild(btnDescargar);

        detalles.appendChild(acciones);
      }

      lista.appendChild(item);
    });

    details.appendChild(lista);
    this.element.appendChild(details);
  }

  async _restaurarDocumento(id) {
    Swal.fire({
      title: "Restaurando documento...",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
    });

    const res = await DocumentoService.restaurarDocumento(id);
    Swal.close();

    if (res.ok) {
      await Swal.fire({
        icon: "success",
        title: "Documento restaurado",
        timer: 1500,
        showConfirmButton: false,
      });

      if (this.onRestaurar) await this.onRestaurar();
      return;
    }

    if (res.status === 409) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ya existe un documento activo de este tipo",
      });
      return;
    }

    const mensaje = res?.mensaje || "No se pudo restaurar el documento.";
    const errores = res.errorMessages ? res.errorMessages.join("<br>") : "";

    if (res.status === 400) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        html: `<p>${mensaje}</p>${errores}`,
      });
      return;
    }

    await Swal.fire({
      icon: "error",
      title: "Error",
      html: `<p>${mensaje}</p>${errores}`,
    });
  }
}
