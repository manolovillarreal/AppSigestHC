import { AdminListaBase } from '../AdminListaBase.js'
import { RolItem } from './RolItem.js'
import { RolForm } from './RolForm.js'
import RolService from '../../../api/rol.api.js'
import { RolView } from './RolView.js'
import { Modal } from '../../../components/modal.js'

export class ListaRoles extends AdminListaBase {
  constructor() {
    super(() => RolService.obtenerRoles(), RolItem, RolView, RolForm, {
      title: 'Roles',
      addButtonText: 'Agregar Rol',
      listClass: 'lista-roles'
    })
  }

  // Preserve the custom add handler because RolForm emits 'guardado'
  _btnAgregarClickHandler() {
    const modal = new Modal('Agregar Rol');
    const form = new RolForm(null)
    form.addEventListener('guardado', () => {
      modal.close();
      this.load().then(() => {
        this.render();
        this.container.innerHTML = '';
        this.container.appendChild(this.element);
      });
    })
    modal.show(form);
  }
}

