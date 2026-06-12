import { BaseComponent } from "../../components/BaseComponent.js";
import contexto from "../../core/store.js";
import AtencionService from "../../api/atencion.api.js";
import { ListaAtenciones } from "./listaAtenciones.js";
import { PAGE_SIZE } from "../../core/config.js";

export class BuscarAtenciones extends BaseComponent{
    constructor() {
        super();
        this.listaAtenciones = [];
        this._ultimosFiltros = null; // filtros de la última búsqueda (para paginar)
        this._paginacion = null;     // { page, pageSize, total, totalPages }
    }

    
    render() {
        this.element = document.createElement("div");
        this.element.className = "buscador-atenciones";

        // Título
        this.element.innerHTML = `
          <div class="buscador-titulo">
            <h2>Consulta de Atenciones</h2>
            <p class="buscador-subtitulo">Consulta y seguimiento de registros clínicos.</p>
          </div>

          <!-- Panel colapsable -->
          <div class="filtros-panel">
            <div class="filtros-panel-header" id="filtros-toggle">
              <div class="filtros-panel-titulo">
                <span class="material-icons">search</span>
                <strong>Filtros de búsqueda</strong>
              </div>
              <span class="material-icons filtros-chevron">expand_less</span>
            </div>
            <div class="filtros-panel-body" id="filtros-body">
              <div class="filtros-grid">
                <div class="filtro-campo">
                  <label>Paciente ID</label>
                  <input type="text" name="pacienteId" 
                    placeholder="Ingrese el ID del paciente" />
                </div>
                <div class="filtro-campo">
                  <label>Estado de atención</label>
                  <select name="estadoAtencionId">
                    <option value="">Todos los estados</option>
                  </select>
                </div>
                <div class="filtro-campo">
                  <label>Fecha inicial</label>
                  <input type="date" name="fechaInicial" />
                </div>
                <div class="filtro-campo">
                  <label>Fecha final</label>
                  <input type="date" name="fechaFinal" />
                </div>
                <div class="filtro-campo">
                  <label>Tercero ID</label>
                  <input type="text" name="terceroId" 
                    placeholder="Ingrese el ID del tercero" />
                </div>
              </div>
              <div class="filtros-acciones">
                <button class="btn-limpiar" id="btn-limpiar-filtros">
                  <span class="material-icons">refresh</span> Limpiar
                </button>
                <button class="btn-primary btn-buscar" id="btn-buscar-atenciones">
                  <span class="material-icons">search</span> Buscar Atenciones
                </button>
              </div>
            </div>
          </div>
        `;

        // Toggle colapsable
        this.element.querySelector('#filtros-toggle')
          .addEventListener('click', () => {
            const body = this.element.querySelector('#filtros-body');
            const chevron = this.element.querySelector('.filtros-chevron');
            const visible = body.style.display !== 'none';
            body.style.display = visible ? 'none' : '';
            chevron.textContent = visible ? 'expand_more' : 'expand_less';
          });

        // Botón limpiar
        this.element.querySelector('#btn-limpiar-filtros')
          .addEventListener('click', () => {
            this.element.querySelectorAll('input').forEach(i => i.value = '');
            const sel = this.element.querySelector('select[name="estadoAtencionId"]');
            if (sel) sel.value = '';
          });

        const {estadosAtencionPermitidos} = contexto;
        const estadoSelect = this.element.querySelector("select[name='estadoAtencionId']");
        estadosAtencionPermitidos.forEach(estado => {
            const option = document.createElement("option");
            option.value = estado.id;
            option.textContent = estado.nombre;
            estadoSelect.appendChild(option);
        });

        this.element.querySelector("#btn-buscar-atenciones").addEventListener("click", () => this._buscarAtenciones());

        return this.element;
    }
    async _buscarAtenciones() {
        const pacienteId = this.element.querySelector("input[name='pacienteId']").value;
        const fechaInicial = this.element.querySelector("input[name='fechaInicial']").value;
        const fechaFinal = this.element.querySelector("input[name='fechaFinal']").value;
        const estadoAtencionId = this.element.querySelector("select[name='estadoAtencionId']").value;
        const terceroId = this.element.querySelector("input[name='terceroId']").value;

        if (fechaInicial && fechaFinal && fechaInicial > fechaFinal) {
            await Swal.fire({
                icon: "error",
                title: "Fechas inválidas",
                text: "La fecha inicial debe ser anterior o igual a la fecha final.",
            });
            return;
        }

        // Se guardan los filtros para poder paginar sin volver a leer el formulario.
        this._ultimosFiltros = {
            pacienteId,
            fechaInicio: fechaInicial,
            fechaFin: fechaFinal,
            estadoAtencionId,
            terceroId
        };

        await this._ejecutarBusqueda(1);
    }

    async _ejecutarBusqueda(page) {
        const resAtenciones = await AtencionService.obtenerAtenciones({
            ...this._ultimosFiltros,
            page,
            pageSize: PAGE_SIZE
        });

        if (resAtenciones.ok) {
            const pagina = resAtenciones.result || {};
            this.listaAtenciones = pagina.data || [];
            this._paginacion = {
                page: pagina.page,
                pageSize: pagina.pageSize,
                total: pagina.total,
                totalPages: pagina.totalPages
            };
            this._renderResultados();
        }
    }

    _renderResultados() {
      const listaAtenciones = new ListaAtenciones({
        atenciones: this.listaAtenciones,
        contenedorId: "main-content-panel",
        onClose: () => {
          const filtros = new BuscarAtenciones();
          filtros.mount('main-content-panel');
        },
        paginacion: this._paginacion ? {
          ...this._paginacion,
          onPageChange: (p) => this._ejecutarBusqueda(p)
        } : null
      });
      listaAtenciones.mount("sidebar-panel");

      // Colapsar filtros al mostrar resultados
      const body = this.element.querySelector('#filtros-body');
      const chevron = this.element.querySelector('.filtros-chevron');
      if (body && chevron) {
        body.style.display = 'none';
        chevron.textContent = 'expand_more';
      }
    }
}
