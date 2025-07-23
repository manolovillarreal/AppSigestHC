export class PermisosPorRolForm {
  constructor(permisos) {
    this.permisos = permisos || [];
    this.element = this._crearPermisosForm();
  }

  _crearPermisosForm() {
    const div = document.createElement("div");
    div.classList.add("permisos-form");

    const titulo = document.createElement("h3");
    titulo.textContent = "Permisos por Rol";
    div.appendChild(titulo);

    this.permisos.forEach((permiso) => {
      const card = document.createElement("div");
      card.classList.add("permiso-rol-card");

      const nombreRol = document.createElement("div");
      nombreRol.classList.add("permiso-rol-nombre");
      nombreRol.textContent = permiso.rol?.nombre || `Rol ${permiso.rolId}`;
      card.appendChild(nombreRol);

      const permisosContainer = document.createElement("div");
      permisosContainer.classList.add("permiso-rol-opciones");

      const checkboxVer = this._crearCheckbox("Puede Ver", permiso.rolId, "ver", permiso.puedeVer);
      const checkboxCargar = this._crearCheckbox("Puede Cargar", permiso.rolId, "cargar", permiso.puedeCargar);

      permisosContainer.appendChild(checkboxVer);
      permisosContainer.appendChild(checkboxCargar);

      card.appendChild(permisosContainer);
      div.appendChild(card);
    });

    return div;
  }

  _crearCheckbox(labelText, rolId, permiso, checked) {
    const label = document.createElement("label");
    label.classList.add("checkbox-permiso");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.dataset.rolId = rolId;
    checkbox.dataset.permiso = permiso;
    checkbox.checked = !!checked;

    label.appendChild(checkbox);
    label.append(` ${labelText}`);
    return label;
  }

  obtenerPermisosActuales() {
    const checkboxes = this.element.querySelectorAll("input[type='checkbox']");
    const permisosPorRol = {};

    checkboxes.forEach((cb) => {
      const rolId = cb.dataset.rolId;
      const permiso = cb.dataset.permiso;

      if (!permisosPorRol[rolId]) {
        permisosPorRol[rolId] = {
          rolId: Number(rolId),
          puedeVer: false,
          puedeCargar: false,
        };
      }

      if (permiso === "ver") permisosPorRol[rolId].puedeVer = cb.checked;
      if (permiso === "cargar") permisosPorRol[rolId].puedeCargar = cb.checked;
    });

    return Object.values(permisosPorRol);
  }
}
