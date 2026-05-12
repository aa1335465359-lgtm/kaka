import { compressImage } from "./utils";

// Custom Client using External API proxy

export const SAFETY_SETTINGS = []; // No longer needed for OpenAI style but kept for compatibility

// Adapt Gemini parts to OpenAI format
const adaptParts = async (parts: any[]) => {
    const adapted = await Promise.all(parts.map(async p => {
        if (p.text) {
            return { type: 'text', text: p.text };
        } else if (p.inlineData) {
            // Compress inline image data to avoid hitting payload limits (Vercel 4.5MB)
            const compressed = await compressImage(p.inlineData.data);
            return { 
                type: 'image_url', 
                image_url: { url: `data:${p.inlineData.mimeType};base64,${compressed}` } 
            };
        }
        return null;
    }));
    return adapted.filter(Boolean);
};

// Extract base64 from various response formats
const extractBase64FromResponse = async (content: string): Promise<string | null> => {
    // Format 1: Pure base64 string (long alphanumeric)
    const b64Match = content.match(/^([A-Za-z0-9+/=]{200,})\s*$/m);
    if (b64Match) return b64Match[1].trim();

    // Format 2: data URI
    const dataUriMatch = content.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/);
    if (dataUriMatch) return dataUriMatch[1];

    // Format 3: Markdown image with base64
    const mdB64Match = content.match(/!\[.*?\]\(data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)\)/);
    if (mdB64Match) return mdB64Match[1];

    return null;
};

// Extract URL from response content
const extractUrlFromResponse = (content: string): string | null => {
    const urlMatch = content.match(/(https?:\/\/[^\s<>"]+?\.(?:png|jpg|jpeg|webp|gif)(?:\?[^\s<>"]*)?)/i);
    return urlMatch ? urlMatch[0] : null;
};

// Fetch URL and convert to base64
const urlToBase64 = async (url: string): Promise<string> => {
    const imgRes = await fetch(url, { mode: 'cors' });
    if (!imgRes.ok) throw new Error(`Failed to fetch image URL: ${imgRes.status}`);
    const blob = await imgRes.blob();
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const generateWithRetry = async (
    params: any, // GenerateContentParameters equivalent
    retries = 3
): Promise<any> => {
    for (let i = 0; i < retries; i++) {
        try {
            // Build OpenAI messages
            const messages = [];

            let jsonSchemaStr = '';
            if (params.config?.responseSchema) {
                jsonSchemaStr = `\n\nYou MUST respond in strictly valid JSON format matching this schema:\n${JSON.stringify(params.config.responseSchema)}`;
            }

            // Add system instruction if present
            if (params.systemInstruction || jsonSchemaStr) {
                let sysText = '';
                if (typeof params.systemInstruction === 'string') {
                    sysText = params.systemInstruction;
                } else if (params.systemInstruction?.parts) {
                    sysText = params.systemInstruction.parts.map((p: any) => p.text).join('\n');
                }
                sysText += jsonSchemaStr;
                if (sysText) {
                    messages.push({ role: 'system', content: sysText });
                }
            }

            // Convert contents
            const contents = Array.isArray(params.contents) ? params.contents : [params.contents];
            for (const item of contents) {
                const role = item.role === 'model' ? 'assistant' : 'user';
                const content = await adaptParts(item.parts);
                messages.push({
                    role,
                    content
                });
            }

            const payload: any = {
                model: params.model || 'gpt-5.5', // Use gpt-5.5 as default
                messages,
                temperature: params.config?.temperature || 0.7,
            };

            // Handle Json schema requests
            if (params.config?.responseMimeType === 'application/json') {
                payload.response_format = { type: 'json_object' };
            }

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`API Error ${res.status}: ${errText}`);
            }

            const data = await res.json();
            
            return {
                text: data.choices?.[0]?.message?.content || ''
            };
        } catch (error: any) {
            const isRateLimit = error.message && error.message.includes('429');
            if (isRateLimit && i < retries - 1) {
                const delay = 2000 * Math.pow(2, i);
                console.warn(`API 429 Hit. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw error;
        }
    }
    throw new Error("API request failed after max retries.");
};

/**
 * NEW: Generate image from structured parts (images + text)
 * Sends images as proper image_url content blocks via Chat Completions API.
 * This is the correct way to do image-to-image / reference-based generation.
 */
export const generateImageFromParts = async (parts: any[], retries = 2): Promise<string> => {
    for (let i = 0; i < retries; i++) {
        try {
            const content = await adaptParts(parts);

            const payload = {
                model: 'gpt-image-2',
                messages: [{ role: 'user', content }],
                temperature: 0.7
            };

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Image Gen API Error ${res.status}: ${errText}`);
            }

            const data = await res.json();
            const responseContent = data.choices?.[0]?.message?.content || '';

            // Try to extract image from various response formats
            let b64 = await extractBase64FromResponse(responseContent);
            if (b64) return b64;

            let url = extractUrlFromResponse(responseContent);
            if (url) return await urlToBase64(url);

            // Check for images array in message (some APIs)
            if (data.choices?.[0]?.message?.images?.[0]) {
                const img = data.choices[0].message.images[0];
                if (img.b64_json) return img.b64_json;
                if (img.url) return await urlToBase64(img.url);
            }

            // Check if response IS already image data (wrapped by API)
            if (data.data?.[0]?.b64_json) return data.data[0].b64_json;
            if (data.data?.[0]?.url) return await urlToBase64(data.data[0].url);

            throw new Error(`Could not extract image from response. Content preview: ${responseContent.substring(0, 200)}`);

        } catch (error: any) {
            const isRateLimit = error.message?.includes('429');
            if (isRateLimit && i < retries - 1) {
                const delay = 2000 * Math.pow(2, i);
                console.warn(`Image Gen 429. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw error;
        }
    }
    throw new Error("Image generation failed after max retries.");
};

/**
 * Legacy: Pure text-to-image (no reference images)
 * Used for generating anchor images and other text-only prompts.
 */
export const generateImage = async (promptText: string): Promise<string> => {
    try {
        // Check if prompt contains embedded image references (old format)
        const hasImages = promptText.includes('[Ref Image:') || promptText.includes('data:image');

        if (hasImages) {
            // Parse old format and redirect to proper multimodal handling
            console.warn('[generateImage] Deprecated: prompt contains embedded images. Use generateImageFromParts instead.');
            const parts = promptText.split('\n\n').filter(Boolean);
            const parsedParts: any[] = [];
            for (const part of parts) {
                const imgMatch = part.match(/\[Ref Image: data:(.*?);base64,(.*?)\]/);
                if (imgMatch) {
                    parsedParts.push({
                        inlineData: { mimeType: imgMatch[1], data: imgMatch[2] }
                    });
                } else {
                    parsedParts.push({ text: part });
                }
            }
            return await generateImageFromParts(parsedParts);
        }

        // Pure text-to-image via Images API
        const payload = {
            model: 'gpt-image-2',
            prompt: promptText,
            n: 1,
            size: "1024x1024",
            response_format: "b64_json"
        };

        const res = await fetch('/api/images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Image API Error ${res.status}: ${errText}`);
        }

        const data = await res.json();
        
        if (data.data && data.data[0] && data.data[0].b64_json) {
            return data.data[0].b64_json;
        } else if (data.data && data.data[0] && data.data[0].url) {
            return await urlToBase64(data.data[0].url);
        }
        
        throw new Error("Invalid response format from Image API.");
    } catch (error) {
        console.error("generateImage error:", error);
        throw error;
    }
};
