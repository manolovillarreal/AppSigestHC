import { BaseComponent } from "../../components/BaseComponent.js";
import { SolicitudCorreccionItem } from "./SolicitudCorreccionItem.js";
import { PacienteCorreccionItem } from "./PacienteCorreccionItem.js";
import { ListaDocumentos } from "../documentos/listaDocumentos.js";
import { AtencionHeader } from "../atenciones/AtencionHeader.js";
import contexto from "../../core/store.js";
import { FiltrosCorrecciones } from "./FiltrosCorrecciones.js";
import { SolicitudCorreccionService } from "../../api/solicitudCorreccion.api.js";
import { Paginacion } from "../../components/Paginacion.js";
import { PAGE_SIZE } from "../../core/config.js";

export class ListaSolicitudesCorreccion extends BaseComponent {
    constructor({ recibidas, enviadas, paginacion }) {
        super();
        this.recibidas = recibidas || [];
        this.enviadas = enviadas || [];
        this.paginacion = paginacion || null; // paginación de "recibidas" (pendientes por rol)
        this._ultimosFiltros = {};            // filtros activos para paginar sin perderlos
    }

    async render() {
        this.element = document.createElement("div");
        this.element.className = "sidebar-correcciones-wrapper";

        // Contenedor de controles
        const controles = document.createElement('div');
        controles.className = 'controles-sidebar';
        controles.innerHTML = `
          <input type="text" id="buscador-correcciones" 
            placeholder="Buscar paciente..." />
          <div class="controles-fila">
            <select id="agrupador-correcciones">
              <option value="estado">Estado</option>
              <option value="eps">EPS</option>
            </select>
            <label class="toggle-mias">
              <input type="checkbox" id="toggle-solo-mias" />
              <span>Solo mías</span>
            </label>
          </div>
        `;
        this.element.appendChild(controles);

        // Elemento principal de la lista
        const listEl = document.createElement("div");
        listEl.classList.add("lista-correcciones");
        this.element.appendChild(listEl);

        // Sección 1
        const seccionRecibidas = document.createElement('div');
        seccionRecibidas.innerHTML = `
          <div class="correcciones-seccion-titulo">
            PENDIENTES POR RESOLVER
          </div>`;
        
        // Sección 2  
        const seccionEnviadas = document.createElement('div');
        seccionEnviadas.innerHTML = `
          <div class="correcciones-seccion-titulo">
            MIS SOLICITUDES ENVIADAS
          </div>`;

        const usuarioId = contexto.usuario?.id || contexto.perfil?.id;

        // LÓGICA DE FILTROS LOCALES
        const applyFilters = () => {
            const buscadorVal = controles.querySelector('#buscador-correcciones').value.toLowerCase().trim();
            const soloMias = controles.querySelector('#toggle-solo-mias').checked;

            // Recibidas: filtro por término de búsqueda
            let recibidasVisibles = 0;
            seccionRecibidas.querySelectorAll('.correccion-paciente-bloque').forEach(card => {
                const nombre = card.querySelector('.correccion-paciente-nombre')?.textContent.toLowerCase() || '';
                const matchesSearch = !buscadorVal || nombre.includes(buscadorVal);
                if (matchesSearch) {
                    card.style.display = '';
                    recibidasVisibles++;
                } else {
                    card.style.display = 'none';
                }
            });

            // Enviadas: filtro por término de búsqueda + solo mías
            let enviadasVisibles = 0;
            seccionEnviadas.querySelectorAll('.correccion-paciente-bloque').forEach(card => {
                const nombre = card.querySelector('.correccion-paciente-nombre')?.textContent.toLowerCase() || '';
                const matchesSearch = !buscadorVal || nombre.includes(buscadorVal);
                const matchesSoloMias = !soloMias || card._esMio;
                if (matchesSearch && matchesSoloMias) {
                    card.style.display = '';
                    enviadasVisibles++;
                } else {
                    card.style.display = 'none';
                }
            });

            // Mostrar u ocultar secciones
            seccionRecibidas.style.display = (this.recibidas.length === 0 || recibidasVisibles === 0) ? 'none' : '';
            seccionEnviadas.style.display = (this.enviadas.length === 0 || enviadasVisibles === 0) ? 'none' : '';
        };

        // Renderiza grupos de pacientes en cada sección
        const renderListInSection = (correcciones, container) => {
            const grupos = {};
            correcciones.forEach(correccion => {
                const paciente = correccion.documento.atencion.paciente;
                const pacienteId = paciente?.id || "sin-id";
                if (!grupos[pacienteId]) {
                    grupos[pacienteId] = {
                        paciente,
                        atencion: correccion.documento.atencion,
                        administradora: correccion.documento.atencion.administradora,
                        solicitudes: []
                    };
                }
                grupos[pacienteId].solicitudes.push(correccion);
            });

            Object.values(grupos).forEach(grupo => {
                const pacienteItem = new PacienteCorreccionItem({
                    paciente: grupo.paciente,
                    atencion: grupo.atencion,
                    administradora: grupo.administradora,
                    solicitudes: grupo.solicitudes
                });
                const pacienteElement = pacienteItem.render();
                
                // Determinar si alguna solicitud pertenece al usuario actual
                const esMio = grupo.solicitudes.some(s => 
                    s.usuarioSolicitaId === usuarioId || 
                    (s.usuarioSolicita && s.usuarioSolicita.id === usuarioId)
                );
                pacienteElement._esMio = esMio;

                pacienteElement.addEventListener('click', () => {    
                    const mainPanel = document.getElementById('main-content-panel');
                    mainPanel.innerHTML = '';
                    
                    const containerDetalle = document.createElement("div");
                    containerDetalle.classList.add("correcciones-detalle-container");

                    const header = new AtencionHeader(
                        grupo.atencion,
                        async () => {
                            const mainPanelClose = document.getElementById('main-content-panel');
                            mainPanelClose.innerHTML = '';
                            const f = new FiltrosCorrecciones(onBuscar);
                            await f.render();
                            f.mount('main-content-panel');
                        }
                    );
                    header.render();
                    containerDetalle.appendChild(header.element);

                    const titulo = document.createElement("h3");
                    titulo.style.fontSize = "16px";
                    titulo.style.fontWeight = "600";
                    titulo.style.margin = "16px 0 12px";
                    titulo.style.color = "#1e293b";
                    titulo.textContent = "Correcciones de Documentos";
                    containerDetalle.appendChild(titulo);
                    
                    grupo.solicitudes.forEach(solicitud => {
                        const solicitudItem = new SolicitudCorreccionItem(solicitud, (action) => {
                             // Manejar recarga u otras acciones
                        });
                        solicitudItem.render();
                        containerDetalle.appendChild(solicitudItem.element);
                    });
                    mainPanel.appendChild(containerDetalle);
                });
                container.appendChild(pacienteElement);
            });
        };

        // Reconstruye la sección de recibidas (título + lista + paginador).
        const pintarRecibidas = () => {
            seccionRecibidas.innerHTML = `
              <div class="correcciones-seccion-titulo">
                PENDIENTES POR RESOLVER
              </div>`;
            renderListInSection(this.recibidas, seccionRecibidas);

            if (this.paginacion) {
                const pager = new Paginacion({
                    ...this.paginacion,
                    onPageChange: (p) => irAPaginaRecibidas(p)
                });
                seccionRecibidas.appendChild(pager.render());
            }

            seccionRecibidas.style.display = this.recibidas.length === 0 ? 'none' : '';
        };

        // Aplica la respuesta paginada del backend al estado del componente.
        const aplicarRespuesta = (res) => {
            this.recibidas = res.result.data || [];
            this.paginacion = {
                page: res.result.page,
                pageSize: res.result.pageSize,
                total: res.result.total,
                totalPages: res.result.totalPages
            };
            pintarRecibidas();
            applyFilters();
        };

        // Cambia de página conservando los filtros activos.
        const irAPaginaRecibidas = async (page) => {
            const res = await SolicitudCorreccionService.obtenerCorreccionesPorRol({
                ...this._ultimosFiltros,
                page,
                pageSize: PAGE_SIZE
            });
            if (res.ok && res.result) aplicarRespuesta(res);
        };

        // Nueva búsqueda desde los filtros: vuelve a la página 1.
        const onBuscar = async (params) => {
            this._ultimosFiltros = params || {};
            const res = await SolicitudCorreccionService.obtenerCorreccionesPorRol({
                ...this._ultimosFiltros,
                page: 1,
                pageSize: PAGE_SIZE
            });
            if (res.ok && res.result) aplicarRespuesta(res);
        };

        const filtros = new FiltrosCorrecciones(onBuscar);
        await filtros.render();
        filtros.mount('main-content-panel');

        pintarRecibidas();
        renderListInSection(this.enviadas, seccionEnviadas);

        // Ocultar sección si está vacía
        if (this.enviadas.length === 0)
          seccionEnviadas.style.display = 'none';

        listEl.appendChild(seccionRecibidas);
        listEl.appendChild(seccionEnviadas);

        controles.querySelector('#buscador-correcciones').addEventListener('input', applyFilters);
        controles.querySelector('#toggle-solo-mias').addEventListener('change', applyFilters);

        // Lógica del agrupador
        controles.querySelector('#agrupador-correcciones').addEventListener('change', (e) => {
            const val = e.target.value;
            const titleRecibidas = seccionRecibidas.querySelector('.correcciones-seccion-titulo');
            const titleEnviadas = seccionEnviadas.querySelector('.correcciones-seccion-titulo');
            if (val === 'estado') {
                if (titleRecibidas) titleRecibidas.textContent = 'PENDIENTES POR RESOLVER';
                if (titleEnviadas) titleEnviadas.textContent = 'MIS SOLICITUDES ENVIADAS';
            } else if (val === 'eps') {
                if (titleRecibidas) titleRecibidas.textContent = 'EPS';
                if (titleEnviadas) titleEnviadas.textContent = 'EPS';
            }
        });

        return this.element;
    }
}