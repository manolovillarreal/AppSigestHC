import { BaseComponent } from "../base/BaseComponent.js";
import { ListaDocumentos } from "../documentos/listaDocumentos.js";
import { ModalAgregarDocumento } from "../documentos/ModalAgregarDocumento.js";
import contexto from "../contexto/contexto.js";
import { PERFILES } from "../config/config.js";
import { AtencionHeader } from "./AtencionHeader.js";
import { AtencionEstado } from "./AtencionEstado.js";
import {
  avanzarEstado,
  cerrarAtencion,
  anularAtencion,
  preguntarSiAvanzarEstado,
} from "./AtencionActions.js";

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

    const estado = new AtencionEstado(
      this.atencion,
      this.PreguntarSiAvanzarEstado.bind(this),
      this.cerrarAtencion.bind(this)
    );
    estado.render();
    this.element.appendChild(estado.element);

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
    const h3 = document.createElement("h3");
    h3.textContent = "Documentos de la Atención";
    this.element.appendChild(h3);

    const contenedorDocumentos = document.createElement("ul");
    contenedorDocumentos.id = "documentos-list";
    contenedorDocumentos.className = "list-view";

    const listaDocumentos = new ListaDocumentos(this.atencion);
    listaDocumentos.mount(contenedorDocumentos);

    const btnAgregarDocumento = document.createElement("button");
    btnAgregarDocumento.id = "btn-agregar-documento";
    btnAgregarDocumento.className = "btn-primary";
    btnAgregarDocumento.textContent = " Agregar Documento";
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

    this.element.appendChild(btnAgregarDocumento);
    this.element.appendChild(contenedorDocumentos);
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
