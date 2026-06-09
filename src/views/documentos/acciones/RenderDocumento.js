import { apiGet } from "../../../core/api.js";
import { formatearFecha, formatearFechaHora } from "../../../utils/date.js";
import { SolicitudCorreccionItem } from "../../correcciones/SolicitudCorreccionItem.js";
import { puedeSolicitarCorrecion, EstadoCorreccion } from "../../../utils/correcciones.js";

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
    btnEliminar.classList.add("btn-accion-doc", "btn-accion-eliminar");
    btnEliminar.title = "Eliminar";
    btnEliminar.innerHTML = `
    <span class="material-icons">delete</span>
    <span class="btn-accion-label">Eliminar</span>`;
    btnEliminar.addEventListener("click", onEliminar);
    acciones.appendChild(btnEliminar);
  }

  const btnDescargar = document.createElement("button");
  btnDescargar.classList.add("btn-accion-doc", "btn-accion-descargar");
  btnDescargar.title = "Descargar";
  btnDescargar.innerHTML = `
    <span class="material-icons">download</span>
    <span class="btn-accion-label">Descargar</span>`;
  btnDescargar.addEventListener("click", onDescargar);
  acciones.appendChild(btnDescargar);

  if ((documento.tipoDocumento.requiereNumeroRelacion || documento.tipoDocumento.esAsistencial) && documento.puedeCargar) {
    const btnEditar = document.createElement("button");
    btnEditar.classList.add("btn-accion-doc", "btn-accion-editar");
    btnEditar.title = "Editar";
    btnEditar.innerHTML = `
    <span class="material-icons">edit</span>
    <span class="btn-accion-label">Editar</span>`;
    btnEditar.addEventListener("click", onEditar);
    acciones.prepend(btnEditar);
  }

  if (puedeSolicitarCorrecion(documento) && !tieneSolicitudesPendientes()) {
    const btnSolicitarCorreccion = document.createElement("button");
    btnSolicitarCorreccion.classList.add("btn-accion-doc", "btn-accion-editar");
    btnSolicitarCorreccion.title = "Solicitar Corrección";
    btnSolicitarCorreccion.innerHTML = `
    <span class="material-symbols-outlined">quick_reference</span>
    <span class="btn-accion-label">Corrección</span>`;
    btnSolicitarCorreccion.addEventListener("click", onSolicitarCorreccion);
    acciones.appendChild(btnSolicitarCorreccion);
  }

  if (documento.tipoDocumento?.permiteFirma) {
    const btnFirmar = document.createElement("button");
    btnFirmar.classList.add("btn-accion-doc", "btn-accion-firmar");
    btnFirmar.title = "Firmar";
    btnFirmar.innerHTML = `
    <span class="material-symbols-outlined">signature</span>
    <span class="btn-accion-label">Firmar</span>`;
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

  const estadoNombre = solicitudPendiente.estadoCorreccion?.nombre || 'Pendiente';
  const fechaSolicitud = solicitudPendiente.fechaSolicitud 
    ? formatearFecha(solicitudPendiente.fechaSolicitud) 
    : 'Sin fecha';
  const solicitadoPor = solicitudPendiente.usuarioSolicita
    ? `${solicitudPendiente.usuarioSolicita.nombre || ''} ${solicitudPendiente.usuarioSolicita.apellidos || ''}`.trim()
    : 'Usuario desconocido';

  const panel = document.createElement('div');
  panel.className = 'correccion-panel-simple';
  panel.innerHTML = `
    <div class="correccion-panel-estado">
      <span class="badge-estado-correccion badge-${estadoNombre.toLowerCase()}">${estadoNombre.toUpperCase()}</span>
    </div>
    <div class="correccion-panel-meta">
      <span>Solicitado: ${fechaSolicitud}</span>
      <span>Por: <strong>${solicitadoPor}</strong></span>
    </div>
    <div class="correccion-panel-acciones"></div>
  `;

  // Instanciar SolicitudCorreccionItem para reutilizar sus métodos
  solicitudPendiente.documento = solicitudPendiente.documento || documento;
  const solicitudItem = new SolicitudCorreccionItem(solicitudPendiente, () => {
    element.classList.remove("documento-item-correcciones");
    onReMount();
  });

  const accionesContainer = panel.querySelector('.correccion-panel-acciones');

  // Botón "Ver corrección" (Visible si está Respondida o Aceptada)
  if (solicitudPendiente.estadoCorreccionId === EstadoCorreccion.RESPONDIDA || solicitudPendiente.estadoCorreccionId === EstadoCorreccion.ACEPTADA) {
    const btnVer = document.createElement("button");
    btnVer.className = "btn-accion-outline";
    btnVer.innerHTML = `<span class="material-icons">visibility</span> Ver corrección`;
    btnVer.onclick = () => solicitudItem._verCorreccion();
    accionesContainer.appendChild(btnVer);
  }

  // Botones según rol (Creador vs Corrector)
  if (puedeSolicitarCorrecion(solicitudPendiente.documento)) {
    // Creador
    if (solicitudPendiente.estadoCorreccionId === EstadoCorreccion.PENDIENTE || solicitudPendiente.estadoCorreccionId === EstadoCorreccion.RECHAZADA) {
      const btnEliminar = document.createElement("button");
      btnEliminar.className = "btn-accion-peligro";
      btnEliminar.innerHTML = `<span class="material-icons">delete</span> Eliminar solicitud`;
      btnEliminar.onclick = () => solicitudItem._eliminarSolicitudCorreccion();
      accionesContainer.appendChild(btnEliminar);
    } else if (solicitudPendiente.estadoCorreccionId === EstadoCorreccion.RESPONDIDA) {
      const btnRechazar = document.createElement("button");
      btnRechazar.className = "btn-accion-peligro";
      btnRechazar.innerHTML = `<span class="material-icons">cancel</span> Rechazar`;
      btnRechazar.onclick = () => solicitudItem._rechazarCorreccion();
      accionesContainer.appendChild(btnRechazar);

      const btnAprobar = document.createElement("button");
      btnAprobar.className = "btn-accion-success";
      btnAprobar.innerHTML = `<span class="material-icons">check</span> Aprobar`;
      btnAprobar.onclick = () => solicitudItem._aprobarCorreccion();
      accionesContainer.appendChild(btnAprobar);
    }
  } else {
    // Corrector
    if (solicitudPendiente.estadoCorreccionId === EstadoCorreccion.PENDIENTE || solicitudPendiente.estadoCorreccionId === EstadoCorreccion.RECHAZADA) {
      const btnResponder = document.createElement("button");
      btnResponder.className = "btn-accion-solido";
      btnResponder.innerHTML = `<span class="material-icons">send</span> Responder solicitud`;
      btnResponder.onclick = () => solicitudItem._responderCorreccion();
      accionesContainer.appendChild(btnResponder);
    }
  }

  element.appendChild(panel);
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
