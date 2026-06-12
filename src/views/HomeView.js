import { BaseComponent } from "../components/BaseComponent.js";
import contexto from "../core/store.js";
import DashboardService from "../api/dashboard.api.js";

const REFRESH_MS = 5 * 60 * 1000; // 5 minutos

const numero = new Intl.NumberFormat("es-CO");

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function fmtMinutos(min) {
  const v = Number(min) || 0;
  if (v <= 0) return "—";
  if (v >= 60) {
    const h = Math.floor(v / 60);
    const m = Math.round(v % 60);
    return m ? `${h} h ${m} min` : `${h} h`;
  }
  return `${v.toFixed(1)} min`;
}

function fmtDecimal(v, dec = 2) {
  return (Number(v) || 0).toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: dec
  });
}

/**
 * Vista de inicio: dashboard de métricas con skeleton loaders,
 * tarjetas con íconos Material y refresco automático cada 5 minutos.
 * Las métricas mostradas dependen del rol resuelto por el backend.
 */
export class HomeView extends BaseComponent {
  constructor() {
    super();
    this.data = null;          // { rol, global, porRol }
    this.cargando = true;      // primera carga -> skeletons
    this.refrescando = false;  // refresco silencioso -> spinner en header
    this.error = null;
    this.ultimaActualizacion = null;
    this._iniciado = false;
    this._intervalId = null;
  }

  render() {
    this.element = document.createElement("div");
    this.element.className = "home-view dash";

    const usuario = contexto.perfil;
    const nombre = usuario?.nombre || usuario?.nombreUsuario || "Usuario";
    const rolUsuario = usuario?.rol?.nombre || this.data?.rol || "";

    this.element.innerHTML = `
      ${this._renderHeader(nombre, rolUsuario)}
      ${this._renderError()}
      <section class="dash-section">
        <h2 class="dash-section__title">
          <span class="material-icons">eco</span> Impacto ambiental
        </h2>
        <div class="dash-grid">${this._renderGlobal()}</div>
      </section>
      <section class="dash-section">
        <h2 class="dash-section__title">
          <span class="material-icons">insights</span> Mi rol
        </h2>
        <div class="dash-grid">${this._renderPorRol()}</div>
      </section>
    `;

    const btn = this.element.querySelector("[data-refrescar]");
    if (btn) btn.addEventListener("click", () => this.refrescar());

    // Disparar la carga inicial y programar el refresco una sola vez.
    if (!this._iniciado) {
      this._iniciado = true;
      this._cargar(false);
      this._intervalId = setInterval(() => this.refrescar(), REFRESH_MS);
    }

    return this.element;
  }

  // ── Carga de datos ───────────────────────────────────────────
  async refrescar() {
    // Si el contenedor ya no está en el DOM, el usuario navegó a otra
    // vista: detenemos el ciclo para no fugar timers ni repintar en vano.
    if (this.container && !document.body.contains(this.container)) {
      this._detener();
      return;
    }
    if (this.refrescando) return;
    await this._cargar(true);
  }

  async _cargar(esRefresco) {
    if (esRefresco) {
      this.refrescando = true;
      this._marcarRefrescando(true);
    }

    const res = await DashboardService.obtenerDashboard();

    if (this.container && !document.body.contains(this.container)) {
      this._detener();
      return;
    }

    if (res?.ok && res.result) {
      this.data = res.result;
      this.error = null;
      this.ultimaActualizacion = new Date();
    } else {
      this.error = res?.errorMessages?.[0] || "No se pudieron cargar las métricas.";
    }

    this.cargando = false;
    this.refrescando = false;
    await this.reMount(false); // repinta con los datos nuevos
  }

  _detener() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  }

  _marcarRefrescando(activo) {
    const ind = this.element?.querySelector("[data-spinner]");
    if (ind) ind.classList.toggle("is-active", activo);
  }

  // ── Render parcial ───────────────────────────────────────────
  _renderHeader(nombre, rol) {
    const hora = this.ultimaActualizacion
      ? this.ultimaActualizacion.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
      : "";
    return `
      <div class="dash-header">
        <div class="dash-header__user">
          <div class="dash-avatar"><span class="material-icons">person</span></div>
          <div>
            <h1>Hola, ${esc(nombre)}</h1>
            <p class="dash-rol">${esc(rol)}</p>
          </div>
        </div>
        <div class="dash-header__actions">
          <span class="dash-updated">${hora ? `Actualizado ${hora}` : ""}</span>
          <span class="dash-spinner ${this.refrescando ? "is-active" : ""}" data-spinner>
            <span class="material-icons">autorenew</span>
          </span>
          <button class="dash-refresh" data-refrescar title="Actualizar ahora">
            <span class="material-icons">refresh</span>
          </button>
        </div>
      </div>`;
  }

  _renderError() {
    if (!this.error) return "";
    return `
      <div class="dash-alert">
        <span class="material-icons">error_outline</span>
        <span>${esc(this.error)}</span>
      </div>`;
  }

  _renderGlobal() {
    if (this.cargando) return this._skeletons(5);
    const g = this.data?.global || {};
    return [
      this._card({ icon: "description", valor: numero.format(g.hojasAhorradasHoy || 0), label: "Hojas ahorradas hoy", sev: "ok" }),
      this._card({ icon: "calendar_month", valor: numero.format(g.hojasAhorradasMes || 0), label: "Hojas ahorradas este mes", sev: "ok" }),
      this._card({ icon: "inventory_2", valor: numero.format(g.hojasAhorradasTotal || 0), label: "Hojas ahorradas en total", sev: "ok" }),
      this._card({ icon: "forest", valor: fmtDecimal(g.arbolesAhorradosTotal, 3), label: "Árboles equivalentes", sev: "info" }),
      this._card({ icon: "scale", valor: `${fmtDecimal(g.kilosAhorradosTotal, 2)} kg`, label: "Papel ahorrado", sev: "info" })
    ].join("");
  }

  _renderPorRol() {
    if (this.cargando) return this._skeletons(4);
    const rol = this.data?.rol || "";
    const r = this.data?.porRol;
    if (!r) {
      return `<div class="dash-empty">
        <span class="material-icons">hourglass_empty</span>
        <p>No hay métricas específicas para tu rol.</p>
      </div>`;
    }
    switch (rol) {
      case "Admisiones": return this._rolAdmisiones(r);
      case "Medico": return this._rolMedico(r);
      case "Enfermeria": return this._rolEnfermeria(r);
      case "Auditoria": return this._rolAuditoria(r);
      case "Facturacion": return this._rolFacturacion(r);
      case "Administrador": return this._rolAdministrador(r);
      default:
        return `<div class="dash-empty">
          <span class="material-icons">hourglass_empty</span>
          <p>No hay métricas específicas para tu rol.</p>
        </div>`;
    }
  }

  _rolAdmisiones(r) {
    return [
      this._card({ icon: "badge", valor: numero.format(r.atencionesSinDocIdentidad || 0), label: "Sin documento de identidad", sev: this._sevPendiente(r.atencionesSinDocIdentidad) }),
      this._card({ icon: "verified_user", valor: numero.format(r.atencionesSinAutorizacion || 0), label: "Sin autorización", sev: this._sevPendiente(r.atencionesSinAutorizacion) }),
      this._card({ icon: "hourglass_top", valor: fmtMinutos(r.tiempoPromedioEsperaHoy), label: "Espera promedio hoy", sev: "info" }),
      this._card({ icon: "medical_services", valor: fmtMinutos(r.tiempoPromedioConsultaHoy), label: "Consulta promedio hoy", sev: "info" })
    ].join("");
  }

  _rolMedico(r) {
    return [
      this._card({ icon: "groups", valor: numero.format(r.pacientesEnAdmision || 0), label: "Pacientes esperando admisión", sev: this._sevCola(r.pacientesEnAdmision) }),
      this._card({ icon: "hourglass_top", valor: fmtMinutos(r.tiempoPromedioEsperaHoy), label: "Espera promedio hoy", sev: "info" }),
      this._card({ icon: "medical_services", valor: fmtMinutos(r.tiempoPromedioConsultaHoy), label: "Consulta promedio hoy", sev: "info" })
    ].join("");
  }

  _rolEnfermeria(r) {
    return this._card({
      icon: "king_bed",
      valor: numero.format(r.pacientesEnIngreso || 0),
      label: "Pacientes activos en ingreso",
      sev: this._sevCola(r.pacientesEnIngreso)
    });
  }

  _rolAuditoria(r) {
    return [
      this._card({ icon: "fact_check", valor: numero.format(r.atencionesPendientesRevision || 0), label: "Atenciones pendientes de revisión", sev: this._sevPendiente(r.atencionesPendientesRevision) }),
      this._card({ icon: "rule", valor: numero.format(r.correcccionesPendientes || 0), label: "Correcciones por aprobar/rechazar", sev: this._sevPendiente(r.correcccionesPendientes) }),
      this._card({ icon: "schedule", valor: fmtMinutos(r.tiempoPromedioRevisionHoy), label: "Revisión promedio hoy", sev: "info" })
    ].join("");
  }

  _rolFacturacion(r) {
    return [
      this._card({ icon: "receipt_long", valor: numero.format(r.atencionesPendientes || 0), label: "Atenciones pendientes", sev: this._sevPendiente(r.atencionesPendientes) }),
      this._card({ icon: "warning", valor: numero.format(r.atencionesenRiesgo || 0), label: "En riesgo (> 22 días)", sev: this._sevRiesgo(r.atencionesenRiesgo) })
    ].join("");
  }

  _rolAdministrador(r) {
    const usuarios = this._card({
      icon: "group",
      valor: numero.format(r.usuariosActivos || 0),
      label: "Usuarios activos",
      sev: "info"
    });

    const estados = r.atencionesPorEstado || {};
    const chips = Object.keys(estados).length
      ? Object.entries(estados).map(([estado, count]) => `
          <div class="dash-chip">
            <span class="dash-chip__count">${numero.format(count)}</span>
            <span class="dash-chip__label">${esc(estado)}</span>
          </div>`).join("")
      : `<p class="dash-empty__text">Sin atenciones activas.</p>`;

    return `
      ${usuarios}
      <div class="dash-card dash-card--wide">
        <div class="dash-card__icon dash-card__icon--info"><span class="material-icons">donut_large</span></div>
        <div class="dash-card__body dash-card__body--full">
          <span class="dash-card__label">Atenciones por estado</span>
          <div class="dash-chips">${chips}</div>
        </div>
      </div>`;
  }

  // ── Helpers de presentación ──────────────────────────────────
  _card({ icon, valor, label, sev = "info" }) {
    return `
      <div class="dash-card dash-card--${sev}">
        <div class="dash-card__icon dash-card__icon--${sev}">
          <span class="material-icons">${icon}</span>
        </div>
        <div class="dash-card__body">
          <span class="dash-card__value">${valor}</span>
          <span class="dash-card__label">${esc(label)}</span>
        </div>
      </div>`;
  }

  _skeletons(n) {
    let out = "";
    for (let i = 0; i < n; i++) {
      out += `
      <div class="dash-card dash-card--skeleton">
        <div class="dash-skel dash-skel--icon"></div>
        <div class="dash-card__body">
          <div class="dash-skel dash-skel--value"></div>
          <div class="dash-skel dash-skel--label"></div>
        </div>
      </div>`;
    }
    return out;
  }

  // Semáforo: 0 = ok; pequeño = atención; alto = urgente.
  _sevPendiente(v) {
    const n = Number(v) || 0;
    if (n === 0) return "ok";
    if (n <= 5) return "warn";
    return "danger";
  }

  _sevCola(v) {
    const n = Number(v) || 0;
    if (n === 0) return "ok";
    if (n <= 10) return "info";
    return "warn";
  }

  _sevRiesgo(v) {
    const n = Number(v) || 0;
    return n === 0 ? "ok" : "danger";
  }
}
