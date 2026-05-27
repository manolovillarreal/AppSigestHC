// src/config.js

// ✅ URL base de la API
const RAW_API_URL = window.__APP_CONFIG__?.API_URL || 'https://localhost:5000';
export const API_URL = RAW_API_URL.endsWith('/api') ? RAW_API_URL : `${RAW_API_URL}/api`;

// ✅ Flag de debug
export const DEBUG_MODE = true;

// ✅ Claves usadas en localStorage
export const LOCAL_STORAGE_KEYS = {
  TOKEN: 'token'
};



// ✅ Mapeo de extensiones MIME comunes para descargas
export const EXTENSIONES_POR_MIME = {
  'application/pdf': '.pdf',
  'application/xml': '.xml',
  'application/json': '.json',
  'text/plain': '.txt'
};

// ✅ Otros ajustes de UI, si los necesitas más adelante
export const UI_CONFIG = {
  THUMBNAIL_SCALE: 0.3, // escala para canvas de PDFs
  FECHA_LOCALE: 'es-CO'
};

export const PERFILES = {
  ADMISIONES: 'Admisiones',
  MEDICO: 'Medico',
  ENFERMERIA: 'Enfermeria',
  AUDITORIA: 'Auditoria',
  FACTURACION: 'Facturacion',
  ADMINISTRADOR: 'Admin'
};