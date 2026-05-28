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

export function calcularEdadTexto(fechaNacimiento) {
  const nacimiento = new Date(fechaNacimiento);
  const hoy = new Date();

  const diffTiempo = hoy.getTime() - nacimiento.getTime();
  const diffDias = Math.floor(diffTiempo / (1000 * 60 * 60 * 24));

  if (diffDias < 30) {
    return `${diffDias} dia${diffDias === 1 ? '' : 's'}`;
  }

  const diffMeses =
    hoy.getFullYear() * 12 + hoy.getMonth() -
    (nacimiento.getFullYear() * 12 + nacimiento.getMonth());

  if (diffMeses < 12) {
    return `${diffMeses} mes${diffMeses === 1 ? '' : 'es'}`;
  }

  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();

  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }

  return `${edad} ano${edad === 1 ? '' : 's'}`;
}
