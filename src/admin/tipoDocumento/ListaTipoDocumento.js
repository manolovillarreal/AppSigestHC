import debug from "../../helpers/debug.js";
import { apiGet } from "../../api/api.js";
import { AdminListaBase } from '../AdminListaBase.js'
import { TipoDocumentoItem } from "./TipoDocumentoItem.js";
import { TipoDocumentoView } from "./TipoDocumentoView.js";
import { TipoDocumentoForm } from './tipoDocumentoForm.js';
import { FiltroLista } from "../../components/FiltroLista.js";

export class ListaTipoDocumentos extends AdminListaBase {
  constructor() {
    super(async () => await apiGet('/TipoDocumento'), TipoDocumentoItem, TipoDocumentoView, TipoDocumentoForm, {
      title: 'Tipos de Documento',
      addButtonText: 'Agregar Tipo',
      listClass: 'tipos-doc-list'
    });
    this.estados = [];
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

    this.items = resTipos.result || [];
    debug.log("Tipos de documento cargados:", this.items);

    if (!resEstados.ok) {
      return debug.logError("Error al cargar estados de atención:", resEstados.errorMessages);
    }
    this.estados = resEstados.result || [];
    this.filtroLista = new FiltroLista(this._getFiltroConfig());
  }

  _getFiltroConfig() {
    return {
      elementos: this.items,
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
          propiedad: tipoDocumento => (tipoDocumento.estadoAtencionInicialId || '').toString(),
        }
      ],
      onFiltrar: (tiposDocumentoFiltrados) => {
        this.reload();
      }
    }
  }
}
