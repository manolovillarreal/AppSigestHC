import { BaseComponent } from '../base/BaseComponent.js';

export class SelectConBuscador extends BaseComponent {
  constructor({ options = [], onSelect = () => {}, placeholder = "Buscar..." }) {
    super();
    
    this.options = options;
    this.onSelect = onSelect;
    this.placeholder = placeholder;
    this.filter = "";
    this.filteredElements = options;
    console.log("Inicializando SelectConBuscador con opciones:", this.options);
    
  }

  render() {
    this.element = document.createElement('div');
    this.element.classList.add('select-buscador');

    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.placeholder = this.placeholder;
    this.input.classList.add('select-buscador-input');

    this.lista = document.createElement('ul');
    this.lista.classList.add('select-buscador-lista');

    this.input.addEventListener('input', () => this.filtrarOpciones());
    this.input.addEventListener('focus', () => this.mostrarLista());
    document.addEventListener('click', (e) => {
      if (!this.element.contains(e.target)) this.ocultarLista();
    });

    this.element.appendChild(this.input);
    this.element.appendChild(this.lista);

    this.actualizarLista();
  }

  filtrarOpciones() {
    console.log("Filtrando opciones con:", this.input.value);
    
    this.filter = this.input.value.toLowerCase();
    this.filteredElements = this.options.filter(o =>
      o.label.toLowerCase().includes(this.filter)
    );
    this.actualizarLista();
  }

  actualizarLista() {
    console.log("Actualizando lista con elementos filtrados:", this.filteredElements);
    
    this.lista.innerHTML = '';
    this.filteredElements.forEach(opcion => {
      const li = document.createElement('li');
      li.textContent = opcion.label;
      li.classList.add('select-buscador-item');
      li.addEventListener('click', () => {
        this.input.value = opcion.label;
        this.onSelect(opcion);
        this.ocultarLista();
      });
      this.lista.appendChild(li);
    });
  }

  mostrarLista() {
    this.lista.classList.add('visible');
    if (this.filteredElements.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'No hay resultados';
      li.classList.add('select-buscador-item', 'no-resultados');
      this.lista.appendChild(li);
    }
  }

  ocultarLista() {
    this.lista.classList.remove('visible');
    
  }
}
