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
    
    const ingresos = groups.filter(g => g.estadoAtencion === 3);

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

      

      if(grupo.estadoId === 3) {          
          const urgenciasCount = grupo.lista.filter(a => a.tipoAtencionId === 1).length;
          const hospitalizacionCount = grupo.lista.filter(a => a.tipoAtencionId === 2).length;
          ul.appendChild(this._buildTipoAtencionGroup('urgencias', urgenciasCount));
          ul.appendChild(this._buildTipoAtencionGroup('hospitalizacion', hospitalizacionCount));
      }
      lista.forEach((atencion) => {
        let groupContainer = ul;

        if(grupo.estadoId === 3) {
          groupContainer = atencion.tipoAtencionId == 1 
                            ? ul.querySelector('#grupo-urgencias') 
                            : ul.querySelector('#grupo-hospitalizacion');
            
        }
        const atencionItem = new ItemAtencion(atencion,this.seleccionarAtencion.bind(this));
        
        atencionItem.appendTo(groupContainer);        
      });
      
      details.appendChild(ul);
      listElement.appendChild(details);
    });

    this.container.appendChild(listElement);
  }
  _buildTipoAtencionGroup(tipoAtencionId,length){
      let details = document.createElement("details");
      details.classList.add("estado-section");
      details.style.marginLeft = "20px";
      details.open = true;

      let summary = document.createElement("summary");
      summary.textContent = `${tipoAtencionId} (${length})`;
      details.appendChild(summary);

      let ul = document.createElement("ul");
      ul.id = "grupo-"+tipoAtencionId;
      ul.classList.add("estado-group");
      details.appendChild(ul);

      return details;

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
