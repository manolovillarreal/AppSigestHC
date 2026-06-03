import { BaseComponent } from "./BaseComponent.js";

export class FiltroLista extends BaseComponent {
  constructor(config) {
    super();
    this.filtros = config.filtros || [];
    this.elementosOriginales = config.elementos || [];
    this.onFiltrar = config.onFiltrar; // función que recibe los elementos filtrados
    this.selectores = {};
    this.elementosFiltrados = config.elementos || [];
  }

  render() {
    const contenedor = document.createElement("div");
    contenedor.classList.add("filtro-lista");

    this.filtros.forEach((filtro) => {
      if (filtro.tipo === "texto") {
        const input = document.createElement("input", {
          className: "filtro-texto",
        });
        input.placeholder = filtro.placeholder || "Buscar...";
        input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.aplicarFiltros();
        }
      });
        this.selectores[filtro.nombre] = input;
        contenedor.appendChild(input);
      }

      if (filtro.tipo === "select") {
        const select = document.createElement("select", {
          className: "filtro-select",
        });
        filtro.opciones.forEach((op) => {
          const opt = document.createElement("option");
          opt.value = op.valor;
          opt.textContent = op.label;
          select.appendChild(opt);
        });
        select.addEventListener("change", () => this.aplicarFiltros());
        this.selectores[filtro.nombre] = select;
        contenedor.appendChild(select);
      }
    });

    const btnBuscar = document.createElement("button");
    btnBuscar.title = "Buscar";
    btnBuscar.innerHTML = "🔍";
    btnBuscar.addEventListener("click", () => this.aplicarFiltros());
    contenedor.appendChild(btnBuscar);

    const btnLimpiar = document.createElement("button");
    btnLimpiar.title = "Limpiar filtros";
    btnLimpiar.innerHTML = "❌";
    btnLimpiar.addEventListener("click",  () => this.limpiarFiltros());

    contenedor.appendChild(btnLimpiar);

    this.element = contenedor;
  }

  aplicarFiltros() {
    let resultado = this.elementosOriginales;

    this.filtros.forEach((filtro) => {
      const valor = this.selectores[filtro.nombre].value.toLowerCase();
        
      if (valor && valor !== "") {
        
        resultado = resultado.filter((e) => {

          const propiedad = filtro.propiedad(e).toLowerCase();
          
          return propiedad.includes(valor);
        });
      }
    });
    this.elementosFiltrados = resultado;
    this.onFiltrar(resultado);
  }

  limpiarFiltros() {
    Object.values(this.selectores).forEach((control) => (control.value = ""));
    this.elementosFiltrados = this.elementosOriginales;
    this.onFiltrar(this.elementosOriginales);
  }

}
