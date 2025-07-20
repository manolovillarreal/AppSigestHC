// documentos/tipos.js
import { apiGet } from "../api.js";


export async function cargarTiposDocumentoAutorizados() {
  const result = await apiGet("/TipoDocumento/Autorizados");
  if (!result.ok) {
    Swal.fire({
      icon: "error",
      title: "Error al cargar tipos de documento",
      text:
        result.errorMessages || "No se pudieron cargar los tipos de documento.",
    });
    console.error("Error al cargar tipos de documento:", result.errorMessages);
    return;
  }
  return result.result || [];
}