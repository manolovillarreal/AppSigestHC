import { apiDownloadBlob, apiGet,apiPut,apiPost, apiUpload } from "../api/api.js";


function EnviarDocumentoFirmado(documentId, data) {
    return apiUpload(`/Documentos/firmar/${documentId}`, data);
}

export const DocumentoService = {
    EnviarDocumentoFirmado
};  