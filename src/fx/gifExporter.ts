import { GIFEncoder, quantize, applyPalette } from 'gifenc';

export interface GifExportOptions {
  width: number;
  height: number;
  maxSide?: number;
  frameCount?: number;
  fps?: number;
  renderFrame: (canvas: HTMLCanvasElement, phase: number) => void;
  onProgress?: (percent: number) => void;
}

/**
 * Renders a looping animated GIF directly in the browser using gifenc.
 * Yields between frames so the UI stays responsive and updates progress cleanly.
 */
export async function exportAnimatedGif(options: GifExportOptions): Promise<Blob> {
  const maxSide = options.maxSide ?? 460;
  const frameCount = options.frameCount ?? 14;
  const fps = options.fps ?? 12;
  const delayMs = Math.round(1000 / fps);

  const scale = Math.min(1, maxSide / Math.max(options.width, options.height));
  const outW = Math.max(64, Math.round(options.width * scale));
  const outH = Math.max(64, Math.round(options.height * scale));

  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = options.width;
  srcCanvas.height = options.height;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = outW;
  outCanvas.height = outH;
  const outCtx = outCanvas.getContext('2d', { willReadFrequently: true })!;

  const gif = GIFEncoder();

  for (let i = 0; i < frameCount; i++) {
    const phase = i / frameCount;
    options.renderFrame(srcCanvas, phase);

    outCtx.clearRect(0, 0, outW, outH);
    outCtx.drawImage(srcCanvas, 0, 0, outW, outH);

    const { data } = outCtx.getImageData(0, 0, outW, outH);
    const palette = quantize(data, 256, { format: 'rgb565' });
    const index = applyPalette(data, palette, 'rgb565');

    gif.writeFrame(index, outW, outH, {
      palette,
      delay: delayMs,
      repeat: 0,
    });

    options.onProgress?.(Math.round(((i + 1) / frameCount) * 100));

    // Yield to browser paint loop
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }

  gif.finish();
  const bytes = gif.bytes();
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'image/gif' });
}
