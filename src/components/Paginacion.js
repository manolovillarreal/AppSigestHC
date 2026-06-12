import { BaseComponent } from "./BaseComponent.js";

/**
 * Control de paginación reutilizable: botones Anterior / Siguiente con el
 * indicador "Mostrando X-Y de Z · Página P de T".
 *
 * Uso:
 *   const pager = new Paginacion({
 *     page, pageSize, total, totalPages,
 *     onPageChange: (nuevaPagina) => { ...recargar... }
 *   });
 *   contenedor.appendChild(pager.render());
 *
 * Se oculta solo cuando hay 0 resultados o cabe todo en una sola página.
 */
export class Paginacion extends BaseComponent {
  constructor({ page = 1, pageSize = 0, total = 0, totalPages, onPageChange } = {}) {
    super();
    this.page = Number(page) || 1;
    this.pageSize = Number(pageSize) || 0;
    this.total = Number(total) || 0;
    this.totalPages = Number(
      totalPages ?? (this.pageSize ? Math.ceil(this.total / this.pageSize) : 0)
    ) || 0;
    this.onPageChange = typeof onPageChange === "function" ? onPageChange : () => {};
  }

  render() {
    this.element = document.createElement("div");
    this.element.className = "paginacion";

    const totalPaginas = Math.max(this.totalPages, 1);

    // Sin resultados o una sola página: no se muestra el control.
    if (this.total === 0 || totalPaginas <= 1) {
      this.element.classList.add("paginacion--oculta");
      return this.element;
    }

    const desde = (this.page - 1) * this.pageSize + 1;
    const hasta = Math.min(this.page * this.pageSize, this.total);

    this.element.innerHTML = `
      <button class="paginacion-btn" data-prev
        ${this.page <= 1 ? "disabled" : ""} aria-label="Página anterior">
        <span class="material-icons">chevron_left</span>
      </button>
      <span class="paginacion-info">
        <span class="paginacion-rango">Mostrando <strong>${desde}-${hasta}</strong> de <strong>${this.total}</strong></span>
        <span class="paginacion-pagina">Página ${this.page} de ${totalPaginas}</span>
      </span>
      <button class="paginacion-btn" data-next
        ${this.page >= totalPaginas ? "disabled" : ""} aria-label="Página siguiente">
        <span class="material-icons">chevron_right</span>
      </button>
    `;

    this.element.querySelector("[data-prev]").addEventListener("click", () => {
      if (this.page > 1) this.onPageChange(this.page - 1);
    });
    this.element.querySelector("[data-next]").addEventListener("click", () => {
      if (this.page < totalPaginas) this.onPageChange(this.page + 1);
    });

    return this.element;
  }
}
