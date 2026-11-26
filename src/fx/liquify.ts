import type { LiquifyStroke } from '../types/studio';

/**
 * Applies interactive liquify/funhouse-mirror warps (bulge, pinch, swirl)
 * onto an ImageData buffer in-place using smooth bilinear interpolation.
 * Only touches the local bounding box of each stroke so real-time painting stays 60fps.
 */
export function applyLiquifyStrokes(
  imageData: ImageData,
  strokes: LiquifyStroke[],
): ImageData {
  if (strokes.length === 0) return imageData;

  const { width, height, data } = imageData;
  const minDim = Math.min(width, height);
  const temp = new Uint8ClampedArray(data.length);

  for (const stroke of strokes) {
    const cx = stroke.nx * width;
    const cy = stroke.ny * height;
    const radius = Math.max(12, stroke.nRadius * minDim);
    const r2 = radius * radius;
    const strength = Math.max(0.05, Math.min(1, stroke.strength));

    const minX = Math.max(0, Math.floor(cx - radius));
    const maxX = Math.min(width - 1, Math.ceil(cx + radius));
    const minY = Math.max(0, Math.floor(cy - radius));
    const maxY = Math.min(height - 1, Math.ceil(cy + radius));

    if (minX >= maxX || minY >= maxY) continue;

    // Copy only the affected bounding region into temp as source
    for (let y = minY; y <= maxY; y++) {
      const rowStart = (y * width + minX) * 4;
      const rowEnd = (y * width + maxX + 1) * 4;
      temp.set(data.subarray(rowStart, rowEnd), rowStart);
    }

    const bulgeExp = 1 + strength * 1.35;
    const pinchExp = 1 / (1 + strength * 1.35);
    const swirlSign = stroke.mode === 'swirl-cw' ? -1 : 1;
    const swirlMaxAngle = swirlSign * strength * 2.8;

    for (let y = minY; y <= maxY; y++) {
      const dy = y - cy;
      const dy2 = dy * dy;

      for (let x = minX; x <= maxX; x++) {
        const dx = x - cx;
        const dist2 = dx * dx + dy2;
        if (dist2 >= r2 || dist2 < 0.0001) continue;

        const dist = Math.sqrt(dist2);
        const normR = dist / radius; // 0..1

        let srcX: number;
        let srcY: number;

        if (stroke.mode === 'bulge') {
          const mappedR = Math.pow(normR, bulgeExp);
          const ratio = mappedR / normR;
          srcX = cx + dx * ratio;
          srcY = cy + dy * ratio;
        } else if (stroke.mode === 'pinch') {
          const mappedR = Math.pow(normR, pinchExp);
          const ratio = mappedR / normR;
          srcX = cx + dx * ratio;
          srcY = cy + dy * ratio;
        } else {
          // Swirl CW or CCW with smooth quadratic falloff to 0 at boundary
          const falloff = (1 - normR) * (1 - normR);
          const angle = swirlMaxAngle * falloff;
          const cosA = Math.cos(angle);
          const sinA = Math.sin(angle);
          srcX = cx + dx * cosA - dy * sinA;
          srcY = cy + dx * sinA + dy * cosA;
        }

        // Clamp within affected region (boundary pixels are unchanged so seamless)
        if (srcX < minX) srcX = minX;
        else if (srcX > maxX - 0.001) srcX = maxX - 0.001;
        if (srcY < minY) srcY = minY;
        else if (srcY > maxY - 0.001) srcY = maxY - 0.001;

        const x0 = Math.floor(srcX);
        const y0 = Math.floor(srcY);
        const x1 = Math.min(maxX, x0 + 1);
        const y1 = Math.min(maxY, y0 + 1);
        const fx = srcX - x0;
        const fy = srcY - y0;
        const invFx = 1 - fx;
        const invFy = 1 - fy;

        const w00 = invFx * invFy;
        const w10 = fx * invFy;
        const w01 = invFx * fy;
        const w11 = fx * fy;

        const i00 = (y0 * width + x0) * 4;
        const i10 = (y0 * width + x1) * 4;
        const i01 = (y1 * width + x0) * 4;
        const i11 = (y1 * width + x1) * 4;
        const dstIdx = (y * width + x) * 4;

        data[dstIdx] = temp[i00] * w00 + temp[i10] * w10 + temp[i01] * w01 + temp[i11] * w11;
        data[dstIdx + 1] =
          temp[i00 + 1] * w00 + temp[i10 + 1] * w10 + temp[i01 + 1] * w01 + temp[i11 + 1] * w11;
        data[dstIdx + 2] =
          temp[i00 + 2] * w00 + temp[i10 + 2] * w10 + temp[i01 + 2] * w01 + temp[i11 + 2] * w11;
        data[dstIdx + 3] =
          temp[i00 + 3] * w00 + temp[i10 + 3] * w10 + temp[i01 + 3] * w01 + temp[i11 + 3] * w11;
      }
    }
  }

  return imageData;
}
