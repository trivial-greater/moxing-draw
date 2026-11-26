import React from 'react';
import {
  Undo2,
  Redo2,
  Download,
  Copy,
  Film,
  KeyRound,
  Save,
  Sparkles,
  Wifi,
  WifiOff,
} from 'lucide-react';
import type { AIProviderId, AspectRatioId } from '../types/studio';

interface TopBarProps {
  aspectRatio: AspectRatioId;
  onChangeAspectRatio: (ratio: AspectRatioId) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSaveProject: () => void;
  onCopyPng: () => void;
  onDownloadPng: () => void;
  onExportGif: () => void;
  exportingGif: boolean;
  gifProgress: number;
  activeProvider: AIProviderId;
  hasActiveKey: boolean;
  proxyReady: boolean | null;
  onOpenApiModal: () => void;
}

const RATIOS: AspectRatioId[] = ['1:1', '3:4', '4:3', '16:9'];

export const TopBar: React.FC<TopBarProps> = ({
  aspectRatio,
  onChangeAspectRatio,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSaveProject,
  onCopyPng,
  onDownloadPng,
  onExportGif,
  exportingGif,
  gifProgress,
  activeProvider,
  hasActiveKey,
  proxyReady,
  onOpenApiModal,
}) => {
  return (
    <header className="h-14 shrink-0 border-b border-white/10 bg-[#101219] px-3 sm:px-4 flex items-center justify-between gap-2 select-none">
      {/* Brand */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-[#d9ff00] text-black flex items-center justify-center shadow-[0_0_16px_rgba(217,255,0,0.28)] shrink-0">
          <Sparkles className="w-4 h-4 stroke-[2.5]" />
        </div>
        <div className="leading-tight truncate">
          <div className="flex items-center gap-1.5">
            <span className="font-black tracking-tight text-sm sm:text-base text-white">
              MOXING STUDIO
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-[#d9ff00] border border-[#d9ff00]/30">
              v3.0
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 hidden md:block">
            灵魂魔性工坊 · AI 生图 / 哈哈镜 / 梗图动图
          </p>
        </div>
        {proxyReady !== null && (
          <span
            title={
              proxyReady
                ? '内置 API/图片代理已就绪，自动解决硅基流动等跨域问题'
                : '当前为纯静态运行模式，支持本地二创与可跨域接口'
            }
            className={`hidden xl:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${
              proxyReady
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
            }`}
          >
            {proxyReady ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {proxyReady ? '零跨域代理就绪' : '纯静态模式'}
          </span>
        )}
      </div>

      {/* Center Canvas Controls */}
      <div className="hidden lg:flex items-center gap-2">
        <div className="flex items-center rounded-lg bg-white/5 border border-white/10 p-0.5">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title="撤销 (Ctrl+Z)"
            className="p-1.5 rounded-md text-zinc-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title="重做 (Ctrl+Y)"
            className="p-1.5 rounded-md text-zinc-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center rounded-lg bg-white/5 border border-white/10 p-0.5 text-xs font-semibold">
          {RATIOS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onChangeAspectRatio(r)}
              className={`px-2 py-1 rounded-md transition ${
                aspectRatio === r
                  ? 'bg-white/15 text-[#d9ff00]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onSaveProject}
          title="保存当前工程到作品库（保留所有可编辑图层）"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 transition"
        >
          <Save className="w-3.5 h-3.5 text-cyan-400" />
          存工程
        </button>
      </div>

      {/* Right API & Export */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={onOpenApiModal}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 transition"
        >
          <KeyRound className="w-3.5 h-3.5 text-[#d9ff00]" />
          <span className="hidden sm:inline">API 配置</span>
          <span
            className={`w-2 h-2 rounded-full ${hasActiveKey ? 'bg-emerald-400' : 'bg-zinc-500'}`}
            title={hasActiveKey ? `${activeProvider} 已配置 Key` : '未配置 API Key'}
          />
        </button>

        <button
          type="button"
          onClick={onCopyPng}
          title="复制 PNG 到剪贴板"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 transition"
        >
          <Copy className="w-3.5 h-3.5" />
          <span className="hidden md:inline">复制</span>
        </button>

        <button
          type="button"
          onClick={onDownloadPng}
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-100 hover:bg-white text-zinc-950 transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>PNG</span>
        </button>

        <button
          type="button"
          onClick={onExportGif}
          disabled={exportingGif}
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-black bg-[#d9ff00] hover:bg-[#e7ff4d] text-black shadow-[0_0_20px_rgba(217,255,0,0.25)] disabled:opacity-60 transition"
        >
          <Film className="w-3.5 h-3.5" />
          <span>{exportingGif ? `GIF ${gifProgress}%` : '导出 GIF'}</span>
        </button>
      </div>
    </header>
  );
};
