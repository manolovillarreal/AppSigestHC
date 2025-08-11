import debug from "../../helpers/debug.js";
import { apiGet } from "../../api/api.js";
import { BaseComponent }  from '../../base/BaseComponent.js'
import { Modal } from '../../components/modal.js'
import { TipoDocumentoItem } from "./TipoDocumentoItem.js";
import { TipoDocumentoView } from "./TipoDocumentoView.js";
import { TipoDocumentoForm } from './tipoDocumentoForm.js';
import { FiltroLista } from "../../components/FiltroLista.js";


export class ListaTipoDocumentos extends BaseComponent {
  constructor() {
    super();
    this.tipos = [];
    this.estados = [];
    this.filtroLista = [];
  }

  async load() {
    const resTipos = await apiGet("/TipoDocumento");
    const resEstados = await apiGet("/EstadoAtencion");

    if (!resTipos.ok) {
      debug.logError("Error al cargar tipos de documento:", resTipos.errorMessages);
      this.element = document.createElement("div");
      this.element.innerHTML = `<p class="error">No se pudieron cargar los tipos de documento.</p>`;
      return;
    }    
    this.tipos = resTipos.result;
    debug.log("Tipos de documento cargados:", this.tipos);
    if (!resEstados.ok) {
      return debug.logError("Error al cargar estados de atención:", resEstados.errorMessages);
    }
    this.estados = resEstados.result;
    this.filtroLista = new FiltroLista(this._getFiltroConfig());
  }

  render() {
    this.element = document.createElement("div");
    this.element.id = "tipos-doc-list";
    this.element.className = "tipos-doc-list";

    this._renderHeader();
    this.filtroLista.appendTo(this.element);  

    const lista = document.createElement("div");
    lista.classList.add("lista-tipo-documento");

    this.filtroLista.elementosFiltrados.forEach((tipo) => {
      const item = new TipoDocumentoItem(tipo, this.handleClickTipoDocumentoItem.bind(this));
      item.render(); // construye this.element del item
      item.appendTo(lista); // lo monta sobre lista
    });

    this.element.appendChild(lista);
  }  

  _renderHeader(){
const header = document.createElement("div");
    header.classList.add("lista-header");

    const titulo = document.createElement("h2");
    titulo.textContent = "Tipos de Documento";

    const btnAgregar = document.createElement("button");
    btnAgregar.classList.add("btn", "btn-primary");
    btnAgregar.textContent = "Agregar Tipo";
    
    btnAgregar.addEventListener("click",()=>{
      const modal = new Modal("Nuevo Tipo de Documento");
      const form = new TipoDocumentoForm(null, async ()=>{
        modal.close();
        await this.mount(this.container);
      });

      modal.show(form);
    });

    header.appendChild(titulo);
    header.appendChild(btnAgregar);
    this.element.appendChild(header);
  }
  handleClickTipoDocumentoItem(tipoDocumento) {
    const vista = new TipoDocumentoView(tipoDocumento,async ()=>{
      await this.mount(this.container);
    });
    vista.mount(this.container);
  }

  _getFiltroConfig(){
   return {
        elementos: this.tipos,
        filtros: [
          {
            nombre: 'codigo',
            tipo: 'texto',
            placeholder: 'Buscar por código',
            propiedad: tipoDocumento => tipoDocumento.codigo
            },
            {
            nombre: 'nombre',
            tipo: 'texto',
            placeholder: 'Buscar por nombre',
            propiedad: tipoDocumento => tipoDocumento.nombre
            },
            {
            nombre: 'estado',
            tipo: 'select',
            opciones: [
                { valor: '', label: '-- Todos los estados --' },
                ...this.estados.map(e => ({ valor: e.id.toString(), label: e.nombre }))
            ],
            propiedad: tipoDocumento => tipoDocumento.estadoAtencionInicialId.toString(),
            }
        ],
        onFiltrar: (tiposDocumentoFiltrados) => {            
             this.reMount(false);
        }
        }
  }
  
}
