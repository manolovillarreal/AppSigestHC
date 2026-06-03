import contexto from "../contexto/contexto.js";

export const EstadoCorreccion = {
  PENDIENTE: 1,
  RESPONDIDA: 2,
  ACEPTADA: 3,
  RECHAZADA: 4
};

export function puedeSolicitarCorrecion(documento){
    const estadosAtencionPermitidos = [5,4];
    const rolesConPermiso = ["Admisiones", "Auditoria"];
    const {perfil} = contexto;
    const {atencion,usuario: usuarioDoc} = documento;

    const puedeSolicitar = estadosAtencionPermitidos.includes(atencion.estadoAtencionId) 
                          && rolesConPermiso.includes(perfil.rol.nombre);
                          
    return puedeSolicitar;
  }