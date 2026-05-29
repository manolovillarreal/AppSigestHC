import { apiPost } from "../api/api.js";
import atencionesService from "../services/AtencionServices.js";
import { formatearErroresHTML } from "../utils/error.js";

export async function preguntarSiAvanzarEstado(onConfirm) {
  const { isConfirmed, value: observacion } = await Swal.fire({
    icon: "question",
    title: "¿Avanzar estado de esta atención?",
    html: `
      <p>Esta acción cambiará el estado de la atención según el flujo definido para tu rol.</p>
      <textarea id="obs-cambio-estado" class="swal2-textarea" placeholder="Observación (opcional)" name="observacion"></textarea>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Sí, continuar",
    cancelButtonText: "Cancelar",
    preConfirm: () => document.getElementById("obs-cambio-estado").value.trim(),
  });

  if (!isConfirmed) return null;
  return onConfirm?.(observacion);
}

export async function avanzarEstado(atencion, observacion) {
  const payload = {
    observacion: observacion || null,
    Atencionid: atencion.id,
  };

  try {
    const res = await apiPost(`/Atenciones/cambiar-estado`, payload);
    if (res.ok) {
      const atencionActualizada = res.result || {};
      atencion.estadoAtencion = atencionActualizada.estadoAtencion;
      atencion.estadoAtencionId = atencionActualizada.estadoAtencionId;
      await Swal.fire({
        icon: "success",
        title: "Atención actualizada",
        text: `Nuevo estado: ${atencionActualizada.estadoAtencion?.nombre || "actualizado"}`,
      });
      return { ok: true };
    }

    const errores = formatearErroresHTML(res.errorMessages);
    await Swal.fire({
      icon: "error",
      title: res.message || "Error al avanzar estado",
      html: errores,
    });
    return { ok: false };
  } catch (err) {
    console.error(err);
    await Swal.fire({
      icon: "error",
      title: "Error inesperado",
      text: "No se pudo avanzar el estado.",
    });
    return { ok: false };
  }
}

export async function cerrarAtencion(atencion) {
  const { isConfirmed, value: observacion } = await Swal.fire({
    icon: "question",
    title: "Cerrar atención",
    html: `
      <p>¿Estás seguro de que deseas cerrar esta atención?</p>
      <textarea id="obs-cierre-atencion" class="swal2-textarea" placeholder="Observación (opcional)"></textarea>
    `,
    showCancelButton: true,
    confirmButtonText: "Sí, cerrar",
    cancelButtonText: "Cancelar",
    preConfirm: () => document.getElementById("obs-cierre-atencion").value.trim(),
  });

  if (!isConfirmed) return { ok: false };

  try {
    const payload = {
      observacion: observacion || null,
      Atencionid: atencion.id,
    };

    const res = await apiPost(`/Atenciones/cerrar`, payload);
    if (res.ok) {
      const atencionActualizada = res.result || {};
      atencion.estadoAtencion = atencionActualizada.estadoAtencion;
      atencion.estadoAtencionId = atencionActualizada.estadoAtencionId;
      await Swal.fire({
        icon: "success",
        title: "Atención cerrada",
        text: "La atención ha sido cerrada correctamente.",
      });
      return { ok: true };
    }

    const errores = formatearErroresHTML(res.errorMessages);
    await Swal.fire({
      icon: "error",
      title: res.message || "Error al cerrar atención",
      html: errores,
    });
    return { ok: false };
  } catch (err) {
    console.error(err);
    await Swal.fire({
      icon: "error",
      title: "Error inesperado",
      text: "No se pudo cerrar la atención.",
    });
    return { ok: false };
  }
}

export async function anularAtencion(atencion) {
  const motivos = [
    { value: "1", label: "Paciente abandono el servicio" },
    { value: "2", label: "Paciente redireccionado" },
    { value: "3", label: "Paciente suspendido en la eps" },
    { value: "4", label: "Error ingreso doble" },
    { value: "5", label: "Otro motivo" },
  ];

  const html = `
    <label for="motivo-anulacion">Motivo de anulación</label>
    <select id="motivo-anulacion" class="swal2-select" style="width:80%;margin-bottom:10px;">
      ${motivos.map((m) => `<option value="${m.value}">${m.label}</option>`).join("")}
    </select>
    <label for="obs-anulacion">Observación</label>
    <textarea id="obs-anulacion" class="swal2-textarea" placeholder="Observación adicional" style="width:80%;"></textarea>
  `;

  const result = await Swal.fire({
    icon: "warning",
    title: "Anular atención",
    html,
    showCancelButton: true,
    confirmButtonText: "Sí, anular",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#d33",
    focusConfirm: false,
    preConfirm: () => {
      const motivo = document.getElementById("motivo-anulacion").value;
      const observacion = document.getElementById("obs-anulacion").value.trim();
      if (!motivo) {
        Swal.showValidationMessage("Debes seleccionar un motivo");
        return false;
      }
      if (motivo === "5" && !observacion) {
        Swal.showValidationMessage("La observación es obligatoria para el motivo 'Otro motivo'.");
        return false;
      }
      return { motivo, observacion };
    },
  });

  if (!result.isConfirmed || !result.value) return { ok: false };

  const payload = {
    motivoAnulacionAtencionId: result.value.motivo,
    observacion: result.value.observacion,
  };

  const res = await atencionesService.anularAtencion(atencion.id, payload);
  if (res.ok) {
    await Swal.fire({
      icon: "success",
      title: "Atención eliminada",
      timer: 1500,
      showConfirmButton: false,
    });
    return { ok: true };
  }

  const mensaje = res?.mensaje || "No se pudo anular la atención.";
  const errores = formatearErroresHTML(res.errores);
  await Swal.fire({
    icon: "error",
    title: "Error",
    html: `<p>${mensaje}</p>${errores}`,
  });
  return { ok: false };
}
