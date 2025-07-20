
export class ItemAtencion {
    constructor(atencion,container,clickHandler) {
        this.atencion = atencion;
        this.container = container;
        this.clickHandler = clickHandler;

    }

    render() {
        const paciente = this.atencion.paciente;
        const item = document.createElement('li');
        item.classList.add("atencion-item");
        item.dataset.id = this.atencion.id;
        item.addEventListener('click', () => this.clickHandler(this.atencion.id));
        item.innerHTML = `
                <div class="paciente-info">
                <strong>${paciente.primerNombre} ${paciente.primerApellido}</strong>
                </div>
                <div class="atencion-detalles">
                <span class="fecha">${new Date(
                    this.atencion.fecha
                ).toLocaleString()}</span>
                </div>
            `;
        this.container.appendChild(item);
    }
}