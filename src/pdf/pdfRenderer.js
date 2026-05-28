import { drawSignatureOnCanvas } from './signaturePositioner.js';

export async function loadPDF(state, pdfBytes) {
  state.originalPdfBytes = new Uint8Array(pdfBytes);
  const pdfBytesForPdfJs = new Uint8Array(pdfBytes);

  const { PDFDocument } = window.PDFLib;
  state.pdfDoc = await PDFDocument.load(pdfBytes);

  const pdfjsLib = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
  if (!pdfjsLib) {
    throw new Error('PDF.js no esta cargado. Asegurate de incluir la libreria.');
  }

  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

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

export function renderPage(state) {
  if (!state.currentPage) return;

  state.currentPage
    .render({
      canvasContext: state.ctx,
      viewport: state.viewport,
    })
    .promise.then(() => {
      state.firmas.forEach((firma) => {
        if (!firma.deleted && firma.pageNum === state.currentPageNum) {
          drawSignatureOnCanvas(state, firma);
        }
      });

      if (state.firmaActual) {
        drawSignatureOnCanvas(state, state.firmaActual, true);
      }
    });
}

export function renderPageThumbnails(state) {
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

    const firmasCount = state.firmas.filter((f) => !f.deleted && f.pageNum === pageNum).length;

    const label = document.createElement('div');
    label.className = 'firma-page-thumbnail-label';
    label.innerHTML = `Pagina ${pageNum}${firmasCount > 0 ? `<span class="firma-page-thumbnail-badge">${firmasCount}</span>` : ''}`;
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

export function updateThumbnailsActive(state) {
  document.querySelectorAll('.firma-page-thumbnail').forEach((thumb, index) => {
    if (index + 1 === state.currentPageNum) {
      thumb.classList.add('active');
      return;
    }
    thumb.classList.remove('active');
  });
}

export function updatePageControls(state) {
  const prevBtn = document.querySelector('[data-action="prev-page"]');
  const nextBtn = document.querySelector('[data-action="next-page"]');
  const pageInfo = document.querySelector('.firma-page-info');

  if (state.totalPages > 1) {
    prevBtn.style.display = state.currentPageNum > 1 ? 'inline-block' : 'none';
    nextBtn.style.display = state.currentPageNum < state.totalPages ? 'inline-block' : 'none';
    pageInfo.style.display = 'inline';
    pageInfo.textContent = `Pagina ${state.currentPageNum} de ${state.totalPages}`;
    return;
  }

  prevBtn.style.display = 'none';
  nextBtn.style.display = 'none';
  pageInfo.style.display = 'none';
}
