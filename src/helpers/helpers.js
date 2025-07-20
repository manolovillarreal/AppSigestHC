// src/helpers/helpers.js

import { ordenEstados, obtenerNombreEstado } from './estados.js';

export async function generarThumbnailPdf(blob, canvasElement) {
  const loadingTask = pdfjsLib.getDocument({ data: await blob.arrayBuffer() });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);

  const viewport = page.getViewport({ scale: 0.3 });
  const context = canvasElement.getContext('2d');

  canvasElement.width = viewport.width;
  canvasElement.height = viewport.height;

  await page.render({ canvasContext: context, viewport }).promise;
}

export function formatearFecha(fechaIso) {
  return new Date(fechaIso).toLocaleDateString('es-CO');
}

export function formatearFechaHora(fechaIso) {
  return new Date(fechaIso).toLocaleString('es-CO');
}

export function calcularEdad(fechaNacimiento) {
  const nacimiento = new Date(fechaNacimiento);
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
}

export function formatearErroresHTML(errores) {
  if (!errores || typeof errores !== 'object') return '';
  return Object.entries(errores)
    .map(([campo, mensajes]) => `<strong></strong> ${mensajes}`)
    .join('<br>');
}

export function ordenarPorEstado(atenciones) {
  const grupos = {};

  atenciones.forEach(a => {
    const estadoId = a.estadoAtencion.id || a.estadoAtencion;
    if (!grupos[estadoId]) grupos[estadoId] = [];
    grupos[estadoId].push(a);
  });

  return ordenEstados
    .filter(id => grupos[id])
    .map(id => ({
      estadoId: id,
      estado: obtenerNombreEstado(id),
      lista: grupos[id]
    }));
}
