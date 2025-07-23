export class EstadosRequeridosView {
  constructor(estados) {
    this.estados = estados;
    this.element = this._renderEstados();
  }

  _renderEstados() {
    const div = document.createElement("div");
    div.classList.add("estados-requeridos");

    const legend = document.createElement("h3");
    legend.textContent = "Obligatorio en Estados:";
    div.appendChild(legend);

    this.estados.forEach((estado) => {
      const p = document.createElement("p");
      p.textContent = `• ${estado.nombre}`;
      div.appendChild(p);
    });

    return div;
  }
}
