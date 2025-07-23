import { BaseComponent } from '../../base/BaseComponent.js';
import { apiGet } from "../../api/api.js";
import { EstadosRequeridosView } from "./EstadosRequeridosView.js";
import { PermisosPorRolForm } from "./PermisosPorRolForm.js";
import { TipoDocumentoForm } from "./TipoDocumentoForm.js";

/**
 * Componente que representa la vista de detalles y configuración de un Tipo de Documento.
 */
export class TipoDocumentoView extends BaseComponent {
  /**
   * @param {Object} tipoDocumento - Objeto del tipo de documento a visualizar.
   */
  constructor(tipoDocumento) {
    super();
    this.tipoDocumento = tipoDocumento;
    this.permisos = [];
    this.estadosRequeridos = [];
  }

  /**
   * Carga datos relacionados al tipo de documento: roles y estados requeridos.
   * @returns {Promise<void>}
   */
  async load() {
    const [rolesRes, requeridosRes] = await Promise.all([
      apiGet(`/tipoDocumentoRol/por-tipo/${this.tipoDocumento.id}`),
      apiGet(`/DocumentosRequeridos/${this.tipoDocumento.id}`)
    ]);

    if (rolesRes.ok) {
      this.permisos = rolesRes.result;
    } else {
      console.warn("Error cargando roles:", rolesRes.errorMessages);
    }

    if (requeridosRes.ok) {
      this.estadosRequeridos = requeridosRes.result;
    } else {
      console.warn("Error cargando estados requeridos:", requeridosRes.errorMessages);
    }
  }

  /**
   * Renderiza el componente y retorna su elemento principal.
   * @returns {HTMLElement}
   */
  render() {
    const container = document.createElement("div");
    container.classList.add("tipo-doc-view");

    // Formulario editable del tipo documento
    const form = new TipoDocumentoForm(this.tipoDocumento, async (actualizado) => {
      console.log("Documento actualizado:", actualizado);
    });
    form.mount(container)

    // Permisos por rol
    if (this.permisos.length > 0) {
      const permisos = new PermisosPorRolForm(this.permisos, this.tipoDocumento);
      container.appendChild(permisos.element);
    }

    // Estados requeridos
    if (this.estadosRequeridos.length > 0) {
      const estados = new EstadosRequeridosView(this.estadosRequeridos);
      container.appendChild(estados.element);
    }

    this.element = container;
    return this.element;
  }
}
