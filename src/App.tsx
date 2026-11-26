import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ASPECT_RATIO_SIZES,
  DEFAULT_ANIMATION,
  DEFAULT_FILTERS,
  type AIProviderId,
  type AIStyleId,
  type AnimationState,
  type AspectRatioId,
  type BaseImageMeta,
  type BubbleStyle,
  type CanvasLayer,
  type CanvasSnapshot,
  type EditorTool,
  type FilterState,
  type LiquifyMode,
  type LiquifyStroke,
  type ProviderConfigMap,
  type SavedProject,
  type TextPresetStyle,
} from './types/studio';
import { preloadAllStickers } from './assets/stickers';
import {
  STUDIO_TEMPLATES,
  getDefaultFiltersForTemplate,
  getTemplateById,
  loadTemplateImage,
} from './assets/templates';
import { StudioCanvasRenderer } from './editor/canvasRenderer';
import { createBubbleLayer, createStickerLayer, createTextLayer } from './editor/layerFactory';
import {
  CREATIVE_PROMPTS,
  checkProxyAvailability,
  generateAIImage,
} from './engines/aiProviders';
import { exportAnimatedGif } from './fx/gifExporter';
import {
  deleteProjectFromDb,
  listProjectsFromDb,
  loadProviderConfigs,
  saveProjectToDb,
  saveProviderConfigs,
} from './storage/projectDb';
import { TopBar } from './components/TopBar';
import { LeftPanel, type LeftTabId } from './components/LeftPanel';
import { CanvasStage } from './components/CanvasStage';
import { RightInspector } from './components/RightInspector';
import { ApiConfigModal } from './components/ApiConfigModal';

function cloneSnapshot(s: CanvasSnapshot): CanvasSnapshot {
  return {
    aspectRatio: s.aspectRatio,
    layers: s.layers.map((l) => ({ ...l })),
    liquifyStrokes: s.liquifyStrokes.map((st) => ({ ...st })),
    filters: { ...s.filters },
  };
}

function decodeBlobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片解码失败'));
    };
    img.src = url;
  });
}

export function App() {
  const renderer = useMemo(() => new StudioCanvasRenderer(), []);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Studio UI State
  const [leftTab, setLeftTab] = useState<LeftTabId>('ai');
  const [tool, setTool] = useState<EditorTool>('select');
  const [apiModalOpen, setApiModalOpen] = useState(false);
  const [proxyReady, setProxyReady] = useState<boolean | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  // Canvas & Document State
  const [aspectRatio, setAspectRatio] = useState<AspectRatioId>('1:1');
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);
  const [baseBlob, setBaseBlob] = useState<Blob | undefined>(undefined);
  const [baseMeta, setBaseMeta] = useState<BaseImageMeta>({
    kind: 'template',
    templateId: STUDIO_TEMPLATES[0].id,
  });
  const [layers, setLayers] = useState<CanvasLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [liquifyStrokes, setLiquifyStrokes] = useState<LiquifyStroke[]>([]);
  const [filters, setFilters] = useState<FilterState>({ ...DEFAULT_FILTERS });
  const [animation, setAnimation] = useState<AnimationState>({ ...DEFAULT_ANIMATION });
  const [timePhase, setTimePhase] = useState(0);

  // Liquify Brush State
  const [liquifyMode, setLiquifyMode] = useState<LiquifyMode>('bulge');
  const [liquifyRadius, setLiquifyRadius] = useState(0.16);
  const [liquifyStrength, setLiquifyStrength] = useState(0.7);

  // Undo / Redo History Stack
  const [history, setHistory] = useState<CanvasSnapshot[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  // AI Engine State
  const [providerConfigs, setProviderConfigs] = useState<ProviderConfigMap>(() =>
    loadProviderConfigs(),
  );
  const [activeProvider, setActiveProvider] = useState<AIProviderId>('siliconflow');
  const [prompt, setPrompt] = useState(CREATIVE_PROMPTS[0]);
  const [aiStyle, setAiStyle] = useState<AIStyleId>('comic-chaos');
  const [aiChaos, setAiChaos] = useState(78);
  const [aiSeed, setAiSeed] = useState(() => Math.floor(Math.random() * 900000 + 100000));
  const [lockSeed, setLockSeed] = useState(false);
  const [customFinalPrompt, setCustomFinalPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // GIF Export & Saved Projects
  const [exportingGif, setExportingGif] = useState(false);
  const [gifProgress, setGifProgress] = useState(0);
  const [gifFps, setGifFps] = useState(12);
  const [gifMaxSide, setGifMaxSide] = useState(460);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);

  const dims = ASPECT_RATIO_SIZES[aspectRatio];

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3000);
  }, []);

  const pushSnapshot = useCallback(
    (snap: CanvasSnapshot) => {
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIdx + 1);
        const next = [...sliced, cloneSnapshot(snap)].slice(-40);
        setHistoryIdx(next.length - 1);
        return next;
      });
    },
    [historyIdx],
  );

  // Keep latest state in ref for snapshot commit callbacks
  const stateRef = useRef({ aspectRatio, layers, liquifyStrokes, filters });
  stateRef.current = { aspectRatio, layers, liquifyStrokes, filters };

  const commitCurrentSnapshot = useCallback(() => {
    pushSnapshot(stateRef.current);
  }, [pushSnapshot]);

  // Initial hydration: preload stickers, detect proxy, load IndexedDB projects, load default template
  useEffect(() => {
    let mounted = true;
    checkProxyAvailability().then((ok) => {
      if (mounted) setProxyReady(ok);
    });
    listProjectsFromDb()
      .then((list) => {
        if (mounted) setSavedProjects(list);
      })
      .catch(() => {});

    Promise.all([preloadAllStickers(), loadTemplateImage(STUDIO_TEMPLATES[0].id)]).then(
      ([, img]) => {
        if (!mounted) return;
        const tpl = STUDIO_TEMPLATES[0];
        const initLayers = tpl.starterLayers();
        const initFilters = getDefaultFiltersForTemplate(tpl);
        setBaseImage(img);
        setBaseBlob(undefined);
        setBaseMeta({ kind: 'template', templateId: tpl.id });
        setAspectRatio(tpl.aspectRatio);
        setLayers(initLayers);
        setLiquifyStrokes([]);
        setFilters(initFilters);
        setHistory([
          cloneSnapshot({
            aspectRatio: tpl.aspectRatio,
            layers: initLayers,
            liquifyStrokes: [],
            filters: initFilters,
          }),
        ]);
        setHistoryIdx(0);
      },
    );

    return () => {
      mounted = false;
    };
  }, []);

  // Save provider configs to localStorage
  const handleChangeProviderConfigs = useCallback((next: ProviderConfigMap) => {
    setProviderConfigs(next);
    saveProviderConfigs(next);
  }, []);

  // Animation RAF loop when active
  useEffect(() => {
    if (animation.preset === 'none' || !animation.playing) {
      if (animation.preset === 'none') setTimePhase(0);
      return;
    }
    let rafId = 0;
    const start = performance.now();
    const cycleMs = 1100 / Math.max(0.3, animation.speed);

    const tick = (now: number) => {
      const phase = ((now - start) % cycleMs) / cycleMs;
      setTimePhase(phase);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [animation.preset, animation.playing, animation.speed]);

  // Undo / Redo handlers
  const handleUndo = useCallback(() => {
    if (historyIdx <= 0) return;
    const target = history[historyIdx - 1];
    if (!target) return;
    const snap = cloneSnapshot(target);
    setHistoryIdx(historyIdx - 1);
    setAspectRatio(snap.aspectRatio);
    setLayers(snap.layers);
    setLiquifyStrokes(snap.liquifyStrokes);
    setFilters(snap.filters);
    setSelectedLayerId(null);
  }, [history, historyIdx]);

  const handleRedo = useCallback(() => {
    if (historyIdx >= history.length - 1) return;
    const target = history[historyIdx + 1];
    if (!target) return;
    const snap = cloneSnapshot(target);
    setHistoryIdx(historyIdx + 1);
    setAspectRatio(snap.aspectRatio);
    setLayers(snap.layers);
    setLiquifyStrokes(snap.liquifyStrokes);
    setFilters(snap.filters);
    setSelectedLayerId(null);
  }, [history, historyIdx]);

  // Local image upload or Ctrl+V clipboard paste
  const importImageBlob = useCallback(
    async (blob: Blob, label: string) => {
      try {
        const img = await decodeBlobToImage(blob);
        renderer.invalidateCache();
        setBaseImage(img);
        setBaseBlob(blob);
        setBaseMeta({ kind: 'upload', prompt: label });
        setLiquifyStrokes([]);
        pushSnapshot({
          aspectRatio: stateRef.current.aspectRatio,
          layers: stateRef.current.layers,
          liquifyStrokes: [],
          filters: stateRef.current.filters,
        });
        showToast(`已导入图片：${label}（可直接加贴纸或哈哈镜）`);
      } catch {
        showToast('图片解析失败，请尝试 PNG / JPG / WebP 格式');
      }
    },
    [pushSnapshot, renderer, showToast],
  );

  // Global keyboard shortcuts (Undo, Redo, Delete layer, Nudge, Ctrl+V Paste image)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);
      if (inInput) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }
      if (e.key === 'Escape') {
        setSelectedLayerId(null);
        return;
      }
      if (!selectedLayerId) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        setLayers((prev) => {
          const next = prev.filter((l) => l.id !== selectedLayerId);
          pushSnapshot({ ...stateRef.current, layers: next });
          return next;
        });
        setSelectedLayerId(null);
        return;
      }

      const step = e.shiftKey ? 12 : 2;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        setLayers((prev) =>
          prev.map((l) => (l.id === selectedLayerId ? { ...l, x: l.x + dx, y: l.y + dy } : l)),
        );
      }
    };

    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            importImageBlob(file, '剪贴板粘贴图');
            return;
          }
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('paste', onPaste);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('paste', onPaste);
    };
  }, [handleUndo, handleRedo, selectedLayerId, pushSnapshot, importImageBlob]);

  // Template switch
  const handleSelectTemplate = async (templateId: string) => {
    const tpl = getTemplateById(templateId);
    const img = await loadTemplateImage(tpl.id);
    const nextLayers = tpl.starterLayers();
    const nextFilters = getDefaultFiltersForTemplate(tpl);
    renderer.invalidateCache();
    setBaseImage(img);
    setBaseBlob(undefined);
    setBaseMeta({ kind: 'template', templateId: tpl.id });
    setAspectRatio(tpl.aspectRatio);
    setLayers(nextLayers);
    setLiquifyStrokes([]);
    setFilters(nextFilters);
    setSelectedLayerId(null);
    pushSnapshot({
      aspectRatio: tpl.aspectRatio,
      layers: nextLayers,
      liquifyStrokes: [],
      filters: nextFilters,
    });
    showToast(`已切换模板「${tpl.name}」`);
  };

  // Real AI Generation
  const handleGenerateAi = async () => {
    if (generating) return;
    const raw = prompt.trim() || CREATIVE_PROMPTS[0];
    const seedToUse = lockSeed ? aiSeed : Math.floor(Math.random() * 900000 + 100000);
    if (!lockSeed) setAiSeed(seedToUse);

    setAiError(null);
    setGenerating(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await generateAIImage({
        provider: activeProvider,
        config: providerConfigs[activeProvider],
        rawPrompt: raw,
        customFinalPrompt,
        styleId: aiStyle,
        chaosLevel: aiChaos,
        aspectRatio,
        seed: seedToUse,
        signal: controller.signal,
      });

      const img = await decodeBlobToImage(res.blob);
      renderer.invalidateCache();
      setBaseImage(img);
      setBaseBlob(res.blob);
      setBaseMeta({
        kind: 'ai',
        prompt: raw,
        expandedPrompt: res.finalPrompt,
        provider: activeProvider,
        seed: res.seed,
      });
      setLiquifyStrokes([]);
      pushSnapshot({
        aspectRatio: stateRef.current.aspectRatio,
        layers: stateRef.current.layers,
        liquifyStrokes: [],
        filters: stateRef.current.filters,
      });
      showToast('AI 魔性底图已生成！可以直接加贴纸、改字或用哈哈镜二创');
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        showToast('已取消生成请求');
      } else {
        setAiError(err instanceof Error ? err.message : '生图失败，请检查网络或 API 配置');
      }
    } finally {
      setGenerating(false);
      abortRef.current = null;
    }
  };

  const handleCancelAi = () => {
    abortRef.current?.abort();
  };

  // Layer CRUD
  const handleAddText = (preset: TextPresetStyle, initialText?: string) => {
    const layer = createTextLayer(dims.width, dims.height, preset, initialText);
    const next = [...layers, layer];
    setTool('select');
    setLayers(next);
    setSelectedLayerId(layer.id);
    pushSnapshot({ ...stateRef.current, layers: next });
  };

  const handleAddBubble = (style: BubbleStyle, initialText?: string) => {
    const layer = createBubbleLayer(dims.width, dims.height, style, initialText);
    const next = [...layers, layer];
    setTool('select');
    setLayers(next);
    setSelectedLayerId(layer.id);
    pushSnapshot({ ...stateRef.current, layers: next });
  };

  const handleAddSticker = (stickerId: string) => {
    const layer = createStickerLayer(dims.width, dims.height, stickerId);
    const next = [...layers, layer];
    setTool('select');
    setLayers(next);
    setSelectedLayerId(layer.id);
    pushSnapshot({ ...stateRef.current, layers: next });
  };

  const handleUpdateLayer = (id: string, patch: Partial<CanvasLayer>, commit = false) => {
    setLayers((prev) => {
      const next = prev.map((l) => (l.id === id ? ({ ...l, ...patch } as CanvasLayer) : l));
      if (commit) {
        pushSnapshot({ ...stateRef.current, layers: next });
      }
      return next;
    });
  };

  const handleDeleteLayer = (id: string) => {
    const next = layers.filter((l) => l.id !== id);
    setLayers(next);
    if (selectedLayerId === id) setSelectedLayerId(null);
    pushSnapshot({ ...stateRef.current, layers: next });
  };

  const handleDuplicateLayer = (id: string) => {
    const src = layers.find((l) => l.id === id);
    if (!src) return;
    const copy: CanvasLayer = {
      ...src,
      id: `${src.type}_${Date.now().toString(36)}`,
      x: src.x + 28,
      y: src.y + 28,
    };
    const next = [...layers, copy];
    setLayers(next);
    setSelectedLayerId(copy.id);
    pushSnapshot({ ...stateRef.current, layers: next });
  };

  const handleMoveLayerOrder = (id: string, dir: 'up' | 'down') => {
    const idx = layers.findIndex((l) => l.id === id);
    if (idx === -1) return;
    const targetIdx = dir === 'up' ? idx + 1 : idx - 1;
    if (targetIdx < 0 || targetIdx >= layers.length) return;
    const next = [...layers];
    const [item] = next.splice(idx, 1);
    next.splice(targetIdx, 0, item);
    setLayers(next);
    pushSnapshot({ ...stateRef.current, layers: next });
  };

  const handleChangeFilters = (next: FilterState, commit = false) => {
    setFilters(next);
    if (commit) pushSnapshot({ ...stateRef.current, filters: next });
  };

  const handleChangeAspectRatio = (nextRatio: AspectRatioId) => {
    if (nextRatio === aspectRatio) return;
    const oldDims = ASPECT_RATIO_SIZES[aspectRatio];
    const newDims = ASPECT_RATIO_SIZES[nextRatio];
    const rx = newDims.width / oldDims.width;
    const ry = newDims.height / oldDims.height;
    const remapped = layers.map((l) => ({ ...l, x: l.x * rx, y: l.y * ry }));
    setAspectRatio(nextRatio);
    setLayers(remapped);
    pushSnapshot({ ...stateRef.current, aspectRatio: nextRatio, layers: remapped });
  };

  // Export clean canvas helper (never draws selection gizmos!)
  const renderCleanExportCanvas = (phase = 0): HTMLCanvasElement => {
    const exp = document.createElement('canvas');
    exp.width = dims.width;
    exp.height = dims.height;
    renderer.render({
      canvas: exp,
      baseImage,
      layers,
      liquifyStrokes,
      filters,
      animation,
      timePhase: phase,
      selectedLayerId: null,
      showSelectionUi: false,
    });
    return exp;
  };

  const handleDownloadPng = () => {
    const exp = renderCleanExportCanvas(timePhase);
    const a = document.createElement('a');
    a.download = `moxing-studio-${Date.now()}.png`;
    a.href = exp.toDataURL('image/png');
    a.click();
    showToast('已下载高清 PNG 原图！');
  };

  const handleCopyPng = () => {
    const exp = renderCleanExportCanvas(timePhase);
    if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
      showToast('当前浏览器环境不支持复制图片，请直接下载 PNG');
      return;
    }
    exp.toBlob((blob) => {
      if (!blob) return;
      navigator.clipboard
        .write([new ClipboardItem({ 'image/png': blob })])
        .then(() => showToast('已复制 PNG 到剪贴板，去群里粘贴吧！'))
        .catch(() => showToast('复制失败，请点 PNG 下载'));
    });
  };

  const handleExportGif = async () => {
    if (exportingGif) return;
    setExportingGif(true);
    setGifProgress(0);
    const animForExport: AnimationState =
      animation.preset === 'none'
        ? { preset: 'shake', speed: 1.4, intensity: 55, playing: true }
        : animation;

    try {
      const blob = await exportAnimatedGif({
        width: dims.width,
        height: dims.height,
        maxSide: gifMaxSide,
        frameCount: 14,
        fps: gifFps,
        renderFrame: (targetCanvas, phase) => {
          renderer.render({
            canvas: targetCanvas,
            baseImage,
            layers,
            liquifyStrokes,
            filters,
            animation: animForExport,
            timePhase: phase,
            selectedLayerId: null,
            showSelectionUi: false,
          });
        },
        onProgress: setGifProgress,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.download = `moxing-gif-${Date.now()}.gif`;
      a.href = url;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      showToast(`真实 GIF 动图导出成功（${Math.round(blob.size / 1024)} KB）！`);
    } catch (err) {
      showToast(`GIF 导出失败：${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setExportingGif(false);
      setGifProgress(0);
    }
  };

  // IndexedDB Save & Restore Full Editable Project
  const handleSaveProject = async () => {
    try {
      const exp = renderCleanExportCanvas(0);
      const thumb = document.createElement('canvas');
      thumb.width = 240;
      thumb.height = Math.round((240 * dims.height) / dims.width);
      thumb.getContext('2d')!.drawImage(exp, 0, 0, thumb.width, thumb.height);

      const title =
        baseMeta.prompt?.slice(0, 18) ||
        (baseMeta.templateId ? getTemplateById(baseMeta.templateId).name : '魔性作品');

      const project: SavedProject = {
        id: `proj_${Date.now().toString(36)}`,
        title,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        aspectRatio,
        layers: layers.map((l) => ({ ...l })),
        liquifyStrokes: liquifyStrokes.map((s) => ({ ...s })),
        filters: { ...filters },
        animation: { ...animation },
        baseMeta: { ...baseMeta },
        baseImageBlob: baseBlob,
        thumbnailDataUrl: thumb.toDataURL('image/jpeg', 0.82),
      };

      await saveProjectToDb(project);
      const refreshed = await listProjectsFromDb();
      setSavedProjects(refreshed);
      showToast('已保存完整可编辑工程到「底图/库」！');
    } catch {
      showToast('工程保存失败（浏览器存储受限）');
    }
  };

  const handleLoadProject = async (proj: SavedProject) => {
    try {
      let img: HTMLImageElement;
      if (proj.baseImageBlob) {
        img = await decodeBlobToImage(proj.baseImageBlob);
      } else {
        img = await loadTemplateImage(proj.baseMeta.templateId || STUDIO_TEMPLATES[0].id);
      }
      renderer.invalidateCache();
      setBaseImage(img);
      setBaseBlob(proj.baseImageBlob);
      setBaseMeta(proj.baseMeta);
      setAspectRatio(proj.aspectRatio);
      setLayers(proj.layers.map((l) => ({ ...l })));
      setLiquifyStrokes(proj.liquifyStrokes.map((s) => ({ ...s })));
      setFilters({ ...proj.filters });
      setAnimation({ ...proj.animation });
      setSelectedLayerId(null);
      pushSnapshot({
        aspectRatio: proj.aspectRatio,
        layers: proj.layers,
        liquifyStrokes: proj.liquifyStrokes,
        filters: proj.filters,
      });
      showToast(`已恢复工程「${proj.title}」（全部图层可继续编辑）`);
    } catch {
      showToast('工程加载失败');
    }
  };

  const handleDeleteProject = async (id: string) => {
    await deleteProjectFromDb(id);
    setSavedProjects((prev) => prev.filter((p) => p.id !== id));
    showToast('已从工程库移除');
  };

  const hasActiveKey = Boolean(providerConfigs[activeProvider]?.apiKey?.trim());

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#0b0c10] text-zinc-100">
      <TopBar
        aspectRatio={aspectRatio}
        onChangeAspectRatio={handleChangeAspectRatio}
        canUndo={historyIdx > 0}
        canRedo={historyIdx < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSaveProject={handleSaveProject}
        onCopyPng={handleCopyPng}
        onDownloadPng={handleDownloadPng}
        onExportGif={handleExportGif}
        exportingGif={exportingGif}
        gifProgress={gifProgress}
        activeProvider={activeProvider}
        hasActiveKey={hasActiveKey}
        proxyReady={proxyReady}
        onOpenApiModal={() => setApiModalOpen(true)}
      />

      <main className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
        <LeftPanel
          activeTab={leftTab}
          onChangeTab={setLeftTab}
          prompt={prompt}
          onChangePrompt={setPrompt}
          aiStyle={aiStyle}
          onChangeAiStyle={setAiStyle}
          aiChaos={aiChaos}
          onChangeAiChaos={setAiChaos}
          aiSeed={aiSeed}
          lockSeed={lockSeed}
          onToggleLockSeed={() => setLockSeed((v) => !v)}
          onRollSeed={() => setAiSeed(Math.floor(Math.random() * 900000 + 100000))}
          customFinalPrompt={customFinalPrompt}
          onChangeCustomFinalPrompt={setCustomFinalPrompt}
          activeProvider={activeProvider}
          hasActiveKey={hasActiveKey}
          generating={generating}
          aiError={aiError}
          onDismissAiError={() => setAiError(null)}
          onGenerateAi={handleGenerateAi}
          onCancelAi={handleCancelAi}
          onOpenApiModal={() => setApiModalOpen(true)}
          activeTemplateId={baseMeta.kind === 'template' ? (baseMeta.templateId ?? null) : null}
          onSelectTemplate={handleSelectTemplate}
          onUploadFile={(f) => importImageBlob(f, f.name)}
          savedProjects={savedProjects}
          onLoadProject={handleLoadProject}
          onDeleteProject={handleDeleteProject}
          onAddText={handleAddText}
          onAddBubble={handleAddBubble}
          onAddSticker={handleAddSticker}
        />

        <CanvasStage
          width={dims.width}
          height={dims.height}
          renderer={renderer}
          baseImage={baseImage}
          layers={layers}
          liquifyStrokes={liquifyStrokes}
          filters={filters}
          animation={animation}
          timePhase={timePhase}
          tool={tool}
          onChangeTool={setTool}
          selectedLayerId={selectedLayerId}
          onSelectLayer={setSelectedLayerId}
          onUpdateLayerLive={(id, patch) => handleUpdateLayer(id, patch, false)}
          onCommitSnapshot={commitCurrentSnapshot}
          liquifyMode={liquifyMode}
          onChangeLiquifyMode={setLiquifyMode}
          liquifyRadius={liquifyRadius}
          onChangeLiquifyRadius={setLiquifyRadius}
          liquifyStrength={liquifyStrength}
          onChangeLiquifyStrength={setLiquifyStrength}
          onAddLiquifyStroke={(s) => setLiquifyStrokes((prev) => [...prev, s])}
          onUndoLiquifyStroke={() => {
            setLiquifyStrokes((prev) => {
              const next = prev.slice(0, -1);
              pushSnapshot({ ...stateRef.current, liquifyStrokes: next });
              return next;
            });
          }}
          onClearLiquify={() => {
            setLiquifyStrokes([]);
            pushSnapshot({ ...stateRef.current, liquifyStrokes: [] });
          }}
          onToggleAnimPlay={() =>
            setAnimation((a) => ({ ...a, playing: !a.playing }))
          }
          onDropImageFile={(f) => importImageBlob(f, f.name)}
          generating={generating}
          onCancelAi={handleCancelAi}
          canvasRef={canvasRef}
        />

        <RightInspector
          layers={layers}
          selectedLayerId={selectedLayerId}
          onSelectLayer={setSelectedLayerId}
          onUpdateLayer={handleUpdateLayer}
          onDeleteLayer={handleDeleteLayer}
          onDuplicateLayer={handleDuplicateLayer}
          onMoveLayerOrder={handleMoveLayerOrder}
          filters={filters}
          onChangeFilters={handleChangeFilters}
          animation={animation}
          onChangeAnimation={setAnimation}
          gifFps={gifFps}
          onChangeGifFps={setGifFps}
          gifMaxSide={gifMaxSide}
          onChangeGifMaxSide={setGifMaxSide}
          onExportGif={handleExportGif}
          exportingGif={exportingGif}
          gifProgress={gifProgress}
        />
      </main>

      <ApiConfigModal
        open={apiModalOpen}
        onClose={() => setApiModalOpen(false)}
        activeProvider={activeProvider}
        onSelectProvider={setActiveProvider}
        configs={providerConfigs}
        onChangeConfigs={handleChangeProviderConfigs}
        proxyReady={proxyReady}
      />

      {/* Crisp Darkroom Toast (top-center below TopBar so it never overlaps bottom dock) */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#181b26]/95 border border-[#d9ff00]/50 text-xs font-bold text-[#d9ff00] shadow-2xl pointer-events-none">
          {toast}
        </div>
      )}
    </div>
  );
}

export default App;
