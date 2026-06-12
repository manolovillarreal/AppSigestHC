import { BaseComponent } from "../../../components/BaseComponent.js";
import TipoDocumentoRolService from "../../../api/tipoDocumentoRol.api.js";
import DocumentoRequeridoService from "../../../api/documentoRequerido.api.js";
import { EstadoRequeridoForm } from "./EstadoRequeridoForm.js";
import { TipoDocumentoPermisoItem } from "./TipoDocumentoPermisoItem.js";
import { TipoDocumentoForm } from "./TipoDocumentoForm.js";
import { TipoDocumentoPermisoForm } from "./TipoDocumentoPermisoForm.js";
import { Modal } from "../../../components/modal.js";

/**
 * Componente que representa la vista de detalles y configuración de un Tipo de Documento.
 */
export class TipoDocumentoView extends BaseComponent {
  /**
   * @param {Object} tipoDocumento - Objeto del tipo de documento a visualizar.
   */
  constructor(tipoDocumento, onClose) {
    super();
    this.tipoDocumento = tipoDocumento;
    this.permisos = [];
    this.estadosRequeridos = [];
    this.onClose = onClose;
  }

  /**
   * Carga datos relacionados al tipo de documento: roles y estados requeridos.
   * @returns {Promise<void>}
   */
  async load() {
    const [rolesRes, requeridosRes] = await Promise.all([
      TipoDocumentoRolService.obtenerPorTipo(this.tipoDocumento.id),
      DocumentoRequeridoService.obtenerPorTipo(this.tipoDocumento.id),
    ]);

    if (rolesRes.ok) {
      this.permisos = rolesRes.result;
      console.log(this.permisos);
      
    } else {
      console.warn("Error cargando roles:", rolesRes.errorMessages);
    }

    if (requeridosRes.ok) {
      this.estadoRequerido = requeridosRes.result;
      console.log("Estados requeridos cargados:", this.estadoRequerido);
    } else {
      console.warn(
        "Error cargando estados requeridos:",
        requeridosRes.errorMessages
      );
    }
  }

  /**
   * Renderiza el componente y retorna su elemento principal.
   * @returns {HTMLElement}
   */
  async render() {
    this.element = document.createElement("div");
    this.element.classList.add("tipo-doc-view");

    // Formulario editable del tipo documento
    const form = new TipoDocumentoForm(this.tipoDocumento, async () => {
      if (this.onClose) this.onClose();
    });

    await form.mount(this.element);
    
    this._renderPermisos();

    
    // Estado requerido
      const estadoForm = new EstadoRequeridoForm(
        this.estadoRequerido,
        this.tipoDocumento
      );
      estadoForm.appendTo(this.element);
    

    return this.element;
  }

  _renderPermisos() {
    const colapsable = document.createElement("details");
    colapsable.classList.add("permisos-colapsable");
    colapsable.open = true; // o false si quieres que inicie cerrado

    const summary = document.createElement("summary");
    summary.textContent = "Permisos por Rol";
    colapsable.appendChild(summary);

    const permisosContainer = document.createElement("div");
    permisosContainer.id = "permisos-por-rol-container";
    colapsable.appendChild(permisosContainer);

    this.permisos.forEach((permiso) => {
      const permisoForm = new TipoDocumentoPermisoItem(permiso);
      permisoForm.appendTo(permisosContainer);
    });

    const btnAgregar = document.createElement("button");
    btnAgregar.classList.add("btn", "btn-primary", "btn-icono");
    btnAgregar.innerHTML = `<span">Agregar</span>`;
    btnAgregar.title = "Agregar nuevo permiso";

    btnAgregar.addEventListener("click", () => {
      const modal = new Modal("Agregar Permiso - " + this.tipoDocumento.nombre);

      const form = new TipoDocumentoPermisoForm(
        this.tipoDocumento,
        this.permisos,
        async (permiso) => {
          console.log("modal close");

          modal.close();
          await this.load();
          this.render(); // ← recargar todo para incluir el nuevo permiso
        }
      );
      modal.show(form);
    });
    console.log(colapsable);
    
    permisosContainer.appendChild(btnAgregar);
    this.element.appendChild(colapsable);

  }
}
