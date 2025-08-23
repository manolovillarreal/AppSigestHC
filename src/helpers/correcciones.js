import contexto from "../contexto/contexto.js";

export function puedeSolicitarCorrecion(documento){
    const estadosAtencionPermitidos = [5,4];
    const rolesConPermiso = ["Admisiones", "Auditor"];
    const {perfil} = contexto;
    const {atencion,usuario: usuarioDoc} = documento;

    const puedeSolicitar = estadosAtencionPermitidos.includes(atencion.estadoAtencionId) 
                          && rolesConPermiso.includes(perfil.rol.nombre)
                          && !documento.puedeCargar; 
    return puedeSolicitar;
  }