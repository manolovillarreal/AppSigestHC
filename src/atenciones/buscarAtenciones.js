import { BaseComponent } from "../base/BaseComponent.js";
import contexto from "../contexto/contexto.js";
import AtencionService from "../services/AtencionServices.js";
import { ListaAtenciones } from "./listaAtenciones.js";

export class BuscarAtenciones extends BaseComponent{
    constructor() {
        super();        
        this.listaAtenciones = [];
    }

    
    render() {
        this.element = document.createElement("div");
        this.element.className = "buscador-atenciones";
        this.element.innerHTML = `
            <div class="buscador-atenciones-filtros">
                <label>
                    Paciente ID:
                    <input type="text" name="pacienteId" />
                </label>
                <label>
                    Fecha Inicial:
                    <input type="date" name="fechaInicial" />
                </label>
                <label>
                    Fecha Final:
                    <input type="date" name="fechaFinal" />
                </label>
                <label>
                    Estado Atención:
                    <select name="estadoAtencionId">
                    <option value="">Seleccione un estado</option>
                    </select>
                </label>
                <label>
                    Tercero ID:
                    <input type="text" name="terceroId" />
                </label>
                <button class="btn-primary" type="button">Buscar</button>
            </div>
            <div id="panel-vista-atencion">
            </div>
        `;
        const {estadosAtencion} = contexto;
        const estadoSelect = this.element.querySelector("select[name='estadoAtencionId']");
        estadosAtencion.forEach(estado => {
            const option = document.createElement("option");
            option.value = estado.id;
            option.textContent = estado.nombre;
            estadoSelect.appendChild(option);
        });

        this.element.querySelector("button").addEventListener("click", () => this._buscarAtenciones());

        return this.element;
    }
    async _buscarAtenciones() {
        const pacienteId = this.element.querySelector("input[name='pacienteId']").value;
        const fechaInicial = this.element.querySelector("input[name='fechaInicial']").value;
        const fechaFinal = this.element.querySelector("input[name='fechaFinal']").value;
        const estadoAtencionId = this.element.querySelector("select[name='estadoAtencionId']").value;
        const terceroId = this.element.querySelector("input[name='terceroId']").value;

        // búsqueda
        const resAtenciones = await AtencionService.obtenerAtenciones({
            pacienteId,
            fechaInicio: fechaInicial,
            fechaFin: fechaFinal,
            estadoAtencionId,
            terceroId
        });

        if (resAtenciones.ok) {
            console.log(resAtenciones.result);
            this.listaAtenciones = resAtenciones.result.data;
            this._renderResultados();
        }
    }

    _renderResultados() {       
        console.log(this.listaAtenciones);
        const listaAtenciones = new ListaAtenciones(
            {   
                atenciones:     this.listaAtenciones , 
                contenedorId:   "panel-vista-atencion" 
            });
        listaAtenciones.mount("sidebar-panel");
    }
}