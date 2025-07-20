import debug from "../helpers/debug.js";
import { apiGet } from "../api/api.js";
import { ordenEstados, obtenerNombreEstado } from "../helpers/estados.js";
import { ItemAtencion } from "./itemAtencion.js";
import { AtencionView } from "./AtencionView.js";

export class ListaAtenciones {
  constructor(containerId) {
    this.container =  document.getElementById(containerId);
    this.atenciones = [];
    this.id = "atenciones-list";
    this.className = "atenciones-list";
    this.atencionSeleccionada = null;
    this.VistaAtencion = new AtencionView() ;
    this.cargarAtenciones();
    
  }

  async cargarAtenciones() {
    try {
      const res = await apiGet("/atenciones/visibles");
      if (!res.ok) {
        debug.logError("Error al cargar atenciones", res.ErrorMessages);
      }
      this.atenciones =  res.result;
      debug.log("Atenciones cargadas:", this.atenciones);
    } catch (error) {
      console.error("Error al cargar atenciones:", error);
    }

    this.render(); 
  }

  seleccionarAtencion(id) {
    
    this.atencionSeleccionada = this.atenciones.find((a) => a.id == id);
    if (!this.atencionSeleccionada) {
      debug.logError("Atención no encontrada", { id });
      return;
    }

    this.VistaAtencion.setAtencionSeleccionada(this.atencionSeleccionada,()=>{
      this.render();
    });
  }

  async render() {
    this.container.innerHTML = "";

   const listElement = Object.assign(document.createElement("ul"), {
        id: "atenciones-list",
        className: "list-view"
        });

    const groups = ordenarPorEstado(this.atenciones);
    

    // Renderizar secciones por estado
    groups.forEach((grupo) => {
      let { estado, lista } = grupo;
      const details = document.createElement("details");
      details.classList.add("estado-section");
      details.open = true;

      const summary = document.createElement("summary");
      summary.textContent = `${estado} (${lista.length})`;
      details.appendChild(summary);

      const ul = document.createElement("ul");
      ul.classList.add("estado-group");

      lista.forEach((atencion) => {
        const atencionItem = new ItemAtencion(atencion,ul,this.seleccionarAtencion.bind(this));
        atencionItem.render();        
      });
      
      details.appendChild(ul);
      listElement.appendChild(details);
    });

    this.container.appendChild(listElement);
  }
}

function ordenarPorEstado(atenciones) {
  const grupos = {};

  atenciones.forEach((a) => {
    const estadoId = a.estadoAtencion.id || a.estadoAtencion;
    if (!grupos[estadoId]) grupos[estadoId] = [];
    grupos[estadoId].push(a);
  });

  return ordenEstados
    .filter((id) => grupos[id])
    .map((id) => ({
      estadoId: id,
      estado: obtenerNombreEstado(id),
      lista: grupos[id],
    }));
}
