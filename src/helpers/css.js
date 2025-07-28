const estilos = [
    "/css/estilos.css",
    'css/modal.css',
]

const tipoDocumentoCss = [
  'css/tipoDocumento/AgregarPermisosTipoDocumento.css',
  'css/tipoDocumento/EstadoRequeridoForm.css',
  'css/tipoDocumento/PermisoPorRolForm.css',
  'css/tipoDocumento/TipoDocumentoForm.css'
]

const modulos = {
  admin: [
    ...tipoDocumentoCss    
  ],
  main: [
   
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
