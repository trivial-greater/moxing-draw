export type AspectRatioId = '1:1' | '3:4' | '4:3' | '16:9';

export interface CanvasDimensions {
  width: number;
  height: number;
}

export const ASPECT_RATIO_SIZES: Record<AspectRatioId, CanvasDimensions> = {
  '1:1': { width: 720, height: 720 },
  '3:4': { width: 640, height: 854 },
  '4:3': { width: 854, height: 640 },
  '16:9': { width: 960, height: 540 },
};

export interface LayerBase {
  id: string;
  name: string;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number; // radians
  opacity: number; // 0..1
  visible: boolean;
}

export type TextPresetStyle = 'meme-impact' | 'acid-pop' | 'danmaku' | 'warning-tape';

export interface TextLayer extends LayerBase {
  type: 'text';
  text: string;
  fontSize: number;
  fontWeight: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  shadow: boolean;
  bgColor: string | null;
  presetStyle: TextPresetStyle;
}

export type BubbleStyle = 'shout' | 'speech' | 'thought' | 'stamp';

export interface BubbleLayer extends LayerBase {
  type: 'bubble';
  bubbleStyle: BubbleStyle;
  text: string;
  fontSize: number;
  fill: string;
  stroke: string;
  textColor: string;
  width: number;
  height: number;
  tailDir: 'bottom-left' | 'bottom-right' | 'top-left' | 'none';
}

export interface StickerLayer extends LayerBase {
  type: 'sticker';
  stickerId: string;
  width: number;
  height: number;
  flipX: boolean;
}

export type CanvasLayer = TextLayer | BubbleLayer | StickerLayer;

export type LiquifyMode = 'bulge' | 'pinch' | 'swirl-cw' | 'swirl-ccw';

export interface LiquifyStroke {
  id: string;
  mode: LiquifyMode;
  /** Normalized coordinates (0..1) relative to canvas so strokes survive aspect changes */
  nx: number;
  ny: number;
  /** Normalized radius relative to min(width, height) */
  nRadius: number;
  strength: number; // 0.1..1.0
}

export interface FilterState {
  deepFry: number; // 0..100
  pixelate: number; // 0..100
  rgbShift: number; // 0..100
  glitch: number; // 0..100
  halftone: number; // 0..100
  speedlines: number; // 0..100
  vignette: number; // 0..100
  hueShift: number; // -180..180
}

export const DEFAULT_FILTERS: FilterState = {
  deepFry: 0,
  pixelate: 0,
  rgbShift: 0,
  glitch: 0,
  halftone: 0,
  speedlines: 0,
  vignette: 0,
  hueShift: 0,
};

export type AnimationPreset = 'none' | 'shake' | 'bounce' | 'glitch' | 'rainbow' | 'spin';

export interface AnimationState {
  preset: AnimationPreset;
  speed: number; // 0.5..2.5
  intensity: number; // 10..100
  playing: boolean;
}

export const DEFAULT_ANIMATION: AnimationState = {
  preset: 'none',
  speed: 1.2,
  intensity: 60,
  playing: true,
};

export type EditorTool = 'select' | 'liquify';

export type AIProviderId = 'siliconflow' | 'pollinations' | 'gemini' | 'huggingface' | 'openai';

export type AIStyleId =
  | 'comic-chaos'
  | 'meme-reaction'
  | 'retro-pixel'
  | 'cyber-meltdown'
  | 'oil-surreal'
  | 'anime-unhinged';

export interface ProviderConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export type ProviderConfigMap = Record<AIProviderId, ProviderConfig>;

export interface BaseImageMeta {
  kind: 'template' | 'upload' | 'ai';
  templateId?: string;
  prompt?: string;
  expandedPrompt?: string;
  provider?: AIProviderId;
  seed?: number;
}

export interface CanvasSnapshot {
  layers: CanvasLayer[];
  liquifyStrokes: LiquifyStroke[];
  filters: FilterState;
  aspectRatio: AspectRatioId;
}

export interface SavedProject {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  aspectRatio: AspectRatioId;
  layers: CanvasLayer[];
  liquifyStrokes: LiquifyStroke[];
  filters: FilterState;
  animation: AnimationState;
  baseMeta: BaseImageMeta;
  baseImageBlob?: Blob;
  thumbnailDataUrl: string;
}
