import React, { useRef, useState } from 'react';
import {
  Sparkles,
  Image as ImageIcon,
  Type,
  Sticker,
  Dices,
  Upload,
  KeyRound,
  AlertTriangle,
  X,
  Trash2,
  Clock,
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
} from 'lucide-react';
import type {
  AIProviderId,
  AIStyleId,
  BubbleStyle,
  SavedProject,
  TextPresetStyle,
} from '../types/studio';
import { AI_PROVIDERS, AI_STYLES, CREATIVE_PROMPTS, buildDirectedPrompt } from '../engines/aiProviders';
import { STUDIO_TEMPLATES } from '../assets/templates';
import { STICKER_LIBRARY, getStickerDataUrl } from '../assets/stickers';

export type LeftTabId = 'ai' | 'templates' | 'text' | 'stickers';

interface LeftPanelProps {
  activeTab: LeftTabId;
  onChangeTab: (tab: LeftTabId) => void;
  // AI Generation
  prompt: string;
  onChangePrompt: (v: string) => void;
  aiStyle: AIStyleId;
  onChangeAiStyle: (id: AIStyleId) => void;
  aiChaos: number;
  onChangeAiChaos: (v: number) => void;
  aiSeed: number;
  lockSeed: boolean;
  onToggleLockSeed: () => void;
  onRollSeed: () => void;
  customFinalPrompt: string;
  onChangeCustomFinalPrompt: (v: string) => void;
  activeProvider: AIProviderId;
  hasActiveKey: boolean;
  generating: boolean;
  aiError: string | null;
  onDismissAiError: () => void;
  onGenerateAi: () => void;
  onCancelAi: () => void;
  onOpenApiModal: () => void;
  // Templates & Upload & Projects
  activeTemplateId: string | null;
  onSelectTemplate: (templateId: string) => void;
  onUploadFile: (file: File) => void;
  savedProjects: SavedProject[];
  onLoadProject: (project: SavedProject) => void;
  onDeleteProject: (id: string) => void;
  // Text & Bubble & Stickers
  onAddText: (preset: TextPresetStyle, text?: string) => void;
  onAddBubble: (style: BubbleStyle, text?: string) => void;
  onAddSticker: (stickerId: string) => void;
}

const QUICK_SLOGANS = [
  '精神状态极其超前',
  '这合理吗？很合理',
  '破大防了家人们',
  '大脑已过载 99%',
  '别问，问就是优雅',
  '我看谁今天敢提需求',
  '已老实，求放过',
  'AI看了连夜拔电源',
];

export const LeftPanel: React.FC<LeftPanelProps> = ({
  activeTab,
  onChangeTab,
  prompt,
  onChangePrompt,
  aiStyle,
  onChangeAiStyle,
  aiChaos,
  onChangeAiChaos,
  aiSeed,
  lockSeed,
  onToggleLockSeed,
  onRollSeed,
  customFinalPrompt,
  onChangeCustomFinalPrompt,
  activeProvider,
  hasActiveKey,
  generating,
  aiError,
  onDismissAiError,
  onGenerateAi,
  onCancelAi,
  onOpenApiModal,
  activeTemplateId,
  onSelectTemplate,
  onUploadFile,
  savedProjects,
  onLoadProject,
  onDeleteProject,
  onAddText,
  onAddBubble,
  onAddSticker,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPromptDirector, setShowPromptDirector] = useState(false);

  const providerMeta = AI_PROVIDERS.find((p) => p.id === activeProvider) ?? AI_PROVIDERS[0];
  const autoExpandedPrompt = buildDirectedPrompt(
    prompt || CREATIVE_PROMPTS[0],
    aiStyle,
    aiChaos,
    activeProvider === 'siliconflow',
  );

  const tabs: { id: LeftTabId; label: string; icon: React.ReactNode }[] = [
    { id: 'ai', label: 'AI 生图', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'templates', label: '底图/库', icon: <ImageIcon className="w-3.5 h-3.5" /> },
    { id: 'text', label: '文字气泡', icon: <Type className="w-3.5 h-3.5" /> },
    { id: 'stickers', label: '贴纸', icon: <Sticker className="w-3.5 h-3.5" /> },
  ];

  const handleRandomPrompt = () => {
    const pool = CREATIVE_PROMPTS.filter((p) => p !== prompt.trim());
    const next = pool[Math.floor(Math.random() * pool.length)] ?? CREATIVE_PROMPTS[0];
    onChangePrompt(next);
  };

  return (
    <aside className="w-full lg:w-[320px] shrink-0 border-b lg:border-b-0 lg:border-r border-white/10 bg-[#12141c] flex flex-col min-h-0">
      {/* Tab Bar */}
      <div className="grid grid-cols-4 border-b border-white/10 p-1.5 gap-1 bg-[#0e1017] shrink-0">
        {tabs.map((t) => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChangeTab(t.id)}
              className={`flex items-center justify-center gap-1 py-2 px-1 rounded-lg text-[11px] font-bold transition ${
                active
                  ? 'bg-[#1c2030] text-[#d9ff00] shadow-inner border border-[#d9ff00]/25'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {activeTab === 'ai' && (
          <>
            {/* Active Provider Strip */}
            <div className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2">
              <div className="min-w-0">
                <div className="text-[11px] text-zinc-400">当前生图引擎</div>
                <div className="text-xs font-bold text-zinc-100 truncate flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      hasActiveKey ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                  {providerMeta.name}
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenApiModal}
                className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white/10 hover:bg-white/15 text-[#d9ff00] transition"
              >
                <KeyRound className="w-3 h-3" />
                {hasActiveKey ? '切换' : '去填 Key'}
              </button>
            </div>

            {/* Prompt Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-200">输入你的离谱脑洞</label>
                <button
                  type="button"
                  onClick={handleRandomPrompt}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-[#d9ff00] transition"
                >
                  <Dices className="w-3.5 h-3.5" />
                  随机灵感
                </button>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => onChangePrompt(e.target.value)}
                rows={3}
                placeholder="例如：数学家梵高在星空下疯狂推导反向传播公式..."
                className="w-full rounded-xl bg-[#0b0d13] border border-white/12 focus:border-[#d9ff00]/70 px-3 py-2.5 text-xs leading-relaxed text-zinc-100 placeholder:text-zinc-500 outline-none resize-none transition"
              />
              <div className="flex flex-wrap gap-1.5">
                {CREATIVE_PROMPTS.slice(0, 4).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onChangePrompt(item)}
                    className="text-[11px] px-2 py-1 rounded-md bg-white/[0.04] hover:bg-white/10 border border-white/8 text-zinc-300 truncate max-w-[140px] transition"
                    title={item}
                  >
                    {item.slice(0, 9)}…
                  </button>
                ))}
              </div>
            </div>

            {/* AI Style Presets */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-zinc-200">魔性画风导演</div>
              <div className="grid grid-cols-2 gap-2">
                {AI_STYLES.map((st) => {
                  const active = aiStyle === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => onChangeAiStyle(st.id)}
                      className={`text-left p-2.5 rounded-xl border transition ${
                        active
                          ? 'bg-[#d9ff00]/10 border-[#d9ff00]/70 text-white'
                          : 'bg-white/[0.03] border-white/8 text-zinc-300 hover:border-white/20'
                      }`}
                    >
                      <div className="text-xs font-bold">{st.name}</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">{st.shortDesc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chaos & Seed */}
            <div className="rounded-xl bg-white/[0.03] border border-white/8 p-3 space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-300">魔性夸张度</span>
                  <span className="font-mono text-[11px] text-[#d9ff00]">{aiChaos}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={aiChaos}
                  onChange={(e) => onChangeAiChaos(Number(e.target.value))}
                  className="studio-slider"
                />
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-white/8 text-xs">
                <span className="text-zinc-400">随机种子</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] text-zinc-300 bg-black/40 px-2 py-0.5 rounded">
                    #{aiSeed}
                  </span>
                  <button
                    type="button"
                    onClick={onRollSeed}
                    title="换个新种子"
                    className="p-1 rounded bg-white/5 hover:bg-white/10 text-zinc-300"
                  >
                    <Dices className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={onToggleLockSeed}
                    title={lockSeed ? '已锁定种子' : '每次生成自动随机'}
                    className={`p-1 rounded transition ${
                      lockSeed ? 'bg-[#d9ff00]/20 text-[#d9ff00]' : 'bg-white/5 text-zinc-400'
                    }`}
                  >
                    {lockSeed ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Expandable Prompt Director */}
            <div className="rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden">
              <button
                type="button"
                onClick={() => setShowPromptDirector((v) => !v)}
                className="w-full px-3 py-2 flex items-center justify-between text-[11px] font-semibold text-zinc-400 hover:text-zinc-200"
              >
                <span>查看 / 微调最终发送咒语</span>
                {showPromptDirector ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
              {showPromptDirector && (
                <div className="px-3 pb-3 space-y-1.5">
                  <textarea
                    value={customFinalPrompt}
                    onChange={(e) => onChangeCustomFinalPrompt(e.target.value)}
                    rows={3}
                    placeholder={autoExpandedPrompt}
                    className="w-full rounded-lg bg-[#090a0e] border border-white/10 p-2 text-[11px] font-mono text-zinc-300 placeholder:text-zinc-500 outline-none"
                  />
                  <div className="text-[10px] text-zinc-500">
                    留空则由 Prompt 导演自动结合画风与夸张度生成。
                  </div>
                </div>
              )}
            </div>

            {/* Error Card (Never overwrites canvas!) */}
            {aiError && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed break-words">{aiError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={onDismissAiError}
                    className="text-rose-300 hover:text-white shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onOpenApiModal}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-100 font-semibold text-[11px]"
                  >
                    检查 API 配置
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeTab('templates')}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-zinc-100 font-semibold text-[11px]"
                  >
                    用本地/模板直接玩
                  </button>
                </div>
              </div>
            )}

            {/* Generate CTA */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onGenerateAi}
                disabled={generating}
                className="flex-1 py-2.5 px-4 rounded-xl font-black text-xs bg-gradient-to-r from-[#d9ff00] to-[#9ef01a] hover:brightness-105 text-black shadow-[0_6px_24px_rgba(217,255,0,0.2)] disabled:opacity-50 transition flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                {generating ? 'AI 疯狂作画中...' : '生成魔性底图'}
              </button>
              {generating && (
                <button
                  type="button"
                  onClick={onCancelAi}
                  className="px-3 py-2.5 rounded-xl text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40"
                >
                  取消
                </button>
              )}
            </div>
          </>
        )}

        {activeTab === 'templates' && (
          <>
            {/* Local Upload & Paste Dropzone */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUploadFile(file);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl border-2 border-dashed border-white/15 hover:border-[#d9ff00]/60 bg-white/[0.02] hover:bg-[#d9ff00]/[0.04] p-4 flex flex-col items-center gap-1.5 text-center transition"
              >
                <Upload className="w-5 h-5 text-[#d9ff00]" />
                <span className="text-xs font-bold text-zinc-100">导入本地照片 / 表情包二创</span>
                <span className="text-[11px] text-zinc-400">
                  支持拖拽到画布，或直接按 <kbd className="px-1 py-0.5 rounded bg-white/10 text-zinc-200">Ctrl+V</kbd> 粘贴截图
                </span>
              </button>
            </div>

            {/* Built-in Original Starter Templates */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200">免 Key 精选魔性模板</span>
                <span className="text-[10px] text-zinc-500">点击即刻开玩</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {STUDIO_TEMPLATES.map((tpl) => {
                  const active = activeTemplateId === tpl.id;
                  const thumb = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(tpl.svg)}`;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => onSelectTemplate(tpl.id)}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition ${
                        active
                          ? 'border-[#d9ff00]/70 bg-[#d9ff00]/10'
                          : 'border-white/8 bg-white/[0.03] hover:border-white/20'
                      }`}
                    >
                      <img
                        src={thumb}
                        alt={tpl.name}
                        className="w-14 h-14 rounded-lg object-cover border border-white/10 shrink-0 bg-black"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-zinc-100 truncate">{tpl.name}</span>
                          <span className="text-[10px] font-mono px-1 rounded bg-white/10 text-zinc-400">
                            {tpl.aspectRatio}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5">{tpl.tagline}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Saved Projects (IndexedDB) */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  本地工程库 ({savedProjects.length})
                </span>
                <span className="text-[10px] text-zinc-500">刷新不丢失 · 可二次编辑</span>
              </div>
              {savedProjects.length === 0 ? (
                <div className="rounded-xl bg-white/[0.02] border border-white/8 p-3 text-[11px] text-zinc-500 text-center">
                  点击顶部「存工程」即可保存完整图层与滤镜状态
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {savedProjects.map((proj) => (
                    <div
                      key={proj.id}
                      className="group relative rounded-xl overflow-hidden border border-white/10 bg-[#0b0c10]"
                    >
                      <button
                        type="button"
                        onClick={() => onLoadProject(proj)}
                        className="w-full text-left block"
                      >
                        <img
                          src={proj.thumbnailDataUrl}
                          alt={proj.title}
                          className="w-full aspect-square object-cover group-hover:scale-105 transition duration-200"
                        />
                        <div className="p-1.5 bg-black/75 text-[10px] font-semibold text-zinc-200 truncate">
                          {proj.title}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteProject(proj.id)}
                        title="删除工程"
                        className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/75 text-zinc-300 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'text' && (
          <>
            <div className="space-y-2">
              <div className="text-xs font-bold text-zinc-200">添加梗字图层（画布可自由拖拽）</div>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'meme-impact', label: '经典梗图大字', preview: '白字黑粗边', accent: 'text-white' },
                    { id: 'acid-pop', label: '酸性潮玩大字', preview: '荧光黄炸裂', accent: 'text-[#d9ff00]' },
                    { id: 'danmaku', label: '斜角弹幕吐槽', preview: '洋红撞白边', accent: 'text-[#ff2e93]' },
                    { id: 'warning-tape', label: '高能警示黑条', preview: '黄底黑字条', accent: 'text-amber-300' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onAddText(item.id)}
                    className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-left transition"
                  >
                    <div className={`text-xs font-black ${item.accent}`}>{item.label}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">{item.preview}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-zinc-200">添加漫画对白气泡</div>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'shout', label: '尖叫爆炸框', desc: '高能怒吼专用' },
                    { id: 'speech', label: '漫画对白框', desc: '经典带尖角对话' },
                    { id: 'thought', label: '内心 OS 云朵', desc: '表面微笑内心疯' },
                    { id: 'stamp', label: '硬核吐槽签', desc: '高反差粗黑阴影' },
                  ] as const
                ).map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => onAddBubble(b.id)}
                    className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-left transition"
                  >
                    <div className="text-xs font-bold text-zinc-100">{b.label}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">{b.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-zinc-200">一键插入高频热梗金句</div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_SLOGANS.map((txt) => (
                  <button
                    key={txt}
                    type="button"
                    onClick={() => onAddText('meme-impact', txt)}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-white/[0.04] hover:bg-[#d9ff00]/15 hover:text-[#d9ff00] border border-white/10 text-zinc-300 transition"
                  >
                    + {txt}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'stickers' && (
          <div className="space-y-3">
            <div className="text-xs font-bold text-zinc-200">
              高清矢量魔性贴纸（点击投入画布）
            </div>
            <div className="grid grid-cols-2 gap-2">
              {STICKER_LIBRARY.map((stk) => (
                <button
                  key={stk.id}
                  type="button"
                  onClick={() => onAddSticker(stk.id)}
                  className="group p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-[#d9ff00]/50 flex flex-col items-center gap-2 transition"
                >
                  <div className="h-14 w-full flex items-center justify-center">
                    <img
                      src={getStickerDataUrl(stk.id)}
                      alt={stk.label}
                      className="max-h-14 max-w-full object-contain group-hover:scale-110 transition duration-150"
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-zinc-300 group-hover:text-white">
                    {stk.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
