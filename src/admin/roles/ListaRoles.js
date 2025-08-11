import { BaseComponent } from '../../base/BaseComponent.js'
import { RolItem } from './RolItem.js'
import { RolForm } from './RolForm.js'
import { apiGet } from '../../api/api.js'
import { RolView } from './RolView.js'

export class ListaRoles extends BaseComponent {
  constructor() {
    super()
    this.roles = []
  }

  async load() {
   
    const resRoles = await apiGet("/roles");

     if (resRoles.ok) {
      this.roles = resRoles.result;
    } else {
      console.error("Error al cargar roles", resRoles.errorMessages);
    }

  }

  render() {
    const contenedor = document.createElement('div');
    contenedor.classList.add('lista-roles');
    contenedor.id = 'lista-roles';

    const header = document.createElement('div');
    header.classList.add('lista-header');
    const titulo = document.createElement('h2');
    titulo.textContent = "Roles"; 

    const btnAgregar = document.createElement('button');
    btnAgregar.classList.add('btn', 'btn-primary');
    btnAgregar.textContent = "Agregar Rol";
    btnAgregar.addEventListener('click', () => this._btnAgregarClickHandler());

    this.roles.forEach(rol => {
      const item = new RolItem(rol, this._rolItemClickHandler.bind(this));
      item.render();
      item.appendTo(contenedor)
    })

    this.element = contenedor;
  }

  _rolItemClickHandler(rol) {
    const vista = new RolView(rol,async ()=>{           
      await this.mount(this.container);
    });
    vista.mount(this.container);
  }


  _btnAgregarClickHandler() {
    const modal = new Modal('Agregar Rol');    
    const form = new RolForm(null)
    form.addEventListener('guardado', () => {
      modal.close();
      this.load().then(() => {
        this.render(); // recargar la lista de roles
      });
    })
    modal.show(form);
  } 
}

