import type {
  AIProviderId,
  AIStyleId,
  AspectRatioId,
  ProviderConfig,
  ProviderConfigMap,
} from '../types/studio';

export interface ProviderMeta {
  id: AIProviderId;
  name: string;
  badge: string;
  defaultBaseUrl: string;
  defaultModel: string;
  modelExamples: string[];
  keyPlaceholder: string;
  docsUrl: string;
  hint: string;
  supportsCustomEndpoint: boolean;
}

export const AI_PROVIDERS: ProviderMeta[] = [
  {
    id: 'siliconflow',
    name: '硅基流动 SiliconFlow',
    badge: '国内直连 · 免费额度',
    defaultBaseUrl: 'https://api.siliconflow.cn/v1',
    defaultModel: 'Kwai-Kolors/Kolors',
    modelExamples: ['Kwai-Kolors/Kolors', 'black-forest-labs/FLUX.1-schnell'],
    keyPlaceholder: 'sk-...',
    docsUrl: 'https://cloud.siliconflow.cn/account/ak',
    hint: '国内直连稳定，注册即赠额度；通过本工坊内置代理自动解决浏览器 CORS 与导出跨域问题。',
    supportsCustomEndpoint: true,
  },
  {
    id: 'pollinations',
    name: 'Pollinations v2',
    badge: '新版 gen.pollinations.ai',
    defaultBaseUrl: 'https://gen.pollinations.ai',
    defaultModel: 'flux',
    modelExamples: ['flux', 'turbo', 'gptimage'],
    keyPlaceholder: 'sk_...（前往 enter.pollinations.ai 免费领 Key）',
    docsUrl: 'https://enter.pollinations.ai',
    hint: '已升级至官方新版 gen.pollinations.ai 端点，支持个人免费 Key，彻底告别匿名 402 限流。',
    supportsCustomEndpoint: false,
  },
  {
    id: 'gemini',
    name: 'Google Gemini Image',
    badge: '原生图文理解极强',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com',
    defaultModel: 'gemini-2.5-flash-image',
    modelExamples: ['gemini-2.5-flash-image', 'gemini-2.0-flash-exp-image-generation'],
    keyPlaceholder: 'AIza...',
    docsUrl: 'https://aistudio.google.com/app/api-keys',
    hint: '中文脑洞与文字梗理解力极强；需使用支持生图配额的 Google AI Studio Key。',
    supportsCustomEndpoint: true,
  },
  {
    id: 'huggingface',
    name: 'Hugging Face Inference',
    badge: '开源 FLUX',
    defaultBaseUrl: 'https://router.huggingface.co/hf-inference/models',
    defaultModel: 'black-forest-labs/FLUX.1-schnell',
    modelExamples: ['black-forest-labs/FLUX.1-schnell', 'stabilityai/stable-diffusion-xl-base-1.0'],
    keyPlaceholder: 'hf_...',
    docsUrl: 'https://huggingface.co/settings/tokens',
    hint: '使用免费 Inference Token（hf_...）调用开源 FLUX / SDXL 模型。',
    supportsCustomEndpoint: true,
  },
  {
    id: 'openai',
    name: 'OpenAI 兼容接口 / 中转站',
    badge: '自定义通用',
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-image-1',
    modelExamples: ['gpt-image-1', 'dall-e-3', 'flux-pro'],
    keyPlaceholder: 'sk-...',
    docsUrl: 'https://platform.openai.com/api-keys',
    hint: '严格遵循 OpenAI /images/generations 标准字段，兼容各类自建或第三方中转站。',
    supportsCustomEndpoint: true,
  },
];

export interface AIStylePreset {
  id: AIStyleId;
  name: string;
  shortDesc: string;
  enPrompt: string;
  zhPrompt: string;
}

export const AI_STYLES: AIStylePreset[] = [
  {
    id: 'comic-chaos',
    name: '暴走喜剧漫',
    shortDesc: '夸张颜艺 · 粗黑漫画描边',
    enPrompt:
      'hilarious exaggerated comedy caricature illustration, wildly expressive goofy facial expression, dramatic dynamic pose, bold ink outlines, vibrant pop-art editorial colors, clean composition, no text, no watermark',
    zhPrompt:
      '极度搞笑夸张的喜剧漫画插画，人物颜艺爆棚、表情滑稽生动、动作张力拉满，粗黑漫画描边，鲜明潮玩波普配色，构图干净，画面中不要出现乱码文字',
  },
  {
    id: 'meme-reaction',
    name: '神级表情包',
    shortDesc: '贴脸特写 · 戏剧张力拉满',
    enPrompt:
      'iconic hilarious internet reaction meme illustration, close-up dramatic fisheye lens perspective, absurdly exaggerated comical expression, intense comedic energy, studio lighting, no text',
    zhPrompt:
      '爆笑经典表情包特写，夸张鱼眼镜头透视，人物神情极其荒诞有戏，强烈喜剧反差感，打光精致，不要生成文字',
  },
  {
    id: 'oil-surreal',
    name: '抽象名画风',
    shortDesc: '油画笔触 · 荒诞反差感',
    enPrompt:
      'museum-grade classical oil painting depicting an absurdly hilarious modern comedic scene, rich impasto brushstrokes, dramatic baroque lighting, comical deadpan expression, surreal humor, no text',
    zhPrompt:
      '博物馆级古典厚涂油画风格演绎极其荒诞爆笑的现代脑洞场景，笔触浓郁有质感，正经严肃的画风与离谱内容的强烈反差幽默，不要文字',
  },
  {
    id: 'anime-unhinged',
    name: '崩坏番剧颜艺',
    shortDesc: '日漫高能 · 精神超前',
    enPrompt:
      'unhinged comedy anime key visual screenshot, wildly exaggerated hilarious anime reaction face, dramatic speedlines and glowing aura, crisp cel-shading, vivid colors, no subtitles, no text',
    zhPrompt:
      '日系搞笑番剧高能名场面截图，极致夸张的崩坏颜艺表情，赛璐璐平涂质感，冲击波光效，色彩明快，无字幕无文字',
  },
  {
    id: 'cyber-meltdown',
    name: '赛博霓虹崩坏',
    shortDesc: '荧光科幻 · 未来荒诞',
    enPrompt:
      'chaotic neon cyberpunk comedy artwork, absurd futuristic gadgets, glowing electric lime and magenta neon reflections, hilarious goofy character expression, cinematic detail, no text',
    zhPrompt:
      '赛博朋克霓虹喜剧风，充满离谱荒诞的未来科技细节，酸性荧光绿与洋红霓虹光影，角色表情极度魔性，电影级光影质感，不要文字',
  },
  {
    id: 'retro-pixel',
    name: '复古街机像素',
    shortDesc: '16-bit 大头 · 怀旧鬼畜',
    enPrompt:
      'crisp 16-bit retro arcade pixel art comedy illustration, funny chunky expressive character proportions, goofy exaggerated face, vibrant arcade color palette, clean pixel clusters, no text',
    zhPrompt:
      '精致复古16位街机像素艺术喜剧插画，大头搞笑比例，表情魔性逗趣，高饱和经典街机调色板，像素清晰，不要文字',
  },
];

export const CREATIVE_PROMPTS = [
  '数学家梵高在星空下疯狂推导反向传播公式，头发炸开',
  '爱因斯坦在菜市场举着计算器和卖菜阿姨激烈砍价',
  '秦始皇戴着墨镜骑喷火电瓶车在长城上送外卖',
  '穿西装的胖橘猫在华尔街交易所看着绿油油的K线图崩溃抱头',
  '蒙娜丽莎戴着电竞耳机一边涮红油火锅一边偷偷比耶',
  '李白举着霓虹麦克风在月球夜市大排档狂飙说唱',
  '一只暴躁大鹅叼着发光激光剑追着老板满海滩跑',
  '拿破仑骑着一只极其嫌弃他的巨大二哈翻越阿尔卑斯山',
];

export function getDefaultProviderConfigs(): ProviderConfigMap {
  const map = {} as ProviderConfigMap;
  for (const p of AI_PROVIDERS) {
    map[p.id] = {
      apiKey: '',
      baseUrl: p.defaultBaseUrl,
      model: p.defaultModel,
    };
  }
  return map;
}

export function buildDirectedPrompt(
  rawPrompt: string,
  styleId: AIStyleId,
  chaosLevel: number, // 0..100
  useChinese: boolean,
): string {
  const style = AI_STYLES.find((s) => s.id === styleId) ?? AI_STYLES[0];
  const clean = rawPrompt.trim();

  if (useChinese) {
    const chaosBoost =
      chaosLevel >= 75
        ? '，极度荒诞魔性，戏剧冲突与搞笑细节拉到最满'
        : chaosLevel >= 40
          ? '，生动幽默、富有趣味反差细节'
          : '，画风精致带一点轻喜剧俏皮感';
    return `${clean}，${style.zhPrompt}${chaosBoost}`;
  }

  const chaosEn =
    chaosLevel >= 75
      ? ', ultra-absurd surreal comedy energy, hilarious visual gags, wildly exaggerated comedic expressions'
      : chaosLevel >= 40
        ? ', witty humorous visual storytelling, expressive quirky details'
        : ', subtle deadpan humor, crisp polished illustration';
  return `${clean}, ${style.enPrompt}${chaosEn}`;
}

function aspectToDimensions(ratio: AspectRatioId, provider: AIProviderId): { w: number; h: number; str: string } {
  if (provider === 'openai') {
    if (ratio === '16:9' || ratio === '4:3') return { w: 1536, h: 1024, str: '1536x1024' };
    if (ratio === '3:4') return { w: 1024, h: 1536, str: '1024x1536' };
    return { w: 1024, h: 1024, str: '1024x1024' };
  }
  switch (ratio) {
    case '3:4':
      return { w: 768, h: 1024, str: '768x1024' };
    case '4:3':
      return { w: 1024, h: 768, str: '1024x768' };
    case '16:9':
      return { w: 1024, h: 576, str: '1024x576' };
    default:
      return { w: 1024, h: 1024, str: '1024x1024' };
  }
}

let proxyAvailableCache: boolean | null = null;

export async function checkProxyAvailability(): Promise<boolean> {
  if (proxyAvailableCache !== null) return proxyAvailableCache;
  try {
    const res = await fetch('/api/proxy?ping=1', { method: 'GET' });
    if (res.ok) {
      const json = (await res.json()) as { ok?: boolean };
      proxyAvailableCache = Boolean(json.ok);
      return proxyAvailableCache;
    }
  } catch {
    // Pure static deployment (e.g. GitHub Pages)
  }
  proxyAvailableCache = false;
  return false;
}

async function smartFetch(
  targetUrl: string,
  options: {
    method: 'GET' | 'POST';
    headers?: Record<string, string>;
    body?: unknown;
    signal?: AbortSignal;
  },
): Promise<Response> {
  const hasProxy = await checkProxyAvailability();
  if (hasProxy) {
    return fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetUrl,
        method: options.method,
        headers: options.headers,
        body: options.body,
      }),
      signal: options.signal,
    });
  }

  // Pure static fallback: direct browser fetch
  return fetch(targetUrl, {
    method: options.method,
    headers: options.headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });
}

async function fetchExternalImageBlob(imageUrl: string, signal?: AbortSignal): Promise<Blob> {
  const hasProxy = await checkProxyAvailability();
  if (hasProxy) {
    const res = await fetch(`/api/image-proxy?url=${encodeURIComponent(imageUrl)}`, { signal });
    if (!res.ok) {
      throw new Error(`图片拉取失败 (HTTP ${res.status})`);
    }
    return res.blob();
  }
  const res = await fetch(imageUrl, { signal });
  if (!res.ok) throw new Error(`图片拉取失败 (HTTP ${res.status})`);
  return res.blob();
}

function base64ToBlob(base64: string, mime = 'image/png'): Blob {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export interface GenerateAIImageRequest {
  provider: AIProviderId;
  config: ProviderConfig;
  rawPrompt: string;
  customFinalPrompt?: string;
  styleId: AIStyleId;
  chaosLevel: number;
  aspectRatio: AspectRatioId;
  seed: number;
  signal?: AbortSignal;
}

export interface GenerateAIImageResult {
  blob: Blob;
  finalPrompt: string;
  seed: number;
}

async function extractUpstreamError(res: Response): Promise<string> {
  try {
    const text = await res.text();
    const trimmed = text.trim();
    if (!trimmed) return `HTTP ${res.status}`;
    try {
      const parsed = JSON.parse(trimmed) as { error?: { message?: string } | string; message?: string };
      if (typeof parsed.error === 'string') return `HTTP ${res.status}: ${parsed.error}`;
      if (parsed.error && typeof parsed.error.message === 'string') {
        return `HTTP ${res.status}: ${parsed.error.message}`;
      }
      if (parsed.message) return `HTTP ${res.status}: ${parsed.message}`;
    } catch {
      // Plain text error
    }
    return `HTTP ${res.status}: ${trimmed.slice(0, 140)}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

export async function generateAIImage(req: GenerateAIImageRequest): Promise<GenerateAIImageResult> {
  const apiKey = req.config.apiKey.trim();
  if (!apiKey) {
    throw new Error('请先点击右上角「API 配置」填入对应平台的 API Key（Key 仅保存在你的本地浏览器）。');
  }

  const baseUrl = req.config.baseUrl.trim().replace(/\/+$/, '');
  const model = req.config.model.trim();
  const dims = aspectToDimensions(req.aspectRatio, req.provider);
  const preferChinese = req.provider === 'siliconflow' && model.toLowerCase().includes('kolors');
  const finalPrompt =
    req.customFinalPrompt?.trim() ||
    buildDirectedPrompt(req.rawPrompt, req.styleId, req.chaosLevel, preferChinese);

  if (req.provider === 'siliconflow') {
    const res = await smartFetch(`${baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        model,
        prompt: finalPrompt,
        image_size: dims.str,
        batch_size: 1,
        seed: req.seed,
      },
      signal: req.signal,
    });
    if (!res.ok) throw new Error(await extractUpstreamError(res));
    const json = (await res.json()) as {
      images?: Array<{ url?: string; b64_json?: string }>;
      data?: Array<{ url?: string; b64_json?: string }>;
    };
    const item = json.images?.[0] ?? json.data?.[0];
    if (!item) throw new Error('硅基流动接口未返回图片数据');
    const blob = item.b64_json
      ? base64ToBlob(item.b64_json)
      : item.url
        ? await fetchExternalImageBlob(item.url, req.signal)
        : null;
    if (!blob) throw new Error('硅基流动返回中缺少 url 或 b64_json');
    return { blob, finalPrompt, seed: req.seed };
  }

  if (req.provider === 'openai') {
    const res = await smartFetch(`${baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        model,
        prompt: finalPrompt,
        size: dims.str,
        n: 1,
      },
      signal: req.signal,
    });
    if (!res.ok) throw new Error(await extractUpstreamError(res));
    const json = (await res.json()) as {
      data?: Array<{ url?: string; b64_json?: string }>;
      images?: Array<{ url?: string; b64_json?: string }>;
    };
    const item = json.data?.[0] ?? json.images?.[0];
    if (!item) throw new Error('OpenAI 兼容接口未返回图片数据');
    const blob = item.b64_json
      ? base64ToBlob(item.b64_json)
      : item.url
        ? await fetchExternalImageBlob(item.url, req.signal)
        : null;
    if (!blob) throw new Error('接口返回中缺少 url 或 b64_json');
    return { blob, finalPrompt, seed: req.seed };
  }

  if (req.provider === 'pollinations') {
    const url =
      `${baseUrl}/image/${encodeURIComponent(finalPrompt)}` +
      `?model=${encodeURIComponent(model)}&width=${dims.w}&height=${dims.h}&seed=${req.seed}&nologo=true`;
    const res = await smartFetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal: req.signal,
    });
    if (!res.ok) throw new Error(await extractUpstreamError(res));
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('image')) {
      throw new Error('Pollinations 返回的不是图像，请检查 Key 是否有效或额度是否充足');
    }
    const blob = await res.blob();
    return { blob, finalPrompt, seed: req.seed };
  }

  if (req.provider === 'huggingface') {
    const res = await smartFetch(`${baseUrl}/${model}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        inputs: finalPrompt,
        parameters: {
          width: dims.w,
          height: dims.h,
        },
      },
      signal: req.signal,
    });
    if (!res.ok) throw new Error(await extractUpstreamError(res));
    const blob = await res.blob();
    return { blob, finalPrompt, seed: req.seed };
  }

  // Google Gemini Image Generation API
  const geminiEndpoint = `${baseUrl}/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await smartFetch(geminiEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      contents: [{ parts: [{ text: finalPrompt }] }],
      generationConfig: { responseModalities: ['IMAGE'] },
    },
    signal: req.signal,
  });
  if (!res.ok) throw new Error(await extractUpstreamError(res));
  const data = (await res.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }>;
      };
    }>;
  };
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const imgPart = parts.find((p) => p.inlineData?.data);
  if (!imgPart?.inlineData?.data) {
    throw new Error('Gemini 接口未返回图像（可能触发安全拦截或模型不支持生图）');
  }
  const blob = base64ToBlob(imgPart.inlineData.data, imgPart.inlineData.mimeType || 'image/png');
  return { blob, finalPrompt, seed: req.seed };
}
