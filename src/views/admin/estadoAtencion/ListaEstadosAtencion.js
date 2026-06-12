import EstadoAtencionService from "../../../api/estadoAtencion.api.js";
import { AdminListaBase } from '../AdminListaBase.js'
import debug from '../../../utils/debug.js';
import { EstadoAtencionItem } from "./EstadoAtencionItem.js";
import { EstadoAtencionView } from "./EstadoAtencionView.js";

export class ListaEstadosAtencion extends AdminListaBase {
    constructor() {
        super(() => EstadoAtencionService.obtenerEstadosAtencion(), EstadoAtencionItem, EstadoAtencionView, null, {
            title: 'Estados de Atención',
            listClass: 'lista-estados-atencion'
        });
    }

    async load() {
        const res = await EstadoAtencionService.obtenerEstadosAtencion();

        if (!res.ok) {
            debug.error("Error al cargar estados de atención:", res.errorMessages);
            this.element = document.createElement("div");
            this.element.innerHTML = `<p class="error">No se pudieron cargar los estados de atención.</p>`;
            return;
        }

        this.items = res.result || [];
    }

    // Mount the view to the legacy container name used elsewhere
    _handleItemClick(estado) {
        const vista = new EstadoAtencionView(estado);
        vista.mount("vistaContenido");
    }
}
