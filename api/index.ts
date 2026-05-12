import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

const API_KEY = process.env.gpt || process.env.VITE_gpt || '';
const MASKED_KEY = API_KEY ? `${API_KEY.substring(0, 4)}...${API_KEY.substring(API_KEY.length - 4)}` : 'MISSING';

router.use(cors());
router.use(express.json({ limit: '50mb' }));

router.use((req, res, next) => {
    const bodySize = req.body ? JSON.stringify(req.body).length : 0;
    console.log(`[API] ${req.method} ${req.path} | body: ${bodySize} bytes | key: ${MASKED_KEY}`);
    next();
});

router.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        has_key: !!API_KEY,
        key_preview: MASKED_KEY,
        env_keys: Object.keys(process.env).filter(k => 
            k.toLowerCase().includes('gpt') || k.toLowerCase().includes('key')
        )
    });
});

/**
 * Chat Completions endpoint - forwards to 9w7.cn/v1/chat/completions
 */
router.post('/chat', async (req, res) => {
    console.log('[API] Chat Request');
    try {
        if (!API_KEY) {
            console.error('[API] Missing API_KEY (gpt) env var');
            return res.status(500).json({ error: 'API Key (gpt) is not configured' });
        }

        const upstreamBody = JSON.stringify(req.body);
        console.log(`[API] Chat body: ${upstreamBody.length} bytes, model: ${req.body?.model || 'default'}`);

        const response = await fetch('https://9w7.cn/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: upstreamBody,
            signal: AbortSignal.timeout(180000)
        });

        const responseText = await response.text();
        let data: any;
        try { data = JSON.parse(responseText); } catch (e) { data = { raw_response: responseText }; }

        console.log(`[API] Chat Response: ${response.status}, len: ${responseText.length}`);

        if (!response.ok) {
            console.error('[API] Chat Error:', responseText.substring(0, 500));
        }

        res.status(response.status).json(data);
    } catch (error: any) {
        console.error('[API] Chat Fatal:', error.message);
        res.status(500).json({ 
            error: 'Internal Proxy Error', 
            message: error.message,
            type: error.name
        });
    }
});

/**
 * Images endpoint - forwards to 9w7.cn/v1/images/generations
 * gpt-image-2 only works via this endpoint, NOT via chat completions
 */
router.post('/images', async (req, res) => {
    console.log('[API] Image Request');
    try {
        if (!API_KEY) {
            console.error('[API] Missing API_KEY (gpt) env var');
            return res.status(500).json({ error: 'API Key (gpt) is not configured' });
        }

        const bodyStr = JSON.stringify(req.body);
        const promptSize = req.body?.prompt?.length || 0;
        console.log(`[API] Image body: ${bodyStr.length} bytes, prompt: ${promptSize} chars`);

        const response = await fetch('https://9w7.cn/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: bodyStr,
            signal: AbortSignal.timeout(180000)
        });

        const responseText = await response.text();
        let data: any;
        try { data = JSON.parse(responseText); } catch (e) { data = { raw_response: responseText }; }

        console.log(`[API] Image Response: ${response.status}, len: ${responseText.length}`);

        if (!response.ok) {
            console.error('[API] Image Error:', responseText.substring(0, 500));
        }

        res.status(response.status).json(data);
    } catch (error: any) {
        console.error('[API] Image Fatal:', error.message);
        res.status(500).json({ 
            error: 'Internal Proxy Error', 
            message: error.message,
            type: error.name
        });
    }
});

export default router;
