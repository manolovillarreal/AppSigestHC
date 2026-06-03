import { BaseComponent } from "../../components/BaseComponent.js";
import { Modal } from "../../components/modal.js";
import { FiltroLista } from "../../components/FiltroLista.js";

export class AdminListaBase extends BaseComponent {
  constructor(service, ItemComponent, ViewComponent, FormComponent = null, options = {}) {
    super();
    this.service = service;
    this.ItemComponent = ItemComponent;
    this.ViewComponent = ViewComponent;
    this.FormComponent = FormComponent;
    this.title = options.title || "Lista";
    this.addButtonText = options.addButtonText || `Agregar ${this.title}`;
    this.listClass = options.listClass || "lista-items";
    this.items = [];
    this.filtroLista = null;
  }

  async load() {
    if (!this.service) {
      return;
    }

    const res = await this.service();
    if (res.ok) {
      this.items = res.result || [];
    } else {
      console.error(`Error al cargar ${this.title.toLowerCase()}:`, res.errorMessages);
    }

    if (typeof this._getFiltroConfig === "function") {
      this.filtroLista = new FiltroLista(this._getFiltroConfig());
    }
  }

  render() {
    this.element = document.createElement("div");
    this.element.className = this.listClass;

    this._renderHeader();

    if (this.filtroLista) {
      this.filtroLista.appendTo(this.element);
    }

    const lista = document.createElement("div");
    lista.classList.add(this.listClass);

    this._getItems().forEach((itemData) => {
      const itemComponent = new this.ItemComponent(itemData, this._handleItemClick.bind(this));
      itemComponent.render();
      itemComponent.appendTo(lista);
    });

    this.element.appendChild(lista);
  }

  _getItems() {
    return this.filtroLista?.elementosFiltrados || this.items || [];
  }

  _renderHeader() {
    const header = document.createElement("div");
    header.classList.add("lista-header");

    const titulo = document.createElement("h2");
    titulo.textContent = this.title;
    header.appendChild(titulo);

    if (this.FormComponent) {
      const btnAgregar = document.createElement("button");
      btnAgregar.classList.add("btn", "btn-primary");
      btnAgregar.textContent = this.addButtonText;
      btnAgregar.addEventListener("click", this._btnAgregarClickHandler.bind(this));
      header.appendChild(btnAgregar);
    }

    this.element.appendChild(header);
  }

  _handleItemClick(item) {
    const vista = new this.ViewComponent(item, async () => {
      await this.mount(this.container);
    });
    vista.mount(this.container);
  }

  async _btnAgregarClickHandler() {
    if (!this.FormComponent) {
      return;
    }

    const modal = new Modal(this.addButtonText);
    const form = new this.FormComponent(null, async () => {
      modal.close();
      await this.reload();
    });

    modal.show(form);
  }

  async reload() {
    if (typeof this.load === "function") {
      await this.load();
    }

    if (!this.container) {
      return;
    }

    this.render();
    this.container.innerHTML = "";
    this.container.appendChild(this.element);
  }
}
