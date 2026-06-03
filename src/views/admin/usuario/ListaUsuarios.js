import { apiGet } from "../../../core/api.js";
import { UsuarioItem } from "./UsuarioItem.js";
import { UsuarioView } from "./UsuarioView.js";
import { UsuarioForm } from "./UsuarioForm.js";
import { FiltroLista } from "../../../components/FiltroLista.js";
import { AdminListaBase } from "../AdminListaBase.js";

export class ListaUsuarios extends AdminListaBase {
  constructor() {
    super(
      () => apiGet("/usuarios"),
      UsuarioItem,
      UsuarioView,
      UsuarioForm,
      {
        title: "Usuarios",
        addButtonText: "Agregar Usuario",
        listClass: "lista-usuarios"
      }
    );

    this.roles = [];
  }

  async load() {
    await super.load();

    const resRoles = await apiGet("/roles");
    if (resRoles.ok) {
      this.roles = resRoles.result;
    } else {
      console.error("Error al cargar roles", resRoles.errorMessages);
    }

    this.filtroLista = new FiltroLista(this._getFiltroConfig());
  }

  _getFiltroConfig() {
    return {
      elementos: this.items,
      filtros: [
        {
          nombre: "nombre",
          tipo: "texto",
          placeholder: "Buscar por nombre",
          propiedad: (usuario) => `${usuario.nombre} ${usuario.apellidos}`
        },
        {
          nombre: "rol",
          tipo: "select",
          opciones: [
            { valor: "", label: "-- Todos los roles --" },
            ...this.roles.map((r) => ({ valor: r.id.toString(), label: r.nombre }))
          ],
          propiedad: (usuario) => usuario.rolId.toString()
        }
      ],
      onFiltrar: () => {
        this.reMount(false);
      }
    };
  }
}
