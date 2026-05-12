
import { Type, Schema } from "@google/genai";
import { generateWithRetry, SAFETY_SETTINGS } from "./client";

/**
 * MODULE 1: Image Pre-processor Engine
 * Standardizes the upload by removing background and centering.
 */
export const preprocessGarment = async (base64Image: string, mimeType: string = "image/jpeg"): Promise<string> => {
    try {
        const response = await generateWithRetry({
            model: "gpt-5.5",
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64Image } },
                    { text: "TASK: Extract the garment from this image. \n1. Remove the background completely and replace it with pure HEX #FFFFFF (White).\n2. Center the garment vertically and horizontally.\n3. Straighten the garment if it is tilted.\n4. Do NOT change the texture, color, or shape of the garment. Maintain high fidelity.\nOutput ONLY the image." }
                ]
            },
            config: {
                safetySettings: SAFETY_SETTINGS
            }
        });

        const candidate = response.candidates?.[0];
        if (!candidate || !candidate.content?.parts) {
            throw new Error("Pre-processing failed: No content");
        }

        for (const part of candidate.content.parts) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
        throw new Error("Pre-processing failed: No image returned");
    } catch (error) {
        console.error("Pre-processing Error:", error);
        throw error;
    }
};

/**
 * MODULE 1.5: Pre-processing Quality Inspector
 * Checks if the processed image lost important details compared to original.
 */
export const evaluatePreprocessing = async (
    originalBase64: string,
    processedBase64: string
): Promise<{ score: number; warning: string }> => {
    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            score: { type: Type.INTEGER, description: "Similarity score 0-100." },
            warning: { type: Type.STRING, description: "Short warning in Chinese describing what is missing (e.g. 'Left sleeve cropped'). If perfect, return empty string." }
        },
        required: ["score", "warning"]
    };

    try {
        const response = await generateWithRetry({
            model: "gpt-5.5", 
            contents: {
                parts: [
                    { inlineData: { mimeType: "image/jpeg", data: originalBase64 } },
                    { inlineData: { mimeType: "image/jpeg", data: processedBase64 } },
                    { text: `Compare Image 1 (Original) and Image 2 (Processed/Cutout).
                    Did the processing accidentally cut off parts of the garment (sleeves, hem, collar)?
                    Did it distort the shape significantly?
                    
                    Score > 90 if the garment is complete and accurate.
                    Score < 90 if parts are missing or warped.
                    
                    Return a JSON with score and a Chinese warning message if score < 90.` }
                ]
            },
            config: { 
                responseMimeType: "application/json", 
                responseSchema: schema,
                safetySettings: SAFETY_SETTINGS
            }
        });

        if (response.text) {
            return JSON.parse(response.text);
        }
        return { score: 100, warning: "" };
    } catch (e) {
        return { score: 100, warning: "" }; // Fail safe
    }
};
