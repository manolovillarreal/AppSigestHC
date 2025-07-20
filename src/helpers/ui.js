// src/ui.js
import { UI_CONFIG } from './config.js';

/**
 * Limpia el contenido de un contenedor (elemento DOM).
 */
export function limpiarElemento(elemento) {
  if (elemento) elemento.innerHTML = '';
}

/**
 * Crea y retorna un spinner cargando.
 */
export function crearSpinner(tamaño = 'md') {
  const spinner = document.createElement('div');
  spinner.className = `spinner spinner-${tamaño}`;
  return spinner;
}

/**
 * Oculta un elemento del DOM por su id.
 */
export function ocultar(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

/**
 * Muestra un elemento del DOM por su id.
 */
export function mostrar(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

/**
 * Formatea una fecha ISO como fecha local legible.
 */
export function fechaLegible(fechaIso) {
  return new Date(fechaIso).toLocaleDateString(UI_CONFIG.FECHA_LOCALE);
}

/**
 * Formatea una fecha ISO como fecha y hora local.
 */
export function fechaHoraLegible(fechaIso) {
  return new Date(fechaIso).toLocaleString(UI_CONFIG.FECHA_LOCALE);
}

/**
 * Crea una alerta visual en el DOM (por ejemplo, una tarjeta de error o éxito).
 */
export function crearAlerta(tipo = 'info', mensaje = '') {
  const div = document.createElement('div');
  div.className = `alert alert-${tipo}`; // tipo: success, danger, warning, info
  div.textContent = mensaje;
  return div;
}

/**
 * Desactiva un botón y muestra un spinner durante un proceso async.
 */
export async function conCargando(boton, fnAsync) {
  const originalHTML = boton.innerHTML;
  boton.disabled = true;
  boton.innerHTML = `<span class="spinner mini"></span> Procesando...`;

  try {
    await fnAsync();
  } finally {
    boton.disabled = false;
    boton.innerHTML = originalHTML;
  }
}

/**
 * Desplaza suavemente al elemento con el ID dado.
 */
export function scrollAElemento(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
