import type {
  BubbleLayer,
  BubbleStyle,
  FilterState,
  StickerLayer,
  TextLayer,
  TextPresetStyle,
} from '../types/studio';
import { DEFAULT_FILTERS } from '../types/studio';
import { getStickerDef } from '../assets/stickers';

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createTextLayer(
  canvasW: number,
  canvasH: number,
  preset: TextPresetStyle,
  initialText?: string,
): TextLayer {
  const base = {
    id: uid('txt'),
    type: 'text' as const,
    x: canvasW / 2,
    y: preset === 'meme-impact' ? canvasH - 72 : canvasH * 0.22,
    scaleX: 1,
    scaleY: 1,
    rotation: preset === 'danmaku' ? -0.1 : 0,
    opacity: 1,
    visible: true,
    presetStyle: preset,
  };

  switch (preset) {
    case 'acid-pop':
      return {
        ...base,
        name: '酸性潮玩大字',
        text: initialText || '精神状态极其超前',
        fontSize: 52,
        fontWeight: 900,
        fill: '#d9ff00',
        stroke: '#0b0c10',
        strokeWidth: 10,
        shadow: true,
        bgColor: null,
      };
    case 'danmaku':
      return {
        ...base,
        name: '弹幕吐槽字',
        text: initialText || '离谱！但很合理',
        fontSize: 38,
        fontWeight: 900,
        fill: '#ff2e93',
        stroke: '#ffffff',
        strokeWidth: 8,
        shadow: true,
        bgColor: null,
      };
    case 'warning-tape':
      return {
        ...base,
        name: '高能警示条',
        text: initialText || '⚠ 警告：前方极度抽象 ⚠',
        fontSize: 30,
        fontWeight: 900,
        fill: '#0b0c10',
        stroke: '#0b0c10',
        strokeWidth: 0,
        shadow: false,
        bgColor: '#facc15',
      };
    default:
      return {
        ...base,
        name: '经典梗图大字',
        text: initialText || '双击修改魔性配文',
        fontSize: 48,
        fontWeight: 900,
        fill: '#ffffff',
        stroke: '#0b0c10',
        strokeWidth: 10,
        shadow: true,
        bgColor: null,
      };
  }
}

export function createBubbleLayer(
  canvasW: number,
  canvasH: number,
  bubbleStyle: BubbleStyle,
  initialText?: string,
): BubbleLayer {
  const defaults: Record<
    BubbleStyle,
    { name: string; text: string; fill: string; textColor: string; w: number; h: number }
  > = {
    shout: {
      name: '尖叫爆炸框',
      text: initialText || '什么鬼?!',
      fill: '#d9ff00',
      textColor: '#0b0c10',
      w: 220,
      h: 118,
    },
    speech: {
      name: '漫画对白框',
      text: initialText || '这合理吗？',
      fill: '#ffffff',
      textColor: '#0b0c10',
      w: 225,
      h: 102,
    },
    thought: {
      name: '内心OS云朵',
      text: initialText || '今天先摆烂…',
      fill: '#f8fafc',
      textColor: '#0f172a',
      w: 225,
      h: 108,
    },
    stamp: {
      name: '吐槽便签框',
      text: initialText || '大脑过载 99%',
      fill: '#ff2e93',
      textColor: '#ffffff',
      w: 220,
      h: 82,
    },
  };

  const d = defaults[bubbleStyle];
  return {
    id: uid('bub'),
    type: 'bubble',
    name: d.name,
    bubbleStyle,
    text: d.text,
    x: canvasW * 0.62,
    y: canvasH * 0.28,
    scaleX: 1,
    scaleY: 1,
    rotation: bubbleStyle === 'shout' ? 0.06 : 0,
    opacity: 1,
    visible: true,
    fontSize: 24,
    fill: d.fill,
    stroke: '#0b0c10',
    textColor: d.textColor,
    width: d.w,
    height: d.h,
    tailDir: 'bottom-left',
  };
}

export function createStickerLayer(
  canvasW: number,
  canvasH: number,
  stickerId: string,
): StickerLayer {
  const def = getStickerDef(stickerId);
  return {
    id: uid('stk'),
    type: 'sticker',
    name: def?.label || '魔性贴纸',
    stickerId,
    x: canvasW / 2 + (Math.random() - 0.5) * 80,
    y: canvasH / 2 + (Math.random() - 0.5) * 80,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    opacity: 1,
    visible: true,
    width: def?.defaultWidth ?? 150,
    height: def?.defaultHeight ?? 150,
    flipX: false,
  };
}

export interface FilterPresetItem {
  id: string;
  label: string;
  desc: string;
  values: FilterState;
}

export const FILTER_PRESETS: FilterPresetItem[] = [
  {
    id: 'clean',
    label: '原图清透',
    desc: '关闭全部滤镜',
    values: { ...DEFAULT_FILTERS },
  },
  {
    id: 'deep-fried',
    label: '电子包浆',
    desc: '高饱和 + 锐化深炸',
    values: { ...DEFAULT_FILTERS, deepFry: 78, vignette: 24, rgbShift: 18 },
  },
  {
    id: 'manga-boom',
    label: '暴漫高能',
    desc: '黑白网点 + 速度线',
    values: { ...DEFAULT_FILTERS, halftone: 92, speedlines: 72, vignette: 20 },
  },
  {
    id: 'cyber-glitch',
    label: '赛博崩坏',
    desc: '故障切片 + RGB色散',
    values: { ...DEFAULT_FILTERS, glitch: 65, rgbShift: 55, vignette: 35 },
  },
  {
    id: 'retro-8bit',
    label: '鬼畜像素',
    desc: '复古像素 + 轻微色偏',
    values: { ...DEFAULT_FILTERS, pixelate: 56, rgbShift: 26, deepFry: 22 },
  },
  {
    id: 'acid-trip',
    label: '精神污染',
    desc: '极端色相 + 深炸冲击',
    values: { ...DEFAULT_FILTERS, deepFry: 64, hueShift: 135, speedlines: 52, rgbShift: 35 },
  },
];
