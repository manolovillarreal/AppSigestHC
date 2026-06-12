import { DocumentoService } from "../../../api/documento.api.js";
import { formatearErroresHTML } from "../../../utils/error.js";

export async function editarDocumento(doc, onSuccess = null) {
  const { result, payload } = await formularioEditar(doc);

  if (!result.isConfirmed) return;

  const response = await DocumentoService.editar(payload);

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
    return;
  }

  const errores = formatearErroresHTML(response.full?.errores);
  await Swal.fire({
    icon: "error",
    title: response.full?.mensaje || "Error al editar",
    html: errores,
  });
}

async function formularioEditar(doc) {
  const { requiereNumeroRelacion, esAsistencial } = doc.tipoDocumento;
  let html = "";

  if (requiereNumeroRelacion) {
    html += `
      <label for="edit-relacion">N° Relación</label>
      <input id="edit-relacion" class="swal2-input" value="${doc.numeroRelacion || ""}">
    `;
  }

  if (esAsistencial) {
    const fecha = doc.fecha?.substring(0, 10) || new Date().toISOString().substring(0, 10);
    html += `
      <label for="edit-fecha">Fecha del Documento</label>
      <input id="edit-fecha" type="date" class="swal2-input" value="${fecha}">
    `;
  }

  html += `
    <label for="edit-observacion">Observación</label>
    <textarea id="edit-observacion" class="swal2-textarea" placeholder="Observación (mínimo 10 caracteres)" style="width:100%;"></textarea>
  `;

  const payload = {};

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
      const obsInput = document.getElementById("edit-observacion");

      if (requiereNumeroRelacion) {
        payload.numeroRelacion = relInput?.value.trim() || null;
      }

      if (esAsistencial) {
        payload.fecha = fechaInput?.value || null;
      }

      const observacion = obsInput?.value.trim() || "";
      if (!observacion || observacion.length < 10) {
        Swal.showValidationMessage("La observación es obligatoria y debe tener al menos 10 caracteres.");
        return false;
      }

      payload.observacion = observacion;
      payload.id = doc.id;
      return true;
    },
  });

  return { result, payload };
}
