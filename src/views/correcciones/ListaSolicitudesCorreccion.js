import { BaseComponent } from "../../components/BaseComponent.js";
import { SolicitudCorreccionItem } from "./SolicitudCorreccionItem.js";
import { PacienteCorreccionItem } from "./PacienteCorreccionItem.js";
import { ListaDocumentos } from "../documentos/listaDocumentos.js";
import { AtencionHeader } from "../atenciones/AtencionHeader.js";

export class ListaSolicitudesCorreccion extends BaseComponent {
    constructor({ recibidas, enviadas }) {
        super();
        this.recibidas = recibidas || [];
        this.enviadas = enviadas || [];
    }

    render() {
        this.element = document.createElement("div");
        this.element.classList.add("lista-correcciones");

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

        renderListInSection(this.recibidas, seccionRecibidas);
        renderListInSection(this.enviadas, seccionEnviadas);

        // Ocultar sección si está vacía
        if (this.recibidas.length === 0) 
          seccionRecibidas.style.display = 'none';
        if (this.enviadas.length === 0)
          seccionEnviadas.style.display = 'none';

        this.element.appendChild(seccionRecibidas);
        this.element.appendChild(seccionEnviadas);

        return this.element;
    }
}