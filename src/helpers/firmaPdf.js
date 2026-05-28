// firmaPdf.js - Módulo para firmar PDFs

/**
 * Abre un modal para firmar un PDF y retorna el PDF firmado
 * @param {Blob|ArrayBuffer|Uint8Array} pdfSource - El PDF a firmar
 * @param {Object} options - Opciones de configuración
 * @returns {Promise<Blob>} - PDF firmado como Blob
 */
export async function firmarPdf(pdfSource, options = {}) {
  // Verificar que las librerías estén cargadas
  if (!window.PDFLib) {
    throw new Error('pdf-lib no está cargado. Asegúrate de incluir: <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js"></script>');
  }
  if (!window.pdfjsLib && !window['pdfjs-dist/build/pdf']) {
    throw new Error('PDF.js no está cargado. Asegúrate de incluir: <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>');
  }
  if (!window.SignaturePad) {
    throw new Error('SignaturePad no está cargado. Asegúrate de incluir: <script src="https://cdn.jsdelivr.net/npm/signature_pad"></script>');
  }

  return new Promise(async (resolve, reject) => {
    try {
      // Convertir el PDF a Uint8Array (más seguro que ArrayBuffer)
      let pdfBytes;
      if (pdfSource instanceof Blob) {
        const arrayBuffer = await pdfSource.arrayBuffer();
        pdfBytes = new Uint8Array(arrayBuffer);
      } else if (pdfSource instanceof ArrayBuffer) {
        pdfBytes = new Uint8Array(pdfSource);
      } else if (pdfSource instanceof Uint8Array) {
        // Crear una copia para evitar problemas de detached buffer
        pdfBytes = new Uint8Array(pdfSource);
      } else {
        throw new Error('Formato de PDF no soportado');
      }

      // Crear el modal y la interfaz
      const modal = createSignatureModal();
      document.body.appendChild(modal);

      // Inicializar el estado
      const state = {
        pdfDoc: null,
        originalPdfBytes: pdfBytes,
        currentPage: null,
        viewport: null,
        pdfPages: [],
        currentPageNum: 1,
        totalPages: 0,
        firmas: [],
        firmaActual: null,
        modoEdicion: false,
        firmaEnEdicion: null,
        firmaIdCounter: 0,
        firmaSize: 150,
        signaturePad: null,
        photoImage: null,
        ctx: null,
        pdfCanvas: null
      };

      // Cargar el PDF
      await loadPDF(state, pdfBytes);

      // Configurar event listeners
      setupEventListeners(modal, state, resolve, reject);

      // Mostrar el modal
      modal.style.display = 'flex';

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Crea el modal HTML para firmar el PDF
 */
function loadStyles() {
  const existing = document.getElementById('firma-pdf-styles');
  if (existing) return;

  const link = document.createElement('link');
  link.id = 'firma-pdf-styles';
  link.rel = 'stylesheet';
  link.href = 'css/pdf/firmaPdf.css';
  document.head.appendChild(link);
}

function createSignatureModal() {
  loadStyles();
  const modal = document.createElement('div');
  modal.id = 'firma-pdf-modal';
  modal.innerHTML = `
    <div class="firma-modal-container">
      <div class="firma-modal-header">
        <h2>Firmar Documento PDF</h2>
        <button class="firma-modal-close" data-action="cancel">&times;</button>
      </div>
      
      <div class="firma-modal-body">
        <div class="firma-pages-panel">
          <h3>Páginas</h3>
          <div class="firma-pages-list"></div>
        </div>

        <div class="firma-viewer-container">
          <div class="firma-toolbar">
            <div class="firma-toolbar-section">
              <button class="firma-btn firma-btn-primary" data-action="add-signature">
                ✍️ Agregar Firma
              </button>
            </div>
            <div class="firma-toolbar-divider"></div>
            <div class="firma-toolbar-section">
              <button class="firma-btn firma-btn-secondary" data-action="prev-page">
                ◀ Anterior
              </button>
              <span class="firma-page-info"></span>
              <button class="firma-btn firma-btn-secondary" data-action="next-page">
                Siguiente ▶
              </button>
            </div>
          </div>
          
          <div class="firma-canvas-wrapper">
            <canvas class="firma-pdf-canvas"></canvas>
          </div>
        </div>

        <div class="firma-signatures-panel">
          <h3>Firmas</h3>
          <div class="firma-signatures-list"></div>
          <button class="firma-btn firma-btn-success" data-action="download" style="width: 100%; margin-top: 10px;">
            💾 Confirmar y Guardar
          </button>
          <button class="firma-btn firma-btn-secondary" data-action="cancel" style="width: 100%; margin-top: 10px;">
            ✖️ Cancelar
          </button>
        </div>
      </div>
    </div>

    <div class="firma-signature-modal">
      <div class="firma-signature-canvas-container">
        <h3>Dibuja tu firma</h3>
        <div class="firma-signature-canvas-wrapper">
          <canvas class="firma-signature-canvas"></canvas>
          <div class="firma-signature-guide">
            Firma aquí en el centro
          </div>
        </div>
        <div class="firma-modal-buttons">
          <button class="firma-btn firma-btn-secondary" data-action="clear-signature">
            🗑️ Limpiar
          </button>
          <button class="firma-btn firma-btn-primary" data-action="accept-signature">
            ✓ Aceptar
          </button>
          <button class="firma-btn firma-btn-danger" data-action="cancel-signature">
            ✖️ Cancelar
          </button>
        </div>
      </div>
    </div>

    <div class="firma-positioning-controls">
      <label for="firma-size-range">Tamaño:</label>
      <input type="range" id="firma-size-range" min="50" max="600" value="150">
      <button class="firma-btn firma-btn-success" data-action="confirm-position">
        ✓ Confirmar
      </button>
      <button class="firma-btn firma-btn-danger" data-action="cancel-position">
        ✖️ Cancelar
      </button>
    </div>
  `;

  return modal;
}

/**
 * Carga el PDF y lo renderiza
 */
async function loadPDF(state, pdfBytes) {
  // Guardar UNA copia del buffer original que NO se usará con PDF.js
  // para evitar que se desconecte cuando PDF.js lo procese
  state.originalPdfBytes = new Uint8Array(pdfBytes);
  
  // Crear OTRA copia para usar con PDF.js (esta puede desconectarse)
  const pdfBytesForPdfJs = new Uint8Array(pdfBytes);
  
  // Usar PDFLib global
  const { PDFDocument } = window.PDFLib;
  state.pdfDoc = await PDFDocument.load(pdfBytes);

  // Cargar con PDF.js - intentar con pdfjsLib global primero
  const pdfjsLib = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
  if (!pdfjsLib) {
    throw new Error('PDF.js no está cargado. Asegúrate de incluir la librería.');
  }

  // Configurar worker si no está configurado
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  // Usar la copia separada para PDF.js
  const pdf = await pdfjsLib.getDocument({ data: pdfBytesForPdfJs }).promise;
  state.totalPages = pdf.numPages;

  state.pdfPages = [];
  for (let i = 1; i <= state.totalPages; i++) {
    state.pdfPages.push(await pdf.getPage(i));
  }

  state.currentPageNum = 1;
  state.currentPage = state.pdfPages[0];
  state.viewport = state.currentPage.getViewport({ scale: 1.2 });

  const canvas = document.querySelector('.firma-pdf-canvas');
  state.pdfCanvas = canvas;
  state.ctx = canvas.getContext('2d');
  canvas.width = state.viewport.width;
  canvas.height = state.viewport.height;

  renderPage(state);
  renderPageThumbnails(state);
  updatePageControls(state);
}

/**
 * Renderiza la página actual con las firmas
 */
function renderPage(state) {
  if (!state.currentPage) return;

  state.currentPage.render({
    canvasContext: state.ctx,
    viewport: state.viewport
  }).promise.then(() => {
    state.firmas.forEach(firma => {
      if (!firma.deleted && firma.pageNum === state.currentPageNum) {
        dibujarFirma(state, firma);
      }
    });
    if (state.firmaActual) {
      dibujarFirma(state, state.firmaActual, true);
    }
  });
}

/**
 * Dibuja una firma en el canvas
 */
function dibujarFirma(state, firma, isPreview = false) {
  const img = new Image();
  img.src = firma.img;
  img.onload = () => {
    const aspectRatio = img.width / img.height;
    const width = firma.size;
    const height = firma.size / aspectRatio;

    state.ctx.drawImage(
      img,
      firma.pos.x,
      firma.pos.y,
      width,
      height
    );

    if (isPreview) {
      state.ctx.strokeStyle = 'red';
      state.ctx.lineWidth = 2;
      state.ctx.strokeRect(firma.pos.x, firma.pos.y, width, height);
    }
  };
}

/**
 * Renderiza las miniaturas de páginas
 */
function renderPageThumbnails(state) {
  const pagesList = document.querySelector('.firma-pages-list');
  pagesList.innerHTML = '';

  state.pdfPages.forEach((page, index) => {
    const pageNum = index + 1;
    const thumbDiv = document.createElement('div');
    thumbDiv.className = 'firma-page-thumbnail';
    if (pageNum === state.currentPageNum) {
      thumbDiv.classList.add('active');
    }

    const thumbCanvas = document.createElement('canvas');
    const thumbViewport = page.getViewport({ scale: 0.2 });
    thumbCanvas.width = thumbViewport.width;
    thumbCanvas.height = thumbViewport.height;

    const thumbCtx = thumbCanvas.getContext('2d');
    page.render({ canvasContext: thumbCtx, viewport: thumbViewport });

    thumbDiv.appendChild(thumbCanvas);

    const firmasCount = state.firmas.filter(f => !f.deleted && f.pageNum === pageNum).length;

    const label = document.createElement('div');
    label.className = 'firma-page-thumbnail-label';
    label.innerHTML = `Página ${pageNum}${firmasCount > 0 ? `<span class="firma-page-thumbnail-badge">${firmasCount}</span>` : ''}`;
    thumbDiv.appendChild(label);

    thumbDiv.addEventListener('click', () => {
      state.currentPageNum = pageNum;
      state.currentPage = state.pdfPages[index];
      state.viewport = state.currentPage.getViewport({ scale: 1.2 });
      state.pdfCanvas.width = state.viewport.width;
      state.pdfCanvas.height = state.viewport.height;
      renderPage(state);
      updatePageControls(state);
      updateThumbnailsActive(state);
    });

    pagesList.appendChild(thumbDiv);
  });
}

/**
 * Actualiza las miniaturas activas
 */
function updateThumbnailsActive(state) {
  document.querySelectorAll('.firma-page-thumbnail').forEach((thumb, index) => {
    if (index + 1 === state.currentPageNum) {
      thumb.classList.add('active');
    } else {
      thumb.classList.remove('active');
    }
  });
}

/**
 * Actualiza los controles de navegación
 */
function updatePageControls(state) {
  const prevBtn = document.querySelector('[data-action="prev-page"]');
  const nextBtn = document.querySelector('[data-action="next-page"]');
  const pageInfo = document.querySelector('.firma-page-info');

  if (state.totalPages > 1) {
    prevBtn.style.display = state.currentPageNum > 1 ? 'inline-block' : 'none';
    nextBtn.style.display = state.currentPageNum < state.totalPages ? 'inline-block' : 'none';
    pageInfo.style.display = 'inline';
    pageInfo.textContent = `Página ${state.currentPageNum} de ${state.totalPages}`;
  } else {
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';
    pageInfo.style.display = 'none';
  }
}

/**
 * Actualiza la lista de firmas
 */
function actualizarListaFirmas(state) {
  const firmasList = document.querySelector('.firma-signatures-list');
  firmasList.innerHTML = '';

  state.firmas.filter(f => !f.deleted).forEach((firma, index) => {
    const item = document.createElement('div');
    item.className = 'firma-signature-item';
    item.innerHTML = `
      <img src="${firma.img}" alt="Firma ${index + 1}">
      <div><strong>Firma ${index + 1}</strong></div>
      <div class="firma-signature-item-page">Página ${firma.pageNum}</div>
      <div class="firma-signature-item-actions">
        <button class="firma-btn firma-btn-primary firma-btn-small" data-action="edit-signature" data-id="${firma.id}">
          Editar
        </button>
        <button class="firma-btn firma-btn-danger firma-btn-small" data-action="delete-signature" data-id="${firma.id}">
          Eliminar
        </button>
      </div>
    `;

    item.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') return;

      if (state.currentPageNum !== firma.pageNum) {
        state.currentPageNum = firma.pageNum;
        state.currentPage = state.pdfPages[state.currentPageNum - 1];
        state.viewport = state.currentPage.getViewport({ scale: 1.2 });
        state.pdfCanvas.width = state.viewport.width;
        state.pdfCanvas.height = state.viewport.height;
        updatePageControls(state);
        updateThumbnailsActive(state);
      }

      renderPage(state);
      const img = new Image();
      img.src = firma.img;
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const width = firma.size;
        const height = firma.size / aspectRatio;

        state.ctx.strokeStyle = 'blue';
        state.ctx.lineWidth = 3;
        state.ctx.strokeRect(firma.pos.x, firma.pos.y, width, height);
      };
    });

    firmasList.appendChild(item);
  });
}

/**
 * Recorta la firma al área sugerida
 */
function cropSignatureToGuide(canvas) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const guideWidth = canvas.width * 0.6;
  const guideHeight = canvas.height * 0.4;
  const guideLeft = (canvas.width - guideWidth) / 2;
  const guideTop = (canvas.height - guideHeight) / 2;

  const captureWidth = guideWidth * 2;
  const captureHeight = guideHeight * 2;
  const captureLeft = Math.max(0, guideLeft - guideWidth / 2);
  const captureTop = Math.max(0, guideTop - guideHeight / 2);
  const captureRight = Math.min(canvas.width, captureLeft + captureWidth);
  const captureBottom = Math.min(canvas.height, captureTop + captureHeight);

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
    return canvas.toDataURL('image/png');
  }

  const padding = 10;
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(canvas.width, maxX + padding);
  maxY = Math.min(canvas.height, maxY + padding);

  const cropWidth = maxX - minX;
  const cropHeight = maxY - minY;

  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = cropWidth;
  croppedCanvas.height = cropHeight;
  const croppedCtx = croppedCanvas.getContext('2d');
  croppedCtx.drawImage(canvas, minX, minY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

  return croppedCanvas.toDataURL('image/png');
}

/**
 * Configura los event listeners
 */
function setupEventListeners(modal, state, resolve, reject) {
  // Botón cancelar
  modal.querySelectorAll('[data-action="cancel"]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (state.firmas.length > 0) {
        if (!confirm('¿Estás seguro de cancelar? Se perderán todas las firmas.')) {
          return;
        }
      }
      document.body.removeChild(modal);
      reject(new Error('Cancelado por el usuario'));
    });
  });

  // Navegación de páginas
  modal.querySelector('[data-action="prev-page"]').addEventListener('click', () => {
    if (state.currentPageNum > 1) {
      state.currentPageNum--;
      state.currentPage = state.pdfPages[state.currentPageNum - 1];
      state.viewport = state.currentPage.getViewport({ scale: 1.2 });
      state.pdfCanvas.width = state.viewport.width;
      state.pdfCanvas.height = state.viewport.height;
      renderPage(state);
      updatePageControls(state);
      updateThumbnailsActive(state);
    }
  });

  modal.querySelector('[data-action="next-page"]').addEventListener('click', () => {
    if (state.currentPageNum < state.totalPages) {
      state.currentPageNum++;
      state.currentPage = state.pdfPages[state.currentPageNum - 1];
      state.viewport = state.currentPage.getViewport({ scale: 1.2 });
      state.pdfCanvas.width = state.viewport.width;
      state.pdfCanvas.height = state.viewport.height;
      renderPage(state);
      updatePageControls(state);
      updateThumbnailsActive(state);
    }
  });

  // Agregar firma
  modal.querySelector('[data-action="add-signature"]').addEventListener('click', () => {
    const signatureModal = modal.querySelector('.firma-signature-modal');
    signatureModal.classList.add('active');

    const canvas = modal.querySelector('.firma-signature-canvas');
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;

    if (state.signaturePad) {
      state.signaturePad.clear();
    }
    state.signaturePad = new window.SignaturePad(canvas);
  });

  // Limpiar firma
  modal.querySelector('[data-action="clear-signature"]').addEventListener('click', () => {
    if (state.signaturePad) {
      state.signaturePad.clear();
    }
  });

  // Cancelar firma
  modal.querySelector('[data-action="cancel-signature"]').addEventListener('click', () => {
    const signatureModal = modal.querySelector('.firma-signature-modal');
    signatureModal.classList.remove('active');
    if (state.signaturePad) {
      state.signaturePad.clear();
    }
  });

  // Aceptar firma
  modal.querySelector('[data-action="accept-signature"]').addEventListener('click', () => {
    if (!state.signaturePad || state.signaturePad.isEmpty()) {
      alert('Primero dibuja una firma');
      return;
    }

    const canvas = modal.querySelector('.firma-signature-canvas');
    const signatureImage = cropSignatureToGuide(canvas);
    const signatureModal = modal.querySelector('.firma-signature-modal');
    signatureModal.classList.remove('active');

    if (state.firmaEnEdicion) {
      state.firmaEnEdicion.img = signatureImage;
      state.firmaActual = state.firmaEnEdicion;
    } else {
      state.firmaActual = {
        id: ++state.firmaIdCounter,
        img: signatureImage,
        pos: { x: 100, y: 100 },
        size: state.firmaSize,
        photo: null,
        pageNum: state.currentPageNum
      };
    }

    state.modoEdicion = true;
    const positioningControls = modal.querySelector('.firma-positioning-controls');
    positioningControls.classList.add('active');
    state.pdfCanvas.classList.add('mode-edit');
    renderPage(state);
  });

  // Click en canvas para posicionar
  state.pdfCanvas.addEventListener('click', (e) => {
    if (!state.modoEdicion || !state.firmaActual) return;

    const rect = state.pdfCanvas.getBoundingClientRect();
    const scaleX = state.pdfCanvas.width / rect.width;
    const scaleY = state.pdfCanvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    state.firmaActual.pos = { x, y };
    renderPage(state);
  });

  // Cambiar tamaño
  modal.querySelector('#firma-size-range').addEventListener('input', (e) => {
    if (!state.modoEdicion || !state.firmaActual) return;
    state.firmaSize = parseInt(e.target.value);
    state.firmaActual.size = state.firmaSize;
    renderPage(state);
  });

  // Confirmar posición
  modal.querySelector('[data-action="confirm-position"]').addEventListener('click', () => {
    if (!state.firmaActual) return;

    if (state.firmaEnEdicion) {
      const index = state.firmas.findIndex(f => f.id === state.firmaEnEdicion.id);
      if (index !== -1) {
        state.firmas[index] = state.firmaActual;
      }
      state.firmaEnEdicion = null;
    } else {
      state.firmas.push(state.firmaActual);
    }

    finalizarEdicion(modal, state);
    actualizarListaFirmas(state);
    renderPageThumbnails(state);
    renderPage(state);
  });

  // Cancelar posición
  modal.querySelector('[data-action="cancel-position"]').addEventListener('click', () => {
    state.firmaEnEdicion = null;
    finalizarEdicion(modal, state);
    renderPage(state);
  });

  // Event delegation para editar/eliminar firmas
  modal.querySelector('.firma-signatures-list').addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-action="edit-signature"]');
    const deleteBtn = e.target.closest('[data-action="delete-signature"]');

    if (editBtn) {
      const id = parseInt(editBtn.dataset.id);
      const firma = state.firmas.find(f => f.id === id);
      if (!firma) return;

      if (state.currentPageNum !== firma.pageNum) {
        state.currentPageNum = firma.pageNum;
        state.currentPage = state.pdfPages[state.currentPageNum - 1];
        state.viewport = state.currentPage.getViewport({ scale: 1.2 });
        state.pdfCanvas.width = state.viewport.width;
        state.pdfCanvas.height = state.viewport.height;
        updatePageControls(state);
        updateThumbnailsActive(state);
      }

      state.firmaEnEdicion = firma;
      state.firmaActual = { ...firma };
      state.modoEdicion = true;
      const positioningControls = modal.querySelector('.firma-positioning-controls');
      positioningControls.classList.add('active');
      state.pdfCanvas.classList.add('mode-edit');
      modal.querySelector('#firma-size-range').value = firma.size;
      renderPage(state);
    }

    if (deleteBtn) {
      const id = parseInt(deleteBtn.dataset.id);
      if (!confirm('¿Estás seguro de eliminar esta firma?')) return;

      const index = state.firmas.findIndex(f => f.id === id);
      if (index !== -1) {
        state.firmas.splice(index, 1);
      }

      actualizarListaFirmas(state);
      renderPageThumbnails(state);
      renderPage(state);
    }
  });

  // Descargar PDF firmado
  modal.querySelector('[data-action="download"]').addEventListener('click', async () => {
    if (state.firmas.length === 0) {
      alert('Agrega al menos una firma antes de guardar.');
      return;
    }

    try {
      const pdfBlob = await generateSignedPDF(state);
      document.body.removeChild(modal);
      resolve(pdfBlob);
    } catch (error) {
      alert('Error al generar el PDF firmado: ' + error.message);
      reject(error);
    }
  });
}

/**
 * Finaliza el modo de edición
 */
function finalizarEdicion(modal, state) {
  state.modoEdicion = false;
  state.firmaActual = null;
  const positioningControls = modal.querySelector('.firma-positioning-controls');
  positioningControls.classList.remove('active');
  state.pdfCanvas.classList.remove('mode-edit');
}

/**
 * Genera el PDF firmado
 */
async function generateSignedPDF(state) {
  const { PDFDocument } = window.PDFLib;
  // Usar directamente el buffer guardado que nunca fue transferido
  const pdfDocLib = await PDFDocument.load(state.originalPdfBytes);
  const pages = pdfDocLib.getPages();

  for (let firma of state.firmas) {
    if (firma.deleted) continue;

    const page = pages[firma.pageNum - 1];
    const { width: pdfW, height: pdfH } = page.getSize();

    const tempPage = state.pdfPages[firma.pageNum - 1];
    const tempViewport = tempPage.getViewport({ scale: 1.2 });
    const canvasW = tempViewport.width;
    const canvasH = tempViewport.height;
    const scaleX = pdfW / canvasW;
    const scaleY = pdfH / canvasH;

    const pngImage = await pdfDocLib.embedPng(firma.img);
    const aspectRatio = pngImage.width / pngImage.height;

    const drawW = firma.size * scaleX;
    const drawH = (firma.size / aspectRatio) * scaleY;
    const x = firma.pos.x * scaleX;
    const y = pdfH - (firma.pos.y * scaleY) - drawH;

    page.drawImage(pngImage, {
      x, y, width: drawW, height: drawH,
    });
  }

  const pdfBytesFinal = await pdfDocLib.save();
  return new Blob([pdfBytesFinal], { type: 'application/pdf' });
}

export default firmarPdf;