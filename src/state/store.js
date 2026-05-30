const _state = {
  perfil: null,
  token: null,
  tiposDocumentosPermitidos: [],
  estadosAtencion: [],
  estadosAtencionPermitidos: []
};

function getPerfil() { return _state.perfil; }
function setPerfil(p) { _state.perfil = p; }

function getToken() { return _state.token ?? localStorage.getItem('token'); }
function setToken(t) {
  _state.token = t;
  if (t == null) localStorage.removeItem('token');
  else localStorage.setItem('token', t);
}

function getTiposDocumento() { return _state.tiposDocumentosPermitidos; }
function setTiposDocumento(t) { _state.tiposDocumentosPermitidos = t; }

function getEstadosAtencion() { return _state.estadosAtencion; }
function setEstadosAtencion(e) { _state.estadosAtencion = e; }

function getEstadosAtencionPermitidos() { return _state.estadosAtencionPermitidos; }
function setEstadosAtencionPermitidos(e) { _state.estadosAtencionPermitidos = e; }

export {
  getPerfil,
  setPerfil,
  getToken,
  setToken,
  getTiposDocumento,
  setTiposDocumento,
  getEstadosAtencion,
  setEstadosAtencion,
  getEstadosAtencionPermitidos,
  setEstadosAtencionPermitidos
};

export const contexto = {
  get perfil() { return getPerfil(); },
  set perfil(p) { setPerfil(p); },
  get token() { return getToken(); },
  set token(t) { setToken(t); },
  get tiposDocumentosPermitidos() { return getTiposDocumento(); },
  set tiposDocumentosPermitidos(t) { setTiposDocumento(t); },
  get estadosAtencion() { return getEstadosAtencion(); },
  set estadosAtencion(e) { setEstadosAtencion(e); },
  get estadosAtencionPermitidos() { return getEstadosAtencionPermitidos(); },
  set estadosAtencionPermitidos(e) { setEstadosAtencionPermitidos(e); }
};

export default contexto;
