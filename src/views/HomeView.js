import { BaseComponent } from "../components/BaseComponent.js";
import { contexto } from "../core/store.js";

export class HomeView extends BaseComponent {
  render() {
    this.element = document.createElement("div");
    this.element.className = "home-view";

    const usuario = contexto.usuario;
    const nombre = usuario?.nombre || usuario?.nombreUsuario || "Usuario";
    const rol = usuario?.rol?.nombre || "";

    this.element.innerHTML = `
      <div class="home-header">
        <div class="home-avatar">
          <span class="material-icons">person</span>
        </div>
        <div class="home-bienvenida">
          <h1>Bienvenido, ${nombre}</h1>
          <p class="home-rol">${rol}</p>
        </div>
      </div>
      <div class="home-cards">
        <div class="home-card home-card-placeholder">
          <span class="material-icons home-card-icon">bar_chart</span>
          <h3>Métricas</h3>
          <p>Próximamente disponible</p>
        </div>
        <div class="home-card home-card-placeholder">
          <span class="material-icons home-card-icon">notifications</span>
          <h3>Notificaciones</h3>
          <p>Próximamente disponible</p>
        </div>
        <div class="home-card home-card-placeholder">
          <span class="material-icons home-card-icon">assignment</span>
          <h3>Resumen de atenciones</h3>
          <p>Próximamente disponible</p>
        </div>
      </div>
    `;
    return this.element;
  }
}
