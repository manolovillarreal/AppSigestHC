const estilos = [
    "/css/estilos.css",
    'css/modal.css',
    "css/FiltroLista.css",
    "src/components/SelectConBuscador.css",
    "src/components/paginacion.css"
]

const atencionesCss = [
  'src/views/atenciones/BuscadorAtenciones.css',
  'src/views/atenciones/ListaAtenciones.css'
];

const tipoDocumentoCss = [
  'src/views/admin/tipoDocumento/AgregarPermisosTipoDocumento.css',
  'src/views/admin/tipoDocumento/EstadoRequeridoForm.css',
  'src/views/admin/tipoDocumento/TipoDocumentoPermisoItem.css',
  'src/views/admin/tipoDocumento/TipoDocumentoForm.css'
]

const UsuarioCss = [
  'src/views/admin/usuario/ListaUsuario.css',
  'src/views/admin/usuario/UsuarioForm.css',
]

const RolesCss = [
  'src/views/admin/roles/roles.css',
];

const EstadoAtencionCss = [
  'src/views/admin/estadoAtencion/EstadoAtencion.css',
];

const ConfiguracionCss = [
  'src/views/admin/configuracion/configuracion.css',
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
    'src/views/correcciones/SolicitudCorreccion.css'
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
