import { BaseComponent } from "../../components/BaseComponent.js";
import { SolicitudCorreccionItem } from "./SolicitudCorreccionItem.js";
import { PacienteCorreccionItem } from "./PacienteCorreccionItem.js";
import { ListaDocumentos } from "../documentos/listaDocumentos.js";

export class ListaSolicitudesCorreccion extends BaseComponent {
    constructor(correcciones) {
        super();
        this.correcciones = correcciones;
    }

    render() {
        this.element = document.createElement("div");
        this.element.classList.add("lista-correcciones");

        // Agrupar por paciente
        const grupos = {};
        this.correcciones.forEach(correccion => {
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
            // Renderizar el bloque resumen del paciente usando PacienteCorreccionItem
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
                
                const container = document.createElement("div");
                container.classList.add("correcciones-detalle-container");
                
                grupo.solicitudes.forEach(solicitud => {
                    const solicitudItem = new SolicitudCorreccionItem(solicitud, (action) => {
                         // Manejar recarga u otras acciones
                         // TODO: podria requerir repintar o recargar.
                    });
                    solicitudItem.render();
                    container.appendChild(solicitudItem.element);
                });
                mainPanel.appendChild(container);
            });
            this.element.appendChild(pacienteElement);
        });

        return this.element;
    }
}