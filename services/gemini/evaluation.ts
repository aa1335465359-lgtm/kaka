
import { Type, Schema } from "@google/genai";
import { InspectionIssue, DetailedScores } from "../../types";
import { generateWithRetry, SAFETY_SETTINGS } from "./client";

/**
 * MODULE 2: Auto-Feedback Loop - Evaluator
 * Scores the image against the prompt AND the original image using VLM.
 * UPDATED: Uses Strict 95/85 Logic with Structured Issues.
 */
export const evaluateGeneratedImage = async (
    generatedImageBase64: string, 
    originalPrompt: string,
    originalGarmentBase64: string
): Promise<{ 
    score: number; 
    status: 'PASS' | 'WARN' | 'FAIL';
    issues: InspectionIssue[];
    need_regen: boolean;
    regen_prompt: string;
    detailedScores: DetailedScores;
}> => {
    const evaluationSchema: Schema = {
        type: Type.OBJECT,
        properties: {
            total_score: { type: Type.INTEGER, description: "0-100 Score." },
            status: { type: Type.STRING, enum: ["PASS", "WARN", "FAIL"] },
            need_regen: { type: Type.BOOLEAN, description: "TRUE if score < 85. FALSE otherwise." },
            detailed_scores: {
                type: Type.OBJECT,
                properties: {
                    reference_similarity: { type: Type.INTEGER, description: "Max 35" },
                    instruction_compliance: { type: Type.INTEGER, description: "Max 30" },
                    structural_integrity: { type: Type.INTEGER, description: "Max 15" },
                    visual_quality: { type: Type.INTEGER, description: "Max 15" },
                    style_usability: { type: Type.INTEGER, description: "Max 5" }
                },
                required: ["reference_similarity", "instruction_compliance", "structural_integrity", "visual_quality", "style_usability"]
            },
            issues: { 
                type: Type.ARRAY, 
                items: {
                    type: Type.OBJECT,
                    properties: {
                        area: { type: Type.STRING, enum: ["Structure", "Instruction", "Quality", "GarmentDetail"] },
                        description: { type: Type.STRING, description: "Detailed description in Simplified Chinese." },
                        severity: { type: Type.STRING, enum: ["minor", "major"] }
                    },
                    required: ["area", "description", "severity"]
                }, 
                description: "List of problems. Empty if PASS." 
            },
            regen_prompt: { type: Type.STRING, description: "Corrective prompt in English to fix the FAIL issues. NO NEW CREATIVITY. Empty if PASS or WARN." }
        },
        required: ["total_score", "status", "need_regen", "detailed_scores", "issues", "regen_prompt"]
    };

    try {
        const response = await generateWithRetry({
            model: "gpt-5.5",
            contents: {
                parts: [
                    { inlineData: { mimeType: "image/jpeg", data: originalGarmentBase64 } },
                    { inlineData: { mimeType: "image/jpeg", data: generatedImageBase64 } },
                    { text: `Role: Strict Fashion Quality Inspector (PRO Stable Mode).

                    INPUTS:
                    Image 1: Original Garment Reference (Ground Truth).
                    Image 2: Generated Model Photo (Candidate).

                    SCORING RULES (Strict):
                    - 95-100 (PASS): Perfect. Zero flaws. No feedback needed.
                    - 85-94 (WARN): Good but has minor flaws (e.g., slight texture diff, background noise). Display warnings. NO REGENERATION.
                    - < 85 (FAIL): Critical flaws (e.g., wrong sleeve length, wrong collar shape, distorted hands, extra limbs). REQUIRES REGENERATION.

                    TASK:
                    1. Compare Image 2 against Image 1. Focus on: Collar, Sleeves, Buttons, Hem, Logos/Pattern.
                    2. Check logic: Are hands/limbs normal? Is lighting professional?
                    3. Calculate Score.
                    4. If score < 85, write a 'regen_prompt' to FIX the issues. Do NOT add new creative elements. ONLY FIX.

                    OUTPUT JSON.` }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: evaluationSchema,
                safetySettings: SAFETY_SETTINGS
            }
        });

        if (response.text) {
            const result = JSON.parse(response.text);
            return {
                score: result.total_score,
                status: result.status,
                need_regen: result.need_regen,
                issues: result.issues || [],
                regen_prompt: result.regen_prompt || "",
                detailedScores: {
                    referenceSimilarity: result.detailed_scores.reference_similarity,
                    instructionCompliance: result.detailed_scores.instruction_compliance,
                    structuralIntegrity: result.detailed_scores.structural_integrity,
                    visualQuality: result.detailed_scores.visual_quality,
                    styleUsability: result.detailed_scores.style_usability
                }
            };
        }
        throw new Error("Evaluation returned empty response");
    } catch (error) {
        console.warn("Evaluation failed", error);
        // Fail-safe fallback
        return { 
            score: 0, 
            status: 'FAIL',
            need_regen: true, 
            issues: [{ area: 'Quality', description: '系统评分失败', severity: 'major' }],
            regen_prompt: "Improve quality",
            detailedScores: { referenceSimilarity:0, instructionCompliance:0, structuralIntegrity:0, visualQuality:0, styleUsability:0 }
        };
    }
};
