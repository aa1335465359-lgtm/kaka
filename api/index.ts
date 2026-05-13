// Vercel serverless function handler for kaka API proxy
// Proxies requests to 9w7.cn with API key from env vars

const API_KEY = process.env.gpt || process.env.VITE_gpt || '';
const MASKED_KEY = API_KEY ? `${API_KEY.substring(0, 4)}...${API_KEY.substring(API_KEY.length - 4)}` : 'MISSING';

function json(res, status, data) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.end(JSON.stringify(data));
}

async function readBody(req) {
    return new Promise((resolve) => {
        if (req.body) return resolve(req.body);
        let data = '';
        req.on('data', chunk => { data += chunk; });
        req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch(e) { resolve({ _raw: data }); } });
    });
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

    const path = req.url.replace(/\/api/, '').split('?')[0];
    console.log(`[${req.method}] ${path} | key: ${MASKED_KEY}`);

    try {
        // Health check - works without API key
        if (req.method === 'GET' && path === '/health') {
            return json(res, 200, {
                status: 'ok',
                has_key: !!API_KEY,
                key_preview: MASKED_KEY,
                env_keys: Object.keys(process.env).filter(k => 
                    k.toLowerCase().includes('gpt') || k.toLowerCase().includes('key')
                ).join(',')
            });
        }

        // All other endpoints require API key
        if (!API_KEY) {
            return json(res, 500, { 
                error: 'API Key not configured', 
                hint: 'Set environment variable "gpt" or "VITE_gpt" on Vercel',
                env_keys_found: Object.keys(process.env).filter(k => 
                    k.toLowerCase().includes('gpt') || k.toLowerCase().includes('key')
                ).join(',')
            });
        }

        // Chat Completions
        if (req.method === 'POST' && path === '/chat') {
            const body = await readBody(req);
            const upstreamBody = JSON.stringify(body);
            console.log(`[chat] body: ${upstreamBody.length} bytes`);

            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 360000);

            try {
                const upstream = await fetch('https://9w7.cn/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${API_KEY}`
                    },
                    body: upstreamBody,
                    signal: controller.signal
                });
                clearTimeout(timer);
                const text = await upstream.text();
                console.log(`[chat] upstream: ${upstream.status}, ${text.length} bytes`);
                let data;
                try { data = JSON.parse(text); } catch(e) { data = { raw: text }; }
                return json(res, upstream.status, data);
            } catch(e) {
                clearTimeout(timer);
                console.error(`[chat] upstream error:`, e.message);
                return json(res, 502, { error: 'Upstream request failed', detail: e.message });
            }
        }

        // Image Generations
        if (req.method === 'POST' && path === '/images') {
            const body = await readBody(req);
            const promptSize = body.prompt ? body.prompt.length : 0;
            const upstreamBody = JSON.stringify(body);
            console.log(`[images] prompt: ${promptSize} chars, body: ${upstreamBody.length} bytes`);

            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 360000);

            try {
                const upstream = await fetch('https://9w7.cn/v1/images/generations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${API_KEY}`
                    },
                    body: upstreamBody,
                    signal: controller.signal
                });
                clearTimeout(timer);
                const text = await upstream.text();
                console.log(`[images] upstream: ${upstream.status}, ${text.length} bytes`);
                let data;
                try { data = JSON.parse(text); } catch(e) { data = { raw: text }; }
                return json(res, upstream.status, data);
            } catch(e) {
                clearTimeout(timer);
                console.error(`[images] upstream error:`, e.message);
                return json(res, 502, { error: 'Upstream request failed', detail: e.message });
            }
        }

        json(res, 404, { error: 'Not found', path });

    } catch(e) {
        console.error(`[handler] FATAL:`, e.message);
        json(res, 500, { error: 'Internal server error', message: e.message });
    }
}
