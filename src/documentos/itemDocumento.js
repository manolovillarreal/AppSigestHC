import debug from "../helpers/debug.js";
import { apiDownloadBlob, apiGet, apiPut, apiDelete } from "../api/api.js";
import {
  formatearFechaHora,
  generarThumbnailPdf,
  formatearFecha,
  formatearErroresHTML,
} from "../helpers/utils.js";
import { downloadBlobFile } from "../helpers/files.js";

export class ItemDocumento {
  constructor(doc, thumbnailRefs, container) {
    this.doc = doc;
    this.thumbnailRefs = thumbnailRefs;
    this.container = container;
    this.wrapper;
  }

  render() {
    if (this.wrapper) this.wrapper.innerHTML = "";

    console.log(this.doc);
    const item = document.createElement("li");
    item.classList.add("documento-item");

    // Thumbnail (se carga después de forma async)
    const thumbnailContainer = document.createElement("div");
    thumbnailContainer.classList.add("thumbnail-container");
    thumbnailContainer.textContent = "...";

    thumbnailContainer.addEventListener("click", () =>
      this.verDocumento(this.doc.id)
    );
    this.thumbnailRefs.set(this.doc.id, thumbnailContainer);

    // Detalles
    const detalles = document.createElement("div");
    detalles.classList.add("documento-detalles");

    const titulo = document.createElement("div");
    titulo.classList.add("doc-nombre");
    titulo.textContent = this.doc.tipoDocumento.nombre;
    detalles.appendChild(titulo);

    if (this.doc.tipoDocumento.esAsistencial) {
      const fechaDoc = document.createElement("div");
      fechaDoc.classList.add("doc-fecha");
      fechaDoc.textContent = `Fecha del documento: ${formatearFecha(
        this.doc.fecha
      )}`;
      detalles.appendChild(fechaDoc);
    }

    if (this.doc.numeroRelacion) {
      const relacion = document.createElement("div");
      relacion.classList.add("doc-relacion");
      relacion.textContent = `N° Relación: ${this.doc.numeroRelacion}`;
      detalles.appendChild(relacion);
    }

    // Metadata del cargue
    const metadata = document.createElement("div");
    metadata.classList.add("doc-meta");
    const usuario = this.doc.usuario || {};
    metadata.innerHTML = `
    <div>Cargado el ${formatearFechaHora(this.doc.fechaCarga)}</div> 
    <div>por ${usuario.nombre || "—"} ${usuario.apellidos || ""}</div>`;
    detalles.appendChild(metadata);

    // Acciones
    const acciones = document.createElement("div");
    acciones.classList.add("doc-acciones");

    // Botón Eliminar

    if (this.doc.puedeCargar) {
      const btnEliminar = document.createElement("button");
      btnEliminar.classList.add("icon-btn");
      btnEliminar.title = "Eliminar";
      btnEliminar.innerHTML = `<span class="material-icons">delete</span>`;
      btnEliminar.addEventListener("click", async () => {
        await this.eliminarDocumento(this.doc.id, () => item.remove());
      });
      acciones.appendChild(btnEliminar);
    }

    // Botón Descargar
    const btnDescargar = document.createElement("button");
    btnDescargar.classList.add("icon-btn");
    btnDescargar.title = "Descargar";
    btnDescargar.innerHTML = `<span class="material-icons">download</span>`;
    btnDescargar.addEventListener("click", () =>
      this.descargarDocumento(this.doc)
    );

    acciones.appendChild(btnDescargar);

    // Botón Editar (si aplica)
    if (
      (this.doc.tipoDocumento.requiereNumeroRelacion ||
        this.doc.tipoDocumento.esAsistencial) &&
      this.doc.puedeCargar
    ) {
      const btnEditar = document.createElement("button");
      btnEditar.classList.add("icon-btn");
      btnEditar.title = "Editar";
      btnEditar.innerHTML = `<span class="material-icons">edit</span>`;
      btnEditar.addEventListener("click", () =>
        this.editarDocumento(this.doc, () => {
          this.render();
        })
      );
      acciones.prepend(btnEditar);
    }

    detalles.appendChild(acciones);
    item.appendChild(thumbnailContainer);
    item.appendChild(detalles);

    this.wrapper = item;
    this.container.appendChild(item);

    descargarMiniaturas(this.doc, this.thumbnailRefs, this.verDocumento);
  }

  async verDocumento(docId) {
    console.log("ver");

    try {
      const res = await apiDownloadBlob(`/Documentos/ver/${docId}`);

      if (!res.ok) {
        alert("No se pudo cargar el documento");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      window.open(url, "_blank");
    } catch (error) {
      alert("No se pudo cargar el documento");
    }
  }

  async descargarDocumento(doc) {
    console.log("descargar");
    console.log(doc);

    const res = await apiDownloadBlob(`/Documentos/ver/${doc.id}`);

    if (!res.ok) {
      alert("No se pudo descargar el documento");
      return;
    }

    await downloadBlobFile(res, doc);
  }
  async eliminarDocumento(docId, onSuccess = null) {
    const confirmacion = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar documento?",
      text: "Esta acción no se puede deshacer.",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
    });

    if (!confirmacion.isConfirmed) return;

    const res = await apiDelete(`/Documentos/${docId}`);

    if (res.ok) {
      await Swal.fire({
        icon: "success",
        title: "Documento eliminado",
        timer: 1500,
        showConfirmButton: false,
      });

      if (onSuccess) onSuccess();
    } else {
      const mensaje = res?.mensaje || "No se pudo eliminar el documento.";
      const errores = formatearErroresHTML(res.errorMessages);

      await Swal.fire({
        icon: "error",
        title: "Error",
        html: `<p>${mensaje}</p>${errores}`,
      });
    }
  }

  async editarDocumento(doc, onSuccess = null) {
    const { result, payload } = await FormularioEditar(doc);

    if (!result.isConfirmed) return;

    const response = await apiPut(`/Documentos/editar`, payload);

    if (response.ok) {
      await Swal.fire({
        icon: "success",
        title: "Documento actualizado",
        timer: 1500,
        showConfirmButton: false,
      });

      doc.numeroRelacion = payload.numeroRelacion || doc.numeroRelacion;
      doc.fecha = payload.fecha || doc.fecha;

      if (onSuccess) onSuccess();
    } else {
      const errores = formatearErroresHTML(response.full?.errores);
      await Swal.fire({
        icon: "error",
        title: response.full?.mensaje || "Error al editar",
        html: errores,
      });
    }
  }
}

async function FormularioEditar(doc) {
  const { requiereNumeroRelacion, esAsistencial } = doc.tipoDocumento;
  let html = "";

  if (requiereNumeroRelacion) {
    html += `
      <label for="edit-relacion">N° Relación</label>
      <input id="edit-relacion" class="swal2-input" value="${
        doc.numeroRelacion || ""
      }">
    `;
  }

  if (esAsistencial) {
    const fecha =
      doc.fecha?.substring(0, 10) || new Date().toISOString().substring(0, 10);
    html += `
      <label for="edit-fecha">Fecha del Documento</label>
      <input id="edit-fecha" type="date" class="swal2-input" value="${fecha}">
    `;
  }

  // 🟢 Aquí declaramos payload afuera y lo llenamos en preConfirm
  let payload = {};

  const result = await Swal.fire({
    title: "Editar Documento",
    html,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Guardar",
    cancelButtonText: "Cancelar",
    preConfirm: () => {
      const relInput = document.getElementById("edit-relacion");
      const fechaInput = document.getElementById("edit-fecha");

      if (requiereNumeroRelacion) {
        payload.numeroRelacion = relInput?.value.trim() || null;
      }

      if (esAsistencial) {
        payload.fecha = fechaInput?.value || null;
      }

      payload.id = doc.id;
      return true; // obligamos a que se cierre si no hay errores
    },
  });

  return { result, payload };
}

async function descargarMiniaturas(doc, thumbnailRefs, verDocumento) {
  // Descargar thumbnails en paralelo
  const thumb = thumbnailRefs.get(doc.id);
  if (!thumb) return;

  try {
    const res = await apiDownloadBlob(`/Documentos/ver/${doc.id}`);

    if (!res.ok) {
      console.log("error");

      thumb.textContent = "[Error]";
      return;
    }

    const tipo = res.headers.get("content-type");
    if (tipo === "application/pdf") {
      const blob = await res.blob();
      const canvas = document.createElement("canvas");
      canvas.classList.add("thumbnail");
      canvas.title = "Click para ver";
      canvas.addEventListener("click", () => {
        verDocumento(doc.id);
      });
      await generarThumbnailPdf(blob, canvas);
      thumb.replaceWith(canvas);
    } else {
      thumb.textContent = tipo.includes("xml")
        ? "[XML]"
        : tipo.includes("json")
        ? "[JSON]"
        : "[Archivo]";
    }
  } catch (error) {
    console.log(error);

    thumb.textContent = "[Error]";
  }
}
