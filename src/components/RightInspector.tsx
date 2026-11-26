import React, { useState } from 'react';
import {
  Sliders,
  Layers,
  Film,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  FlipHorizontal,
  RotateCcw,
  Play,
  Pause,
} from 'lucide-react';
import type {
  AnimationPreset,
  AnimationState,
  BubbleStyle,
  CanvasLayer,
  FilterState,
} from '../types/studio';
import { DEFAULT_FILTERS } from '../types/studio';
import { FILTER_PRESETS } from '../editor/layerFactory';

type InspectorTab = 'fx' | 'layers' | 'motion';

interface RightInspectorProps {
  layers: CanvasLayer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateLayer: (id: string, patch: Partial<CanvasLayer>, commit?: boolean) => void;
  onDeleteLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onMoveLayerOrder: (id: string, dir: 'up' | 'down') => void;
  filters: FilterState;
  onChangeFilters: (next: FilterState, commit?: boolean) => void;
  animation: AnimationState;
  onChangeAnimation: (next: AnimationState) => void;
  gifFps: number;
  onChangeGifFps: (fps: number) => void;
  gifMaxSide: number;
  onChangeGifMaxSide: (size: number) => void;
  onExportGif: () => void;
  exportingGif: boolean;
  gifProgress: number;
}

const SWATCHES = ['#ffffff', '#d9ff00', '#ff2e93', '#22d3ee', '#facc15', '#ef4444', '#0b0c10'];

const ANIM_PRESETS: { id: AnimationPreset; label: string; desc: string }[] = [
  { id: 'none', label: '静止原图', desc: '关闭动效' },
  { id: 'shake', label: '高频鬼畜震', desc: '红温破防抖动' },
  { id: 'bounce', label: '蹦迪心跳弹', desc: '节奏感缩放弹跳' },
  { id: 'glitch', label: '故障信号抽搐', desc: '赛博失真撕裂' },
  { id: 'rainbow', label: '彩虹精神污染', desc: '全色相魔性循环' },
  { id: 'spin', label: '魔性摇摆晃', desc: '失重晕眩摇晃' },
];

export const RightInspector: React.FC<RightInspectorProps> = ({
  layers,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  onDeleteLayer,
  onDuplicateLayer,
  onMoveLayerOrder,
  filters,
  onChangeFilters,
  animation,
  onChangeAnimation,
  gifFps,
  onChangeGifFps,
  gifMaxSide,
  onChangeGifMaxSide,
  onExportGif,
  exportingGif,
  gifProgress,
}) => {
  const [tab, setTab] = useState<InspectorTab>('fx');
  const selectedLayer = layers.find((l) => l.id === selectedLayerId) ?? null;

  const filterSliders: { key: keyof FilterState; label: string; min?: number; max?: number }[] = [
    { key: 'deepFry', label: '电子包浆 (Deep-Fry)' },
    { key: 'pixelate', label: '复古像素化' },
    { key: 'rgbShift', label: 'RGB 色散错位' },
    { key: 'glitch', label: '赛博故障 + CRT' },
    { key: 'halftone', label: '暴漫黑白网点' },
    { key: 'speedlines', label: '漫画冲击速度线' },
    { key: 'vignette', label: '暗房戏剧暗角' },
    { key: 'hueShift', label: '色相魔性偏移', min: -180, max: 180 },
  ];

  return (
    <aside className="w-full lg:w-[300px] shrink-0 border-t lg:border-t-0 lg:border-l border-white/10 bg-[#12141c] flex flex-col min-h-0">
      {/* Top Switcher */}
      <div className="grid grid-cols-3 border-b border-white/10 p-1.5 gap-1 bg-[#0e1017] shrink-0">
        <button
          type="button"
          onClick={() => setTab('fx')}
          className={`flex items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-bold transition ${
            tab === 'fx'
              ? 'bg-[#1c2030] text-[#d9ff00] border border-[#d9ff00]/25'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          属性/滤镜
        </button>
        <button
          type="button"
          onClick={() => setTab('layers')}
          className={`flex items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-bold transition ${
            tab === 'layers'
              ? 'bg-[#1c2030] text-[#d9ff00] border border-[#d9ff00]/25'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          图层 ({layers.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('motion')}
          className={`flex items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-bold transition ${
            tab === 'motion'
              ? 'bg-[#1c2030] text-[#d9ff00] border border-[#d9ff00]/25'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          动图 GIF
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {tab === 'fx' && (
          <>
            {/* Selected Layer Inspector Card */}
            {selectedLayer && (
              <div className="rounded-xl bg-[#181b26] border border-[#d9ff00]/35 p-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-[#d9ff00] truncate">
                    选中：{selectedLayer.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onDuplicateLayer(selectedLayer.id)}
                      title="复制图层"
                      className="p-1 rounded bg-white/5 hover:bg-white/15 text-zinc-300"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteLayer(selectedLayer.id)}
                      title="删除图层 (Delete)"
                      className="p-1 rounded bg-white/5 hover:bg-rose-500/25 text-zinc-300 hover:text-rose-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Text & Bubble Content Editing */}
                {(selectedLayer.type === 'text' || selectedLayer.type === 'bubble') && (
                  <div className="space-y-2.5">
                    <textarea
                      rows={2}
                      value={selectedLayer.text}
                      onChange={(e) => onUpdateLayer(selectedLayer.id, { text: e.target.value }, false)}
                      onBlur={() => onUpdateLayer(selectedLayer.id, {}, true)}
                      className="w-full rounded-lg bg-[#0b0d13] border border-white/12 px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#d9ff00] resize-none"
                    />

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-zinc-400">
                        <span>字号</span>
                        <span className="font-mono text-zinc-200">{selectedLayer.fontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min={16}
                        max={96}
                        value={selectedLayer.fontSize}
                        onChange={(e) =>
                          onUpdateLayer(selectedLayer.id, { fontSize: Number(e.target.value) }, false)
                        }
                        onMouseUp={() => onUpdateLayer(selectedLayer.id, {}, true)}
                        className="studio-slider"
                      />
                    </div>

                    {/* Colors */}
                    <div className="space-y-1.5">
                      <div className="text-[11px] text-zinc-400">
                        {selectedLayer.type === 'text' ? '文字颜色' : '气泡底色'}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {SWATCHES.map((col) => (
                          <button
                            key={col}
                            type="button"
                            onClick={() => onUpdateLayer(selectedLayer.id, { fill: col }, true)}
                            className={`w-5 h-5 rounded-full border-2 transition ${
                              selectedLayer.fill.toLowerCase() === col
                                ? 'border-[#d9ff00] scale-110'
                                : 'border-white/25'
                            }`}
                            style={{ backgroundColor: col }}
                          />
                        ))}
                        <input
                          type="color"
                          value={selectedLayer.fill}
                          onChange={(e) => onUpdateLayer(selectedLayer.id, { fill: e.target.value }, true)}
                          className="w-6 h-5 rounded cursor-pointer bg-transparent border-0"
                        />
                      </div>
                    </div>

                    {selectedLayer.type === 'text' && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-zinc-400">
                          <span>描边粗细</span>
                          <span className="font-mono text-zinc-200">{selectedLayer.strokeWidth}px</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={16}
                          value={selectedLayer.strokeWidth}
                          onChange={(e) =>
                            onUpdateLayer(selectedLayer.id, { strokeWidth: Number(e.target.value) }, false)
                          }
                          onMouseUp={() => onUpdateLayer(selectedLayer.id, {}, true)}
                          className="studio-slider"
                        />
                      </div>
                    )}

                    {selectedLayer.type === 'bubble' && (
                      <div className="grid grid-cols-4 gap-1">
                        {(['shout', 'speech', 'thought', 'stamp'] as BubbleStyle[]).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => onUpdateLayer(selectedLayer.id, { bubbleStyle: st }, true)}
                            className={`py-1 rounded text-[10px] font-bold border ${
                              selectedLayer.bubbleStyle === st
                                ? 'bg-[#d9ff00]/20 border-[#d9ff00] text-[#d9ff00]'
                                : 'bg-white/5 border-white/10 text-zinc-400'
                            }`}
                          >
                            {st === 'shout'
                              ? '爆炸'
                              : st === 'speech'
                                ? '对话'
                                : st === 'thought'
                                  ? '云朵'
                                  : '便签'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Sticker Controls */}
                {selectedLayer.type === 'sticker' && (
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateLayer(selectedLayer.id, { flipX: !selectedLayer.flipX }, true)
                    }
                    className="w-full py-1.5 rounded-lg text-xs font-bold bg-white/8 hover:bg-white/15 text-zinc-200 inline-flex items-center justify-center gap-1.5"
                  >
                    <FlipHorizontal className="w-3.5 h-3.5" />
                    水平镜像翻转
                  </button>
                )}

                {/* Common Opacity & Reset Angle */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-zinc-400">
                      <span>不透明度</span>
                      <span className="font-mono text-zinc-200">
                        {Math.round(selectedLayer.opacity * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={15}
                      max={100}
                      value={Math.round(selectedLayer.opacity * 100)}
                      onChange={(e) =>
                        onUpdateLayer(
                          selectedLayer.id,
                          { opacity: Number(e.target.value) / 100 },
                          false,
                        )
                      }
                      onMouseUp={() => onUpdateLayer(selectedLayer.id, {}, true)}
                      className="studio-slider"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateLayer(selectedLayer.id, { rotation: 0, scaleX: 1, scaleY: 1 }, true)
                      }
                      className="flex-1 py-1 rounded-lg text-[11px] font-semibold bg-white/5 hover:bg-white/10 text-zinc-300"
                    >
                      重置缩放旋转
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectLayer(null)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/5 hover:bg-white/10 text-zinc-400"
                    >
                      取消选中
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Global Filter Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200">一键魔性滤镜风格</span>
                <button
                  type="button"
                  onClick={() => onChangeFilters({ ...DEFAULT_FILTERS }, true)}
                  className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-[#d9ff00]"
                >
                  <RotateCcw className="w-3 h-3" />
                  重置
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {FILTER_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onChangeFilters({ ...p.values }, true)}
                    className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/8 hover:border-[#d9ff00]/45 text-left transition"
                  >
                    <div className="text-xs font-bold text-zinc-100">{p.label}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Precision Filter Sliders */}
            <div className="space-y-3 pt-1">
              <div className="text-xs font-bold text-zinc-200">像素级特效精调</div>
              {filterSliders.map(({ key, label, min = 0, max = 100 }) => (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-300 font-medium">{label}</span>
                    <span
                      className={`font-mono ${
                        filters[key] !== 0 ? 'text-[#d9ff00]' : 'text-zinc-500'
                      }`}
                    >
                      {filters[key]}
                      {key === 'hueShift' ? '°' : '%'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    value={filters[key]}
                    onChange={(e) =>
                      onChangeFilters({ ...filters, [key]: Number(e.target.value) }, false)
                    }
                    onMouseUp={() => onChangeFilters({ ...filters }, true)}
                    className="studio-slider"
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'layers' && (
          <div className="space-y-2">
            <div className="text-xs font-bold text-zinc-200">
              图层堆叠管理（上方图层覆盖下方）
            </div>
            {layers.length === 0 ? (
              <div className="rounded-xl bg-white/[0.02] border border-white/8 p-5 text-center text-xs text-zinc-500">
                画布暂无叠加图层，去左侧添加梗字、气泡或矢量贴纸吧！
              </div>
            ) : (
              <div className="space-y-1.5">
                {[...layers].reverse().map((layer, revIdx) => {
                  const isSel = layer.id === selectedLayerId;
                  const isTop = revIdx === 0;
                  const isBottom = revIdx === layers.length - 1;
                  return (
                    <div
                      key={layer.id}
                      onClick={() => onSelectLayer(layer.id)}
                      className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition ${
                        isSel
                          ? 'bg-[#d9ff00]/10 border-[#d9ff00]/60'
                          : 'bg-white/[0.03] border-white/8 hover:border-white/20'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateLayer(layer.id, { visible: !layer.visible }, true);
                        }}
                        className="p-1 text-zinc-400 hover:text-white"
                      >
                        {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-zinc-100 truncate">
                          {layer.type === 'text' || layer.type === 'bubble'
                            ? layer.text.slice(0, 14) || layer.name
                            : layer.name}
                        </div>
                        <div className="text-[10px] text-zinc-500 uppercase">{layer.type}</div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          disabled={isTop}
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveLayerOrder(layer.id, 'up');
                          }}
                          className="p-1 rounded hover:bg-white/10 text-zinc-400 disabled:opacity-25"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={isBottom}
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveLayerOrder(layer.id, 'down');
                          }}
                          className="p-1 rounded hover:bg-white/10 text-zinc-400 disabled:opacity-25"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteLayer(layer.id);
                          }}
                          className="p-1 rounded hover:bg-rose-500/20 text-zinc-400 hover:text-rose-300"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'motion' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-xs font-bold text-zinc-200">选择鬼畜动效（支持真 GIF 导出）</div>
              <div className="grid grid-cols-2 gap-1.5">
                {ANIM_PRESETS.map((a) => {
                  const active = animation.preset === a.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() =>
                        onChangeAnimation({ ...animation, preset: a.id, playing: a.id !== 'none' })
                      }
                      className={`p-2.5 rounded-xl border text-left transition ${
                        active
                          ? 'bg-purple-500/20 border-purple-400 text-white'
                          : 'bg-white/[0.03] border-white/8 text-zinc-300 hover:border-white/20'
                      }`}
                    >
                      <div className="text-xs font-bold">{a.label}</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">{a.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {animation.preset !== 'none' && (
              <div className="rounded-xl bg-white/[0.03] border border-white/8 p-3 space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-300">鬼畜速度</span>
                    <span className="font-mono text-[#d9ff00]">{animation.speed.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={25}
                    value={Math.round(animation.speed * 10)}
                    onChange={(e) =>
                      onChangeAnimation({ ...animation, speed: Number(e.target.value) / 10 })
                    }
                    className="studio-slider"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-300">鬼畜幅度</span>
                    <span className="font-mono text-[#d9ff00]">{animation.intensity}%</span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={100}
                    value={animation.intensity}
                    onChange={(e) =>
                      onChangeAnimation({ ...animation, intensity: Number(e.target.value) })
                    }
                    className="studio-slider"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onChangeAnimation({ ...animation, playing: !animation.playing })}
                  className="w-full py-1.5 rounded-lg text-xs font-bold bg-white/8 hover:bg-white/15 text-zinc-100 inline-flex items-center justify-center gap-1.5"
                >
                  {animation.playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {animation.playing ? '暂停实时预览' : '继续实时预览'}
                </button>
              </div>
            )}

            {/* GIF Export Card */}
            <div className="rounded-xl bg-[#181b26] border border-[#d9ff00]/30 p-3.5 space-y-3">
              <div className="text-xs font-black text-white">真实 GIF 表情包导出设置</div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="space-y-1">
                  <span className="text-zinc-400">尺寸规格</span>
                  <select
                    value={gifMaxSide}
                    onChange={(e) => onChangeGifMaxSide(Number(e.target.value))}
                    className="w-full rounded-lg bg-[#0b0d13] border border-white/12 px-2 py-1.5 text-zinc-200 outline-none"
                  >
                    <option value={320}>320px 微信极速</option>
                    <option value={460}>460px 高清均衡</option>
                    <option value={600}>600px 超清大图</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="text-zinc-400">流畅帧率</span>
                  <select
                    value={gifFps}
                    onChange={(e) => onChangeGifFps(Number(e.target.value))}
                    className="w-full rounded-lg bg-[#0b0d13] border border-white/12 px-2 py-1.5 text-zinc-200 outline-none"
                  >
                    <option value={10}>10 FPS（体积小）</option>
                    <option value={12}>12 FPS（推荐）</option>
                    <option value={15}>15 FPS（丝滑）</option>
                  </select>
                </div>
              </div>

              {exportingGif && (
                <div className="space-y-1">
                  <div className="h-2 rounded-full bg-black/50 overflow-hidden">
                    <div
                      className="h-full bg-[#d9ff00] transition-all duration-150"
                      style={{ width: `${gifProgress}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-zinc-400 text-right font-mono">
                    正在浏览器本地编码 GIF：{gifProgress}%
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={onExportGif}
                disabled={exportingGif}
                className="w-full py-2.5 rounded-xl text-xs font-black bg-[#d9ff00] hover:bg-[#e8ff4d] text-black disabled:opacity-60 transition inline-flex items-center justify-center gap-1.5"
              >
                <Film className="w-4 h-4" />
                {exportingGif ? `编码中 ${gifProgress}%...` : '一键渲染下载 GIF 动图'}
              </button>
              <p className="text-[10px] text-zinc-500 leading-relaxed">
                若当前为「静止原图」，点导出会自动应用轻微鬼畜抖动生成动态表情包。
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
