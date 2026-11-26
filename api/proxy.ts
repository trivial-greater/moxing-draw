// Vercel / Cloudflare Pages compatible Serverless AI API Proxy
// Prevents browser CORS errors when calling SiliconFlow, OpenAI, Pollinations, Gemini, HuggingFace.

export const config = {
  runtime: 'edge',
};

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

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method === 'GET' && url.searchParams.get('ping') === '1') {
    return new Response(JSON.stringify({ ok: true, mode: 'edge-proxy' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const payload = (await req.json()) as {
      targetUrl?: string;
      method?: 'GET' | 'POST';
      headers?: Record<string, string>;
      body?: unknown;
    };
    const safeUrl = payload.targetUrl ? isSafeHttpsUrl(payload.targetUrl) : null;
    if (!safeUrl) {
      return new Response(JSON.stringify({ error: 'Invalid targetUrl' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const method = payload.method === 'GET' ? 'GET' : 'POST';
    const headers = new Headers();
    if (payload.headers) {
      for (const [k, v] of Object.entries(payload.headers)) {
        const l = k.toLowerCase();
        if (l === 'host' || l === 'origin' || l === 'referer' || l === 'content-length') continue;
        headers.set(k, v);
      }
    }

    const init: RequestInit = { method, headers };
    if (method === 'POST' && payload.body !== undefined) {
      init.body = typeof payload.body === 'string' ? payload.body : JSON.stringify(payload.body);
      if (!headers.has('content-type')) headers.set('content-type', 'application/json');
    }

    const upstream = await fetch(safeUrl.toString(), init);
    const respHeaders = new Headers();
    respHeaders.set('Content-Type', upstream.headers.get('content-type') || 'application/octet-stream');
    respHeaders.set('Access-Control-Allow-Origin', '*');

    return new Response(upstream.body, {
      status: upstream.status,
      headers: respHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Proxy failed' }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      },
    );
  }
}
