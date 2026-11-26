import type { AspectRatioId, CanvasLayer, FilterState } from '../types/studio';
import { DEFAULT_FILTERS } from '../types/studio';

export interface StudioTemplate {
  id: string;
  name: string;
  tagline: string;
  aspectRatio: AspectRatioId;
  svg: string;
  defaultFilters: Partial<FilterState>;
  starterLayers: () => CanvasLayer[];
}

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export const STUDIO_TEMPLATES: StudioTemplate[] = [
  {
    id: 'van-gogh-math',
    name: '星空算高数',
    tagline: '致敬经典「数学家梵高」· 拖贴纸/用哈哈镜立刻开玩',
    aspectRatio: '1:1',
    defaultFilters: { vignette: 18 },
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 720">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0b1536"/>
          <stop offset="50%" stop-color="#1d3b8b"/>
          <stop offset="100%" stop-color="#0d1b3e"/>
        </linearGradient>
        <radialGradient id="moon" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fff8b8"/>
          <stop offset="55%" stop-color="#facc15"/>
          <stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.45"/>
          <stop offset="100%" stop-color="#1e3a8a" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="720" height="720" fill="url(#sky)"/>
      <!-- Swirling starry night sky strokes -->
      <circle cx="565" cy="145" r="135" fill="url(#moon)"/>
      <circle cx="565" cy="145" r="52" fill="#fef08a"/>
      <circle cx="170" cy="165" r="150" fill="url(#halo)"/>
      <g fill="none" stroke-linecap="round" opacity="0.88">
        <path d="M-20 180 C120 90 210 260 350 175 C460 110 550 265 740 160" stroke="#38bdf8" stroke-width="18" stroke-dasharray="44 18"/>
        <path d="M-10 220 C130 135 230 300 370 215 C490 140 580 295 750 200" stroke="#93c5fd" stroke-width="10" stroke-dasharray="28 14"/>
        <path d="M40 120 C140 50 240 180 350 110" stroke="#fde047" stroke-width="9" stroke-dasharray="22 14"/>
        <circle cx="170" cy="165" r="56" stroke="#fde047" stroke-width="9" stroke-dasharray="24 14"/>
        <circle cx="170" cy="165" r="90" stroke="#38bdf8" stroke-width="12" stroke-dasharray="32 16"/>
        <circle cx="565" cy="145" r="82" stroke="#fef08a" stroke-width="10" stroke-dasharray="26 16"/>
      </g>
      <!-- Floating glowing math formulas in the starry sky -->
      <g font-family="Georgia, serif" font-style="italic" font-weight="700" fill="#fde047" opacity="0.65">
        <text x="58" y="345" font-size="36" transform="rotate(-12 58 345)">∫ eˣ dx = eˣ + C</text>
        <text x="485" y="330" font-size="34" fill="#7dd3fc" transform="rotate(10 485 330)">∂J/∂W = 0</text>
        <text x="48" y="455" font-size="30" fill="#c4b5fd" transform="rotate(8 48 455)">lim x→0 sin(x)/x</text>
        <text x="515" y="440" font-size="36" fill="#fde047" transform="rotate(-10 515 440)">∇×E = -∂B/∂t</text>
      </g>
      <!-- Stylized Pop-Art Portrait of Mathematician Van Gogh -->
      <g transform="translate(360, 445)">
        <!-- Jacket shoulders -->
        <path d="M-210 280 C-190 125 -110 85 0 85 C110 85 190 125 210 280 Z" fill="#1e3a8a" stroke="#0b0c10" stroke-width="10"/>
        <path d="M-58 92 L0 198 L58 92 Z" fill="#fef3c7" stroke="#0b0c10" stroke-width="8"/>
        <path d="M-16 112 L0 218 L16 112 Z" fill="#f97316" stroke="#0b0c10" stroke-width="6"/>
        <!-- Straw artist hat brim -->
        <ellipse cx="0" cy="-148" rx="195" ry="44" fill="#facc15" stroke="#0b0c10" stroke-width="10"/>
        <path d="M-112 -148 C-108 -238 108 -238 112 -148 Z" fill="#eab308" stroke="#0b0c10" stroke-width="10"/>
        <path d="M-110 -158 Q0 -138 110 -158" fill="none" stroke="#1d4ed8" stroke-width="18"/>
        <!-- Neck & Face -->
        <rect x="-36" y="38" width="72" height="72" rx="18" fill="#f6c69c" stroke="#0b0c10" stroke-width="8"/>
        <!-- Ginger hair tufts -->
        <path d="M-104 -116 C-122 -55 -114 25 -82 65 L82 65 C114 25 122 -55 104 -116 Z" fill="#ea580c" stroke="#0b0c10" stroke-width="9"/>
        <!-- Face oval -->
        <ellipse cx="0" cy="-34" rx="92" ry="112" fill="#fbd1a2" stroke="#0b0c10" stroke-width="9"/>
        <!-- Bandaged ear comedy tribute -->
        <path d="M84 -70 C116 -65 118 20 82 28 Z" fill="#ffffff" stroke="#0b0c10" stroke-width="7"/>
        <line x1="92" y1="-34" x2="108" y2="-28" stroke="#cbd5e1" stroke-width="5"/>
        <!-- Iconic fiery orange beard -->
        <path d="M-86 -10 C-94 64 -48 112 0 112 C48 112 94 64 86 -10 C62 34 38 42 0 42 C-38 42 -62 34 -86 -10 Z" fill="#ea580c" stroke="#0b0c10" stroke-width="8" stroke-linejoin="round"/>
        <path d="M-44 20 Q0 4 44 20 Q28 42 0 36 Q-28 42 -44 20 Z" fill="#c2410c" stroke="#0b0c10" stroke-width="6"/>
        <!-- Wild hyper-caffeinated asymmetric eyes (perfect for liquify!) -->
        <circle cx="-36" cy="-54" r="28" fill="#ffffff" stroke="#0b0c10" stroke-width="7"/>
        <circle cx="38" cy="-58" r="34" fill="#ffffff" stroke="#0b0c10" stroke-width="7"/>
        <circle cx="-30" cy="-52" r="11" fill="#0ea5e9" stroke="#0b0c10" stroke-width="4"/>
        <circle cx="-30" cy="-52" r="5" fill="#0b0c10"/>
        <circle cx="34" cy="-56" r="13" fill="#0ea5e9" stroke="#0b0c10" stroke-width="4"/>
        <circle cx="34" cy="-56" r="6" fill="#0b0c10"/>
        <!-- Spiraling crazy eyebrows -->
        <path d="M-72 -88 Q-36 -110 -8 -84" fill="none" stroke="#c2410c" stroke-width="11" stroke-linecap="round"/>
        <path d="M8 -88 Q42 -118 76 -84" fill="none" stroke="#c2410c" stroke-width="11" stroke-linecap="round"/>
        <!-- Nose & shocked mouth -->
        <path d="M-4 -42 L-12 -4 L10 -2" fill="none" stroke="#0b0c10" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
        <ellipse cx="0" cy="48" rx="18" ry="15" fill="#7f1d1d" stroke="#0b0c10" stroke-width="6"/>
        <ellipse cx="0" cy="54" rx="10" ry="6" fill="#fb7185"/>
      </g>
    </svg>`,
    starterLayers: () => [
      {
        id: uid('txt'),
        type: 'text',
        name: '顶部梗字',
        text: '反向传播算到凌晨三点',
        x: 360,
        y: 66,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 1,
        visible: true,
        fontSize: 44,
        fontWeight: 900,
        fill: '#ffffff',
        stroke: '#0b0c10',
        strokeWidth: 9,
        shadow: true,
        bgColor: null,
        presetStyle: 'meme-impact',
      },
      {
        id: uid('bub'),
        type: 'bubble',
        name: '对白气泡',
        bubbleStyle: 'shout',
        text: '梯度又爆炸了!',
        x: 560,
        y: 255,
        scaleX: 1,
        scaleY: 1,
        rotation: 0.08,
        opacity: 1,
        visible: true,
        fontSize: 22,
        fill: '#d9ff00',
        stroke: '#0b0c10',
        textColor: '#0b0c10',
        width: 210,
        height: 112,
        tailDir: 'bottom-left',
      },
      {
        id: uid('stk'),
        type: 'sticker',
        name: '红温青筋',
        stickerId: 'angry-vein',
        x: 245,
        y: 345,
        scaleX: 0.72,
        scaleY: 0.72,
        rotation: -0.18,
        opacity: 1,
        visible: true,
        width: 110,
        height: 110,
        flipX: false,
      },
    ],
  },
  {
    id: 'orange-cat-boss',
    name: '暴躁橘座凝视',
    tagline: '高饱和波普橘猫特写 · 最适合贴墨镜与深炸包浆',
    aspectRatio: '1:1',
    defaultFilters: { speedlines: 35 },
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 720">
      <defs>
        <radialGradient id="popbg" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stop-color="#fde047"/>
          <stop offset="65%" stop-color="#fb923c"/>
          <stop offset="100%" stop-color="#ea580c"/>
        </radialGradient>
      </defs>
      <rect width="720" height="720" fill="url(#popbg)"/>
      <!-- Pop art sunburst -->
      <g fill="#fff7ed" opacity="0.28">
        <polygon points="360,360 300,-40 420,-40"/>
        <polygon points="360,360 660,-40 760,90"/>
        <polygon points="360,360 760,300 760,420"/>
        <polygon points="360,360 760,640 620,760"/>
        <polygon points="360,360 420,760 300,760"/>
        <polygon points="360,360 100,760 -40,630"/>
        <polygon points="360,360 -40,420 -40,300"/>
        <polygon points="360,360 -40,90 100,-40"/>
      </g>
      <!-- Chubby Pop-Art Tabby Cat -->
      <g transform="translate(360, 410)">
        <!-- Shoulders -->
        <ellipse cx="0" cy="245" rx="235" ry="160" fill="#f97316" stroke="#111118" stroke-width="12"/>
        <ellipse cx="0" cy="260" rx="135" ry="120" fill="#fffbeb"/>
        <!-- Ears -->
        <polygon points="-175,-95 -205,-275 -46,-172" fill="#f97316" stroke="#111118" stroke-width="12" stroke-linejoin="round"/>
        <polygon points="-155,-118 -176,-228 -78,-165" fill="#fda4af"/>
        <polygon points="175,-95 205,-275 46,-172" fill="#f97316" stroke="#111118" stroke-width="12" stroke-linejoin="round"/>
        <polygon points="155,-118 176,-228 78,-165" fill="#fda4af"/>
        <!-- Giant round chubby head -->
        <ellipse cx="0" cy="-28" rx="212" ry="182" fill="#fb923c" stroke="#111118" stroke-width="12"/>
        <!-- Forehead M stripes -->
        <path d="M-38 -195 L-28 -126 M0 -206 L0 -120 M38 -195 L28 -126" stroke="#9a3412" stroke-width="16" stroke-linecap="round"/>
        <!-- Cheeks -->
        <ellipse cx="-66" cy="54" rx="68" ry="48" fill="#fff7ed"/>
        <ellipse cx="66" cy="54" rx="68" ry="48" fill="#fff7ed"/>
        <!-- Unimpressed / Intense Meme Eyes -->
        <circle cx="-78" cy="-42" r="46" fill="#fef08a" stroke="#111118" stroke-width="9"/>
        <circle cx="78" cy="-42" r="46" fill="#fef08a" stroke="#111118" stroke-width="9"/>
        <ellipse cx="-72" cy="-40" rx="14" ry="26" fill="#0b0c10"/>
        <ellipse cx="72" cy="-40" rx="14" ry="26" fill="#0b0c10"/>
        <circle cx="-79" cy="-52" r="7" fill="#ffffff"/>
        <circle cx="65" cy="-52" r="7" fill="#ffffff"/>
        <!-- Dramatic angry eyebrows -->
        <path d="M-136 -86 L-28 -68" stroke="#111118" stroke-width="13" stroke-linecap="round"/>
        <path d="M136 -86 L28 -68" stroke="#111118" stroke-width="13" stroke-linecap="round"/>
        <!-- Pink triangle nose & smirk -->
        <polygon points="-22,12 22,12 0,36" fill="#fb7185" stroke="#111118" stroke-width="7" stroke-linejoin="round"/>
        <path d="M0 36 L0 54 M-44 64 Q-16 86 0 54 Q16 86 44 64" fill="none" stroke="#111118" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- Whiskers -->
        <g stroke="#111118" stroke-width="7" stroke-linecap="round">
          <line x1="-130" y1="34" x2="-245" y2="18"/>
          <line x1="-132" y1="56" x2="-250" y2="62"/>
          <line x1="130" y1="34" x2="245" y2="18"/>
          <line x1="132" y1="56" x2="250" y2="62"/>
        </g>
      </g>
    </svg>`,
    starterLayers: () => [
      {
        id: uid('stk'),
        type: 'sticker',
        name: '装酷墨镜',
        stickerId: 'sunglasses',
        x: 360,
        y: 368,
        scaleX: 1.25,
        scaleY: 1.25,
        rotation: -0.04,
        opacity: 1,
        visible: true,
        width: 210,
        height: 74,
        flipX: false,
      },
      {
        id: uid('txt'),
        type: 'text',
        name: '底部配文',
        text: '我看谁今天敢提需求',
        x: 360,
        y: 650,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 1,
        visible: true,
        fontSize: 48,
        fontWeight: 900,
        fill: '#d9ff00',
        stroke: '#0b0c10',
        strokeWidth: 10,
        shadow: true,
        bgColor: null,
        presetStyle: 'acid-pop',
      },
    ],
  },
  {
    id: 'vaporwave-meltdown',
    name: '赛博精神污染日落',
    tagline: '霓虹蒸汽波网格背景 · 自由粘贴照片/梗图绝配',
    aspectRatio: '1:1',
    defaultFilters: { rgbShift: 22, glitch: 15 },
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 720">
      <defs>
        <linearGradient id="vsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#09041f"/>
          <stop offset="52%" stop-color="#4c0b63"/>
          <stop offset="68%" stop-color="#db2777"/>
          <stop offset="100%" stop-color="#0f0728"/>
        </linearGradient>
        <linearGradient id="vsun" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="55%" stop-color="#fb7185"/>
          <stop offset="100%" stop-color="#ec4899"/>
        </linearGradient>
      </defs>
      <rect width="720" height="720" fill="url(#vsky)"/>
      <!-- Star field -->
      <g fill="#ffffff" opacity="0.75">
        <circle cx="80" cy="70" r="2.5"/><circle cx="195" cy="110" r="2"/><circle cx="620" cy="85" r="3"/>
        <circle cx="540" cy="48" r="2"/><circle cx="320" cy="54" r="2.5"/><circle cx="120" cy="190" r="2"/>
        <circle cx="655" cy="175" r="2.5"/><circle cx="445" cy="92" r="2"/><circle cx="240" cy="42" r="2"/>
      </g>
      <!-- Striped synthwave sun -->
      <circle cx="360" cy="310" r="168" fill="url(#vsun)"/>
      <g fill="#4c0b63">
        <rect x="170" y="315" width="380" height="10"/>
        <rect x="170" y="344" width="380" height="14"/>
        <rect x="170" y="378" width="380" height="18"/>
        <rect x="170" y="416" width="380" height="24"/>
      </g>
      <!-- Wireframe mountains -->
      <polygon points="0,465 135,345 255,465" fill="#180a38" stroke="#22d3ee" stroke-width="4"/>
      <polygon points="180,465 320,380 445,465" fill="#13082e" stroke="#f472b6" stroke-width="4"/>
      <polygon points="410,465 575,335 720,465" fill="#180a38" stroke="#22d3ee" stroke-width="4"/>
      <!-- Perspective neon floor -->
      <rect x="0" y="465" width="720" height="255" fill="#0d0622"/>
      <g stroke="#22d3ee" stroke-width="2.5" opacity="0.78">
        <line x1="0" y1="465" x2="720" y2="465" stroke="#f472b6" stroke-width="4"/>
        <line x1="0" y1="490" x2="720" y2="490"/>
        <line x1="0" y1="525" x2="720" y2="525"/>
        <line x1="0" y1="572" x2="720" y2="572"/>
        <line x1="0" y1="635" x2="720" y2="635"/>
        <line x1="360" y1="465" x2="360" y2="720"/>
        <line x1="310" y1="465" x2="200" y2="720"/>
        <line x1="260" y1="465" x2="20" y2="720"/>
        <line x1="210" y1="465" x2="-180" y2="720"/>
        <line x1="410" y1="465" x2="520" y2="720"/>
        <line x1="460" y1="465" x2="700" y2="720"/>
        <line x1="510" y1="465" x2="900" y2="720"/>
      </g>
    </svg>`,
    starterLayers: () => [
      {
        id: uid('txt'),
        type: 'text',
        name: '赛博标语',
        text: '精神状态极其稳定',
        x: 360,
        y: 310,
        scaleX: 1,
        scaleY: 1,
        rotation: -0.05,
        opacity: 1,
        visible: true,
        fontSize: 58,
        fontWeight: 900,
        fill: '#ffffff',
        stroke: '#ff2e93',
        strokeWidth: 10,
        shadow: true,
        bgColor: null,
        presetStyle: 'acid-pop',
      },
      {
        id: uid('stk'),
        type: 'sticker',
        name: '精神超前红章',
        stickerId: 'stamp-ahead',
        x: 565,
        y: 550,
        scaleX: 0.95,
        scaleY: 0.95,
        rotation: 0.1,
        opacity: 1,
        visible: true,
        width: 165,
        height: 165,
        flipX: false,
      },
    ],
  },
  {
    id: 'manga-scream',
    name: '高能黑白暴漫分镜',
    tagline: '经典黑白漫画冲击波 · 配上大字直接成神级表情包',
    aspectRatio: '1:1',
    defaultFilters: { speedlines: 65 },
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 720">
      <rect width="720" height="720" fill="#f8fafc"/>
      <defs>
        <pattern id="dots" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="8" cy="8" r="2.8" fill="#cbd5e1"/>
        </pattern>
      </defs>
      <rect width="720" height="720" fill="url(#dots)"/>
      <circle cx="360" cy="360" r="235" fill="#ffffff" stroke="#0b0c10" stroke-width="10"/>
      <!-- Dramatic comic shock silhouette face -->
      <g transform="translate(360, 385)">
        <ellipse cx="0" cy="-18" rx="148" ry="165" fill="#ffffff" stroke="#0b0c10" stroke-width="12"/>
        <!-- Sweating frantic lines -->
        <path d="M-92 -145 L-92 -82 M-72 -158 L-72 -92 M-52 -162 L-52 -100" stroke="#0b0c10" stroke-width="6" stroke-linecap="round"/>
        <!-- Wide staring eyes -->
        <circle cx="-54" cy="-42" r="36" fill="#ffffff" stroke="#0b0c10" stroke-width="9"/>
        <circle cx="56" cy="-48" r="42" fill="#ffffff" stroke="#0b0c10" stroke-width="9"/>
        <circle cx="-50" cy="-42" r="8" fill="#0b0c10"/>
        <circle cx="52" cy="-48" r="9" fill="#0b0c10"/>
        <!-- Screaming open mouth -->
        <path d="M-66 42 Q0 18 66 42 Q76 118 0 124 Q-76 118 -66 42 Z" fill="#0b0c10"/>
        <path d="M-44 46 L44 46 L38 62 L-38 62 Z" fill="#ffffff"/>
        <ellipse cx="0" cy="100" rx="32" ry="16" fill="#f43f5e"/>
      </g>
    </svg>`,
    starterLayers: () => [
      {
        id: uid('bub'),
        type: 'bubble',
        name: '尖叫气泡',
        bubbleStyle: 'shout',
        text: '你说什么?!',
        x: 548,
        y: 138,
        scaleX: 1,
        scaleY: 1,
        rotation: 0.08,
        opacity: 1,
        visible: true,
        fontSize: 28,
        fill: '#ffffff',
        stroke: '#0b0c10',
        textColor: '#0b0c10',
        width: 225,
        height: 120,
        tailDir: 'bottom-left',
      },
      {
        id: uid('stk'),
        type: 'sticker',
        name: '漫画面大汗',
        stickerId: 'sweat-drop',
        x: 195,
        y: 235,
        scaleX: 0.9,
        scaleY: 0.9,
        rotation: -0.1,
        opacity: 1,
        visible: true,
        width: 82,
        height: 122,
        flipX: false,
      },
    ],
  },
  {
    id: 'acid-poster',
    name: '酸性潮玩海报底板',
    tagline: '3:4 竖版潮玩海报比例 · 发小红书/朋友圈绝佳',
    aspectRatio: '3:4',
    defaultFilters: { vignette: 12 },
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 854">
      <defs>
        <linearGradient id="ac" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#11131a"/>
          <stop offset="50%" stop-color="#1b1433"/>
          <stop offset="100%" stop-color="#0b181f"/>
        </linearGradient>
      </defs>
      <rect width="640" height="854" fill="url(#ac)"/>
      <circle cx="510" cy="180" r="220" fill="#ff2e93" opacity="0.22"/>
      <circle cx="130" cy="670" r="240" fill="#22d3ee" opacity="0.2"/>
      <circle cx="320" cy="430" r="190" fill="none" stroke="#d9ff00" stroke-width="3" stroke-dasharray="14 10" opacity="0.7"/>
      <rect x="28" y="28" width="584" height="798" rx="18" fill="none" stroke="#ffffff" stroke-opacity="0.18" stroke-width="2"/>
      <text x="320" y="92" font-family="Impact, Arial Black, sans-serif" font-size="22" letter-spacing="8" fill="#d9ff00" text-anchor="middle">MOXING // EDITION 03</text>
      <text x="320" y="790" font-family="monospace" font-size="16" letter-spacing="4" fill="#94a3b8" text-anchor="middle">CTRL+V PASTE ANY PHOTO OR GENERATE WITH AI</text>
    </svg>`,
    starterLayers: () => [
      {
        id: uid('txt'),
        type: 'text',
        name: '潮玩主标题',
        text: '今日精神状态\n已全面超前',
        x: 320,
        y: 420,
        scaleX: 1,
        scaleY: 1,
        rotation: -0.04,
        opacity: 1,
        visible: true,
        fontSize: 58,
        fontWeight: 900,
        fill: '#d9ff00',
        stroke: '#0b0c10',
        strokeWidth: 9,
        shadow: true,
        bgColor: null,
        presetStyle: 'acid-pop',
      },
    ],
  },
];

const templateImageCache = new Map<string, HTMLImageElement>();

export function getTemplateById(id: string): StudioTemplate {
  return STUDIO_TEMPLATES.find((t) => t.id === id) ?? STUDIO_TEMPLATES[0];
}

export function loadTemplateImage(templateId: string): Promise<HTMLImageElement> {
  const cached = templateImageCache.get(templateId);
  if (cached) return Promise.resolve(cached);

  const tpl = getTemplateById(templateId);
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(tpl.svg)}`;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      templateImageCache.set(templateId, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error(`Template decode failed: ${templateId}`));
    img.src = url;
  });
}

export function getDefaultFiltersForTemplate(tpl: StudioTemplate): FilterState {
  return { ...DEFAULT_FILTERS, ...tpl.defaultFilters };
}
