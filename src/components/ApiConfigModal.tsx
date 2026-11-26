import React, { useState } from 'react';
import { X, Eye, EyeOff, ExternalLink, ShieldCheck, Check } from 'lucide-react';
import type { AIProviderId, ProviderConfigMap } from '../types/studio';
import { AI_PROVIDERS } from '../engines/aiProviders';

interface ApiConfigModalProps {
  open: boolean;
  onClose: () => void;
  activeProvider: AIProviderId;
  onSelectProvider: (id: AIProviderId) => void;
  configs: ProviderConfigMap;
  onChangeConfigs: (next: ProviderConfigMap) => void;
  proxyReady: boolean | null;
}

export const ApiConfigModal: React.FC<ApiConfigModalProps> = ({
  open,
  onClose,
  activeProvider,
  onSelectProvider,
  configs,
  onChangeConfigs,
  proxyReady,
}) => {
  const [showKey, setShowKey] = useState(false);

  if (!open) return null;

  const meta = AI_PROVIDERS.find((p) => p.id === activeProvider) ?? AI_PROVIDERS[0];
  const cur = configs[activeProvider];

  const updateField = (field: 'apiKey' | 'baseUrl' | 'model', value: string) => {
    onChangeConfigs({
      ...configs,
      [activeProvider]: {
        ...cur,
        [field]: value,
      },
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-[#141722] border border-white/15 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-white">真 AI 引擎配置</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              选择任意平台并填入个人 Key，支持国内直连与零跨域代理
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Provider Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {AI_PROVIDERS.map((p) => {
              const active = p.id === activeProvider;
              const configured = Boolean(configs[p.id]?.apiKey?.trim());
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectProvider(p.id)}
                  className={`p-2.5 rounded-xl border text-left transition flex items-start justify-between gap-2 ${
                    active
                      ? 'bg-[#d9ff00]/10 border-[#d9ff00]/70'
                      : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{p.name}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">{p.badge}</div>
                  </div>
                  {configured && (
                    <span className="shrink-0 w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mt-0.5">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Provider Form */}
          <div className="rounded-xl bg-[#0d0f16] border border-white/10 p-4 space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-zinc-200">API Key</label>
                <a
                  href={meta.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#d9ff00] hover:underline"
                >
                  获取 Key
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={cur.apiKey}
                  onChange={(e) => updateField('apiKey', e.target.value)}
                  placeholder={meta.keyPlaceholder}
                  className="w-full rounded-lg bg-[#141722] border border-white/12 focus:border-[#d9ff00] pl-3 pr-9 py-2 text-xs font-mono text-white outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((s) => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">模型名称</label>
                <input
                  type="text"
                  value={cur.model}
                  onChange={(e) => updateField('model', e.target.value)}
                  className="w-full rounded-lg bg-[#141722] border border-white/12 focus:border-[#d9ff00] px-2.5 py-1.5 text-xs font-mono text-zinc-100 outline-none"
                />
              </div>
              {meta.supportsCustomEndpoint && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">Base URL</label>
                  <input
                    type="text"
                    value={cur.baseUrl}
                    onChange={(e) => updateField('baseUrl', e.target.value)}
                    className="w-full rounded-lg bg-[#141722] border border-white/12 focus:border-[#d9ff00] px-2.5 py-1.5 text-xs font-mono text-zinc-100 outline-none"
                  />
                </div>
              )}
            </div>

            {/* Quick model pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-zinc-500">常用模型：</span>
              {meta.modelExamples.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => updateField('model', m)}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border transition ${
                    cur.model === m
                      ? 'bg-[#d9ff00]/15 border-[#d9ff00]/60 text-[#d9ff00]'
                      : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed pt-1">{meta.hint}</p>
          </div>

          {/* Privacy & Proxy Footer */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Key 仅存于本地浏览器 LocalStorage
                {proxyReady ? ' · 经本地同源代理转发，无 CORS 阻塞' : ''}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-black bg-[#d9ff00] hover:bg-[#e9ff4d] text-black shrink-0"
            >
              保存并返回
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
