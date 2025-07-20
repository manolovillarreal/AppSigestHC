// src/helpers/validaciones.js

export function esTextoVacio(texto) {
  return !texto || texto.trim() === '';
}

export function esFechaValida(fechaStr) {
  if (!fechaStr) return false;
  const fecha = new Date(fechaStr);
  return fecha instanceof Date && !isNaN(fecha);
}

export function validarArchivo(archivo, tipoEsperado) {
  if (!archivo) return 'Debe seleccionar un archivo.';
  const extension = archivo.name.split('.').pop().toLowerCase();
  if (extension !== tipoEsperado.toLowerCase()) {
    return `El archivo debe tener extensión .${tipoEsperado}`;
  }
  return null;
}

export function validarNumeroRelacion(numero) {
  return !esTextoVacio(numero);
}

export function validarDocumentoForm({ tipo, numeroRelacion, fecha, archivo }) {
  if (!tipo) {
    return 'Debe seleccionar un tipo de documento.';
  }

  if (tipo.requiereNumeroRelacion && esTextoVacio(numeroRelacion)) {
    return 'Debe ingresar el número de relación.';
  }

  if (tipo.esAsistencial && !esFechaValida(fecha)) {
    return 'Debe ingresar una fecha válida.';
  }

  const errorArchivo = validarArchivo(archivo, tipo.extensionPermitida || 'pdf');
  if (errorArchivo) return errorArchivo;

  return null; // Sin errores
}
