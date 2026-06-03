import { apiGet } from "../../../core/api.js";
import { BaseComponent } from "../../../components/BaseComponent.js";
import { Modal } from "../../../components/modal.js";
import { RolForm } from "./RolForm.js";
import { RolPermisoForm } from "./RolPermisoForm.js";
import { RolPermisoItem } from "./RolPermisoItem.js";

export class RolView extends BaseComponent {
    constructor(rol, onClose) {
        super();
        this.rol = rol;
        this.permisos = [];        
        this.onClose = onClose;        
    }

    async load() {
        const res = await  apiGet(`/tipoDocumentoRol/por-rol/${this.rol.id}`);
        if (res.ok) {
            this.permisos = res.result;
            console.log("Permisos del rol:", this.permisos);
            
        } else {
            console.warn("Error cargando permisos:", res.errorMessages);
        }
    }

    render() {
        this.element = document.createElement("div");
        this.element.classList.add("rol-view");

        // Formulario editable del rol
        const form = new RolForm(this.rol, async () => {
            if (this.onClose) this.onClose();
        });
        form.mount(this.element);

        this._renderPermisos();

        return this.element;
    }
    _renderPermisos() {
        const colapsable = document.createElement("details");
        colapsable.classList.add("permisos-colapsable");
        colapsable.open = true; // o false si prefieres cerrado por defecto

        const summary = document.createElement("summary");
        summary.textContent = "Permisos asignados al rol";
        colapsable.appendChild(summary);

        const permisosContainer = document.createElement("div");
        permisosContainer.classList.add("permisos-container");

        this.permisos.forEach((permiso) => {
            const permisoItem = new RolPermisoItem(permiso);
            permisoItem.appendTo(permisosContainer);
        });

        colapsable.appendChild(permisosContainer);
        this.element.appendChild(colapsable);

        // Botón para agregar nuevo permiso
        const btnAgregarPermiso = document.createElement("button");
        btnAgregarPermiso.classList.add("btn", "btn-agregar");
        btnAgregarPermiso.textContent = "Agregar Permiso";
        btnAgregarPermiso.addEventListener("click", () => this._agregarPermiso());

        this.element.appendChild(btnAgregarPermiso);
    }

    _agregarPermiso() {
            const modal = new Modal("Agregar Permiso - " + this.rol.nombre);

            const form = new RolPermisoForm(
                this.rol,
                this.permisos,
                async (permiso) => {
                    modal.close();
                    await this.load();
                    this.render(); // recargar la vista para incluir el nuevo permiso
                }
            );
    
            modal.show(form);
        }
}