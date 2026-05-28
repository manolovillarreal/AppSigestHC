import debug from "../helpers/debug.js";
import { apiGet } from "../api/api.js";
import { ordenEstados, obtenerNombreEstado } from "../utils/estados.js";
import { ItemAtencion } from "./itemAtencion.js";
import { AtencionView } from "./AtencionView.js";
import { ModalNuevaAtencion } from "./modalNuevaAtencion.js";
import { BaseComponent } from "../base/BaseComponent.js";
import contexto from "../contexto/contexto.js";
import { PERFILES } from "../config/config.js";

export class ListaAtenciones extends BaseComponent {
  constructor({atenciones,contenedorId}) {
    super();
    this.atenciones = atenciones || [];
    this.id = "atenciones-list";
    this.className = "atenciones-list";
    this.atencionSeleccionada = null;
    this.agruparPor = "estado";
    this.listElement = {};
    this.contenedorId = contenedorId;
  }


  seleccionarAtencion(atencionSeleccionada) {    

    const vistaAtencion = new AtencionView(atencionSeleccionada,(accion)=>{
      if(accion === "anulada")
        this.atenciones = this.atenciones.filter(a => a.id !== atencionSeleccionada.id);
       this._renderGrupos();
    });
    vistaAtencion.mount(this.contenedorId || "main-content-panel");
  }

  render() {
    this.element = document.createElement("div");
     const wrapper = document.createElement('div');
    wrapper.classList.add('btn-right-wrapper');
    
    if(puedeVerAgrupadorSelect()) 
      this._renderAgrupadorSelect(wrapper);

    if(puedeCrearNuevaAtencion()) 
      this._renderBtnNuevaAtencion(wrapper);
    this.element.appendChild(wrapper);

   this.listElement = Object.assign(document.createElement("ul"), {
        id: "atenciones-list",
        className: "list-view"
        });      
    this.element.appendChild(this.listElement);

    this._renderGrupos();

    
  }
  _renderGrupos(){

    // Determinar agrupamiento
    this.listElement.innerHTML = ""; // Limpiar lista antes de renderizar
      let groups;
      (this.agruparPor === "estado")
        ? groups = ordenarPorEstado(this.atenciones)
        : groups = ordenarPorAdministradora(this.atenciones);

      // Renderizar secciones por estado o tercero
      groups.forEach((grupo) => {
        let { label, lista,} = grupo;
        const details = document.createElement("details");
        details.classList.add("estado-section");
        details.open = true;

        const summary = document.createElement("summary");
        summary.textContent = `${label} (${lista.length})`;
        details.appendChild(summary);

        const ul = document.createElement("ul");
        ul.classList.add("estado-group");

      if(this.agruparPor === "estado" && grupo.grupoId === 3) {
          const urgenciasCount = grupo.lista.filter(a => a.tipoAtencionId === 1).length;
          const hospitalizacionCount = grupo.lista.filter(a => a.tipoAtencionId === 2).length;
          ul.appendChild(this._buildTipoAtencionGroup('urgencias', urgenciasCount));
          ul.appendChild(this._buildTipoAtencionGroup('hospitalizacion', hospitalizacionCount));
      }      
      lista.forEach((atencion) => {
        let groupContainer = ul;

        atencion.extraLabel = (this.agruparPor === "estado")?                                
                                 atencion.administradora.nombre
                                 : obtenerNombreEstado(atencion.estadoAtencion.id )

        if(grupo.grupoId === 3) {
          groupContainer = atencion.tipoAtencionId == 1 
                            ? ul.querySelector('#grupo-urgencias') 
                            : ul.querySelector('#grupo-hospitalizacion');
            
        }
        const atencionItem = new ItemAtencion(atencion,()=>this.seleccionarAtencion(atencion));
        
        atencionItem.appendTo(groupContainer);        
      });
      
      details.appendChild(ul);
      this.listElement.appendChild(details);
    });

  }
  _renderAgrupadorSelect(wrapper) {
      const agrupadorWrapper = document.createElement("div");
      agrupadorWrapper.className = "agrupador-atenciones";
      agrupadorWrapper.innerHTML = `
        <label for="agrupador-select">Agrupar por:</label>      
      `;
      const agrupadorSelect = document.createElement("select");
      agrupadorSelect.id = "agrupador-select";
      agrupadorSelect.innerHTML = `
        <option value="estado">Estado</option>
        <option value="administradora">Administradora</option>
      `;

      agrupadorSelect.onchange = (e) => {
        this.agruparPor = e.target.value;
        this._renderGrupos();
      };


      agrupadorWrapper.appendChild(agrupadorSelect);
      wrapper.appendChild(agrupadorWrapper);
    }
  _renderBtnNuevaAtencion(wrapper) {

    const btnNuevaAtencion = document.createElement("button");
    btnNuevaAtencion.id = "btnNuevaAtencion";
    btnNuevaAtencion.classList.add("btn-primary");
    btnNuevaAtencion.textContent = "Nueva Atención";
    btnNuevaAtencion.addEventListener("click", () => {
        const modal = new ModalNuevaAtencion((atencion) => {
          this.atenciones.push(atencion);
          this._renderGrupos();
        });
      });
  
      wrapper.appendChild(btnNuevaAtencion);
      document.getElementById("sidebar-panel").appendChild(wrapper);
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
    const estadoId = a.estadoAtencion.id;
    if (!grupos[estadoId]) grupos[estadoId] = [];
    grupos[estadoId].push(a);
  });

  return ordenEstados
    .filter((id) => grupos[id])
    .map((id) => ({
      grupoId: id,
      label: obtenerNombreEstado(id),
      lista: grupos[id],
    }));
}

function ordenarPorAdministradora(atenciones) {
  const grupos = {};

    atenciones.forEach((a) => {
    const nit = a.administradora.nit
    if (!grupos[nit]) grupos[nit] = [];
    grupos[nit].push(a);
  });

  // Ordenar las atenciones dentro de cada grupo por estadoAtencion
  Object.values(grupos).forEach((lista) => {
    lista.sort((a, b) => {
      const estadoA = a.estadoAtencion.id || a.estadoAtencion;
      const estadoB = b.estadoAtencion.id || b.estadoAtencion;
      return ordenEstados.indexOf(estadoA) - ordenEstados.indexOf(estadoB);
    });
  });

  // Obtener los ids y ordenarlos alfabéticamente por el nombre de la administradora
  const idsOrdenados = Object.keys(grupos).sort((a, b) => {
    const nombreA = grupos[a][0].administradora.nombre.toLowerCase();
    const nombreB = grupos[b][0].administradora.nombre.toLowerCase();
    return nombreA.localeCompare(nombreB);
  });
  console.log(idsOrdenados);

  return idsOrdenados.map((id) => ({
    grupoId: id,
    label: grupos[id][0].administradora.nombre,
    lista: grupos[id],
  }));
}

function puedeVerAgrupadorSelect() {

  const perfilesHabilitados = [
    PERFILES.ADMISIONES,
    PERFILES.AUDITORIA,
    PERFILES.FACTURACION,
    PERFILES.ADMINISTRADOR
  ]
  const {perfil} = contexto;
  return perfilesHabilitados.includes(perfil.rol.nombre);
}

function puedeCrearNuevaAtencion(){
  const {perfil} = contexto;
  return perfil.rol.nombre === PERFILES.ADMISIONES;
}