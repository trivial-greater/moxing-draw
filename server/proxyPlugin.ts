import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';

interface ProxyPayload {
  targetUrl?: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: unknown;
  responseType?: 'json' | 'binary';
}

function isSafeHttpsUrl(raw: string): URL | null {
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'https:') return null;
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      host.startsWith('169.254.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
      host.endsWith('.local')
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    req.on('data', (chunk: Buffer) => {
      total += chunk.length;
      if (total > 2 * 1024 * 1024) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(JSON.stringify(payload));
}

function attachProxyMiddleware(middlewares: {
  use: (handler: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void;
}) {
  middlewares.use(async (req, res, next) => {
    const urlStr = req.url || '';
    if (!urlStr.startsWith('/api/proxy') && !urlStr.startsWith('/api/image-proxy')) {
      next();
      return;
    }

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.end();
      return;
    }

    // 1. Health check for frontend proxy detection
    if (urlStr === '/api/proxy?ping=1' && req.method === 'GET') {
      sendJson(res, 200, { ok: true, mode: 'vite-proxy' });
      return;
    }

    // 2. Binary image CORS passthrough (/api/image-proxy?url=...)
    if (urlStr.startsWith('/api/image-proxy')) {
      try {
        const reqUrl = new URL(urlStr, 'http://localhost');
        const target = reqUrl.searchParams.get('url') || '';
        const safeUrl = isSafeHttpsUrl(target);
        if (!safeUrl) {
          sendJson(res, 400, { error: 'Invalid or disallowed image URL (must be public HTTPS)' });
          return;
        }
        const upstream = await fetch(safeUrl.toString(), {
          headers: { 'User-Agent': 'MoxingStudio/3.0' },
        });
        if (!upstream.ok) {
          sendJson(res, upstream.status, { error: `Image upstream HTTP ${upstream.status}` });
          return;
        }
        const contentType = upstream.headers.get('content-type') || 'image/png';
        const arrayBuf = await upstream.arrayBuffer();
        res.statusCode = 200;
        res.setHeader('Content-Type', contentType);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=300');
        res.end(Buffer.from(arrayBuf));
      } catch (err) {
        sendJson(res, 502, {
          error: err instanceof Error ? err.message : 'Image proxy failed',
        });
      }
      return;
    }

    // 3. Universal AI API Proxy (POST /api/proxy)
    if (urlStr.startsWith('/api/proxy') && req.method === 'POST') {
      try {
        const raw = await readBody(req);
        const payload = JSON.parse(raw) as ProxyPayload;
        const safeUrl = payload.targetUrl ? isSafeHttpsUrl(payload.targetUrl) : null;
        if (!safeUrl) {
          sendJson(res, 400, { error: 'Invalid or disallowed targetUrl (must be public HTTPS)' });
          return;
        }

        const method = payload.method === 'GET' ? 'GET' : 'POST';
        const headers: Record<string, string> = {
          'User-Agent': 'MoxingStudio/3.0',
        };
        if (payload.headers) {
          for (const [k, v] of Object.entries(payload.headers)) {
            const lower = k.toLowerCase();
            if (lower === 'host' || lower === 'content-length' || lower === 'origin' || lower === 'referer') {
              continue;
            }
            headers[k] = v;
          }
        }

        const init: RequestInit = { method, headers };
        if (method === 'POST' && payload.body !== undefined) {
          init.body = typeof payload.body === 'string' ? payload.body : JSON.stringify(payload.body);
          if (!Object.keys(headers).some((k) => k.toLowerCase() === 'content-type')) {
            headers['Content-Type'] = 'application/json';
          }
        }

        const upstream = await fetch(safeUrl.toString(), init);
        const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
        const buf = Buffer.from(await upstream.arrayBuffer());

        res.statusCode = upstream.status;
        res.setHeader('Content-Type', contentType);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(buf);
      } catch (err) {
        sendJson(res, 502, {
          error: err instanceof Error ? err.message : 'Proxy request failed',
        });
      }
      return;
    }

    sendJson(res, 405, { error: 'Method not allowed' });
  });
}

export function moxingProxyPlugin(): Plugin {
  return {
    name: 'moxing-api-proxy',
    configureServer(server) {
      attachProxyMiddleware(server.middlewares);
    },
    configurePreviewServer(server) {
      attachProxyMiddleware(server.middlewares);
    },
  };
}
