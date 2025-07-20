// documentos/listaDocumentos.js
import { apiGet } from "../api/api.js";
import {GrupoDocumentosPorRol} from "./grupoDocumentosPorRol.js"

export class ListaDocumentos {
  constructor(containerId) {
    this.containerId = containerId;
    this.documentos = [];
  }

  async CargaDocumentos(atencion) {

    const { result: documentos } = await apiGet(`/Documentos/por-atencion/${atencion.id}`);
    this.documentos = documentos || [];
    this.render();
  }


  render() {
    const container = document.getElementById(this.containerId);
    container.innerHTML="";
    if (!container) {
      console.error(`Container with id ${this.containerId} not found`);
      return;
    }

    const thumbnailRefs = new Map();
    const documentosPorRol = agruparDocumentosPorRol(this.documentos);  
    
    console.log(documentosPorRol);
    
    Object.entries(documentosPorRol).forEach(([rolNombre,docs]) => {
      const grupo = new GrupoDocumentosPorRol(rolNombre, docs);
      grupo.render(thumbnailRefs, container);
    });

  }
}

function agruparDocumentosPorRol(documentos) {
  const documentosPorRol = {};

  documentos.forEach(doc => {
    const rol = doc.usuario?.rolNombre || 'Sin Categoria';
    if (!documentosPorRol[rol]) {
      documentosPorRol[rol] = [];
    }
    documentosPorRol[rol].push(doc);
  });

  return documentosPorRol;
}