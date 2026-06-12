const { PDFDocument } = PDFLib;
let pdfDoc = null, currentPage = null, viewport = null, originalPdfBytes = null;
let signaturePad = null, photoImage = null;
let firmaSize = 150;
let firmas = []; // array de todas las firmas confirmadas
let firmaActual = null; // firma en edición antes de confirmar
let modoEdicion = false; // modo de posicionamiento/edición
let firmaEnEdicion = null; // referencia a la firma siendo editada
let firmaIdCounter = 0; // contador para IDs únicos
let pdfPages = []; // array de todas las páginas del PDF
let currentPageNum = 1; // página actual siendo visualizada
let totalPages = 0; // total de páginas del PDF

const pdfCanvas = document.getElementById("pdf-canvas");
const ctx = pdfCanvas.getContext("2d");
const signatureModal = document.getElementById("signature-modal");
const positioningControls = document.getElementById("positioning-controls");
const firmasList = document.getElementById("firmas-list");
const pagesList = document.getElementById("pages-list");
const uploadArea = document.getElementById("upload-area");
const mainContainer = document.getElementById("main-container");

// Función para cargar PDF
async function loadPDF(file) {
  if (!file || file.type !== 'application/pdf') {
    alert('Por favor selecciona un archivo PDF válido');
    return;
  }
  
  originalPdfBytes = await file.arrayBuffer();
  pdfDoc = await PDFDocument.load(originalPdfBytes);

  const pdfjsLib = window['pdfjs-dist/build/pdf'];
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.14.305/pdf.worker.min.js';

  const pdf = await pdfjsLib.getDocument({ data: originalPdfBytes }).promise;
  totalPages = pdf.numPages;
  
  // Cargar todas las páginas
  pdfPages = [];
  for (let i = 1; i <= totalPages; i++) {
    pdfPages.push(await pdf.getPage(i));
  }
  
  currentPageNum = 1;
  currentPage = pdfPages[0];
  viewport = currentPage.getViewport({ scale: 1.2 });
  pdfCanvas.width = viewport.width;
  pdfCanvas.height = viewport.height;
  
  // Ocultar área de carga y mostrar interfaz principal
  uploadArea.style.display = "none";
  mainContainer.classList.add("active");
  
  renderPage();
  renderPageThumbnails();
  updatePageControls();
}

// Cargar PDF desde input file
document.getElementById('pdf-upload').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    await loadPDF(file);
  }
});

// Botón para reiniciar y cargar otro documento
document.getElementById('reset-document-btn').addEventListener('click', () => {
  if (firmas.length > 0) {
    if (!confirm('¿Estás seguro? Se perderán todas las firmas sin guardar del documento actual.')) {
      return;
    }
  }
  
  // Resetear todas las variables
  pdfDoc = null;
  currentPage = null;
  viewport = null;
  originalPdfBytes = null;
  firmas = [];
  firmaActual = null;
  modoEdicion = false;
  firmaEnEdicion = null;
  pdfPages = [];
  currentPageNum = 1;
  totalPages = 0;
  
  // Limpiar canvas
  ctx.clearRect(0, 0, pdfCanvas.width, pdfCanvas.height);
  
  // Ocultar interfaz principal y mostrar área de carga
  mainContainer.classList.remove("active");
  uploadArea.style.display = "block";
  
  // Resetear input file
  document.getElementById('pdf-upload').value = '';
});

// Drag and drop functionality
uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
  uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', (e) => {
  e.preventDefault();
  e.stopPropagation();
  uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', async (e) => {
  e.preventDefault();
  e.stopPropagation();
  uploadArea.classList.remove('drag-over');
  
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    await loadPDF(files[0]);
  }
});

// Renderizar página con TODAS las firmas confirmadas
function renderPage() {
  if (!currentPage) return;
  currentPage.render({ canvasContext: ctx, viewport }).promise.then(() => {
    // Solo dibujar firmas de la página actual
    firmas.forEach(firma => {
      if (!firma.deleted && firma.pageNum === currentPageNum) {
        dibujarFirma(firma);
      }
    });
    if (firmaActual) dibujarFirma(firmaActual, true); // firma en edición
  });
}

// Renderizar miniaturas de páginas
function renderPageThumbnails() {
  pagesList.innerHTML = "";
  
  pdfPages.forEach((page, index) => {
    const pageNum = index + 1;
    const thumbDiv = document.createElement("div");
    thumbDiv.className = "page-thumbnail";
    if (pageNum === currentPageNum) thumbDiv.classList.add("active");
    
    const thumbCanvas = document.createElement("canvas");
    const thumbViewport = page.getViewport({ scale: 0.2 });
    thumbCanvas.width = thumbViewport.width;
    thumbCanvas.height = thumbViewport.height;
    
    const thumbCtx = thumbCanvas.getContext("2d");
    page.render({ canvasContext: thumbCtx, viewport: thumbViewport });
    
    thumbDiv.appendChild(thumbCanvas);
    
    // Botón de eliminar página (solo si hay más de una página)
    if (pdfPages.length > 1) {
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "page-thumbnail-delete";
      deleteBtn.innerHTML = "×";
      deleteBtn.title = "Eliminar página";
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deletePage(pageNum);
      });
      thumbDiv.appendChild(deleteBtn);
    }
    
    // Contador de firmas en esta página
    const firmasCount = firmas.filter(f => !f.deleted && f.pageNum === pageNum).length;
    
    const label = document.createElement("div");
    label.className = "page-thumbnail-label";
    label.innerHTML = `Página ${pageNum}${firmasCount > 0 ? `<span class="page-thumbnail-badge">${firmasCount}</span>` : ''}`;
    thumbDiv.appendChild(label);
    
    // Click para cambiar de página
    thumbDiv.addEventListener("click", () => {
      currentPageNum = pageNum;
      currentPage = pdfPages[index];
      viewport = currentPage.getViewport({ scale: 1.2 });
      pdfCanvas.width = viewport.width;
      pdfCanvas.height = viewport.height;
      renderPage();
      updatePageControls();
      updateThumbnailsActive();
    });
    
    pagesList.appendChild(thumbDiv);
  });
}

// Actualizar qué miniatura está activa
function updateThumbnailsActive() {
  document.querySelectorAll(".page-thumbnail").forEach((thumb, index) => {
    if (index + 1 === currentPageNum) {
      thumb.classList.add("active");
    } else {
      thumb.classList.remove("active");
    }
  });
}

// Actualizar controles de navegación
function updatePageControls() {
  const prevBtn = document.getElementById("prev-page");
  const nextBtn = document.getElementById("next-page");
  const pageInfo = document.getElementById("page-info");
  
  if (totalPages > 1) {
    prevBtn.style.display = currentPageNum > 1 ? "inline-block" : "none";
    nextBtn.style.display = currentPageNum < totalPages ? "inline-block" : "none";
    pageInfo.style.display = "inline";
    pageInfo.textContent = `Página ${currentPageNum} de ${totalPages}`;
  } else {
    prevBtn.style.display = "none";
    nextBtn.style.display = "none";
    pageInfo.style.display = "none";
  }
}

// Navegación entre páginas
document.getElementById("prev-page").addEventListener("click", () => {
  if (currentPageNum > 1) {
    currentPageNum--;
    currentPage = pdfPages[currentPageNum - 1];
    viewport = currentPage.getViewport({ scale: 1.2 });
    pdfCanvas.width = viewport.width;
    pdfCanvas.height = viewport.height;
    renderPage();
    updatePageControls();
    updateThumbnailsActive();
  }
});

document.getElementById("next-page").addEventListener("click", () => {
  if (currentPageNum < totalPages) {
    currentPageNum++;
    currentPage = pdfPages[currentPageNum - 1];
    viewport = currentPage.getViewport({ scale: 1.2 });
    pdfCanvas.width = viewport.width;
    pdfCanvas.height = viewport.height;
    renderPage();
    updatePageControls();
    updateThumbnailsActive();
  }
});

// Dibujar firma en el canvas
function dibujarFirma(firma, isPreview = false) {
  const img = new Image();
  img.src = firma.img;
  img.onload = () => {
    const aspectRatio = img.width / img.height;
    const width = firma.size;
    const height = firma.size / aspectRatio;
    
    ctx.drawImage(
      img,
      firma.pos.x,
      firma.pos.y,
      width,
      height
    );

    // Borde rojo si está en preview/edición
    if (isPreview) {
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.strokeRect(firma.pos.x, firma.pos.y, width, height);
    }

    // Código de foto (oculto pero funcional)
    if (firma.photo) {
      const photo = new Image();
      photo.src = firma.photo;
      photo.onload = () => {
        ctx.drawImage(photo, firma.pos.x + firma.size + 5, firma.pos.y, 60, 60);
        if (isPreview) {
          ctx.strokeStyle = "red";
          ctx.strokeRect(firma.pos.x + firma.size + 5, firma.pos.y, 60, 60);
        }
      };
    }
  };
}

// ========== PASO 1: Abrir modal para crear firma ==========
document.getElementById("add-signature-btn").addEventListener("click", () => {
  if (!pdfDoc) {
    alert("Primero carga un PDF");
    return;
  }
  abrirModalFirma();
});

function abrirModalFirma(firmaExistente = null) {
  signatureModal.classList.add("active");
  
  const canvas = document.getElementById("signature-fullscreen");
  canvas.width = canvas.parentElement.offsetWidth;
  canvas.height = canvas.parentElement.offsetHeight;
  
  if (signaturePad) {
    signaturePad.clear();
  }
  signaturePad = new SignaturePad(canvas);
  
  // Si estamos editando una firma existente, cargarla
  if (firmaExistente) {
    const img = new Image();
    img.src = firmaExistente.img;
    img.onload = () => {
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
  }
}

// Limpiar firma en modal
document.getElementById("clear-signature").addEventListener("click", () => {
  signaturePad.clear();
});

// Cancelar modal de firma
document.getElementById("cancel-signature").addEventListener("click", () => {
  signatureModal.classList.remove("active");
  signaturePad.clear();
});

// Función para recortar la firma al área sugerida (con margen del doble)
function cropSignatureToGuide(canvas) {
  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Calcular el área sugerida (60% ancho, 40% alto, centrado)
  const guideWidth = canvas.width * 0.6;
  const guideHeight = canvas.height * 0.4;
  const guideLeft = (canvas.width - guideWidth) / 2;
  const guideTop = (canvas.height - guideHeight) / 2;
  
  // Área de captura: el doble del área sugerida
  const captureWidth = guideWidth * 2;
  const captureHeight = guideHeight * 2;
  const captureLeft = Math.max(0, guideLeft - guideWidth / 2);
  const captureTop = Math.max(0, guideTop - guideHeight / 2);
  const captureRight = Math.min(canvas.width, captureLeft + captureWidth);
  const captureBottom = Math.min(canvas.height, captureTop + captureHeight);
  
  // Encontrar los límites reales de la firma dentro del área de captura
  let minX = captureRight, minY = captureBottom, maxX = captureLeft, maxY = captureTop;
  let hasContent = false;
  
  for (let y = captureTop; y < captureBottom; y++) {
    for (let x = captureLeft; x < captureRight; x++) {
      const index = (y * canvas.width + x) * 4;
      const alpha = data[index + 3];
      if (alpha > 10) {
        hasContent = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  
  if (!hasContent) {
    return canvas.toDataURL("image/png");
  }
  
  // Agregar un pequeño padding
  const padding = 10;
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(canvas.width, maxX + padding);
  maxY = Math.min(canvas.height, maxY + padding);
  
  const cropWidth = maxX - minX;
  const cropHeight = maxY - minY;
  
  // Crear un nuevo canvas con el área recortada
  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = cropWidth;
  croppedCanvas.height = cropHeight;
  const croppedCtx = croppedCanvas.getContext('2d');
  croppedCtx.drawImage(canvas, minX, minY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
  
  return croppedCanvas.toDataURL("image/png");
}

// ========== PASO 2: Aceptar firma y pasar a modo posicionamiento ==========
document.getElementById("accept-signature").addEventListener("click", () => {
  if (signaturePad.isEmpty()) {
    alert("Primero dibuja una firma");
    return;
  }
  
  const canvas = document.getElementById("signature-fullscreen");
  const signatureImage = cropSignatureToGuide(canvas);
  signatureModal.classList.remove("active");
  
  // Si estamos editando una firma existente
  if (firmaEnEdicion) {
    firmaEnEdicion.img = signatureImage;
    firmaActual = firmaEnEdicion;
  } else {
    // Nueva firma - asignar a la página actual
    firmaActual = {
      id: ++firmaIdCounter,
      img: signatureImage,
      pos: { x: 100, y: 100 },
      size: firmaSize,
      photo: null,
      pageNum: currentPageNum
    };
  }
  
  modoEdicion = true;
  positioningControls.classList.add("active");
  pdfCanvas.style.cursor = "move";
  renderPage();
});

// ========== PASO 3: Posicionar firma en el PDF ==========
pdfCanvas.addEventListener("click", (e) => {
  if (!modoEdicion || !firmaActual) return;
  
  const rect = pdfCanvas.getBoundingClientRect();
  const scaleX = pdfCanvas.width / rect.width;
  const scaleY = pdfCanvas.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;

  firmaActual.pos = { x, y };
  renderPage();
});

// Cambiar tamaño de firma durante posicionamiento
document.getElementById("sizeRange").addEventListener("input", (e) => {
  if (!modoEdicion || !firmaActual) return;
  firmaSize = parseInt(e.target.value);
  firmaActual.size = firmaSize;
  renderPage();
});

// ========== PASO 4: Confirmar posición y agregar firma ==========
document.getElementById("confirm-position").addEventListener("click", () => {
  if (!firmaActual) return;
  
  // Si estamos editando, actualizar la firma existente
  if (firmaEnEdicion) {
    const index = firmas.findIndex(f => f.id === firmaEnEdicion.id);
    if (index !== -1) {
      firmas[index] = firmaActual;
    }
    firmaEnEdicion = null;
  } else {
    // Agregar nueva firma
    firmas.push(firmaActual);
  }
  
  finalizarEdicion();
  actualizarListaFirmas();
  renderPageThumbnails(); // Actualizar contadores en miniaturas
  renderPage();
});

// Cancelar posicionamiento
document.getElementById("cancel-position").addEventListener("click", () => {
  firmaEnEdicion = null;
  finalizarEdicion();
  renderPage();
});

function finalizarEdicion() {
  modoEdicion = false;
  firmaActual = null;
  positioningControls.classList.remove("active");
  pdfCanvas.style.cursor = "crosshair";
}

// ========== PASO 5: Panel lateral con lista de firmas ==========
function actualizarListaFirmas() {
  firmasList.innerHTML = "";
  
  firmas.filter(f => !f.deleted).forEach((firma, index) => {
    const item = document.createElement("div");
    item.className = "firma-item";
    item.innerHTML = `
      <img src="${firma.img}" alt="Firma ${index + 1}">
      <div><strong>Firma ${index + 1}</strong></div>
      <div class="firma-item-page">Página ${firma.pageNum}</div>
      <div class="firma-item-actions">
        <button class="btn btn-primary btn-edit" data-id="${firma.id}">Editar</button>
        <button class="btn btn-danger btn-delete" data-id="${firma.id}">Eliminar</button>
      </div>
    `;
    
    // Click en el item resalta la firma y va a su página
    item.addEventListener("click", (e) => {
      if (e.target.tagName === "BUTTON") return;
      
      // Cambiar a la página de la firma si no estamos ahí
      if (currentPageNum !== firma.pageNum) {
        currentPageNum = firma.pageNum;
        currentPage = pdfPages[currentPageNum - 1];
        viewport = currentPage.getViewport({ scale: 1.2 });
        pdfCanvas.width = viewport.width;
        pdfCanvas.height = viewport.height;
        updatePageControls();
        updateThumbnailsActive();
      }
      
      resaltarFirma(firma);
    });
    
    firmasList.appendChild(item);
  });
  
  // Eventos para botones de editar y eliminar
  document.querySelectorAll(".btn-edit").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id);
      editarFirma(id);
    });
  });
  
  document.querySelectorAll(".btn-delete").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id);
      eliminarFirma(id);
    });
  });
}

function resaltarFirma(firma) {
  // Resaltar visualmente en el PDF
  renderPage();
  const img = new Image();
  img.src = firma.img;
  img.onload = () => {
    const aspectRatio = img.width / img.height;
    const width = firma.size;
    const height = firma.size / aspectRatio;
    
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 3;
    ctx.strokeRect(firma.pos.x, firma.pos.y, width, height);
  };
  
  // Resaltar en la lista
  document.querySelectorAll(".firma-item").forEach(item => {
    item.classList.remove("active");
  });
  event.currentTarget.classList.add("active");
}

function editarFirma(id) {
  const firma = firmas.find(f => f.id === id);
  if (!firma) return;
  
  // Navegar a la página de la firma si no estamos ahí
  if (currentPageNum !== firma.pageNum) {
    currentPageNum = firma.pageNum;
    currentPage = pdfPages[currentPageNum - 1];
    viewport = currentPage.getViewport({ scale: 1.2 });
    pdfCanvas.width = viewport.width;
    pdfCanvas.height = viewport.height;
    updatePageControls();
    updateThumbnailsActive();
  }
  
  // Entrar en modo de edición sin abrir el modal
  firmaEnEdicion = firma;
  firmaActual = { ...firma }; // Clonar la firma para edición
  modoEdicion = true;
  positioningControls.classList.add("active");
  pdfCanvas.style.cursor = "move";
  
  // Actualizar el slider con el tamaño actual
  document.getElementById("sizeRange").value = firma.size;
  
  renderPage();
}

function eliminarFirma(id) {
  if (!confirm("¿Estás seguro de eliminar esta firma?")) return;
  
  const index = firmas.findIndex(f => f.id === id);
  if (index !== -1) {
    firmas.splice(index, 1);
  }
  
  actualizarListaFirmas();
  renderPageThumbnails(); // Actualizar contadores en miniaturas
  renderPage();
}

// Función para eliminar una página del PDF
async function deletePage(pageNum) {
  if (pdfPages.length <= 1) {
    alert("No puedes eliminar la única página del documento");
    return;
  }
  
  const firmasEnPagina = firmas.filter(f => !f.deleted && f.pageNum === pageNum).length;
  let mensaje = `¿Estás seguro de eliminar la página ${pageNum}?`;
  if (firmasEnPagina > 0) {
    mensaje += `\n\nEsta página tiene ${firmasEnPagina} firma(s) que también serán eliminadas.`;
  }
  
  if (!confirm(mensaje)) return;
  
  // Eliminar firmas de esta página
  firmas = firmas.filter(f => f.pageNum !== pageNum);
  
  // Actualizar números de página de las firmas restantes
  firmas.forEach(f => {
    if (f.pageNum > pageNum) {
      f.pageNum--;
    }
  });
  
  // Eliminar la página del array
  pdfPages.splice(pageNum - 1, 1);
  totalPages--;
  
  // Actualizar PDF original
  const pdfDocLib = await PDFDocument.load(originalPdfBytes);
  pdfDocLib.removePage(pageNum - 1);
  originalPdfBytes = await pdfDocLib.save();
  pdfDoc = await PDFDocument.load(originalPdfBytes);
  
  // Ajustar página actual si es necesario
  if (currentPageNum > totalPages) {
    currentPageNum = totalPages;
  } else if (currentPageNum >= pageNum && currentPageNum > 1) {
    currentPageNum--;
  }
  
  // Re-renderizar todo
  currentPage = pdfPages[currentPageNum - 1];
  viewport = currentPage.getViewport({ scale: 1.2 });
  pdfCanvas.width = viewport.width;
  pdfCanvas.height = viewport.height;
  
  renderPage();
  renderPageThumbnails();
  updatePageControls();
  actualizarListaFirmas();
}

// Cámara (código oculto pero funcional)
const video = document.getElementById("video");
const photoCanvas = document.getElementById("photo");
const photoCtx = photoCanvas.getContext("2d");
navigator.mediaDevices.getUserMedia({ video: true }).then(stream => video.srcObject = stream).catch(err => {
  console.log("Cámara no disponible:", err);
});

document.getElementById("take-photo").addEventListener("click", () => {
  photoCtx.drawImage(video, 0, 0, photoCanvas.width, photoCanvas.height);
  photoImage = photoCanvas.toDataURL("image/png");
  if (firmaActual) {
    firmaActual.photo = photoImage;
    renderPage();
  }
});

// Restablecer foto
document.getElementById("reset-photo").addEventListener("click", () => {
  photoCtx.clearRect(0, 0, photoCanvas.width, photoCanvas.height);
  photoImage = null;
  if (firmaActual) {
    firmaActual.photo = null;
    renderPage();
  }
});

// Descargar PDF firmado
document.getElementById("download").addEventListener("click", async () => {
  if (!pdfDoc || firmas.length === 0) {
    alert("Carga un PDF y agrega al menos una firma.");
    return;
  }

  const pdfDocLib = await PDFDocument.load(originalPdfBytes);
  const pages = pdfDocLib.getPages();

  for (let firma of firmas) {
    if (firma.deleted) continue;
    
    const page = pages[firma.pageNum - 1];
    const { width: pdfW, height: pdfH } = page.getSize();
    
    // Calcular escala basada en la página específica
    const tempPage = pdfPages[firma.pageNum - 1];
    const tempViewport = tempPage.getViewport({ scale: 1.2 });
    const canvasW = tempViewport.width;
    const canvasH = tempViewport.height;
    const scaleX = pdfW / canvasW;
    const scaleY = pdfH / canvasH;
    
    const pngImage = await pdfDocLib.embedPng(firma.img);
    const aspectRatio = pngImage.width / pngImage.height;

    // Tamaño y posición escalados + inversión del eje Y del PDF
    const drawW = firma.size * scaleX;
    const drawH = (firma.size / aspectRatio) * scaleY;
    const x = firma.pos.x * scaleX;
    const y = pdfH - (firma.pos.y * scaleY) - drawH;

    page.drawImage(pngImage, {
      x, y, width: drawW, height: drawH,
    });

    if (firma.photo) {
      const pngPhoto = await pdfDocLib.embedPng(firma.photo);
      const photoW = 60 * scaleX;
      const photoH = 60 * scaleY;
      const px = (firma.pos.x + firma.size + 10) * scaleX;
      const py = pdfH - (firma.pos.y * scaleY) - photoH;

      page.drawImage(pngPhoto, {
        x: px, y: py, width: photoW, height: photoH,
      });
    }
  }

  const pdfBytesFinal = await pdfDocLib.save();
  const blob = new Blob([pdfBytesFinal], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "pdf_firmado.pdf";
  link.click();
});
