import { BaseComponent } from "../../base/BaseComponent.js";
import { UsuarioForm } from "./UsuarioForm.js";

export class UsuarioView extends BaseComponent {
  constructor(usuario, onClose) {
    super();
    this.usuario = usuario;
    this.onClose = onClose;
  }

  render() {
    this.element = document.createElement("div");
    this.element.classList.add("usuario-view");

    const form = new UsuarioForm(this.usuario, async () => {
      if (this.onClose) this.onClose();
    });

    form.mount(this.element);
    return this.element;
  }
}
