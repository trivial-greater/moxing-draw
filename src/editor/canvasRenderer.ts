import type {
  AnimationState,
  BubbleLayer,
  CanvasLayer,
  FilterState,
  LiquifyStroke,
  StickerLayer,
  TextLayer,
} from '../types/studio';
import { getCachedStickerImage } from '../assets/stickers';
import { applyLiquifyStrokes } from '../fx/liquify';
import { applyPostFilters } from '../fx/filters';

export interface LayerBounds {
  width: number;
  height: number;
}

export type HandleType = 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'rotate';

export interface HitResult {
  layerId: string;
  handle: HandleType;
}

export interface RenderSceneParams {
  canvas: HTMLCanvasElement;
  baseImage: HTMLImageElement | HTMLCanvasElement | null;
  layers: CanvasLayer[];
  liquifyStrokes: LiquifyStroke[];
  filters: FilterState;
  animation: AnimationState;
  timePhase: number; // 0..1
  selectedLayerId: string | null;
  showSelectionUi: boolean;
  compareOriginal?: boolean;
}

const FONT_STACK =
  '"PingFang SC", "HarmonyOS Sans SC", "Microsoft YaHei", "Impact", "Arial Black", sans-serif';

export function measureLayerLocalSize(
  ctx: CanvasRenderingContext2D,
  layer: CanvasLayer,
): LayerBounds {
  if (layer.type === 'sticker') {
    return { width: layer.width, height: layer.height };
  }
  if (layer.type === 'bubble') {
    return { width: layer.width, height: layer.height };
  }

  // Text layer (supports multi-line)
  ctx.save();
  ctx.font = `${layer.fontWeight} ${layer.fontSize}px ${FONT_STACK}`;
  const lines = (layer.text || '双击输入梗字').split('\n');
  let maxW = 60;
  for (const line of lines) {
    const w = ctx.measureText(line || ' ').width;
    if (w > maxW) maxW = w;
  }
  ctx.restore();
  const lineHeight = layer.fontSize * 1.22;
  const padX = layer.bgColor ? 34 : 20;
  const padY = layer.bgColor ? 22 : 14;
  return {
    width: maxW + padX,
    height: lines.length * lineHeight + padY,
  };
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function drawTextLayer(ctx: CanvasRenderingContext2D, layer: TextLayer) {
  const lines = (layer.text || '双击输入梗字').split('\n');
  const bounds = measureLayerLocalSize(ctx, layer);
  const lineHeight = layer.fontSize * 1.22;

  ctx.save();
  ctx.font = `${layer.fontWeight} ${layer.fontSize}px ${FONT_STACK}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (layer.bgColor) {
    ctx.fillStyle = layer.bgColor;
    drawRoundedRect(ctx, -bounds.width / 2, -bounds.height / 2, bounds.width, bounds.height, 10);
    ctx.fill();
    if (layer.presetStyle === 'warning-tape') {
      ctx.strokeStyle = '#0b0c10';
      ctx.lineWidth = 4;
      ctx.stroke();
    }
  }

  const startY = -((lines.length - 1) * lineHeight) / 2;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const y = startY + i * lineHeight;

    if (layer.shadow) {
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.72)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 4;
      if (layer.strokeWidth > 0) {
        ctx.strokeStyle = layer.stroke;
        ctx.lineWidth = layer.strokeWidth;
        ctx.lineJoin = 'round';
        ctx.strokeText(line, 0, y);
      }
      ctx.fillStyle = layer.fill;
      ctx.fillText(line, 0, y);
      ctx.restore();
    } else {
      if (layer.strokeWidth > 0) {
        ctx.strokeStyle = layer.stroke;
        ctx.lineWidth = layer.strokeWidth;
        ctx.lineJoin = 'round';
        ctx.strokeText(line, 0, y);
      }
      ctx.fillStyle = layer.fill;
      ctx.fillText(line, 0, y);
    }
  }

  ctx.restore();
}

function drawBubbleLayer(ctx: CanvasRenderingContext2D, layer: BubbleLayer) {
  const hw = layer.width / 2;
  const hh = layer.height / 2;

  ctx.save();
  ctx.fillStyle = layer.fill;
  ctx.strokeStyle = layer.stroke;
  ctx.lineWidth = 5;
  ctx.lineJoin = 'round';

  if (layer.bubbleStyle === 'shout') {
    // Spiky manga explosion speech bubble
    const spikes = 16;
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const a = (Math.PI * i) / spikes;
      const isOuter = i % 2 === 0;
      const rx = hw * (isOuter ? 1.12 : 0.86);
      const ry = hh * (isOuter ? 1.16 : 0.82);
      const px = Math.cos(a) * rx;
      const py = Math.sin(a) * ry;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (layer.bubbleStyle === 'thought') {
    // Cloud bubble + trailing thought dots
    const bumps = 12;
    ctx.beginPath();
    for (let i = 0; i < bumps; i++) {
      const a = (Math.PI * 2 * i) / bumps;
      const bx = Math.cos(a) * hw * 0.78;
      const by = Math.sin(a) * hh * 0.72;
      ctx.moveTo(bx + 26, by);
      ctx.arc(bx, by, 26, 0, Math.PI * 2);
    }
    ctx.fill();
    // Clean outline ellipse on top
    ctx.beginPath();
    ctx.ellipse(0, 0, hw * 0.94, hh * 0.86, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (layer.tailDir !== 'none') {
      const sign = layer.tailDir === 'bottom-right' ? 1 : -1;
      ctx.beginPath();
      ctx.arc(sign * hw * 0.45, hh * 0.98, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sign * hw * 0.62, hh * 1.18, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  } else if (layer.bubbleStyle === 'stamp') {
    // Bold brutalist comic badge box
    ctx.save();
    ctx.fillStyle = '#0b0c10';
    drawRoundedRect(ctx, -hw + 6, -hh + 6, layer.width, layer.height, 12);
    ctx.fill();
    ctx.restore();
    drawRoundedRect(ctx, -hw, -hh, layer.width, layer.height, 12);
    ctx.fill();
    ctx.stroke();
  } else {
    // Classic manga speech bubble with tail
    drawRoundedRect(ctx, -hw, -hh, layer.width, layer.height, 26);
    ctx.fill();
    ctx.stroke();
    if (layer.tailDir !== 'none') {
      const isRight = layer.tailDir === 'bottom-right';
      const isTop = layer.tailDir === 'top-left';
      ctx.beginPath();
      if (isTop) {
        ctx.moveTo(-hw * 0.45, -hh + 2);
        ctx.lineTo(-hw * 0.72, -hh - 26);
        ctx.lineTo(-hw * 0.16, -hh + 2);
      } else {
        const sx = isRight ? 1 : -1;
        ctx.moveTo(sx * hw * 0.45, hh - 2);
        ctx.lineTo(sx * hw * 0.68, hh + 28);
        ctx.lineTo(sx * hw * 0.14, hh - 2);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Cover inner stroke seam
      ctx.fillStyle = layer.fill;
      ctx.fillRect(-hw + 12, isTop ? -hh - 2 : hh - 8, layer.width - 24, 10);
    }
  }

  // Bubble text with simple line wrapping
  ctx.fillStyle = layer.textColor;
  ctx.font = `900 ${layer.fontSize}px ${FONT_STACK}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const maxLineW = layer.width * 0.78;
  const rawLines = (layer.text || '输入对白').split('\n');
  const wrapped: string[] = [];
  for (const rl of rawLines) {
    let cur = '';
    for (const ch of rl) {
      if (ctx.measureText(cur + ch).width > maxLineW && cur.length > 0) {
        wrapped.push(cur);
        cur = ch;
      } else {
        cur += ch;
      }
    }
    wrapped.push(cur);
  }

  const lh = layer.fontSize * 1.24;
  const startY = -((wrapped.length - 1) * lh) / 2;
  for (let i = 0; i < wrapped.length; i++) {
    ctx.fillText(wrapped[i], 0, startY + i * lh, layer.width * 0.86);
  }

  ctx.restore();
}

function drawStickerLayer(ctx: CanvasRenderingContext2D, layer: StickerLayer) {
  const img = getCachedStickerImage(layer.stickerId);
  if (!img) return;
  ctx.save();
  if (layer.flipX) ctx.scale(-1, 1);
  ctx.drawImage(img, -layer.width / 2, -layer.height / 2, layer.width, layer.height);
  ctx.restore();
}

function drawSelectionOverlay(
  ctx: CanvasRenderingContext2D,
  layer: CanvasLayer,
) {
  const bounds = measureLayerLocalSize(ctx, layer);
  const w = bounds.width * Math.abs(layer.scaleX);
  const h = bounds.height * Math.abs(layer.scaleY);
  const hw = w / 2 + 8;
  const hh = h / 2 + 8;

  ctx.save();
  ctx.translate(layer.x, layer.y);
  ctx.rotate(layer.rotation);

  // Dashed accent frame
  ctx.strokeStyle = '#d9ff00';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(-hw, -hh, hw * 2, hh * 2);
  ctx.setLineDash([]);

  // Rotate stem & handle
  const rotY = -hh - 28;
  ctx.beginPath();
  ctx.moveTo(0, -hh);
  ctx.lineTo(0, rotY);
  ctx.strokeStyle = '#d9ff00';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, rotY, 7.5, 0, Math.PI * 2);
  ctx.fillStyle = '#0b0c10';
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#d9ff00';
  ctx.stroke();

  // 4 corner resize handles
  const corners: [number, number][] = [
    [-hw, -hh],
    [hw, -hh],
    [hw, hh],
    [-hw, hh],
  ];
  for (const [cx, cy] of corners) {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0b0c10';
    ctx.lineWidth = 2;
    ctx.fillRect(cx - 5.5, cy - 5.5, 11, 11);
    ctx.strokeRect(cx - 5.5, cy - 5.5, 11, 11);
  }

  ctx.restore();
}

export class StudioCanvasRenderer {
  private liquifyCacheCanvas: HTMLCanvasElement;
  private liquifyCacheKey = '';
  private workCanvas: HTMLCanvasElement;

  constructor() {
    this.liquifyCacheCanvas = document.createElement('canvas');
    this.workCanvas = document.createElement('canvas');
  }

  private getLiquifiedBase(
    baseImage: HTMLImageElement | HTMLCanvasElement,
    width: number,
    height: number,
    strokes: LiquifyStroke[],
  ): HTMLCanvasElement {
    const imgKey =
      baseImage instanceof HTMLImageElement
        ? `${baseImage.src.slice(0, 80)}_${baseImage.naturalWidth}x${baseImage.naturalHeight}`
        : `canvas_${baseImage.width}x${baseImage.height}`;
    const strokeKey = strokes
      .map((s) => `${s.id}:${s.nx.toFixed(3)},${s.ny.toFixed(3)},${s.nRadius.toFixed(3)},${s.strength.toFixed(2)}`)
      .join('|');
    const fullKey = `${width}x${height}::${imgKey}::${strokeKey}`;

    if (fullKey === this.liquifyCacheKey && this.liquifyCacheCanvas.width === width && this.liquifyCacheCanvas.height === height) {
      return this.liquifyCacheCanvas;
    }

    this.liquifyCacheCanvas.width = width;
    this.liquifyCacheCanvas.height = height;
    const ctx = this.liquifyCacheCanvas.getContext('2d', { willReadFrequently: true })!;
    ctx.clearRect(0, 0, width, height);

    const iw = baseImage instanceof HTMLImageElement ? baseImage.naturalWidth || baseImage.width : baseImage.width;
    const ih = baseImage instanceof HTMLImageElement ? baseImage.naturalHeight || baseImage.height : baseImage.height;

    if (iw > 0 && ih > 0) {
      const scale = Math.max(width / iw, height / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      const dx = (width - dw) / 2;
      const dy = (height - dh) / 2;
      ctx.drawImage(baseImage, dx, dy, dw, dh);
    }

    if (strokes.length > 0) {
      const imgData = ctx.getImageData(0, 0, width, height);
      applyLiquifyStrokes(imgData, strokes);
      ctx.putImageData(imgData, 0, 0);
    }

    this.liquifyCacheKey = fullKey;
    return this.liquifyCacheCanvas;
  }

  public invalidateCache() {
    this.liquifyCacheKey = '';
  }

  public render(params: RenderSceneParams): void {
    const {
      canvas,
      baseImage,
      layers,
      liquifyStrokes,
      filters,
      animation,
      timePhase,
      selectedLayerId,
      showSelectionUi,
      compareOriginal,
    } = params;

    const width = canvas.width;
    const height = canvas.height;
    const outCtx = canvas.getContext('2d')!;
    outCtx.clearRect(0, 0, width, height);

    // Hold-to-compare original unedited image
    if (compareOriginal && baseImage) {
      const iw = baseImage instanceof HTMLImageElement ? baseImage.naturalWidth || baseImage.width : baseImage.width;
      const ih = baseImage instanceof HTMLImageElement ? baseImage.naturalHeight || baseImage.height : baseImage.height;
      if (iw > 0 && ih > 0) {
        const scale = Math.max(width / iw, height / ih);
        const dw = iw * scale;
        const dh = ih * scale;
        outCtx.drawImage(baseImage, (width - dw) / 2, (height - dh) / 2, dw, dh);
      }
      return;
    }

    // Prepare compositing work canvas
    if (this.workCanvas.width !== width || this.workCanvas.height !== height) {
      this.workCanvas.width = width;
      this.workCanvas.height = height;
    }
    const ctx = this.workCanvas.getContext('2d', { willReadFrequently: true })!;
    ctx.clearRect(0, 0, width, height);

    // Compute animated transform parameters from animation preset + phase (0..1)
    const activeAnim = animation.preset !== 'none';
    const intensity = animation.intensity / 100;
    const angleRad = timePhase * Math.PI * 2;
    let tx = 0;
    let ty = 0;
    let animScale = 1;
    let animRot = 0;
    let extraHue = 0;
    let extraGlitch = 0;

    if (activeAnim) {
      switch (animation.preset) {
        case 'shake':
          tx = Math.sin(angleRad * 4) * 14 * intensity;
          ty = Math.cos(angleRad * 6) * 10 * intensity;
          animRot = Math.sin(angleRad * 3) * 0.045 * intensity;
          animScale = 1.05;
          break;
        case 'bounce':
          animScale = 1 + Math.abs(Math.sin(angleRad * 2)) * 0.16 * intensity;
          ty = -Math.abs(Math.sin(angleRad * 2)) * 18 * intensity;
          animRot = Math.sin(angleRad) * 0.06 * intensity;
          break;
        case 'glitch':
          extraGlitch = 35 + intensity * 55;
          tx = (Math.sin(angleRad * 7) > 0.4 ? 1 : -1) * 6 * intensity;
          break;
        case 'rainbow':
          extraHue = timePhase * 360;
          animScale = 1 + Math.sin(angleRad * 2) * 0.04 * intensity;
          break;
        case 'spin':
          animRot = Math.sin(angleRad) * 0.24 * intensity;
          animScale = 1.08 + Math.cos(angleRad * 2) * 0.06 * intensity;
          break;
      }
    }

    // 1. Draw Base Image (with Liquify applied)
    ctx.save();
    ctx.fillStyle = '#12141c';
    ctx.fillRect(0, 0, width, height);
    ctx.translate(width / 2 + tx, height / 2 + ty);
    ctx.rotate(animRot);
    ctx.scale(animScale, animScale);
    ctx.translate(-width / 2, -height / 2);

    if (baseImage) {
      const liquified = this.getLiquifiedBase(baseImage, width, height, liquifyStrokes);
      ctx.drawImage(liquified, 0, 0);
    }

    // 2. Apply pixel filters to base image (before crisp top text/stickers OR across base)
    ctx.restore();
    applyPostFilters(ctx, width, height, filters, extraHue, extraGlitch, timePhase);

    // 3. Draw interactive layers (Text / Comic Bubbles / Vector Stickers) on top so typography stays razor-sharp
    for (const layer of layers) {
      if (!layer.visible) continue;
      ctx.save();
      ctx.globalAlpha = layer.opacity;
      // Subtle synchronized animation motion for layers too
      const ltx = activeAnim && animation.preset === 'shake' ? tx * 0.75 : 0;
      const lty = activeAnim && animation.preset === 'bounce' ? ty * 0.65 : 0;
      ctx.translate(layer.x + ltx, layer.y + lty);
      ctx.rotate(layer.rotation + (activeAnim && animation.preset === 'spin' ? animRot * 0.45 : 0));
      ctx.scale(layer.scaleX, layer.scaleY);

      if (layer.type === 'text') {
        drawTextLayer(ctx, layer);
      } else if (layer.type === 'bubble') {
        drawBubbleLayer(ctx, layer);
      } else {
        drawStickerLayer(ctx, layer);
      }
      ctx.restore();
    }

    // Present composited frame to visible canvas
    outCtx.drawImage(this.workCanvas, 0, 0);

    // 4. Draw Selection Gizmo (only in interactive editor, NEVER in exports)
    if (showSelectionUi && selectedLayerId) {
      const sel = layers.find((l) => l.id === selectedLayerId && l.visible);
      if (sel) {
        drawSelectionOverlay(outCtx, sel);
      }
    }
  }

  public hitTest(
    ctx: CanvasRenderingContext2D,
    layers: CanvasLayer[],
    selectedLayerId: string | null,
    px: number,
    py: number,
  ): HitResult | null {
    // First check handles on currently selected layer
    if (selectedLayerId) {
      const sel = layers.find((l) => l.id === selectedLayerId && l.visible);
      if (sel) {
        const bounds = measureLayerLocalSize(ctx, sel);
        const hw = (bounds.width * Math.abs(sel.scaleX)) / 2 + 8;
        const hh = (bounds.height * Math.abs(sel.scaleY)) / 2 + 8;

        const dx = px - sel.x;
        const dy = py - sel.y;
        const cos = Math.cos(-sel.rotation);
        const sin = Math.sin(-sel.rotation);
        const lx = dx * cos - dy * sin;
        const ly = dx * sin + dy * cos;

        // Rotate handle
        if (Math.hypot(lx, ly - (-hh - 28)) <= 14) {
          return { layerId: sel.id, handle: 'rotate' };
        }
        // Corner handles
        const handles: { id: HandleType; x: number; y: number }[] = [
          { id: 'nw', x: -hw, y: -hh },
          { id: 'ne', x: hw, y: -hh },
          { id: 'se', x: hw, y: hh },
          { id: 'sw', x: -hw, y: hh },
        ];
        for (const h of handles) {
          if (Math.abs(lx - h.x) <= 13 && Math.abs(ly - h.y) <= 13) {
            return { layerId: sel.id, handle: h.id };
          }
        }
      }
    }

    // Check layer bodies top-to-bottom
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (!layer.visible) continue;
      const bounds = measureLayerLocalSize(ctx, layer);
      const hw = (bounds.width * Math.abs(layer.scaleX)) / 2 + 6;
      const hh = (bounds.height * Math.abs(layer.scaleY)) / 2 + 6;

      const dx = px - layer.x;
      const dy = py - layer.y;
      const cos = Math.cos(-layer.rotation);
      const sin = Math.sin(-layer.rotation);
      const lx = dx * cos - dy * sin;
      const ly = dx * sin + dy * cos;

      if (Math.abs(lx) <= hw && Math.abs(ly) <= hh) {
        return { layerId: layer.id, handle: 'move' };
      }
    }

    return null;
  }
}
