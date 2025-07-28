import { BaseComponent } from "../../base/BaseComponent.js";
import { apiGet } from "../../api/api.js";
import { EstadoRequeridoForm } from "./EstadoRequeridoForm.js";
import { PermisoPorRolForm } from "./PermisoPorRolForm.js";
import { TipoDocumentoForm } from "./TipoDocumentoForm.js";
import { AgregarPermisoRolForm } from "./AgregarPermisoRolForm .js";
import { Modal } from "../../modal/modal.js";

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
      apiGet(`/tipoDocumentoRol/por-tipo/${this.tipoDocumento.id}`),
      apiGet(`/DocumentosRequeridos/por-tipo/${this.tipoDocumento.id}`),
    ]);

    if (rolesRes.ok) {
      this.permisos = rolesRes.result;
    } else {
      console.warn("Error cargando roles:", rolesRes.errorMessages);
    }

    if (requeridosRes.ok) {
      this.estadoRequerido = requeridosRes.result;
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
  render() {
    this.element = document.createElement("div");
    this.element.classList.add("tipo-doc-view");

    // Formulario editable del tipo documento
    const form = new TipoDocumentoForm(this.tipoDocumento, async () => {
      if (this.onClose) this.onClose();
    });
    form.mount(this.element);

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
      const permisoForm = new PermisoPorRolForm(permiso);
      permisoForm.appendTo(permisosContainer);
    });

    const btnAgregar = document.createElement("button");
    btnAgregar.classList.add("btn", "btn-primary", "btn-icono");
    btnAgregar.innerHTML = `<span">Agregar</span>`;
    btnAgregar.title = "Agregar nuevo permiso";

    btnAgregar.addEventListener("click", () => {
      const modal = new Modal("Agregar Permiso - " + this.tipoDocumento.nombre);

      const form = new AgregarPermisoRolForm(
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

    permisosContainer.appendChild(btnAgregar);
    this.element.appendChild(colapsable);
  }
}
