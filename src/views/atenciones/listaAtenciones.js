import debug from "../../utils/debug.js";
import { ordenEstados, obtenerNombreEstado } from "../../utils/estados.js";
import { ItemAtencion } from "./itemAtencion.js";
import { AtencionView } from "./AtencionView.js";
import { ModalNuevaAtencion } from "./modalNuevaAtencion.js";
import { BaseComponent } from "../../components/BaseComponent.js";
import contexto from "../../core/store.js";
import { PERFILES } from "../../core/config.js";

export class ListaAtenciones extends BaseComponent {
  constructor({atenciones,contenedorId, onClose}) {
    super();
    this.atenciones = atenciones || [];
    this.id = "atenciones-list";
    this.className = "atenciones-list";
    this.atencionSeleccionada = null;
    this.agruparPor = "estado";
    this.listElement = {};
    this.contenedorId = contenedorId;
    this.onClose = onClose;
  }


  seleccionarAtencion(atencionSeleccionada) {    

    const vistaAtencion = new AtencionView(
      atencionSeleccionada,
      (accion)=>{
        if(accion === "anulada")
          this.atenciones = this.atenciones.filter(a => a.id !== atencionSeleccionada.id);
         this._renderGrupos();
      },
      this.onClose
    );
    vistaAtencion.mount(this.contenedorId || "main-content-panel");
  }

  render() {
    this.element = document.createElement("div");

    const controlesSidebar = document.createElement("div");
    controlesSidebar.classList.add("controles-sidebar");

    // FILA 1: Buscador
    const buscador = document.createElement("input");
    buscador.type = "text";
    buscador.id = "buscador-atenciones";
    buscador.placeholder = "Buscar paciente...";

    buscador.addEventListener("input", (e) => {
      const termino = e.target.value.toLowerCase().trim();
      const items = document.querySelectorAll(".atencion-item");
      items.forEach(item => {
        const texto = item.textContent.toLowerCase();
        item.style.display = termino === "" || texto.includes(termino) 
          ? "" : "none";
      });
      // Ocultar grupos vacíos
      document.querySelectorAll(".grupo-estado").forEach(grupo => {
        const visibles = grupo.querySelectorAll(".atencion-item:not([style*='none'])");
        grupo.style.display = visibles.length === 0 ? "none" : "";
      });
    });

    controlesSidebar.appendChild(buscador);

    // FILA 2: Select + Botón
    const controlesFila = document.createElement("div");
    controlesFila.classList.add("controles-fila");

    if (puedeVerAgrupadorSelect()) {
      this._renderAgrupadorSelect(controlesFila);
    }

    if (puedeCrearNuevaAtencion()) {
      this._renderBtnNuevaAtencion(controlesFila);
    }

    controlesSidebar.appendChild(controlesFila);
    this.element.appendChild(controlesSidebar);

    this.listElement = Object.assign(document.createElement("ul"), {
      id: "atenciones-list",
      className: "list-view"
    });      
    this.element.appendChild(this.listElement);

    this._renderGrupos();
  }

  _renderGrupos() {
    // Determinar agrupamiento
    this.listElement.innerHTML = ""; // Limpiar lista antes de renderizar
    let groups;
    (this.agruparPor === "estado")
      ? groups = ordenarPorEstado(this.atenciones)
      : groups = ordenarPorAdministradora(this.atenciones);

    // Renderizar secciones por estado o tercero
    groups.forEach((grupo) => {
      let { label, lista } = grupo;
      const details = document.createElement("details");
      details.classList.add("estado-section", "grupo-estado");
      details.open = true;

      const summary = document.createElement("summary");
      summary.textContent = `${label} (${lista.length})`;
      details.appendChild(summary);

      const ul = document.createElement("ul");
      ul.classList.add("estado-group");

      if (this.agruparPor === "estado" && grupo.grupoId === 3) {
        const urgenciasCount = grupo.lista.filter(a => a.tipoAtencionId === 1).length;
        const hospitalizacionCount = grupo.lista.filter(a => a.tipoAtencionId === 2).length;
        ul.appendChild(this._buildTipoAtencionGroup('urgencias', urgenciasCount));
        ul.appendChild(this._buildTipoAtencionGroup('hospitalizacion', hospitalizacionCount));
      }      
      lista.forEach((atencion) => {
        let groupContainer = ul;

        atencion.extraLabel = (this.agruparPor === "estado")
          ? atencion.administradora.nombre
          : obtenerNombreEstado(atencion.estadoAtencion.id);

        if (grupo.grupoId === 3) {
          groupContainer = atencion.tipoAtencionId == 1 
            ? ul.querySelector('#grupo-urgencias') 
            : ul.querySelector('#grupo-hospitalizacion');
        }
        const atencionItem = new ItemAtencion(atencion, () => this.seleccionarAtencion(atencion));
        
        atencionItem.appendTo(groupContainer);        
      });
      
      details.appendChild(ul);
      this.listElement.appendChild(details);
    });
  }

  _renderAgrupadorSelect(wrapper) {
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

    wrapper.appendChild(agrupadorSelect);
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
  }

  _buildTipoAtencionGroup(tipoAtencionId, length) {
    let details = document.createElement("details");
    details.classList.add("estado-section", "grupo-estado");
    details.style.marginLeft = "20px";
    details.open = true;

    let summary = document.createElement("summary");
    summary.textContent = `${tipoAtencionId} (${length})`;
    details.appendChild(summary);

    let ul = document.createElement("ul");
    ul.id = "grupo-" + tipoAtencionId;
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
  const { perfil } = contexto;
  return perfilesHabilitados.includes(perfil.rol.nombre);
}

function puedeCrearNuevaAtencion() {
  const { perfil } = contexto;
  return perfil.rol.nombre === PERFILES.ADMISIONES;
}
