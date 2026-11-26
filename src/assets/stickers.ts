export interface StickerDefinition {
  id: string;
  label: string;
  category: 'face' | 'comic' | 'stamp';
  defaultWidth: number;
  defaultHeight: number;
  svg: string;
}

export const STICKER_LIBRARY: StickerDefinition[] = [
  {
    id: 'sunglasses',
    label: '装酷墨镜',
    category: 'face',
    defaultWidth: 210,
    defaultHeight: 74,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 84">
      <rect x="6" y="14" width="228" height="14" rx="3" fill="#0b0c10"/>
      <path d="M18 18 H108 V62 Q108 74 94 74 H34 Q18 74 18 58 Z" fill="#0b0c10" stroke="#22d3ee" stroke-width="5"/>
      <path d="M132 18 H222 V58 Q222 74 206 74 H146 Q132 74 132 62 Z" fill="#0b0c10" stroke="#22d3ee" stroke-width="5"/>
      <rect x="108" y="24" width="24" height="10" fill="#22d3ee"/>
      <polygon points="34,26 52,26 38,62 24,62" fill="#ffffff" opacity="0.88"/>
      <polygon points="58,26 68,26 54,62 46,62" fill="#ffffff" opacity="0.5"/>
      <polygon points="148,26 166,26 152,62 138,62" fill="#ffffff" opacity="0.88"/>
      <polygon points="172,26 182,26 168,62 160,62" fill="#ffffff" opacity="0.5"/>
    </svg>`,
  },
  {
    id: 'angry-vein',
    label: '红温青筋',
    category: 'comic',
    defaultWidth: 110,
    defaultHeight: 110,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <g stroke="#111118" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <path d="M22 44 Q46 44 46 20"/>
        <path d="M98 44 Q74 44 74 20"/>
        <path d="M22 76 Q46 76 46 100"/>
        <path d="M98 76 Q74 76 74 100"/>
      </g>
      <g stroke="#ff2442" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <path d="M22 44 Q46 44 46 20"/>
        <path d="M98 44 Q74 44 74 20"/>
        <path d="M22 76 Q46 76 46 100"/>
        <path d="M98 76 Q74 76 74 100"/>
      </g>
    </svg>`,
  },
  {
    id: 'sweat-drop',
    label: '漫画面大汗',
    category: 'comic',
    defaultWidth: 82,
    defaultHeight: 122,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 135">
      <defs>
        <linearGradient id="sw" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#e0f2fe"/>
          <stop offset="55%" stop-color="#38bdf8"/>
          <stop offset="100%" stop-color="#0284c7"/>
        </linearGradient>
      </defs>
      <path d="M45 10 C45 10 80 65 80 92 C80 112 64 126 45 126 C26 126 10 112 10 92 C10 65 45 10 45 10 Z" fill="url(#sw)" stroke="#111118" stroke-width="7" stroke-linejoin="round"/>
      <ellipse cx="32" cy="84" rx="8" ry="18" transform="rotate(-14 32 84)" fill="#ffffff" opacity="0.85"/>
      <circle cx="38" cy="107" r="4.5" fill="#ffffff" opacity="0.8"/>
    </svg>`,
  },
  {
    id: 'laser-eyes',
    label: '激光射线眼',
    category: 'face',
    defaultWidth: 320,
    defaultHeight: 110,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120">
      <defs>
        <radialGradient id="gl" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="35%" stop-color="#ff2e63"/>
          <stop offset="100%" stop-color="#ff2e63" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="bm" x1="0" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stop-color="#ff2e63" stop-opacity="0"/>
          <stop offset="30%" stop-color="#ff2e63" stop-opacity="0.95"/>
          <stop offset="50%" stop-color="#ffffff"/>
          <stop offset="70%" stop-color="#ff2e63" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="#ff2e63" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <polygon points="0,56 360,42 360,78 0,64" fill="url(#bm)" opacity="0.85"/>
      <rect x="8" y="57" width="344" height="6" fill="#ffffff" opacity="0.9"/>
      <circle cx="122" cy="60" r="46" fill="url(#gl)"/>
      <circle cx="238" cy="60" r="46" fill="url(#gl)"/>
      <polygon points="122,20 128,54 162,60 128,66 122,100 116,66 82,60 116,54" fill="#ffffff"/>
      <polygon points="238,20 244,54 278,60 244,66 238,100 232,66 198,60 232,54" fill="#ffffff"/>
    </svg>`,
  },
  {
    id: 'crown',
    label: '抽象王者皇冠',
    category: 'face',
    defaultWidth: 165,
    defaultHeight: 118,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 130">
      <path d="M22 104 L12 36 L58 66 L90 18 L122 66 L168 36 L158 104 Z" fill="#facc15" stroke="#111118" stroke-width="8" stroke-linejoin="round"/>
      <rect x="20" y="96" width="140" height="22" rx="6" fill="#eab308" stroke="#111118" stroke-width="7"/>
      <circle cx="90" cy="78" r="10" fill="#ff2e93" stroke="#111118" stroke-width="4"/>
      <circle cx="52" cy="84" r="7" fill="#22d3ee" stroke="#111118" stroke-width="3.5"/>
      <circle cx="128" cy="84" r="7" fill="#22d3ee" stroke="#111118" stroke-width="3.5"/>
      <circle cx="12" cy="32" r="7" fill="#fde047" stroke="#111118" stroke-width="4"/>
      <circle cx="90" cy="14" r="8" fill="#fde047" stroke="#111118" stroke-width="4"/>
      <circle cx="168" cy="32" r="7" fill="#fde047" stroke="#111118" stroke-width="4"/>
    </svg>`,
  },
  {
    id: 'tears-jet',
    label: '瀑布泪流成河',
    category: 'face',
    defaultWidth: 180,
    defaultHeight: 180,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <defs>
        <linearGradient id="tr" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#bae6fd"/>
          <stop offset="60%" stop-color="#38bdf8"/>
          <stop offset="100%" stop-color="#0284c7" stop-opacity="0.85"/>
        </linearGradient>
      </defs>
      <path d="M36 16 Q22 96 14 186 Q34 196 54 186 Q56 98 64 16 Z" fill="url(#tr)" stroke="#0f172a" stroke-width="6" stroke-linejoin="round"/>
      <path d="M136 16 Q144 98 146 186 Q166 196 186 186 Q178 96 164 16 Z" fill="url(#tr)" stroke="#0f172a" stroke-width="6" stroke-linejoin="round"/>
      <path d="M38 36 L30 160" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity="0.8"/>
      <path d="M162 36 L170 160" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity="0.8"/>
    </svg>`,
  },
  {
    id: 'clown-nose',
    label: '小丑红鼻子',
    category: 'face',
    defaultWidth: 88,
    defaultHeight: 88,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <radialGradient id="cn" cx="35%" cy="32%" r="65%">
          <stop offset="0%" stop-color="#ff8fa3"/>
          <stop offset="45%" stop-color="#ef233c"/>
          <stop offset="100%" stop-color="#8d0801"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="42" fill="url(#cn)" stroke="#111118" stroke-width="6"/>
      <ellipse cx="36" cy="34" rx="12" ry="7" transform="rotate(-32 36 34)" fill="#ffffff" opacity="0.85"/>
    </svg>`,
  },
  {
    id: 'question-marks',
    label: '黑人问号三连',
    category: 'comic',
    defaultWidth: 165,
    defaultHeight: 112,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 140">
      <g font-family="Impact, Arial Black, sans-serif" font-weight="900" text-anchor="middle" stroke="#111118" stroke-width="11" paint-order="stroke">
        <text x="48" y="102" font-size="78" fill="#22d3ee" transform="rotate(-18 48 92)">?</text>
        <text x="108" y="96" font-size="96" fill="#d9ff00" transform="rotate(4 108 86)">?</text>
        <text x="166" y="108" font-size="74" fill="#ff2e93" transform="rotate(20 166 96)">?</text>
      </g>
    </svg>`,
  },
  {
    id: 'fire-aura',
    label: '背后燃起来了',
    category: 'comic',
    defaultWidth: 160,
    defaultHeight: 165,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 170">
      <path d="M80 10 C102 42 142 64 136 112 C132 144 108 160 80 160 C52 160 24 142 22 108 C20 74 44 58 46 36 C56 48 64 46 66 28 C72 20 76 14 80 10 Z" fill="#ff4d00" stroke="#111118" stroke-width="7" stroke-linejoin="round"/>
      <path d="M80 54 C96 76 116 92 112 122 C108 142 94 152 80 152 C64 152 46 140 46 118 C46 98 62 84 68 68 C73 74 78 68 80 54 Z" fill="#facc15"/>
      <path d="M80 96 C90 110 96 122 92 138 C89 147 71 147 68 138 C64 124 72 110 80 96 Z" fill="#ffffff" opacity="0.9"/>
    </svg>`,
  },
  {
    id: 'censored-bar',
    label: '神秘打码黑条',
    category: 'stamp',
    defaultWidth: 230,
    defaultHeight: 62,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 70">
      <rect x="4" y="8" width="252" height="54" rx="4" fill="#090a0e" stroke="#d9ff00" stroke-width="5"/>
      <text x="130" y="45" font-family="Impact, Microsoft YaHei, sans-serif" font-weight="900" font-size="28" letter-spacing="4" fill="#d9ff00" text-anchor="middle">CENSORED</text>
    </svg>`,
  },
  {
    id: 'stamp-ahead',
    label: '精神超前红章',
    category: 'stamp',
    defaultWidth: 165,
    defaultHeight: 165,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180">
      <g transform="rotate(-14 90 90)">
        <circle cx="90" cy="90" r="76" fill="rgba(239,35,60,0.12)" stroke="#ef233c" stroke-width="8" stroke-dasharray="14 5"/>
        <circle cx="90" cy="90" r="64" fill="none" stroke="#ef233c" stroke-width="3.5"/>
        <rect x="14" y="66" width="152" height="48" rx="6" fill="#ef233c"/>
        <text x="90" y="99" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle">精神超前</text>
        <text x="90" y="50" font-family="Arial Black, sans-serif" font-size="13" letter-spacing="3" fill="#ef233c" text-anchor="middle">★ CERTIFIED ★</text>
        <text x="90" y="138" font-family="Arial Black, sans-serif" font-size="12" letter-spacing="2" fill="#ef233c" text-anchor="middle">MOXING STUDIO</text>
      </g>
    </svg>`,
  },
  {
    id: 'brain-overload',
    label: '大脑过载闪电',
    category: 'comic',
    defaultWidth: 130,
    defaultHeight: 150,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 160">
      <polygon points="84,8 28,88 68,88 52,152 116,66 76,66" fill="#d9ff00" stroke="#111118" stroke-width="8" stroke-linejoin="round"/>
      <polygon points="80,26 46,78 72,78 62,126 98,74 72,74" fill="#ffffff" opacity="0.5"/>
    </svg>`,
  },
];

const stickerCache = new Map<string, HTMLImageElement>();
const stickerPromises = new Map<string, Promise<HTMLImageElement>>();

export function getStickerDef(id: string): StickerDefinition | undefined {
  return STICKER_LIBRARY.find((s) => s.id === id);
}

export function getStickerDataUrl(id: string): string {
  const def = getStickerDef(id);
  if (!def) return '';
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(def.svg)}`;
}

export function getCachedStickerImage(id: string): HTMLImageElement | null {
  return stickerCache.get(id) ?? null;
}

export function preloadStickerImage(id: string): Promise<HTMLImageElement> {
  const cached = stickerCache.get(id);
  if (cached) return Promise.resolve(cached);
  const existing = stickerPromises.get(id);
  if (existing) return existing;

  const url = getStickerDataUrl(id);
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      stickerCache.set(id, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error(`Failed to decode sticker: ${id}`));
    img.src = url;
  });

  stickerPromises.set(id, promise);
  return promise;
}

export function preloadAllStickers(): Promise<void> {
  return Promise.all(STICKER_LIBRARY.map((s) => preloadStickerImage(s.id))).then(() => undefined);
}
