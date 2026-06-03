import { apiDelete } from "../../../core/api.js";
import { formatearErroresHTML } from "../../../utils/error.js";

export async function eliminarDocumento(docId, onSuccess = null) {
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
    return;
  }

  const mensaje = res?.mensaje || "No se pudo eliminar el documento.";
  const errores = formatearErroresHTML(res.errorMessages);

  if (res.status === 400) {
    await Swal.fire({
      icon: "error",
      title: "Error",
      html: `<p>${mensaje}</p>${errores}`,
    });
    return;
  }

  await Swal.fire({
    icon: "error",
    title: "Error",
    html: `<p>${mensaje}</p>${errores}`,
  });
}
