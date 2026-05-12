import { compressImage } from "./utils";

export const SAFETY_SETTINGS = [];

// Adapt Gemini parts to OpenAI format
const adaptParts = async (parts: any[]) => {
    const adapted = await Promise.all(parts.map(async p => {
        if (p.text) {
            return { type: 'text', text: p.text };
        } else if (p.inlineData) {
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

export const generateWithRetry = async (
    params: any,
    retries = 3
): Promise<any> => {
    for (let i = 0; i < retries; i++) {
        try {
            const messages = [];

            let jsonSchemaStr = '';
            if (params.config?.responseSchema) {
                jsonSchemaStr = `\n\nYou MUST respond in strictly valid JSON format matching this schema:\n${JSON.stringify(params.config.responseSchema)}`;
            }

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

            const contents = Array.isArray(params.contents) ? params.contents : [params.contents];
            for (const item of contents) {
                const role = item.role === 'model' ? 'assistant' : 'user';
                const content = await adaptParts(item.parts);
                messages.push({ role, content });
            }

            const payload: any = {
                model: params.model || 'gpt-5.5',
                messages,
                temperature: params.config?.temperature || 0.7,
            };

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
            return { text: data.choices?.[0]?.message?.content || '' };
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
 * Generate image from structured parts (images + text)
 * Compresses images, builds prompt with [Ref Image: ...] markers,
 * sends to Images API (gpt-image-2 only supports this endpoint)
 */
export const generateImageFromParts = async (parts: any[], retries = 2): Promise<string> => {
    for (let i = 0; i < retries; i++) {
        try {
            // Build prompt text from parts, compressing images
            const promptParts = await Promise.all(parts.map(async (p) => {
                if (p.text) return p.text;
                if (p.inlineData) {
                    const compressed = await compressImage(p.inlineData.data);
                    return `[Ref Image: data:${p.inlineData.mimeType};base64,${compressed}]`;
                }
                return '';
            }));
            const promptText = promptParts.filter(Boolean).join('\n\n');

            const payload = {
                model: 'gpt-image-2',
                prompt: promptText,
                n: 1,
                size: "1024x1024",
                response_format: "b64_json"
            };

            console.log(`[generateImageFromParts] Prompt size: ${promptText.length} chars`);

            const res = await fetch('/api/images', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Image Gen API Error ${res.status}: ${errText}`);
            }

            const data = await res.json();
            
            if (data.data && data.data[0] && data.data[0].b64_json) {
                return data.data[0].b64_json;
            } else if (data.data && data.data[0] && data.data[0].url) {
                const imgRes = await fetch(data.data[0].url);
                if (!imgRes.ok) throw new Error(`Failed to fetch image URL: ${imgRes.status}`);
                const blob = await imgRes.blob();
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            }
            
            throw new Error("Invalid response format from Image API.");
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
 * Pure text-to-image (no reference images)
 * Used for anchor image generation and other text-only prompts.
 */
export const generateImage = async (promptText: string): Promise<string> => {
    try {
        console.log(`[generateImage] Prompt size: ${promptText.length} chars`);

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
            const imgRes = await fetch(data.data[0].url);
            if (!imgRes.ok) throw new Error(`Failed to fetch image URL: ${imgRes.status}`);
            const blob = await imgRes.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        }
        
        throw new Error("Invalid response format from Image API.");
    } catch (error) {
        console.error("generateImage error:", error);
        throw error;
    }
};
