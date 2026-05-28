import { loadPDF, renderPage, renderPageThumbnails, updatePageControls, updateThumbnailsActive } from './pdfRenderer.js';
import { cropSignatureToGuide } from './signatureCapture.js';
import { finalizarEdicion } from './signaturePositioner.js';
import { generateSignedPDF } from './pdfSigner.js';

export async function firmarPdf(pdfSource, options = {}) {
  if (!window.PDFLib) {
    throw new Error('pdf-lib no esta cargado. Asegurate de incluir: <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js"></script>');
  }
  if (!window.pdfjsLib && !window['pdfjs-dist/build/pdf']) {
    throw new Error('PDF.js no esta cargado. Asegurate de incluir: <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>');
  }
  if (!window.SignaturePad) {
    throw new Error('SignaturePad no esta cargado. Asegurate de incluir: <script src="https://cdn.jsdelivr.net/npm/signature_pad"></script>');
  }

  return new Promise(async (resolve, reject) => {
    try {
      let pdfBytes;
      if (pdfSource instanceof Blob) {
        const arrayBuffer = await pdfSource.arrayBuffer();
        pdfBytes = new Uint8Array(arrayBuffer);
      } else if (pdfSource instanceof ArrayBuffer) {
        pdfBytes = new Uint8Array(pdfSource);
      } else if (pdfSource instanceof Uint8Array) {
        pdfBytes = new Uint8Array(pdfSource);
      } else {
        throw new Error('Formato de PDF no soportado');
      }

      const modal = createSignatureModal();
      document.body.appendChild(modal);

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
        pdfCanvas: null,
      };

      await loadPDF(state, pdfBytes);
      setupEventListeners(modal, state, resolve, reject);
      modal.style.display = 'flex';
    } catch (error) {
      reject(error);
    }
  });
}

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
          <h3>Paginas</h3>
          <div class="firma-pages-list"></div>
        </div>

        <div class="firma-viewer-container">
          <div class="firma-toolbar">
            <div class="firma-toolbar-section">
              <button class="firma-btn firma-btn-primary" data-action="add-signature">
                Agregar Firma
              </button>
            </div>
            <div class="firma-toolbar-divider"></div>
            <div class="firma-toolbar-section">
              <button class="firma-btn firma-btn-secondary" data-action="prev-page">
                Anterior
              </button>
              <span class="firma-page-info"></span>
              <button class="firma-btn firma-btn-secondary" data-action="next-page">
                Siguiente
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
            Confirmar y Guardar
          </button>
          <button class="firma-btn firma-btn-secondary" data-action="cancel" style="width: 100%; margin-top: 10px;">
            Cancelar
          </button>
        </div>
      </div>
    </div>

    <div class="firma-signature-modal">
      <div class="firma-signature-canvas-container">
        <h3>Dibuja tu firma</h3>
        <div class="firma-signature-canvas-wrapper">
          <canvas class="firma-signature-canvas"></canvas>
          <div class="firma-signature-guide">Firma aqui en el centro</div>
        </div>
        <div class="firma-modal-buttons">
          <button class="firma-btn firma-btn-secondary" data-action="clear-signature">Limpiar</button>
          <button class="firma-btn firma-btn-primary" data-action="accept-signature">Aceptar</button>
          <button class="firma-btn firma-btn-danger" data-action="cancel-signature">Cancelar</button>
        </div>
      </div>
    </div>

    <div class="firma-positioning-controls">
      <label for="firma-size-range">Tamano:</label>
      <input type="range" id="firma-size-range" min="50" max="600" value="150">
      <button class="firma-btn firma-btn-success" data-action="confirm-position">Confirmar</button>
      <button class="firma-btn firma-btn-danger" data-action="cancel-position">Cancelar</button>
    </div>
  `;

  return modal;
}

function actualizarListaFirmas(state) {
  const firmasList = document.querySelector('.firma-signatures-list');
  firmasList.innerHTML = '';

  state.firmas
    .filter((f) => !f.deleted)
    .forEach((firma, index) => {
      const item = document.createElement('div');
      item.className = 'firma-signature-item';
      item.innerHTML = `
      <img src="${firma.img}" alt="Firma ${index + 1}">
      <div><strong>Firma ${index + 1}</strong></div>
      <div class="firma-signature-item-page">Pagina ${firma.pageNum}</div>
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

        // NOTE: no separado porque combina navegacion de paginas y resaltado de seleccion con estado UI compartido.
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

function setupEventListeners(modal, state, resolve, reject) {
  modal.querySelectorAll('[data-action="cancel"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (state.firmas.length > 0) {
        if (!confirm('Estas seguro de cancelar? Se perderan todas las firmas.')) {
          return;
        }
      }
      document.body.removeChild(modal);
      reject(new Error('Cancelado por el usuario'));
    });
  });

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

  modal.querySelector('[data-action="clear-signature"]').addEventListener('click', () => {
    if (state.signaturePad) {
      state.signaturePad.clear();
    }
  });

  modal.querySelector('[data-action="cancel-signature"]').addEventListener('click', () => {
    const signatureModal = modal.querySelector('.firma-signature-modal');
    signatureModal.classList.remove('active');
    if (state.signaturePad) {
      state.signaturePad.clear();
    }
  });

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
        pageNum: state.currentPageNum,
      };
    }

    state.modoEdicion = true;
    const positioningControls = modal.querySelector('.firma-positioning-controls');
    positioningControls.classList.add('active');
    state.pdfCanvas.classList.add('mode-edit');
    renderPage(state);
  });

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

  modal.querySelector('#firma-size-range').addEventListener('input', (e) => {
    if (!state.modoEdicion || !state.firmaActual) return;
    state.firmaSize = parseInt(e.target.value, 10);
    state.firmaActual.size = state.firmaSize;
    renderPage(state);
  });

  modal.querySelector('[data-action="confirm-position"]').addEventListener('click', () => {
    if (!state.firmaActual) return;

    if (state.firmaEnEdicion) {
      const index = state.firmas.findIndex((f) => f.id === state.firmaEnEdicion.id);
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

  modal.querySelector('[data-action="cancel-position"]').addEventListener('click', () => {
    state.firmaEnEdicion = null;
    finalizarEdicion(modal, state);
    renderPage(state);
  });

  modal.querySelector('.firma-signatures-list').addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-action="edit-signature"]');
    const deleteBtn = e.target.closest('[data-action="delete-signature"]');

    if (editBtn) {
      const id = parseInt(editBtn.dataset.id, 10);
      const firma = state.firmas.find((f) => f.id === id);
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
      const id = parseInt(deleteBtn.dataset.id, 10);
      if (!confirm('Estas seguro de eliminar esta firma?')) return;

      const index = state.firmas.findIndex((f) => f.id === id);
      if (index !== -1) {
        state.firmas.splice(index, 1);
      }

      actualizarListaFirmas(state);
      renderPageThumbnails(state);
      renderPage(state);
    }
  });

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
      alert(`Error al generar el PDF firmado: ${error.message}`);
      reject(error);
    }
  });
}

export default firmarPdf;
