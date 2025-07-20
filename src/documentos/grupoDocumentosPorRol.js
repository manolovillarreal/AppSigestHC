import { ItemDocumento } from "./itemDocumento.js";



export class GrupoDocumentosPorRol {
  constructor(rolNombre,documentos) {
    this.rolNombre = rolNombre;
    this.documentos = documentos;
  }
  render(thumbnailRefs,container) {

    const panel = document.createElement("div");
    panel.classList.add("doc-panel");

    const header = document.createElement("div");
    header.classList.add("doc-panel-header");
    header.textContent = `${this.rolNombre} (${this.documentos.length})`;

    const contenido = document.createElement("div");
    contenido.classList.add("doc-panel-content");

    // Toggle colapsable
    header.addEventListener("click", () => {
      contenido.classList.toggle("hidden");
    });

    console.log(this.documentos);
    
    // Renderizar los documentos de este grupo
    this.documentos.forEach(doc => {
      
      const item = new ItemDocumento(doc,thumbnailRefs,contenido);
      item.render()
    });

    panel.appendChild(header);
    panel.appendChild(contenido);
    
    container.appendChild(panel);
  }
 
}






function crearElementoDocumento(doc, thumbnailRefs) {
  const item = document.createElement("li");
  item.classList.add("documento-item");

  // Thumbnail (se carga después de forma async)
  const thumbnailContainer = document.createElement("div");
  thumbnailContainer.classList.add("thumbnail-container");
  thumbnailContainer.textContent = "...";

  thumbnailContainer.addEventListener("click", () => verDocumento(doc.id));
  thumbnailRefs.set(doc.id, thumbnailContainer);

  // Detalles
  const detalles = document.createElement("div");
  detalles.classList.add("documento-detalles");

  const titulo = document.createElement("div");
  titulo.classList.add("doc-nombre");
  titulo.textContent = doc.tipoDocumento.nombre;
  detalles.appendChild(titulo);

  if (doc.tipoDocumento.esAsistencial) {
    const fechaDoc = document.createElement("div");
    fechaDoc.classList.add("doc-fecha");
    fechaDoc.textContent = `Fecha del documento: ${formatearFecha(doc.fecha)}`;
    detalles.appendChild(fechaDoc);
  }

  if (doc.numeroRelacion) {
    const relacion = document.createElement("div");
    relacion.classList.add("doc-relacion");
    relacion.textContent = `N° Relación: ${doc.numeroRelacion}`;
    detalles.appendChild(relacion);
  }

  // Metadata del cargue
  const metadata = document.createElement("div");
  metadata.classList.add("doc-meta");
  const usuario = doc.usuario || {};
  metadata.innerHTML = `
    <div>Cargado el ${formatearFechaHora(doc.fechaCarga)}</div> 
    <div>por ${usuario.nombre || '—'} ${usuario.apellidos || ''}</div>`;
  detalles.appendChild(metadata);

  // Acciones
  const acciones = document.createElement("div");
  acciones.classList.add("doc-acciones");

  // Botón Eliminar
  const btnEliminar = document.createElement("button");
  btnEliminar.classList.add("icon-btn");
  btnEliminar.title = "Eliminar";
  btnEliminar.innerHTML = `<span class="material-icons">delete</span>`;
  btnEliminar.addEventListener("click", async () => {
    await eliminarDocumento(doc.id, () => item.remove());
  });

  // Botón Descargar
  const btnDescargar = document.createElement("button");
  btnDescargar.classList.add("icon-btn");
  btnDescargar.title = "Descargar";
  btnDescargar.innerHTML = `<span class="material-icons">download</span>`;
  btnDescargar.addEventListener("click", () => descargarDocumento(doc.id));

  acciones.appendChild(btnEliminar);
  acciones.appendChild(btnDescargar);

  // Botón Editar (si aplica)
  if (doc.tipoDocumento.requiereNumeroRelacion || doc.tipoDocumento.esAsistencial) {
    const btnEditar = document.createElement("button");
    btnEditar.classList.add("icon-btn");
    btnEditar.title = "Editar";
    btnEditar.innerHTML = `<span class="material-icons">edit</span>`;
    btnEditar.addEventListener("click", () => editarDocumento(doc.id, doc));
    acciones.prepend(btnEditar);
  }

  detalles.appendChild(acciones);
  item.appendChild(thumbnailContainer);
  item.appendChild(detalles);

  return item;
}
