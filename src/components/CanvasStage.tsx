import React, { useEffect, useRef, useState } from 'react';
import {
  MousePointer2,
  Wand2,
  Eye,
  RotateCcw,
  Undo2,
  Play,
  Pause,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from 'lucide-react';
import type {
  AnimationState,
  CanvasLayer,
  EditorTool,
  FilterState,
  LiquifyMode,
  LiquifyStroke,
} from '../types/studio';
import { StudioCanvasRenderer, type HandleType } from '../editor/canvasRenderer';

interface CanvasStageProps {
  width: number;
  height: number;
  renderer: StudioCanvasRenderer;
  baseImage: HTMLImageElement | HTMLCanvasElement | null;
  layers: CanvasLayer[];
  liquifyStrokes: LiquifyStroke[];
  filters: FilterState;
  animation: AnimationState;
  timePhase: number;
  tool: EditorTool;
  onChangeTool: (tool: EditorTool) => void;
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateLayerLive: (id: string, patch: Partial<CanvasLayer>) => void;
  onCommitSnapshot: () => void;
  // Liquify settings
  liquifyMode: LiquifyMode;
  onChangeLiquifyMode: (m: LiquifyMode) => void;
  liquifyRadius: number; // 0.08..0.38
  onChangeLiquifyRadius: (r: number) => void;
  liquifyStrength: number; // 0.2..1.0
  onChangeLiquifyStrength: (s: number) => void;
  onAddLiquifyStroke: (stroke: LiquifyStroke) => void;
  onUndoLiquifyStroke: () => void;
  onClearLiquify: () => void;
  onToggleAnimPlay: () => void;
  onDropImageFile: (file: File) => void;
  generating: boolean;
  onCancelAi: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

interface DragSession {
  layerId: string;
  handle: HandleType;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
  origScaleX: number;
  origScaleY: number;
  origRotation: number;
  startDist: number;
  startAngle: number;
  moved: boolean;
}

export const CanvasStage: React.FC<CanvasStageProps> = ({
  width,
  height,
  renderer,
  baseImage,
  layers,
  liquifyStrokes,
  filters,
  animation,
  timePhase,
  tool,
  onChangeTool,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayerLive,
  onCommitSnapshot,
  liquifyMode,
  onChangeLiquifyMode,
  liquifyRadius,
  onChangeLiquifyRadius,
  liquifyStrength,
  onChangeLiquifyStrength,
  onAddLiquifyStroke,
  onUndoLiquifyStroke,
  onClearLiquify,
  onToggleAnimPlay,
  onDropImageFile,
  generating,
  onCancelAi,
  canvasRef,
}) => {
  const dragRef = useRef<DragSession | null>(null);
  const liquifyPaintingRef = useRef(false);
  const lastLiquifyPtRef = useRef<{ x: number; y: number } | null>(null);

  const [compareOriginal, setCompareOriginal] = useState(false);
  const [hoverBrush, setHoverBrush] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [dragFileOver, setDragFileOver] = useState(false);

  // Render scene whenever visual inputs change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    renderer.render({
      canvas,
      baseImage,
      layers,
      liquifyStrokes,
      filters,
      animation,
      timePhase,
      selectedLayerId: tool === 'select' ? selectedLayerId : null,
      showSelectionUi: tool === 'select',
      compareOriginal,
    });
  }, [
    width,
    height,
    renderer,
    baseImage,
    layers,
    liquifyStrokes,
    filters,
    animation,
    timePhase,
    selectedLayerId,
    tool,
    compareOriginal,
    canvasRef,
  ]);

  const toCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, cssScale: 1 };
    const rect = canvas.getBoundingClientRect();
    const cssScale = rect.width / width;
    return {
      x: ((clientX - rect.left) / rect.width) * width,
      y: ((clientY - rect.top) / rect.height) * height,
      cssScale,
    };
  };

  const stampLiquifyAt = (x: number, y: number) => {
    const stroke: LiquifyStroke = {
      id: `lq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      mode: liquifyMode,
      nx: x / width,
      ny: y / height,
      nRadius: liquifyRadius,
      strength: liquifyStrength,
    };
    onAddLiquifyStroke(stroke);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    const { x, y } = toCanvasCoords(e.clientX, e.clientY);

    if (tool === 'liquify') {
      setInlineEditId(null);
      liquifyPaintingRef.current = true;
      lastLiquifyPtRef.current = { x, y };
      stampLiquifyAt(x, y);
      return;
    }

    const ctx = canvas.getContext('2d')!;
    const hit = renderer.hitTest(ctx, layers, selectedLayerId, x, y);
    if (!hit) {
      onSelectLayer(null);
      setInlineEditId(null);
      return;
    }

    const layer = layers.find((l) => l.id === hit.layerId);
    if (!layer) return;
    onSelectLayer(layer.id);
    if (inlineEditId && inlineEditId !== layer.id) {
      setInlineEditId(null);
    }

    dragRef.current = {
      layerId: layer.id,
      handle: hit.handle,
      startX: x,
      startY: y,
      origX: layer.x,
      origY: layer.y,
      origScaleX: layer.scaleX,
      origScaleY: layer.scaleY,
      origRotation: layer.rotation,
      startDist: Math.max(12, Math.hypot(x - layer.x, y - layer.y)),
      startAngle: Math.atan2(y - layer.y, x - layer.x),
      moved: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { x, y } = toCanvasCoords(e.clientX, e.clientY);

    if (tool === 'liquify') {
      setHoverBrush({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        visible: true,
      });
      if (liquifyPaintingRef.current && lastLiquifyPtRef.current) {
        const dist = Math.hypot(x - lastLiquifyPtRef.current.x, y - lastLiquifyPtRef.current.y);
        const step = Math.max(18, liquifyRadius * Math.min(width, height) * 0.42);
        if (dist >= step) {
          lastLiquifyPtRef.current = { x, y };
          stampLiquifyAt(x, y);
        }
      }
      return;
    }

    const session = dragRef.current;
    if (!session) return;
    session.moved = true;

    if (session.handle === 'move') {
      onUpdateLayerLive(session.layerId, {
        x: session.origX + (x - session.startX),
        y: session.origY + (y - session.startY),
      });
    } else if (session.handle === 'rotate') {
      const curAngle = Math.atan2(y - session.origY, x - session.origX);
      let nextRot = session.origRotation + (curAngle - session.startAngle);
      // Snap gently to 0 deg when close
      if (Math.abs(nextRot) < 0.05) nextRot = 0;
      onUpdateLayerLive(session.layerId, { rotation: nextRot });
    } else {
      const curDist = Math.max(14, Math.hypot(x - session.origX, y - session.origY));
      const ratio = Math.max(0.2, Math.min(5, curDist / session.startDist));
      onUpdateLayerLive(session.layerId, {
        scaleX: session.origScaleX * ratio,
        scaleY: session.origScaleY * ratio,
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }

    if (liquifyPaintingRef.current) {
      liquifyPaintingRef.current = false;
      lastLiquifyPtRef.current = null;
      onCommitSnapshot();
      return;
    }

    if (dragRef.current) {
      const wasMoved = dragRef.current.moved;
      dragRef.current = null;
      if (wasMoved) onCommitSnapshot();
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool !== 'select') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = toCanvasCoords(e.clientX, e.clientY);
    const hit = renderer.hitTest(canvas.getContext('2d')!, layers, selectedLayerId, x, y);
    if (!hit) return;
    const layer = layers.find((l) => l.id === hit.layerId);
    if (layer && (layer.type === 'text' || layer.type === 'bubble')) {
      onSelectLayer(layer.id);
      setInlineEditId(layer.id);
    }
  };

  const editingLayer = inlineEditId
    ? layers.find((l) => l.id === inlineEditId && (l.type === 'text' || l.type === 'bubble'))
    : null;

  const displayBrushPx = (() => {
    const canvas = canvasRef.current;
    if (!canvas) return 60;
    const rect = canvas.getBoundingClientRect();
    const minDisplay = Math.min(rect.width, rect.height);
    return Math.max(16, liquifyRadius * minDisplay * 2);
  })();

  return (
    <section
      className="flex-1 min-w-0 min-h-0 studio-stage-bg relative flex flex-col items-center justify-between p-4 sm:p-6 overflow-hidden select-none"
      onDragOver={(e) => {
        e.preventDefault();
        setDragFileOver(true);
      }}
      onDragLeave={() => setDragFileOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragFileOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
          onDropImageFile(file);
        }
      }}
    >
      {/* Subtle Top Status Hint */}
      <div className="w-full flex items-center justify-between text-[11px] text-zinc-400 pointer-events-none z-10">
        <span>
          {tool === 'liquify'
            ? '哈哈镜模式：在画面上点击或涂抹（眼睛/下巴/脸部），瞬间魔性畸变'
            : '选择模式：拖拽移动 · 四角缩放 · 顶部圆点旋转 · 双击文字直接改字'}
        </span>
        <span className="font-mono hidden sm:inline text-zinc-500">
          {width} × {height}px
        </span>
      </div>

      {/* Main Canvas Stage Frame */}
      <div className="flex-1 w-full min-h-0 flex items-center justify-center py-3">
        <div
          className={`relative max-w-full max-h-full rounded-xl overflow-hidden border transition-shadow ${
            dragFileOver
              ? 'border-[#d9ff00] shadow-[0_0_40px_rgba(217,255,0,0.3)]'
              : 'border-white/15 shadow-[0_24px_80px_rgba(0,0,0,0.75)]'
          }`}
          style={{
            aspectRatio: `${width} / ${height}`,
            height: width <= height ? '100%' : 'auto',
            width: width > height ? '100%' : 'auto',
            maxWidth: '100%',
            maxHeight: '100%',
          }}
        >
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={() => setHoverBrush((b) => ({ ...b, visible: false }))}
            onDoubleClick={handleDoubleClick}
            className={`block w-full h-full touch-none ${
              tool === 'liquify' ? 'cursor-crosshair' : 'cursor-default'
            }`}
          />

          {/* Live Liquify Brush Preview Ring */}
          {tool === 'liquify' && hoverBrush.visible && (
            <div
              className="pointer-events-none absolute rounded-full border-2 border-[#d9ff00] bg-[#d9ff00]/10 shadow-[0_0_12px_rgba(217,255,0,0.35)]"
              style={{
                width: `${displayBrushPx}px`,
                height: `${displayBrushPx}px`,
                left: `${hoverBrush.x - displayBrushPx / 2}px`,
                top: `${hoverBrush.y - displayBrushPx / 2}px`,
              }}
            />
          )}

          {/* Inline Double-Click Text Editor Popover */}
          {editingLayer && (editingLayer.type === 'text' || editingLayer.type === 'bubble') && (
            <div
              className="absolute inset-x-4 bottom-4 z-30 rounded-xl bg-[#10121a]/95 backdrop-blur-md border border-[#d9ff00]/60 p-3 shadow-2xl flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <textarea
                autoFocus
                rows={2}
                value={editingLayer.text}
                onChange={(e) => onUpdateLayerLive(editingLayer.id, { text: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Escape' || ((e.ctrlKey || e.metaKey) && e.key === 'Enter')) {
                    setInlineEditId(null);
                    onCommitSnapshot();
                  }
                }}
                className="flex-1 bg-black/50 border border-white/15 rounded-lg px-2.5 py-1.5 text-sm text-white outline-none focus:border-[#d9ff00] resize-none"
                placeholder="输入文案（支持换行）"
              />
              <button
                type="button"
                onClick={() => {
                  setInlineEditId(null);
                  onCommitSnapshot();
                }}
                className="px-3 py-2 rounded-lg text-xs font-black bg-[#d9ff00] text-black shrink-0"
              >
                完成
              </button>
            </div>
          )}

          {/* Drag-drop File Overlay */}
          {dragFileOver && (
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-[#d9ff00] z-20 pointer-events-none">
              <span className="text-base font-black">松开鼠标，立即导入画布二创！</span>
            </div>
          )}

          {/* AI Generating Frosted Overlay */}
          {generating && (
            <div className="absolute inset-0 bg-[#0b0c10]/80 backdrop-blur-md flex flex-col items-center justify-center gap-3 z-30 p-6 text-center">
              <Loader2 className="w-9 h-9 text-[#d9ff00] animate-spin" />
              <div className="text-sm font-black text-white">AI 灵魂画师正在疯狂作画中...</div>
              <p className="text-xs text-zinc-400">生成完成后会自动进入画布，保留你所有的贴纸与梗字</p>
              <button
                type="button"
                onClick={onCancelAi}
                className="mt-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-rose-500/30 text-zinc-200 border border-white/15 transition"
              >
                中止请求
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Tool Dock */}
      <div className="z-20 flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-[#141722]/92 backdrop-blur-md border border-white/12 px-2.5 py-2 shadow-2xl">
        {/* Select vs Liquify Switch */}
        <div className="flex items-center bg-black/40 rounded-xl p-0.5 border border-white/8">
          <button
            type="button"
            onClick={() => onChangeTool('select')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              tool === 'select'
                ? 'bg-[#d9ff00] text-black'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            <MousePointer2 className="w-3.5 h-3.5" />
            选择/排版
          </button>
          <button
            type="button"
            onClick={() => {
              onChangeTool('liquify');
              onSelectLayer(null);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              tool === 'liquify'
                ? 'bg-[#ff2e93] text-white shadow-[0_0_16px_rgba(255,46,147,0.4)]'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            哈哈镜笔刷
            {liquifyStrokes.length > 0 && (
              <span className="text-[10px] px-1.5 rounded-full bg-black/30">
                {liquifyStrokes.length}
              </span>
            )}
          </button>
        </div>

        {/* Contextual Liquify Controls */}
        {tool === 'liquify' && (
          <div className="flex flex-wrap items-center gap-2 pl-1 border-l border-white/10">
            <div className="flex items-center gap-1">
              {(
                [
                  { id: 'bulge', label: '膨胀', icon: <ZoomIn className="w-3 h-3" /> },
                  { id: 'pinch', label: '收缩', icon: <ZoomOut className="w-3 h-3" /> },
                  { id: 'swirl-cw', label: '右旋', icon: <RotateCw className="w-3 h-3" /> },
                  { id: 'swirl-ccw', label: '左旋', icon: <RotateCcw className="w-3 h-3" /> },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onChangeLiquifyMode(m.id)}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border transition ${
                    liquifyMode === m.id
                      ? 'bg-[#ff2e93]/20 border-[#ff2e93] text-pink-200'
                      : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  {m.icon}
                  {m.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 w-24">
              <span className="text-[10px] text-zinc-400 shrink-0">半径</span>
              <input
                type="range"
                min={8}
                max={36}
                value={Math.round(liquifyRadius * 100)}
                onChange={(e) => onChangeLiquifyRadius(Number(e.target.value) / 100)}
                className="studio-slider"
              />
            </div>

            <div className="flex items-center gap-1.5 w-24">
              <span className="text-[10px] text-zinc-400 shrink-0">力度</span>
              <input
                type="range"
                min={20}
                max={100}
                value={Math.round(liquifyStrength * 100)}
                onChange={(e) => onChangeLiquifyStrength(Number(e.target.value) / 100)}
                className="studio-slider"
              />
            </div>

            <button
              type="button"
              onClick={onUndoLiquifyStroke}
              disabled={liquifyStrokes.length === 0}
              title="撤回上一笔畸变"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 disabled:opacity-30"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClearLiquify}
              disabled={liquifyStrokes.length === 0}
              title="还原全部哈哈镜畸变"
              className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-white/5 hover:bg-rose-500/20 text-zinc-300 hover:text-rose-200 disabled:opacity-30"
            >
              还原
            </button>
          </div>
        )}

        {/* Hold to Compare Original */}
        <button
          type="button"
          onPointerDown={() => setCompareOriginal(true)}
          onPointerUp={() => setCompareOriginal(false)}
          onPointerLeave={() => setCompareOriginal(false)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
            compareOriginal
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
              : 'bg-white/5 border-white/10 text-zinc-300 hover:text-white'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">按住看原图</span>
        </button>

        {/* Animation Play / Pause quick pill */}
        {animation.preset !== 'none' && (
          <button
            type="button"
            onClick={onToggleAnimPlay}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-purple-500/20 border border-purple-400/50 text-purple-200 hover:bg-purple-500/30 transition"
          >
            {animation.playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{animation.playing ? '动效中' : '已暂停'}</span>
          </button>
        )}
      </div>
    </section>
  );
};
