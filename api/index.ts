// Simple Vercel serverless function handler
// No Express dependency - uses raw Node.js http primitives

const API_KEY = process.env.gpt || process.env.VITE_gpt || '';
const MASKED_KEY = API_KEY ? `${API_KEY.substring(0, 4)}...${API_KEY.substring(API_KEY.length - 4)}` : 'MISSING';

function parseBody(req) {
    return new Promise((resolve) => {
        if (req.body) return resolve(req.body);
        let data = '';
        req.on('data', chunk => { data += chunk; });
        req.on('end', () => {
            try { resolve(data ? JSON.parse(data) : {}); }
            catch(e) { resolve({ raw: data }); }
        });
    });
}

function json(res, status, data) {
    res.writeHead(status, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end(JSON.stringify(data));
}

async function proxyToUpstream(upstreamUrl, body, timeout) {
    const upstreamBody = JSON.stringify(body);
    console.log(`[proxy] → ${upstreamUrl} | body: ${upstreamBody.length} bytes`);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout || 180000);

    try {
        const response = await fetch(upstreamUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: upstreamBody,
            signal: controller.signal
        });

        clearTimeout(timer);
        const text = await response.text();
        console.log(`[proxy] ← status: ${response.status}, len: ${text.length}`);
        return { status: response.status, body: text };
    } catch(e) {
        clearTimeout(timer);
        console.error(`[proxy] error:`, e.message);
        throw e;
    }
}

export default async function handler(req, res) {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400'
        });
        return res.end();
    }

    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname.replace(/^\/api/, '') || '/';

    console.log(`[handler] ${req.method} ${path} | key: ${MASKED_KEY}`);

    try {
        // Health check
        if (req.method === 'GET' && path === '/health') {
            return json(res, 200, {
                status: 'ok',
                has_key: !!API_KEY,
                key_preview: MASKED_KEY,
                node_version: process.version
            });
        }

        if (!API_KEY) {
            return json(res, 500, { error: 'API Key (gpt) not configured in environment' });
        }

        // Chat Completions
        if (req.method === 'POST' && path === '/chat') {
            const body = await parseBody(req);
            const result = await proxyToUpstream(
                'https://9w7.cn/v1/chat/completions',
                body,
                180000
            );
            return json(res, result.status, JSON.parse(result.body));
        }

        // Image Generations
        if (req.method === 'POST' && path === '/images') {
            const body = await parseBody(req);
            const promptSize = body.prompt ? body.prompt.length : 0;
            console.log(`[images] prompt: ${promptSize} chars`);

            const result = await proxyToUpstream(
                'https://9w7.cn/v1/images/generations',
                body,
                180000
            );
            return json(res, result.status, JSON.parse(result.body));
        }

        // 404
        json(res, 404, { error: 'Not found', path });

    } catch(e) {
        console.error(`[handler] FATAL:`, e.message);
        json(res, 500, {
            error: 'Internal Error',
            message: e.message,
            type: e.name
        });
    }
}
