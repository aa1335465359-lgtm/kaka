// Minimal Vercel handler - pure ESM, no async, no deps
export default function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  // Parse URL path
  const path = req.url.replace(/\/api/, '').split('?')[0];

  if (req.method === 'GET' && path === '/health') {
    const hasKey = !!(process.env.gpt || process.env.VITE_gpt);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      status: 'ok',
      has_key: hasKey,
      env_keys: Object.keys(process.env).filter(k => 
        k.toLowerCase().includes('gpt') || k.toLowerCase().includes('key')
      ).join(',')
    }));
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ ok: true, path, method: req.method }));
}
