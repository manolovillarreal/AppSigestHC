
export async function downloadBlobFile(response,doc) {

    try{
        const blob = await response.blob();

        
    const contentType = response.headers.get("Content-Type");
    const disposition = response.headers.get("Content-Disposition");

    for (let [key, value] of response.headers.entries()) {
  console.log(`${key}: ${value}`);
}


    // 🔍 Extensiones comunes por tipo MIME
    const extensionPorTipo = {
      "application/pdf": ".pdf",
      "application/xml": ".xml",
      "application/json": ".json",
      "text/plain": ".txt",
    };

    // Detectar nombre desde cabecera
    let filename = null;
    
    if (disposition && disposition.includes("filename=")) {
      const match = disposition.match(/filename="?(.+?)"?$/);
      if (match) filename = decodeURIComponent(match[1]);
    }

    // Si no hay nombre, generamos uno
    if (!filename) {
      const ext = extensionPorTipo[contentType] || "";
      filename = `documento-${doc.Id}${ext}`;
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
    }
    catch(err){
        console.log(err);
        
    }
    
    
}