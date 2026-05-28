export function formatearErroresHTML(errores) {
  if (!errores || typeof errores !== 'object') return '';

  return Object.entries(errores)
    .map(([, mensajes]) => `<strong></strong> ${mensajes}`)
    .join('<br>');
}
