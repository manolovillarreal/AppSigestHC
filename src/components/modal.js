
export class Modal {
  constructor(title = "", isLarge = false) {
    // Si se llama sin parámetros o con valores por defecto,
    // es probablemente una subclase que extenderá y creará su propio HTML.
    // No inicializar el HTML aquí para evitar duplicación.
    if (title === "" && isLarge === false) {
      // Subclase: no crear HTML, lo hará ella misma en render()
      return;
    }

    // Instanciación normal: crear HTML
    this._initializeHTML(title, isLarge);
  }

  _initializeHTML(title, isLarge) {
    this.modal = document.createElement("div");
    this.modal.classList.add("modal-overlay");

    this.modal.innerHTML = `
      <div class="modal-content ${isLarge ? "modal-large" : ""}">
        <div class="modal-header">
          <h2 class="modal-title">${title}</h2>
          <button class="modal-close" title="Close">&times;</button>
        </div>
        <div class="modal-body"></div>
      </div>
    `;
    this._bindCloseEvents();
  }

  _bindCloseEvents() {
    if (!this.modal) return;
    const closeBtn = this.modal.querySelector(".modal-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.close());
    }

    this.modal.addEventListener("click", (event) => {
      if (event.target === this.modal) this.close();
    });
  }

  /**
   * Event binding para compatibilidad con subclases que heredan de modales/modal.js
   * Las subclases pueden sobrescribir este método para agregar listeners personalizados.
   */
  _bindEvents() {
    // Compatibilidad: se puede sobrescribir en subclases
    // Por defecto, no hace nada si no hay this.modal
    if (!this.modal) return;
  }

  /**
   * Abre el modal (compatibilidad con modales/modal.js)
   */
  abrir() {
    if (this.modal) {
      this.modal.classList.add("visible");
      // También asegurarse de que esté en el DOM
      if (!document.body.contains(this.modal)) {
        document.body.appendChild(this.modal);
      }
    }
  }

  /**
   * Cierra y limpia el modal (compatibilidad con modales/modal.js)
   */
  cerrar() {
    if (this.modal) {
      this.modal.remove();
    }
  }

  /**
   * Mounts a component or HTMLElement into the modal and displays it.
   * @param {BaseComponent|HTMLElement} component - The component or element to mount.
   */
  async show(component) {
    if (!this.modal) return;
    document.body.appendChild(this.modal);
    const body = this.modal.querySelector(".modal-body");

    if (component instanceof HTMLElement) {
      body.appendChild(component);
    } else if (typeof component.mount === "function") {
      await component.mount(body);
    } else {
      console.warn("Unsupported component type passed to modal.");
    }
  }

  /**
   * Closes and removes the modal from the DOM.
   */
  close() {
    if (this.modal) {
      this.modal.remove();
    }
  }
}
