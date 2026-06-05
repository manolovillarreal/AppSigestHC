import { BaseComponent } from "../../../components/BaseComponent.js";
import { obtenerRutaDocumentos, actualizarRutaDocumentos } from "../../../api/configuracion.api.js";

export class ConfiguracionView extends BaseComponent {
  constructor() {
    super();
    this.rutaActual = "";
  }

  async load() {
    const res = await obtenerRutaDocumentos();
    if (res.ok) {
      this.rutaActual = res.result?.valor ?? "";
    }
  }

  render() {
    const div = document.createElement("div");
    div.classList.add("configuracion-view");

    div.innerHTML = `
      <h1>Configuración del sistema</h1>
      <div class="configuracion-seccion">
        <h2>Almacenamiento de documentos</h2>
        <div class="campo">
          <label for="inputRutaDocumentos">Ruta de documentos</label>
          <input type="text" id="inputRutaDocumentos" value="${this.rutaActual}" />
          <span class="campo-ayuda">
            Los documentos ya guardados no se verán afectados.
            Solo los nuevos documentos usarán esta ruta.
          </span>
        </div>
        <div class="configuracion-acciones">
          <button type="button" class="btn-primary btn-guardar-config">Guardar cambios</button>
        </div>
      </div>
    `;

    div.querySelector(".btn-guardar-config").addEventListener("click", () =>
      this._handleGuardar(div)
    );

    this.element = div;
  }

  async _handleGuardar(div) {
    const valor = div.querySelector("#inputRutaDocumentos").value.trim();

    Swal.fire({
      title: "Guardando...",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
    });

    const res = await actualizarRutaDocumentos(valor);

    if (res.ok) {
      await Swal.fire({
        icon: "success",
        title: "Cambios guardados",
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }

    if (res.status === 400) {
      const mensaje = res.errorMessages?.[0] ?? "La ruta especificada no existe.";
      await Swal.fire({ icon: "error", title: "Error", text: mensaje });
      return;
    }

    await Swal.fire({ icon: "error", title: "Error", text: "No se pudieron guardar los cambios." });
  }
}
