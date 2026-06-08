import { BaseComponent } from "../../components/BaseComponent.js";
import { ListaDocumentos } from "../documentos/listaDocumentos.js";
import { ModalAgregarDocumento } from "../documentos/ModalAgregarDocumento.js";
import contexto from "../../core/store.js";
import { PERFILES } from "../../core/config.js";
import { AtencionHeader } from "./AtencionHeader.js";
import { AtencionEstado } from "./AtencionEstado.js";
import { PapeleraDocumentos } from "../documentos/PapeleraDocumentos.js";
import {
  avanzarEstado,
  cerrarAtencion,
  anularAtencion,
  preguntarSiAvanzarEstado,
} from "./AtencionActions.js";
import { importarDocumentoIdentidad } from "../../api/documento.api.js";

export class AtencionView extends BaseComponent {
  constructor(atencion, onSuccess) {
    super();
    this.atencion = atencion;
    this.onSuccess = onSuccess;
  }

  render() {
    this.element = document.createElement("div");
    if (!this.atencion) return;

    const header = new AtencionHeader(
      this.atencion,
      () => this.element.remove(),
      this._onSuccess.bind(this)
    );
    header.render();
    this.element.appendChild(header.element);
    this._renderHeaderActions();

    // El estado ahora se renderiza dentro de _renderPanelDocumentos

    this._renderPanelDocumentos();
  }

  _renderHeaderActions() {
    const { perfil } = contexto;
    if (this.atencion.estadoAtencion.id === 1 && perfil.rol.nombre === PERFILES.ADMISIONES) {
      const btnAnular = document.createElement("button");
      btnAnular.id = "btnAnularAtencion";
      btnAnular.className = "btn-anular-atencion";
      btnAnular.title = "Anular atención";
      btnAnular.innerHTML = `<span class="material-icons">delete</span>`;
      btnAnular.addEventListener("click", () => this._anularAtencion());
      this.element.appendChild(btnAnular);
    }
  }
  _renderPanelDocumentos() {
    const headerDoc = document.createElement("div");
    headerDoc.className = "header-documentos-seccion";

    const h3 = document.createElement("h3");
    h3.className = "titulo-documentos";
    h3.innerHTML = `<span class="material-icons" style="color: #64748b; font-size: 20px;">description</span> Documentos de la Atención`;
    
    const accionesContainer = document.createElement("div");
    accionesContainer.className = "acciones-docs-header";

    const estado = new AtencionEstado(
      this.atencion,
      this.PreguntarSiAvanzarEstado.bind(this),
      this.cerrarAtencion.bind(this)
    );
    estado.render();
    if (estado.element) {
        estado.element.className = "estado-buttons-container";
        accionesContainer.appendChild(estado.element);
    }

    const btnAgregarDocumento = document.createElement("button");
    btnAgregarDocumento.id = "btn-agregar-documento";
    btnAgregarDocumento.className = "btn-agregar-documento btn-primary";
    btnAgregarDocumento.innerHTML = `<span class="material-icons">add</span> Agregar Documento`;

    accionesContainer.appendChild(btnAgregarDocumento);

    headerDoc.appendChild(h3);
    headerDoc.appendChild(accionesContainer);

    this.element.appendChild(headerDoc);

    const contenedorDocumentos = document.createElement("ul");
    contenedorDocumentos.id = "documentos-list";
    contenedorDocumentos.className = "list-view";

    const btnImportarID = document.createElement("button");
    btnImportarID.id = "btn-importar-id";
    btnImportarID.className = "btn-primary";
    btnImportarID.textContent = "Importar documento de identidad";
    btnImportarID.style.display = "none";

    const actualizarBotonImportarID = (documentos) => {
      const tieneID = documentos.some(
        (d) => d.tipoDocumento?.codigo === "ID" && !d.fechaEliminacion
      );
      const esAdmisiones = contexto.perfil?.rol?.nombre === PERFILES.ADMISIONES;
      btnImportarID.style.display = (esAdmisiones && !tieneID) ? "" : "none";
    };

    const listaDocumentos = new ListaDocumentos(this.atencion, true, async () => {
      await listaDocumentos.reMount();
      if (this.papeleraDocumentos) await this.papeleraDocumentos.reMount();
      actualizarBotonImportarID(listaDocumentos.documentos);
    });
    listaDocumentos.mount(contenedorDocumentos).then(() => {
      actualizarBotonImportarID(listaDocumentos.documentos);
    });

    btnImportarID.addEventListener("click", async () => {
      Swal.fire({
        title: "Importando...",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading(),
      });

      const response = await importarDocumentoIdentidad(this.atencion.id);

      if (!response.ok) {
        await Swal.fire({
          icon: "error",
          title: "Error al importar",
          text: response.errorMessages?.[0] || "Error desconocido",
        });
        return;
      }

      if (!response.result) {
        await Swal.fire({
          icon: "info",
          title: "Sin documentos anteriores",
          text: "No se encontró un documento de identidad en atenciones anteriores.",
        });
        return;
      }

      await Swal.fire({
        icon: "success",
        title: "Documento importado",
        timer: 1500,
        showConfirmButton: false,
      });
      btnImportarID.style.display = "none";
      await listaDocumentos.reMount();
    });

    // btnAgregarDocumento ya fue creado en el headerDoc

    const papeleraContainer = document.createElement("div");
    papeleraContainer.id = "papelera-documentos-container";

    this.papeleraDocumentos = new PapeleraDocumentos(this.atencion.id, async () => {
      await listaDocumentos.reMount();
      if (this.papeleraDocumentos) await this.papeleraDocumentos.reMount();
    });
    this.papeleraDocumentos.mount(papeleraContainer);
    btnAgregarDocumento.addEventListener("click", () => {
      new ModalAgregarDocumento(this.atencion, (documento) => {
        listaDocumentos.documentos.push(documento);
        listaDocumentos.reMount(false);

        if (documento.tipoDocumento.id == 12) {
          avanzarEstado(this.atencion, "Estado avanzado automáticamente al registrar la factura").then((result) => {
            if (result.ok) {
              this.render();
              this._onSuccess("actualizada");
            }
          });
        }
      });
    });

    // Ya se añadió btnAgregarDocumento arriba
    this.element.appendChild(btnImportarID);
    this.element.appendChild(contenedorDocumentos);
    this.element.appendChild(papeleraContainer);
  }

  _onSuccess(accion) {
    if (this.onSuccess) this.onSuccess(accion);
    accion == "anulada" ? this.element.remove() : this.reMount();
  }

  async PreguntarSiAvanzarEstado() {
    await preguntarSiAvanzarEstado(async (observacion) => {
      const result = await avanzarEstado(this.atencion, observacion);
      if (result.ok) {
        this.render();
        this._onSuccess("actualizada");
      }
    });
  }

  async cerrarAtencion() {
    const result = await cerrarAtencion(this.atencion);
    if (result.ok) {
      this.render();
      this._onSuccess("actualizada");
    }
  }

  async _anularAtencion() {
    const result = await anularAtencion(this.atencion);
    if (result.ok) {
      this.atencion.estaAnulada = true;
      this._onSuccess("anulada");
    }
  }
}
