import type { FilterState } from '../types/studio';

function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clampByte(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

/**
 * Applies pixel-level comedic / stylized post-processing filters directly on canvas.
 * timePhase (0..1) drives animated glitch slicing & rainbow hue cycling seamlessly.
 */
export function applyPostFilters(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  filters: FilterState,
  extraHueDeg = 0,
  extraGlitch = 0,
  timePhase = 0,
): void {
  const totalHue = filters.hueShift + extraHueDeg;
  const effectiveGlitch = Math.min(100, filters.glitch + extraGlitch);

  // 1. Hue shift via fast offscreen CSS filter when active
  if (Math.abs(totalHue) > 0.5) {
    const tmp = document.createElement('canvas');
    tmp.width = width;
    tmp.height = height;
    const tctx = tmp.getContext('2d')!;
    tctx.filter = `hue-rotate(${totalHue.toFixed(1)}deg)`;
    tctx.drawImage(ctx.canvas, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(tmp, 0, 0);
  }

  // 2. Retro Pixelation (nearest-neighbor downscale & upscale)
  if (filters.pixelate > 0) {
    const factor = 1 + (filters.pixelate / 100) * 14; // 1px..15px blocks
    const pw = Math.max(24, Math.round(width / factor));
    const ph = Math.max(24, Math.round(height / factor));
    const low = document.createElement('canvas');
    low.width = pw;
    low.height = ph;
    const lctx = low.getContext('2d')!;
    lctx.imageSmoothingEnabled = false;
    lctx.drawImage(ctx.canvas, 0, 0, pw, ph);

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(low, 0, 0, width, height);
    ctx.restore();
  }

  // 3. Pixel-buffer stage: Deep-Fry (电子包浆), RGB Chromatic Shift, Manga Halftone
  const needsPixelPass = filters.deepFry > 0 || filters.rgbShift > 0 || filters.halftone > 0;
  if (needsPixelPass) {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    // 3a. Deep-Fry: high saturation + harsh contrast + sharpen halo + subtle green/amber patina
    if (filters.deepFry > 0) {
      const k = filters.deepFry / 100;
      const srcCopy = new Uint8ClampedArray(data);
      const contrast = 1 + k * 1.45;
      const sat = 1 + k * 1.85;
      const sharpenAmt = k * 0.95;
      const noiseAmp = k * 24;
      const rng = seededRandom(42069);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          let r = srcCopy[i];
          let g = srcCopy[i + 1];
          let b = srcCopy[i + 2];

          // 4-neighbor crisp unsharp mask for that iconic crunchy over-sharpened meme texture
          if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
            const up = ((y - 1) * width + x) * 4;
            const dn = ((y + 1) * width + x) * 4;
            const lt = (y * width + x - 1) * 4;
            const rt = (y * width + x + 1) * 4;
            const avgR = (srcCopy[up] + srcCopy[dn] + srcCopy[lt] + srcCopy[rt]) * 0.25;
            const avgG = (srcCopy[up + 1] + srcCopy[dn + 1] + srcCopy[lt + 1] + srcCopy[rt + 1]) * 0.25;
            const avgB = (srcCopy[up + 2] + srcCopy[dn + 2] + srcCopy[lt + 2] + srcCopy[rt + 2]) * 0.25;
            r += (r - avgR) * sharpenAmt;
            g += (g - avgG) * sharpenAmt;
            b += (b - avgB) * sharpenAmt;
          }

          // Contrast push around midpoint
          r = (r - 128) * contrast + 128;
          g = (g - 128) * contrast + 128;
          b = (b - 128) * contrast + 128;

          // Saturation push + slight electronic patina green/warm cast
          const luma = 0.299 * r + 0.587 * g + 0.114 * b;
          r = luma + (r - luma) * sat + k * 14;
          g = luma + (g - luma) * sat + k * 6;
          b = luma + (b - luma) * sat - k * 16;

          // Subtle JPEG crunch grain
          const n = (rng() - 0.5) * noiseAmp;
          data[i] = clampByte(r + n);
          data[i + 1] = clampByte(g + n * 0.8);
          data[i + 2] = clampByte(b + n);
        }
      }
    }

    // 3b. Manga High-Contrast Halftone (暴漫黑白网点)
    if (filters.halftone > 0) {
      const k = filters.halftone / 100;
      const cell = 6;
      for (let y = 0; y < height; y++) {
        const cy = (y % cell) - cell * 0.5 + 0.5;
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

          const cx = (x % cell) - cell * 0.5 + 0.5;
          const distNorm = Math.sqrt(cx * cx + cy * cy) / (cell * 0.72);
          let inkVal: number;
          if (luma < 0.24) {
            inkVal = 16;
          } else if (luma > 0.82) {
            inkVal = 250;
          } else {
            // Halftone dot radius inversely proportional to brightness
            const dotRadius = (1 - luma) * 1.05;
            inkVal = distNorm < dotRadius ? 22 : 246;
          }

          data[i] = r * (1 - k) + inkVal * k;
          data[i + 1] = g * (1 - k) + inkVal * k;
          data[i + 2] = b * (1 - k) + inkVal * k;
        }
      }
    }

    // 3c. True Per-Channel RGB Chromatic Aberration
    if (filters.rgbShift > 0) {
      const shift = Math.max(1, Math.round((filters.rgbShift / 100) * 16));
      const snap = new Uint8ClampedArray(data);
      for (let y = 0; y < height; y++) {
        const row = y * width;
        for (let x = 0; x < width; x++) {
          const dst = (row + x) * 4;
          const rx = Math.max(0, x - shift);
          const bx = Math.min(width - 1, x + shift);
          data[dst] = snap[(row + rx) * 4];
          data[dst + 2] = snap[(row + bx) * 4 + 2];
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }

  // 4. Cyber Glitch horizontal displacement + CRT scanlines
  if (effectiveGlitch > 0) {
    const k = effectiveGlitch / 100;
    const snap = document.createElement('canvas');
    snap.width = width;
    snap.height = height;
    snap.getContext('2d')!.drawImage(ctx.canvas, 0, 0);

    const frameSeed = Math.floor(timePhase * 12) * 997 + 1337;
    const rng = seededRandom(frameSeed);
    const sliceCount = Math.floor(5 + k * 18);

    for (let s = 0; s < sliceCount; s++) {
      const sy = Math.floor(rng() * height);
      const sh = Math.max(3, Math.floor(4 + rng() * (14 + k * 24)));
      const dx = Math.round((rng() - 0.5) * (16 + k * 56));
      ctx.drawImage(snap, 0, sy, width, sh, dx, sy, width, sh);

      if (rng() < 0.35 * k) {
        ctx.fillStyle = rng() > 0.5 ? 'rgba(34, 211, 238, 0.22)' : 'rgba(255, 46, 147, 0.22)';
        ctx.fillRect(0, sy, width, Math.max(2, sh * 0.45));
      }
    }

    // Crisp CRT Scanlines
    ctx.fillStyle = `rgba(0, 0, 0, ${(0.08 + k * 0.22).toFixed(3)})`;
    for (let y = 0; y < height; y += 4) {
      ctx.fillRect(0, y, width, 1.5);
    }
  }

  // 5. Razor-sharp Manga Radial Speedlines (leaving center clear!)
  if (filters.speedlines > 0) {
    const k = filters.speedlines / 100;
    const cx = width / 2;
    const cy = height / 2;
    const maxR = Math.hypot(cx, cy) * 1.06;
    const innerBase = Math.min(cx, cy) * (0.86 - k * 0.28);
    const count = Math.floor(36 + k * 54);
    const rng = seededRandom(777 + Math.floor(timePhase * 8) * 31);

    ctx.save();
    ctx.fillStyle = `rgba(11, 12, 16, ${(0.35 + k * 0.55).toFixed(3)})`;
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + (rng() - 0.5) * 0.04;
      const spread = (0.008 + rng() * 0.016) * (0.6 + k * 0.7);
      const innerR = innerBase + (rng() - 0.3) * 75;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * innerR, cy + Math.sin(a) * innerR);
      ctx.lineTo(cx + Math.cos(a - spread) * maxR, cy + Math.sin(a - spread) * maxR);
      ctx.lineTo(cx + Math.cos(a + spread) * maxR, cy + Math.sin(a + spread) * maxR);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // 6. Dramatic Darkroom Vignette
  if (filters.vignette > 0) {
    const k = filters.vignette / 100;
    const cx = width / 2;
    const cy = height / 2;
    const outerR = Math.hypot(cx, cy);
    const grad = ctx.createRadialGradient(cx, cy, outerR * 0.38, cx, cy, outerR);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, `rgba(5, 6, 10, ${(k * 0.85).toFixed(3)})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }
}
