const estilos = [
    "/css/estilos.css",
    'css/modal.css',
    "css/FiltroLista.css",
    "css/components/SelectConBuscador.css",
    "css/components/paginacion.css"
]

const atencionesCss = [
  'css/atencion/BuscadorAtenciones.css',
  'css/atencion/ListaAtenciones.css'
];

const tipoDocumentoCss = [
  'css/tipoDocumento/AgregarPermisosTipoDocumento.css',
  'css/tipoDocumento/EstadoRequeridoForm.css',
  'css/tipoDocumento/TipoDocumentoPermisoItem.css',
  'css/tipoDocumento/TipoDocumentoForm.css'
]

const UsuarioCss = [
  'css/usuario/ListaUsuario.css',
  'css/usuario/UsuarioForm.css',
]

const RolesCss = [
  'css/roles/roles.css',
];

const EstadoAtencionCss = [
  'css/EstadoAtencion/EstadoAtencion.css',
];

const ConfiguracionCss = [
  'css/admin/configuracion.css',
];

const modulos = {
  admin: [
    ...tipoDocumentoCss,
    ...UsuarioCss ,
    ...RolesCss,
    ...EstadoAtencionCss,
    ...ConfiguracionCss
  ],
  main: [
    ...atencionesCss,
    'css/SolicitudCorrecion/SolicitudCorrecion.css'
  ]
};

/**
 * Carga dinámicamente las hojas de estilo asociadas a una clave.
 * @param {string} grupo - Clave del grupo de estilos (ej: "admin", "main").
 */
export function cargarCSS(grupo) {
  const rutas = [...estilos ,...modulos[grupo]];
  
  if (!rutas) {
    console.warn(`No se encontró el grupo de estilos: "${grupo}"`);
    return;
  }

  rutas.forEach(href => {
    if (!href || typeof href !== "string") return;

    if (document.querySelector(`link[href="${href}"]`)) {
      // Ya está cargado
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  });
}
