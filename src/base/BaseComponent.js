export class BaseComponent {
  constructor() {
    this.element = null; // Se debe asignar en render()
    this.container = null
  }

  /**
   * Crea el contenido visual del componente y lo asigna a this.element.
   * Debe ser implementado por clases hijas.
   */
  render() {
    throw new Error("El método render() debe ser implementado en la subclase.");
  }

  /**
   * Reemplaza el contenido de un contenedor con el componente.
   * @param {HTMLElement|string} container - Un nodo o un id de nodo.
   */
  async mount(container,load=true ) {
    // Ejecutar carga de datos si hay un método load
    if (typeof this.load === "function" && load) {
      await this.load();
    }

    const cont =
      typeof container === "string"
        ? document.getElementById(container)
        : container;

    if (!cont) throw new Error("Contenedor no encontrado");

    if (!this.element) this.render();

    // Limpiar contenido previo del contenedor
    cont.innerHTML = "";

    // Agregar el componente al contenedor
    if (this.element instanceof HTMLElement) {
      cont.appendChild(this.element);
      this.container = cont;
    } else {
      console.warn(
        "⚠️ No se encontró 'this.element' válido al montar el componente."
      );
    }
  }

  /**
   * Agrega el componente al final de un contenedor sin borrar nada.
   * @param {HTMLElement|string} container
   */
  async appendTo(container) {
     // Ejecutar carga de datos si hay un método load
    if (typeof this.load === "function") {
      await this.load();
    }

    const cont =
      typeof container === "string"
        ? document.getElementById(container)
        : container;

    if (!cont) throw new Error("Contenedor no encontrado");

    if (!this.element) this.render();

    cont.appendChild(this.element);
    this.container = cont;
  }

  /**
   * Inserta el componente antes del nodo de referencia.
   * @param {HTMLElement} referenceNode
   */
  insertBefore(referenceNode) {
    if (!this.element) this.render();

     this.container = referenceNode.parentNode;
     this.container.insertBefore(this.element, referenceNode);
  }

  /**
   * Inserta el componente después del nodo de referencia.
   * @param {HTMLElement} referenceNode
   */
  insertAfter(referenceNode) {
    if (!this.element) this.render();

    this.container = referenceNode.parentNode;
  this.container.insertBefore(this.element, referenceNode.nextSibling);
  }

  

}
