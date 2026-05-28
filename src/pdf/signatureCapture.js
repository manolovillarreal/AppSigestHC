export function cropSignatureToGuide(canvas) {
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

  let minX = captureRight;
  let minY = captureBottom;
  let maxX = captureLeft;
  let maxY = captureTop;
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
