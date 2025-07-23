import { cargarCSS } from "../helpers/utils.js";

export class Modal {
  constructor(title = "") {
    this.modal = document.createElement("div");
    this.modal.classList.add("modal-overlay");

    this.modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title">${title}</h2>
          <button class="modal-close" title="Close">&times;</button>
        </div>
        <div class="modal-body"></div>
      </div>
    `;
    cargarCSS('css/modal.css');
    this._bindCloseEvents();
  }

  _bindCloseEvents() {
    this.modal.querySelector(".modal-close").addEventListener("click", () => this.close());

    this.modal.addEventListener("click", (event) => {
      if (event.target === this.modal) this.close();
    });
  }

  /**
   * Mounts a component or HTMLElement into the modal and displays it.
   * @param {BaseComponent|HTMLElement} component - The component or element to mount.
   */
  async show(component) {
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
    this.modal.remove();
  }
}
