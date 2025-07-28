import {DEBUG_MODE} from '../config/config.js';

if (DEBUG_MODE) {
  console.log('Modo depuración activado');
}
  function log(...args) {
    if (DEBUG_MODE) {
         const caller = getCallerLineInfo();
    console.log("%c[DEBUG]", "color: #1e90ff", ...args, `\n→ ${caller}`);
    }   
}
 function logError(...args) {
    if (DEBUG_MODE) {
        const caller = getCallerLineInfo();
         console.error("%c[ERROR]", "color: red", ...args, `\n→ ${caller}`);
    }
}   
 function logWarn(message,obj) {
    if (DEBUG_MODE) {
         const caller = getCallerLineInfo();
        console.warn("%c[WARN]", "color: orange", ...args, `\n→ ${caller}`);
    }
}   
 function logInfo(message,obj) {
    if (DEBUG_MODE) {
         const caller = getCallerLineInfo();
         console.info("%c[INFO]", "color: orange", ...args, `\n→ ${caller}`);
    }
}

function getCallerLineInfo() {
  const err = new Error();
  const stackLines = err.stack?.split("\n");

  // Tomamos la línea 3 del stack (el caller)
  const rawLine = stackLines?.[3] || "";

  // Elimina el host dejando solo el path desde la raíz del proyecto
  return rawLine.replace(/^.*\/\/[^/]+/, "").trim();
}

const debug = {
    log,
    logError,
    logWarn,
    logInfo
};

export default debug;


