export async function generarThumbnailPdf(blob, canvasElement) {
  const loadingTask = pdfjsLib.getDocument({ data: await blob.arrayBuffer() });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);

  const viewport = page.getViewport({ scale: 0.3 });
  const context = canvasElement.getContext('2d');

  canvasElement.width = viewport.width;
  canvasElement.height = viewport.height;

  await page.render({ canvasContext: context, viewport }).promise;
}
