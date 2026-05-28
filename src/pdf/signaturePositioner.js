export function drawSignatureOnCanvas(state, firma, isPreview = false) {
  const img = new Image();
  img.src = firma.img;
  img.onload = () => {
    const aspectRatio = img.width / img.height;
    const width = firma.size;
    const height = firma.size / aspectRatio;

    state.ctx.drawImage(img, firma.pos.x, firma.pos.y, width, height);

    if (isPreview) {
      state.ctx.strokeStyle = 'red';
      state.ctx.lineWidth = 2;
      state.ctx.strokeRect(firma.pos.x, firma.pos.y, width, height);
    }
  };
}

export function finalizarEdicion(modal, state) {
  state.modoEdicion = false;
  state.firmaActual = null;
  const positioningControls = modal.querySelector('.firma-positioning-controls');
  positioningControls.classList.remove('active');
  state.pdfCanvas.classList.remove('mode-edit');
}
