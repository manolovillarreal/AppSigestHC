// src/config.js

// ✅ URL base de la API
export const API_URL = 'https://localhost:7138/api'; // Cambiar en producción

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
