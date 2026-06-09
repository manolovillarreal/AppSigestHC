import { BaseComponent } from "../../components/BaseComponent.js";
import { SolicitudCorreccionItem } from "./SolicitudCorreccionItem.js";
import { PacienteCorreccionItem } from "./PacienteCorreccionItem.js";
import { ListaDocumentos } from "../documentos/listaDocumentos.js";
import { AtencionHeader } from "../atenciones/AtencionHeader.js";
import contexto from "../../core/store.js";
import { FiltrosCorrecciones } from "./FiltrosCorrecciones.js";
import { SolicitudCorreccionService } from "../../api/solicitudCorreccion.api.js";

export class ListaSolicitudesCorreccion extends BaseComponent {
    constructor({ recibidas, enviadas }) {
        super();
        this.recibidas = recibidas || [];
        this.enviadas = enviadas || [];
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

                    const header = new AtencionHeader(grupo.atencion);
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

        // LÓGICA DE FILTROS
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

        const filtros = new FiltrosCorrecciones(async (params) => {
            const res = await SolicitudCorreccionService.obtenerCorreccionesPorRol(params);
            if (res.ok && res.result) {
                this.recibidas = res.result;
                seccionRecibidas.innerHTML = `
                  <div class="correcciones-seccion-titulo">
                    PENDIENTES POR RESOLVER
                  </div>`;
                renderListInSection(this.recibidas, seccionRecibidas);
                if (this.recibidas.length === 0) 
                  seccionRecibidas.style.display = 'none';
                else
                  seccionRecibidas.style.display = '';
                applyFilters();
            }
        });
        await filtros.render();
        filtros.mount('main-content-panel');

        renderListInSection(this.recibidas, seccionRecibidas);
        renderListInSection(this.enviadas, seccionEnviadas);

        // Ocultar sección si está vacía
        if (this.recibidas.length === 0) 
          seccionRecibidas.style.display = 'none';
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