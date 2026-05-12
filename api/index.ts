import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// Masking key for logs
const API_KEY = process.env.gpt || process.env.VITE_gpt || '';
const MASKED_KEY = API_KEY ? `${API_KEY.substring(0, 4)}...${API_KEY.substring(API_KEY.length - 4)}` : 'MISSING';

router.use(cors());
router.use(express.json({ limit: '50mb' }));

// Log incoming requests for debugging
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
 * Supports multimodal (text + image_url) for both analysis and image generation
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
            signal: AbortSignal.timeout(180000) // 3 min for multimodal generation
        });

        const responseText = await response.text();
        let data: any;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            data = { raw_response: responseText };
        }

        console.log(`[API] Chat Response: ${response.status}, content-length: ${responseText.length}`);

        if (!response.ok) {
            console.error('[API] Chat Error:', responseText.substring(0, 500));
            return res.status(response.status).json(data);
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
 * Images endpoint - handles both:
 * 1. Pure text-to-image (forward to /v1/images/generations)
 * 2. Multimodal (detect embedded images in prompt, redirect to /v1/chat/completions)
 */
router.post('/images', async (req, res) => {
    console.log('[API] Image Request');
    try {
        if (!API_KEY) {
            console.error('[API] Missing API_KEY (gpt) env var');
            return res.status(500).json({ error: 'API Key (gpt) is not configured' });
        }

        const prompt = req.body?.prompt || '';
        const hasImages = prompt.includes('[Ref Image:') || prompt.includes('data:image');

        if (hasImages) {
            // === MULTIMODAL: Parse embedded images from old-format prompt ===
            console.log('[API] Multimodal image request detected, redirecting to chat API...');
            
            const parts = prompt.split('\n\n').filter(Boolean);
            const content: any[] = [];
            
            for (const part of parts) {
                const imgMatch = part.match(/\[Ref Image: data:(.*?);base64,(.*?)\]/);
                if (imgMatch) {
                    content.push({
                        type: 'image_url',
                        image_url: { url: `data:${imgMatch[1]};base64,${imgMatch[2]}` }
                    });
                } else {
                    content.push({ type: 'text', text: part });
                }
            }

            const chatPayload = {
                model: 'gpt-image-2',
                messages: [{ role: 'user', content }],
                temperature: 0.7
            };

            console.log(`[API] Multimodal chat payload: ${JSON.stringify(chatPayload).length} bytes`);

            const response = await fetch('https://9w7.cn/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify(chatPayload),
                signal: AbortSignal.timeout(180000)
            });

            const responseText = await response.text();
            let data: any;
            try { data = JSON.parse(responseText); } catch (e) { data = { raw_response: responseText }; }

            console.log(`[API] Multimodal Response: ${response.status}, len: ${responseText.length}`);

            if (!response.ok) {
                console.error('[API] Multimodal Error:', responseText.substring(0, 500));
                return res.status(response.status).json(data);
            }

            // Extract image from chat response, wrap in Images API format
            const chatContent = data?.choices?.[0]?.message?.content || '';
            
            // Try base64 extraction
            const b64Match = chatContent.match(/([A-Za-z0-9+/=]{500,})/);
            if (b64Match) {
                console.log('[API] Extracted b64 from chat response');
                return res.json({ data: [{ b64_json: b64Match[1] }] });
            }
            
            const dataUriMatch = chatContent.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/);
            if (dataUriMatch) {
                console.log('[API] Extracted b64 from data URI');
                return res.json({ data: [{ b64_json: dataUriMatch[1] }] });
            }
            
            const urlMatch = chatContent.match(/(https?:\/\/[^\s<>"]+?\.(?:png|jpg|jpeg|webp)(?:\?[^\s<>"]*)?)/i);
            if (urlMatch) {
                console.log(`[API] Found image URL: ${urlMatch[1]}`);
                return res.json({ data: [{ url: urlMatch[1] }] });
            }

            if (data?.data) {
                return res.json(data);
            }

            // Fallback: return raw chat response
            console.log('[API] Warning: Could not extract image, returning raw');
            return res.json(data);

        } else {
            // === STANDARD: Pure text-to-image ===
            const bodyStr = JSON.stringify(req.body);
            console.log(`[API] Standard image gen, body: ${bodyStr.length} bytes`);

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
        }
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
