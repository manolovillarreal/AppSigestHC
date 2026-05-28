export async function generateSignedPDF(state) {
  const { PDFDocument } = window.PDFLib;
  const pdfDocLib = await PDFDocument.load(state.originalPdfBytes);
  const pages = pdfDocLib.getPages();

  for (const firma of state.firmas) {
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
      x,
      y,
      width: drawW,
      height: drawH,
    });
  }

  const pdfBytesFinal = await pdfDocLib.save();
  return new Blob([pdfBytesFinal], { type: 'application/pdf' });
}
