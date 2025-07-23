import debug from "../../helpers/debug.js";
import { apiGet } from "../../api/api.js";
import { BaseComponent }  from '../../base/BaseComponent.js'
import { Modal } from '../../modal/modal.js'
import { TipoDocumentoItem } from "./TipoDocumentoItem.js";
import { TipoDocumentoView } from "./TipoDocumentoView.js";
import { TipoDocumentoForm } from './tipoDocumentoForm.js';


export class ListaTipoDocumentos extends BaseComponent {
  constructor() {
    super();
    this.tipos = [];
  }

  async load() {
    const res = await apiGet("/TipoDocumento");

    if (!res.ok) {
      console.error("Error al cargar tipos de documento:", res.errorMessages);
      this.element = document.createElement("div");
      this.element.innerHTML = `<p class="error">No se pudieron cargar los tipos de documento.</p>`;
      return;
    }    
    this.tipos = res.result;
    debug.log("Tipos de Documento",this.tipos);
    this.render();
  }

  render() {
    this.element = document.createElement("div");
    this.element.id = "tipos-doc-list";
    this.element.className = "tipos-doc-list";

    const header = document.createElement("div");
    header.classList.add("lista-header");

    const titulo = document.createElement("h2");
    titulo.textContent = "Tipos de Documento";

    const btnAgregar = document.createElement("button");
    btnAgregar.classList.add("btn", "btn-primario");
    btnAgregar.textContent = "Agregar Tipo";
    btnAgregar.addEventListener("click",this.handleClickBtnAgregarTipoDocumento);

    header.appendChild(titulo);
    header.appendChild(btnAgregar);

    const lista = document.createElement("div");
    lista.classList.add("lista-tipo-documento");

    this.tipos.forEach((tipo) => {
      const item = new TipoDocumentoItem(tipo, this.handleClickTipoDocumentoItem.bind(this));
      item.render(); // construye this.element del item
      item.appendTo(lista); // lo monta sobre lista
    });

    this.element.appendChild(header);
    this.element.appendChild(lista);
  }  

  handleClickTipoDocumentoItem(tipoDocumento) {
    debug.log("seleccion: ",tipoDocumento)
    const vista = new TipoDocumentoView(tipoDocumento);
    vista.mount(document.getElementById("vistaContenido"));
  }

  handleClickBtnAgregarTipoDocumento() {
 
  const form = new TipoDocumentoForm(null, async (creado) => {
    Swal.fire("Tipo creado", "Se creó exitosamente", "success");
    modal.cerrar();
    listaTipos.load(); // si tienes acceso a la lista
  });

  const modal = new Modal("Nuevo Tipo de Documento");
  modal.show(form);
  }
}
