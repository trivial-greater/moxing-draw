# MOXING STUDIO v3.0 · 灵魂魔性工坊

从 v2.0 推翻重构的现代化 **AI 魔性生图 & 交互式梗图 / GIF 动图工坊**。  
采用 **Vite + React 19 + TypeScript + Tailwind CSS v4 + 内置零跨域代理层**，彻底解决旧版打开即 402 报错、硅基流动 CORS 拦截、Canvas 导出污染、贴纸挡脸与无法导出动图等痛点。

> 旧版 v2.0.0 完整保留在 Git 分支 `archive/v2.0-legacy` 与标签 `v2.0.0` / `archive-v2.0-before-rewrite`。

## 核心能力

- **双源零门槛开玩**：
  - **本地/模板二创（免 Key）**：支持拖拽照片、`Ctrl+V` 直接粘贴任意截图，以及 5 套原创高质感魔性底图模板，打开第一秒即可创作。
  - **多厂商真 AI 文生图**：内置本地与 Vercel Edge 代理层（`/api/proxy` + `/api/image-proxy`），彻底解决 CORS 跨域与图片导出污染，统一支持 **硅基流动 SiliconFlow（Kolors / FLUX）**、**Pollinations v2（`gen.pollinations.ai`）**、**Google Gemini Image**、**Hugging Face** 及任意 **OpenAI 兼容接口**；内置 6 种画风 Prompt 导演、随机种子锁定与可中止请求。
- **交互式自由图层画布**：
  - 梗字、4 种漫画对白气泡、12 款高清矢量 SVG 贴纸全部支持 **拖拽移动、四角缩放、顶部旋转、双击改字、图层层级调整** 以及 **40 步 `Ctrl+Z / Ctrl+Y` 撤销重做**。
- **魔性哈哈镜液化笔刷（Liquify Warp）**：
  - 鼠标在画布上点/涂即可实时进行 **大眼膨胀 / 收缩 / 左右漩涡扭曲**，支持调半径与力度、按步撤回与一键还原。
- **像素级魔性滤镜管线**：
  - 电子包浆（Deep-Fry）、复古像素化、真实逐通道 RGB 色散、赛博故障切片 + CRT 扫描线、暴漫黑白网点（Halftone）、漫画速度线、戏剧暗角与色相偏移，支持 6 种一键风格预设与独立滑块叠加。
- **真实 `.gif` 动图导出 + IndexedDB 工程库**：
  - 5 种鬼畜动效实时预览，并直接在浏览器本地编码导出可发微信/QQ 的真实 `.gif` 表情包，以及高清 PNG 与剪贴板复制。
  - 工程库使用 IndexedDB 持久化保存**原图 + 全部可编辑图层、哈哈镜与滤镜参数**，刷新不丢失，随时加载二次修改。

## 本地运行

```bash
npm install
npm run dev
```

启动后访问终端输出的地址（默认 `http://localhost:5173`），内置代理层自动就绪。

## 构建部署

```bash
npm run build
```

- **Vercel / Cloudflare Pages**：直接关联仓库部署即可，根目录 `api/proxy.ts` 与 `api/image-proxy.ts` 会自动生效。
- **GitHub Pages**：`dist/` 可直接作为纯静态站部署（自动降级为纯静态模式，本地照片二创、模板、哈哈镜、滤镜与 GIF 导出 100% 可用）。
