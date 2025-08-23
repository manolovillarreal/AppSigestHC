// documentos/listaDocumentos.js
import { apiGet } from "../api/api.js";
import { BaseComponent } from "../base/BaseComponent.js";
import {GrupoDocumentosPorRol} from "./grupoDocumentosPorRol.js"
import { ItemDocumento } from "./itemDocumento.js";

export class ListaDocumentos extends BaseComponent {
  constructor(atencion,agruparDocumento = true) {
    super();
    this.atencion = atencion;
    this.documentos = [];
    this.agruparDocumento = agruparDocumento;
  }

  async load() {

    const { result: documentos } = await apiGet(`/Documentos/por-atencion/${this.atencion.id}`);
    this.documentos = documentos.map(doc => {
      doc.atencion = this.atencion;
      return doc;
    });
  }


  render() {
    this.element = document.createElement("div");
    if (!this.element) {
      console.error(`Container with id ${this.containerId} not found`);
      return;
    }
    
    if (this.agruparDocumento) {
      const documentosPorRol = agruparDocumentosPorRol(this.documentos);
      Object.entries(documentosPorRol).forEach(([rolNombre, docs]) => {
        const grupo = new GrupoDocumentosPorRol(rolNombre, docs);
        grupo.appendTo(this.element);
      });
    } else {
      this.documentos.forEach(doc => {
        console.log("1");        
        const item = new ItemDocumento(doc,true);
        item.appendTo(this.element);
      });
    }

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