import { apiGet } from "../../api/api.js";
import { BaseComponent } from "../../base/BaseComponent.js";
import debug from '../../helpers/debug.js';    
import { EstadoAtencionItem } from "./EstadoAtencionItem.js";
import { EstadoAtencionView } from "./EstadoAtencionView.js";



export class ListaEstadosAtencion extends BaseComponent {
    constructor() {
        super();
        this.listaEstados = [];

    }

    async load() {
        const res = await apiGet("/EstadoAtencion");       
        
        if (!res.ok) {
            debug.error("Error al cargar estados de atención:", res.errorMessages);
            this.element = document.createElement("div");
            this.element.innerHTML = `<p class="error">No se pudieron cargar los estados de atención.</p>`;
            return;
            
        }
        this.listaEstados = res.result;
    }

    render() {
        this.element = document.createElement("div");
        this.listaEstados.forEach(estado => {
            const item = new EstadoAtencionItem(estado, this._handleEstadoClick.bind(this));
            item.appendTo(this.element);
        });
        return this.element;
    }

    _handleEstadoClick(estado) {
        const vista = new EstadoAtencionView(estado);
        vista.mount("vistaContenido");
    }   
}