import { BaseComponent } from "../../base/BaseComponent.js";
import { apiGet } from "../../api/api.js";
import { UsuarioItem } from "./UsuarioItem.js";
import { UsuarioView } from "./UsuarioView.js";
import { UsuarioForm } from "./UsuarioForm.js";
import { Modal } from "../../components/modal.js";
import { FiltroLista } from "../../components/FiltroLista.js";

export class ListaUsuarios extends BaseComponent {
  constructor(container) {
    super();
    this.usuarios = [];
    this.roles = [];
    this.container = container;
    this.filtroLista = null; //new ListaFiltro()
  }

  async load() {
    const resUsuarios = await apiGet("/usuarios");
    const resRoles = await apiGet("/roles");

    if (resUsuarios.ok) {
      this.usuarios = resUsuarios.result;
    } else {
      console.error("Error al cargar usuarios", resUsuarios.errorMessages);
    }

    if (resRoles.ok) {
      this.roles = resRoles.result;
    } else {
      console.error("Error al cargar roles", resRoles.errorMessages);
    }

     this.filtroLista = new FiltroLista(this._getFiltroConfig());
  }

  render() {
    this.element = document.createElement("div");
    this.element.id = "usuarios-list";
    this.element.className = "usuarios-list";

    this._renderHeader();

    this.filtroLista.appendTo(this.element);  

    const lista = document.createElement("div");
    lista.classList.add("lista-usuarios");

    this.filtroLista.elementosFiltrados
      .forEach((usuario) => {
        const item = new UsuarioItem(usuario, this.handleClickUsuarioItem.bind(this));
        item.render();
        item.appendTo(lista);
      });

    this.element.appendChild(lista);
  }

  _renderHeader(){
    const header = document.createElement("div");
    header.classList.add("lista-header");

    const titulo = document.createElement("h2");
    titulo.textContent = "Usuarios";

    const btnAgregar = document.createElement("button");
    btnAgregar.classList.add("btn", "btn-primary");
    btnAgregar.textContent = "Agregar Usuario";
    btnAgregar.addEventListener("click", this.handleClickBtnAgregarUsuario.bind(this));

    header.appendChild(titulo);
    header.appendChild(btnAgregar);
    this.element.appendChild(header);
  }

  
  handleClickUsuarioItem(usuario) {
    const vista = new UsuarioView(usuario, async () => {
      await this.mount(this.container);
    });
    vista.mount(this.container);
  }

  handleClickBtnAgregarUsuario() {
    const modal = new Modal("Nuevo Usuario");

    const form = new UsuarioForm(null, async (creado) => {
      Swal.fire("Usuario creado", "Se creó exitosamente", "success");
      modal.close();
      this.load(); // recarga la lista
      this.render();
    });

    modal.show(form);
  }

  _getFiltroConfig(){
   return {
        elementos: this.usuarios,
        filtros: [
            {
            nombre: 'nombre',
            tipo: 'texto',
            placeholder: 'Buscar por nombre',
            propiedad: usuario => `${usuario.nombre} ${usuario.apellidos}`
            },
            {
            nombre: 'rol',
            tipo: 'select',
            opciones: [
                { valor: '', label: '-- Todos los roles --' },
                ...this.roles.map(r => ({ valor: r.id.toString(), label: r.nombre }))
            ],
            propiedad: usuario => usuario.rolId.toString()
            }
        ],
        onFiltrar: (usuariosFiltrados) => {            
             this.reMount(false);
        }
        }
  }
}
