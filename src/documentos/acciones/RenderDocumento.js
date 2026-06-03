import { apiGet } from "../../api/api.js";
import { formatearFecha, formatearFechaHora } from "../../utils/date.js";
import { SolicitudCorreccionItem } from "../../solicitudesCorreccion/SolicitudCorreccionItem.js";
import { puedeSolicitarCorrecion, EstadoCorreccion } from "../../helpers/correcciones.js";

export function renderCheckbox(element, documento, onSelectionChange) {
  const checkboxContainer = document.createElement("div");
  checkboxContainer.classList.add("documento-checkbox-container");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.classList.add("documento-checkbox");
  checkbox.id = `doc-checkbox-${documento.id}`;
  checkbox.addEventListener("change", (e) => {
    onSelectionChange && onSelectionChange(documento, e.target.checked);
  });

  checkboxContainer.appendChild(checkbox);
  element.appendChild(checkboxContainer);
}

export function renderContent(element, documento, onVerDocumento) {
  const wrapper = document.createElement("div");
  wrapper.classList.add("documento-item-wrapper");
  element.appendChild(wrapper);

  const thumbnailContainer = document.createElement("div");
  thumbnailContainer.classList.add("thumbnail-container");
  thumbnailContainer.textContent = "...";
  thumbnailContainer.addEventListener("click", () => onVerDocumento(documento.id));

  const detalles = document.createElement("div");
  detalles.classList.add("documento-detalles");

  const titulo = document.createElement("div");
  titulo.classList.add("doc-nombre");
  titulo.textContent = documento.tipoDocumento?.nombre || "Documento";
  titulo.addEventListener("click", () => onVerDocumento(documento.id));
  detalles.appendChild(titulo);

  if (documento.tipoDocumento?.esAsistencial) {
    const fechaDoc = document.createElement("div");
    fechaDoc.classList.add("doc-fecha");
    fechaDoc.textContent = `Fecha del documento: ${formatearFecha(documento.fecha)}`;
    detalles.appendChild(fechaDoc);
  }

  if (documento.numeroRelacion) {
    const relacion = document.createElement("div");
    relacion.classList.add("doc-relacion");
    relacion.textContent = `N° Relación: ${documento.numeroRelacion}`;
    detalles.appendChild(relacion);
  }

  const metadata = document.createElement("div");
  metadata.classList.add("doc-meta");
  const usuario = documento.usuario || {};
  metadata.innerHTML = `
    <div>Cargado el ${formatearFechaHora(documento.fechaCarga)}</div>
    <div>por ${usuario.nombre || "—"} ${usuario.apellidos || ""}</div>`;
  detalles.appendChild(metadata);

  wrapper.appendChild(thumbnailContainer);
  wrapper.appendChild(detalles);
}

export function renderAcciones({
  element,
  documento,
  onEliminar,
  onDescargar,
  onEditar,
  onSolicitarCorreccion,
  onFirmarDocumento,
  tieneSolicitudesPendientes,
}) {
  const container = element.querySelector(".documento-detalles");
  const acciones = document.createElement("div");
  acciones.classList.add("doc-acciones");

  if (documento.puedeCargar) {
    const btnEliminar = document.createElement("button");
    btnEliminar.classList.add("icon-btn");
    btnEliminar.title = "Eliminar";
    btnEliminar.innerHTML = `<span class="material-icons">delete</span>`;
    btnEliminar.addEventListener("click", onEliminar);
    acciones.appendChild(btnEliminar);
  }

  const btnDescargar = document.createElement("button");
  btnDescargar.classList.add("icon-btn");
  btnDescargar.title = "Descargar";
  btnDescargar.innerHTML = `<span class="material-icons">download</span>`;
  btnDescargar.addEventListener("click", onDescargar);
  acciones.appendChild(btnDescargar);

  if ((documento.tipoDocumento.requiereNumeroRelacion || documento.tipoDocumento.esAsistencial) && documento.puedeCargar) {
    const btnEditar = document.createElement("button");
    btnEditar.classList.add("icon-btn");
    btnEditar.title = "Editar";
    btnEditar.innerHTML = `<span class="material-icons">edit</span>`;
    btnEditar.addEventListener("click", onEditar);
    acciones.prepend(btnEditar);
  }

  if (puedeSolicitarCorrecion(documento) && !tieneSolicitudesPendientes()) {
    const btnSolicitarCorreccion = document.createElement("button");
    btnSolicitarCorreccion.classList.add("icon-btn");
    btnSolicitarCorreccion.title = "Solicitar Corrección";
    btnSolicitarCorreccion.innerHTML = `<span class="material-symbols-outlined">quick_reference</span>`;
    btnSolicitarCorreccion.addEventListener("click", onSolicitarCorreccion);
    acciones.appendChild(btnSolicitarCorreccion);
  }

  if (documento.tipoDocumento?.permiteFirma) {
    const btnFirmar = document.createElement("button");
    btnFirmar.classList.add("icon-btn");
    btnFirmar.title = "Firmar";
    btnFirmar.innerHTML = `<span class="material-symbols-outlined">signature</span>`;
    btnFirmar.addEventListener("click", onFirmarDocumento);
    acciones.appendChild(btnFirmar);
  }

  container.appendChild(acciones);
}

export function renderCorrecciones(element, documento, onReMount) {
  const solicitudPendiente = documento.solicitudesCorreccion.find(
    (sc) => sc?.estadoCorreccionId !== EstadoCorreccion.ACEPTADA
  );

  if (!solicitudPendiente) return;

  solicitudPendiente.documento = solicitudPendiente.documento || documento;
  const solicitudItem = new SolicitudCorreccionItem(solicitudPendiente, () => {
    element.classList.remove("documento-item-correcciones");
    onReMount();
  });

  const container = document.createElement("div");
  solicitudItem.mount(container);
  element.appendChild(container);
}

export async function descargarMiniaturas(doc, thumbnailContainer, onVerDocumento) {
  console.log('descargarMiniaturas llamado con doc.id:', doc?.id);
  console.log('thumbnailContainer:', thumbnailContainer);

  const thumb = thumbnailContainer;
  if (!thumb) return;

  try {
    if (doc.tipoDocumento && doc.tipoDocumento.extensionPermitida === "pdf") {
      const res = await apiGet(`/Documentos/thumbnails/${doc.id}`);
      console.log('respuesta API thumbnail:', res);
      if (!res.ok || !res.result || !Array.isArray(res.result) || res.result.length === 0) {
        thumb.textContent = "[Error]";
        console.error('Respuesta de API no válida para miniatura:', res);
        return;
      }

      const base64 = res.result[0];
      const img = document.createElement("img");
      img.classList.add("thumbnail");
      img.title = "Click para ver";
      img.src = `data:image/png;base64,${base64}`;
      img.addEventListener("click", () => onVerDocumento(doc.id));
      thumb.replaceWith(img);
      return;
    }

    thumb.textContent = doc.tipoDocumento?.mimeType?.includes("xml")
      ? "[XML]"
      : doc.tipoDocumento?.mimeType?.includes("json")
      ? "[JSON]"
      : "[Archivo]";
  } catch (error) {
    thumb.textContent = "[Error]";
  }
}
