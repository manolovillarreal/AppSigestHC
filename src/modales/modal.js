// modal.js
export class Modal {
  /**
   * @param {string} modalId - El ID del contenedor del modal
   * @param {string} closeBtnSelector - Selector opcional para el botón de cierre dentro del modal
   */
  constructor() {
    this._bindEvents();
  }

  _bindEvents() {
    // Clic fuera del modal
    window.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.cerrar();
      }
    });

    // Clic en el botón X
    if (this.closeBtn) {
      this.closeBtn.addEventListener("click", () => this.cerrar());
    }

    // Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.cerrar();
    });
  }

  abrir() {
    this.modal.classList.add("visible");
  }

  cerrar() {
    this.modal.classList.remove("visible");
    this.limpiarContenido();
  }

  limpiarContenido() {
    // Este método se puede sobrescribir en clases hijas si se necesita
  }
}
