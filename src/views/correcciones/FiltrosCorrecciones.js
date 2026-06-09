import { BaseComponent } from "../../components/BaseComponent.js";
import TipoDocumentoService from "../../api/tipoDocumento.api.js";
import { contexto } from "../../core/store.js";

export class FiltrosCorrecciones extends BaseComponent {
  constructor(onBuscar) {
    super();
    this.onBuscar = onBuscar;
  }

  async render() {
    this.element = document.createElement("div");
    this.element.className = "buscador-atenciones";

    this.element.innerHTML = `
      <div class="buscador-titulo">
        <h2>Correcciones de Documentos</h2>
        <p class="buscador-subtitulo">Consulta y seguimiento de solicitudes de corrección.</p>
      </div>

      <div class="filtros-panel">
        <div class="filtros-panel-header" id="filtros-correcciones-toggle">
          <div class="filtros-panel-titulo">
            <span class="material-icons">search</span>
            <strong>Filtros de búsqueda</strong>
          </div>
          <span class="material-icons filtros-chevron">expand_less</span>
        </div>
        <div class="filtros-panel-body" id="filtros-correcciones-body">
          <div class="filtros-grid">
            <div class="filtro-campo">
              <label>Paciente ID</label>
              <input type="text" name="pacienteId" 
                placeholder="Ingrese el ID del paciente" />
            </div>
            <div class="filtro-campo">
              <label>Estado de corrección</label>
              <select name="estadoCorreccionId">
                <option value="">Todos los estados</option>
                <option value="1">Pendiente</option>
                <option value="2">Respondida</option>
                <option value="3">Rechazada</option>
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
              <label>Tipo de documento</label>
              <select name="tipoDocumentoId">
                <option value="">Todos los tipos</option>
              </select>
            </div>
            <div class="filtro-campo">
              <label>N° Relación</label>
              <input type="text" name="numeroRelacion" 
                placeholder="Ingrese el número de relación" />
            </div>
          </div>
          <div class="filtros-acciones">
            <button class="btn-limpiar" id="btn-limpiar-correcciones">
              <span class="material-icons">refresh</span> Limpiar
            </button>
            <button class="btn-primary btn-buscar" id="btn-buscar-correcciones">
              <span class="material-icons">search</span> Buscar
            </button>
          </div>
        </div>
      </div>

      <div id="correcciones-resultados"></div>
    `;

    // Toggle colapsable
    this.element.querySelector('#filtros-correcciones-toggle')
      .addEventListener('click', () => {
        const body = this.element.querySelector('#filtros-correcciones-body');
        const chevron = this.element.querySelector('.filtros-chevron');
        const visible = body.style.display !== 'none';
        body.style.display = visible ? 'none' : '';
        chevron.textContent = visible ? 'expand_more' : 'expand_less';
      });

    // Poblar tipos de documento
    try {
      const res = await TipoDocumentoService.obtenerTodos();
      if (res.ok && res.result) {
        const select = this.element.querySelector('select[name="tipoDocumentoId"]');
        res.result.forEach(td => {
          const opt = document.createElement('option');
          opt.value = td.id;
          opt.textContent = td.nombre;
          select.appendChild(opt);
        });
      }
    } catch(e) {}

    // Limpiar
    this.element.querySelector('#btn-limpiar-correcciones')
      .addEventListener('click', () => {
        this.element.querySelectorAll('input').forEach(i => i.value = '');
        this.element.querySelectorAll('select').forEach(s => s.value = '');
      });

    // Buscar
    this.element.querySelector('#btn-buscar-correcciones')
      .addEventListener('click', () => {
        const filtros = {
          pacienteId: this.element.querySelector('[name="pacienteId"]').value,
          estadoCorreccionId: this.element.querySelector('[name="estadoCorreccionId"]').value,
          fechaInicial: this.element.querySelector('[name="fechaInicial"]').value,
          fechaFinal: this.element.querySelector('[name="fechaFinal"]').value,
          tipoDocumentoId: this.element.querySelector('[name="tipoDocumentoId"]').value,
          numeroRelacion: this.element.querySelector('[name="numeroRelacion"]').value,
        };
        // Colapsar filtros
        const body = this.element.querySelector('#filtros-correcciones-body');
        const chevron = this.element.querySelector('.filtros-chevron');
        body.style.display = 'none';
        chevron.textContent = 'expand_more';

        this.onBuscar(filtros);
      });

    return this.element;
  }
}
