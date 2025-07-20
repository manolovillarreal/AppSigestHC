import {DEBUG_MODE} from '../config/config.js';

if (DEBUG_MODE) {
  console.log('Modo depuración activado');
}
  function log(message,obj) {
    if (DEBUG_MODE) {
        console.log(`[DEBUG] ${message}`, obj || '');
    }   
}
 function logError(message,obj) {
    if (DEBUG_MODE) {
        console.error(`[DEBUG ERROR] ${message}`, obj || '');
    }
}   
 function logWarn(message,obj) {
    if (DEBUG_MODE) {
        console.warn(`[DEBUG WARN] ${message}`, obj || '');
    }
}   
 function logInfo(message,obj) {
    if (DEBUG_MODE) {
        console.info(`[DEBUG INFO] ${message}`, obj || '');
    }
}
const debug = {
    log,
    logError,
    logWarn,
    logInfo
};

export default debug;


