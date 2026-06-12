import { DocumentoService } from "../../../api/documento.api.js";
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
    fechaDoc.innerHTML = `
      <span class="material-icons doc-meta-icon">calendar_today</span>
      Fecha del documento: ${formatearFechaHora(documento.fecha)}`;
    detalles.appendChild(fechaDoc);
  }

  if (documento.numeroRelacion) {
    const relacion = document.createElement("div");
    relacion.classList.add("doc-relacion");
    relacion.innerHTML = `
      <span class="material-icons doc-meta-icon">tag</span>
      N° Relación: ${documento.numeroRelacion}`;
    detalles.appendChild(relacion);
  }

  const metadata = document.createElement("div");
  metadata.classList.add("doc-meta");
  const usuario = documento.usuario || {};
  metadata.innerHTML = `
    <div>
      <span class="material-icons doc-meta-icon">schedule</span>
      Cargado el ${formatearFechaHora(documento.fechaCarga)}
    </div>
    <div>
      <span class="material-icons doc-meta-icon">person</span>
      por ${usuario.nombre || "—"} ${usuario.apellidos || ""}
    </div>`;
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
    btnEliminar.innerHTML = `
      <span class="material-icons">delete</span> Eliminar`;
    btnEliminar.className = 'btn-doc-accion btn-doc-eliminar';
    btnEliminar.addEventListener("click", onEliminar);
    acciones.appendChild(btnEliminar);
  }

  const btnDescargar = document.createElement("button");
  btnDescargar.innerHTML = `
    <span class="material-icons">download</span> Descargar`;
  btnDescargar.className = 'btn-doc-accion btn-doc-descargar';
  btnDescargar.addEventListener("click", onDescargar);
  acciones.appendChild(btnDescargar);

  if ((documento.tipoDocumento.requiereNumeroRelacion || documento.tipoDocumento.esAsistencial) && documento.puedeCargar) {
    const btnEditar = document.createElement("button");
    btnEditar.innerHTML = `
      <span class="material-icons">edit</span> Editar`;
    btnEditar.className = 'btn-doc-accion btn-doc-editar';
    btnEditar.addEventListener("click", onEditar);
    acciones.prepend(btnEditar);
  }

  if (puedeSolicitarCorrecion(documento) && !tieneSolicitudesPendientes()) {
    const btnSolicitarCorreccion = document.createElement("button");
    btnSolicitarCorreccion.innerHTML = `
      <span class="material-symbols-outlined">quick_reference</span> Corrección`;
    btnSolicitarCorreccion.className = 'btn-doc-accion btn-doc-correccion';
    btnSolicitarCorreccion.addEventListener("click", onSolicitarCorreccion);
    acciones.appendChild(btnSolicitarCorreccion);
  }

  if (documento.tipoDocumento?.permiteFirma) {
    const btnFirmar = document.createElement("button");
    btnFirmar.innerHTML = `
      <span class="material-symbols-outlined">signature</span> Firmar`;
    btnFirmar.className = 'btn-doc-accion btn-doc-firmar';
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

  const fechaSegura = (valor) => {
    if (!valor) return 'Fecha no disponible';
    const d = new Date(valor);
    return isNaN(d.getTime()) ? 'Fecha no disponible' : formatearFecha(valor);
  };

  const nombreUsuario = (usuario) => {
    if (!usuario) return 'Usuario desconocido';
    const nombre = usuario.nombre || usuario.nombreUsuario || '';
    const apellidos = usuario.apellidos || '';
    return `${nombre} ${apellidos}`.trim() || 'Usuario desconocido';
  };

  const estadoNombre = solicitudPendiente.estadoCorreccion?.nombre || 'Pendiente';

  const observaciones = (solicitudPendiente.observacion || '')
    .split('|')
    .map(o => o.trim())
    .filter(Boolean);

  const motivoOriginal = observaciones[0] || '';
  const rechazos = observaciones.slice(1);

  const panel = document.createElement('div');
  panel.className = 'correccion-panel-simple';

  const estadoConfig = {
    'Pendiente':   { color: '#d97706', bg: 'rgba(251,191,36,0.12)',  texto: 'PENDIENTE' },
    'Respondida':  { color: '#059669', bg: 'rgba(16,185,129,0.12)', texto: 'RESPONDIDA' },
    'Rechazada':   { color: '#dc2626', bg: 'rgba(239,68,68,0.12)',  texto: 'RECHAZADA' },
    'Aprobada':    { color: '#2563eb', bg: 'rgba(59,130,246,0.12)', texto: 'APROBADA' },
  };
  const cfg = estadoConfig[estadoNombre] || estadoConfig['Pendiente'];

  // Fecha y usuario según estado
  const estaRespondida = estadoNombre === 'Respondida' || estadoNombre === 'Aprobada';
  const fechaLabel = estaRespondida ? 'Respondido' : 'Solicitado';
  const fecha = estaRespondida 
    ? fechaSegura(solicitudPendiente.fechaCorrige || solicitudPendiente.fechaSolicitud)
    : fechaSegura(solicitudPendiente.fechaSolicitud);
  const porLabel = estaRespondida ? 'Por' : 'Por';
  const porUsuario = estaRespondida
    ? nombreUsuario(solicitudPendiente.usuarioCorrige)
    : nombreUsuario(solicitudPendiente.usuarioSolicita);

  panel.innerHTML = `
    <div class="cp-badge" style="
      color: ${cfg.color}; 
      background: ${cfg.bg};
      font-size: 11px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 20px;
      display: inline-block;
      margin-bottom: 8px;
      letter-spacing: 0.5px;
    ">${cfg.texto}</div>
    <div class="cp-meta">
      <span>${fechaLabel}: <strong>${fecha}</strong></span>
      <span>${porLabel}: ${porUsuario}</span>
      ${motivoOriginal ? `
        <div class="cp-motivo">
          <strong>Motivo:</strong>
          <span>${motivoOriginal}</span>
          ${rechazos.length > 0 ? `
            <div class="cp-rechazos">
              <strong>Rechazos previos:</strong>
              <ul>${rechazos.map(r => `<li>${r}</li>`).join('')}</ul>
            </div>
          ` : ''}
        </div>
      ` : ''}
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
      btnEliminar.className = "btn-doc-accion btn-doc-eliminar";
      btnEliminar.title = "Eliminar Solicitud";
      btnEliminar.innerHTML = `
        <span class="material-icons">delete</span>
        <span class="btn-accion-label">Eliminar</span>
      `;
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
      const res = await DocumentoService.obtenerThumbnail(doc.id);
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
