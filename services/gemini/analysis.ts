
import { Type, Schema, GenerateContentResponse } from "@google/genai";
import { GarmentAnalysis, SceneSuggestion, VariationSuggestion, SmartProfile, DirectorConfig, StylePreset } from "../../types";
import { SCENE_CONFIG } from "../promptConfig";
import { PROTOCOL_OFFICER_PROMPT, CREATIVE_DIRECTOR_PROMPT } from "../prompts/templates";
import { generateWithRetry, SAFETY_SETTINGS } from "./client";

/**
 * Unified result type combining face detection, garment analysis, and scene suggestions.
 */
export interface UnifiedAnalysisResult {
  hasFace: boolean;
  analysis: GarmentAnalysis;
  sceneSuggestions: SceneSuggestion[];
}

/**
 * Step 0: Detect if the image contains a real human face.
 * Used to trigger Smart Mannequin Mode.
 */
export const detectFaceInImage = async (base64Image: string, mimeType: string = "image/jpeg"): Promise<boolean> => {
    try {
        const response = await generateWithRetry({
            model: "gpt-5.5",
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64Image } },
                    { text: "Does this image contain a visible real human face (a model)? Answer ONLY with 'YES' or 'NO'." }
                ]
            },
            config: {
                responseMimeType: "text/plain",
                safetySettings: SAFETY_SETTINGS
            }
        });
        const text = response.text?.trim().toUpperCase();
        return text?.includes("YES") ?? false;
    } catch (e) {
        return false;
    }
};

/**
 * Step 1: Analyze the image to extract garment technical details.
 */
export const analyzeGarmentImage = async (base64Image: string, mimeType: string = "image/jpeg"): Promise<GarmentAnalysis> => {
  const sceneOptions = Object.values(SCENE_CONFIG).map(s => s.name);
  const sceneListStr = JSON.stringify(sceneOptions);

  const analysisSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      technicalDescription: {
        type: Type.STRING,
        description: "A highly detailed technical description of the garment's construction, stitching, neckline, hem, and closures. In Chinese.",
      },
      fabricType: {
        type: Type.STRING,
        description: "Specific fabric material guess (e.g., Silk Chiffon, Heavy Cotton Twill, Leather). In Chinese.",
      },
      cutAndFit: {
        type: Type.STRING,
        description: "The silhouette and fit of the garment (e.g., A-line, Bodycon, Oversized drop-shoulder). In Chinese.",
      },
      originalStyleVibe: {
        type: Type.STRING,
        description: "The artistic mood of the original photo (e.g., Studio lighting, Boho chic, Streetwear). In Chinese.",
      },
      styleKeywords: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "5 key adjectives describing the visual style. In Chinese.",
      },
      recommendedScenario: {
        type: Type.STRING,
        description: `Select the single best fitting scenario from this exact list: ${sceneListStr}. Return only the name.`,
      },
      productTitle: {
        type: Type.STRING,
        description: "A professional e-commerce product title in Chinese. Format: [Core Keywords] + [Selling Point/Feature] + [Style] + [Category]. Example: '法式复古V领真丝连衣裙 收腰显瘦气质长裙'.",
      },
      garmentLength: {
        type: Type.STRING,
        description: "The length of the garment. Choose strictly from: 'mini' (short/above knee), 'knee' (at knee), 'midi' (calf length), 'ankle' (ankle length), 'floor' (floor length), 'top' (if it is a top/jacket only).",
      }
    },
    required: ["technicalDescription", "fabricType", "cutAndFit", "originalStyleVibe", "styleKeywords", "recommendedScenario", "productTitle", "garmentLength"],
  };

  try {
    const response = await generateWithRetry({
      model: "gpt-5.5",
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Image } },
          { text: `分析这张时尚图片。你是一位专业的时装设计师。请提取服装的技术细节、长度和营销标题。同时，请从以下场景列表中选择一个最能衬托这件衣服风格的场景作为推荐：${sceneListStr}. 请用简体中文回答所有内容（garmentLength请使用指定的英文单词）。` },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        systemInstruction: "你是一位专业的时装技术设计师。分析输入图片的材质、剪裁和结构。请用简体中文输出。",
        safetySettings: SAFETY_SETTINGS
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as GarmentAnalysis;
    }
    throw new Error("No analysis data returned");
  } catch (error) {
    console.error("Analysis Error:", error);
    throw error;
  }
};

/**
 * Step 1.5: Generate AI Scene Suggestions based on analysis.
 */
export const generateSceneSuggestions = async (analysis: GarmentAnalysis): Promise<SceneSuggestion[]> => {
    const schema: Schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING, description: "Short commercial name for the scene (Chinese). 2-6 chars. NO EMOJIS." },
          description: { type: Type.STRING, description: "PHYSICAL LOCATION PROMPT (English). Nouns only." }
        },
        required: ["id", "title", "description"]
      }
    };
  
    try {
      const response = await generateWithRetry({
        model: "gpt-5.5",
        contents: {
          parts: [{
            text: `You are a Logic-based Location Scout.
            Your task: Suggest 4 PHYSICAL LOCATIONS where a real person would wear this specific garment: "${analysis.productTitle}".

            CRITICAL RULES (SUBTRACTIVE PROMPTING):
            1. **NO STORYTELLING**. NO "Vibe" words. NO emotions (e.g. "romantic", "mysterious").
            2. **NO CAMERA/LIGHTING TERMS**. Do NOT describe blur, bokeh, sunlight, or shadows. (These are controlled by UI sliders).
            3. **PHYSICAL NOUNS ONLY**. Describe the space using concrete objects and materials.
               - Bad: "A beautiful sunny afternoon in a busy market."
               - Good: "Location: Coffee Shop Window. Background: Glass surface, Wooden table, Pavement."
            4. **LOGIC**:
               - Home/Pajamas -> Bedroom, Sofa, Rug.
               - Office/Suit -> Office Window, Metal Railing, Concrete Wall.
               - Summer/Dress -> White Plaster Wall, Garden Steps, Poolside Tile.
            
            Output 4 distinct options.`
          }]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          safetySettings: SAFETY_SETTINGS
        }
      });
  
      if (response.text) {
        return JSON.parse(response.text) as SceneSuggestion[];
      }
      return [];
    } catch (e) {
      console.warn("Failed to generate scene suggestions", e);
      return [];
    }
  };

/**
 * NEW: Generate Smart Scene Prompt from User Input
 */
export const generateSmartScenePrompt = async (scenario: string, style: string): Promise<string> => {
    try {
        const response = await generateWithRetry({
            model: "gpt-5.5",
            contents: {
                parts: [{
                    text: `As a Professional Fashion Photographer Director, write a concise, high-quality environmental description based on the user's input.
                    
                    USER INPUT:
                    Scenario: ${scenario}
                    Style Vibe: ${style}

                    REQUIREMENTS:
                    1. Output English text ONLY.
                    2. Focus on PHYSICAL ELEMENTS (Materials, Lighting, Objects).
                    3. Do NOT mention the model or the clothes. Focus purely on the background and atmosphere.
                    4. Keep it under 50 words.
                    5. Format: "Location: [Place]. Lighting: [Light type]. Background: [Details]. Atmosphere: [Vibe]."
                    `
                }]
            },
            config: {
                safetySettings: SAFETY_SETTINGS
            }
        });

        return response.text || `Location: ${scenario}. Style: ${style}.`;
    } catch (e) {
        return `Location: ${scenario}. Style: ${style}.`;
    }
};

/**
 * NEW: Generate Hidden Style Preset (AI Summarization Step)
 * REFACTORED: Uses Centralized Prompt Template.
 */
export const generateStylePreset = async (
    visualStyle: string,
    scene: string,
    lighting: string,
    expressions: string[], // NEW: Allowed expressions
    customPrompt?: string 
): Promise<StylePreset> => {
    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            summary: { 
                type: Type.STRING, 
                description: "STRICT FORMAT: 'Title | Scene | Vibe'. ALL IN CHINESE. e.g. '都市丽人 | 办公楼落地窗 | 精英感&冷静克制'" 
            },
            allowed_expressions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "The list of allowed model expressions passed from input."
            },
            allowed_scenes: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "The list of allowed physical scenes derived from input."
            },
            camera: {
                type: Type.OBJECT,
                properties: {
                    lens: { type: Type.STRING, description: "HARDWARE. e.g. '28mm (Phone Wide)', '50mm (Standard)', '85mm (Portrait)'" },
                    aperture: { type: Type.STRING, description: "OPTICS. e.g. 'f/11 (Deep Focus)', 'f/1.4 (Blur)'" },
                    shutter: { type: Type.STRING, description: "e.g. '1/200s'" },
                    film_type: { type: Type.STRING, description: "MEDIUM. e.g. 'Digital RAW', 'Kodak Portra 400', 'iPhone Sensor'" }
                }
            },
            lighting: {
                type: Type.OBJECT,
                properties: {
                    setup: { type: Type.STRING, description: "PHYSICS. e.g. 'Direct Flash', 'Softbox', 'Natural Sun'" },
                    quality: { type: Type.STRING, description: "TEXTURE. e.g. 'Hard Shadows', 'Soft Diffused'" }
                }
            },
            composition: {
                type: Type.OBJECT,
                properties: {
                    depth_of_field: { type: Type.STRING, description: "RULE. e.g. 'Background Visible', 'Background Blurred'" },
                    framing: { type: Type.STRING, description: "e.g. 'Center', 'Rule of thirds', 'Candid'" },
                    angle: { type: Type.STRING, description: "e.g. 'Eye level', 'Low angle', 'High angle'" }
                }
            },
            scene_context: {
                type: Type.OBJECT,
                properties: {
                    environment_type: { type: Type.STRING },
                    props: { type: Type.STRING }
                }
            },
            mood: {
                type: Type.OBJECT,
                properties: {
                    atmosphere: { type: Type.STRING },
                    color_palette: { type: Type.STRING }
                }
            }
        },
        required: ["summary", "allowed_expressions", "allowed_scenes", "camera", "lighting", "composition", "scene_context", "mood"]
    };

    try {
        const prompt = PROTOCOL_OFFICER_PROMPT({
            visualStyle,
            scene,
            lighting,
            expressions: expressions.join(', '),
            customInstruction: customPrompt
        });

        const response = await generateWithRetry({
            model: "gpt-5.5",
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                safetySettings: SAFETY_SETTINGS
            }
        });

        if (response.text) {
            return JSON.parse(response.text) as StylePreset;
        }
        throw new Error("Failed to generate style preset");
    } catch (e) {
        // Fallback preset
        return {
            summary: "标准预设 | 影棚 | 自然光",
            allowed_expressions: expressions,
            allowed_scenes: [scene],
            camera: { lens: "50mm", aperture: "f/5.6", shutter: "1/125s", film_type: "Digital" },
            lighting: { setup: "Natural", quality: "Soft" },
            composition: { depth_of_field: "Standard", framing: "Center", angle: "Eye level" },
            scene_context: { environment_type: scene, props: "Minimal" },
            mood: { atmosphere: "Neutral", color_palette: "True to life" }
        };
    }
};

/**
 * NEW: AI Creative Director Logic
 * REFACTORED: Uses Centralized Prompt Template.
 * UPDATE: Added onLog for debugging.
 */
export const generateDirectorConfig = async (
    analysis: GarmentAnalysis,
    profile: SmartProfile,
    onLog?: (title: string, prompt: string) => void
): Promise<DirectorConfig> => {
    const allowedExpressions = profile.stylePreset?.allowed_expressions || [];
    const expressionsContext = allowedExpressions.length > 0 
        ? `ALLOWED EXPRESSIONS POOL: [${allowedExpressions.join(', ')}]. You MUST pick ONE that best fits the garment style.` 
        : "EXPRESSION: Default to 'Confident'.";

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            concept_title: { type: Type.STRING, description: "A creative title for this photoshoot concept." },
            visual_strategy: { type: Type.STRING, description: "A concise sentence explaining the reasoning. Why this light? Why this pose? Based on the garment material and cut." },
            scene_architecture: {
                type: Type.OBJECT,
                properties: {
                    environment: { type: Type.STRING, description: "Specific location details (e.g. 'Marble floor lobby with glass walls')." },
                    props: { type: Type.STRING, description: "Props that fit the scene (e.g. 'Coffee cup', 'Magazine')." },
                    depth_of_field: { type: Type.STRING, description: "e.g. 'f/1.4 shallow' or 'f/8 deep'." }
                }
            },
            lighting_setup: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, description: "e.g. 'Softbox', 'Natural Window', 'Direct Sun'." },
                    direction: { type: Type.STRING, description: "e.g. 'Side light', 'Backlit', '45 degree'." },
                    shadow_quality: { type: Type.STRING, description: "e.g. 'Soft diffused shadows', 'Hard contrast shadows'." },
                    color_temperature: { type: Type.STRING, description: "e.g. 'Warm Golden Hour', 'Cool Blue Daylight'." }
                }
            },
            camera_direction: {
                type: Type.OBJECT,
                properties: {
                    angle: { type: Type.STRING, description: "e.g. 'Low angle', 'Eye level', 'High angle'." },
                    framing: { type: Type.STRING, description: "e.g. 'Full body', 'Cowboy shot', 'Waist up'." },
                    lens_choice: { type: Type.STRING, description: "e.g. '35mm wide', '85mm portrait'." }
                }
            },
            subject_direction: {
                type: Type.OBJECT,
                properties: {
                    pose_vibe: { type: Type.STRING, description: "EMOTIONAL & ATMOSPHERIC ONLY. (e.g. 'Aloof', 'Busy', 'Relaxed'). DO NOT DESCRIBE BODY ANGLE." },
                    facial_expression: { type: Type.STRING, description: "e.g. 'Confident smile', 'Aloof high fashion gaze'." },
                    interaction_with_garment: { type: Type.STRING, description: "MICRO-ACTION. (e.g. 'Hand in pocket', 'Adjusting cuffs', 'Walking fast')." }
                }
            },
            color_grading: { type: Type.STRING, description: "Film stock or color mood (e.g. 'Kodak Portra 400', 'Clean Digital', 'Black and White')." }
        },
        required: ["concept_title", "visual_strategy", "scene_architecture", "lighting_setup", "camera_direction", "subject_direction", "color_grading"]
    };

    try {
        const prompt = CREATIVE_DIRECTOR_PROMPT({
            garmentDna: `${analysis.fabricType}, ${analysis.cutAndFit}, ${analysis.styleKeywords.join(', ')}`,
            garmentLength: analysis.garmentLength, // Pass garment length for framing logic
            brandIdentity: `${profile.name} - ${profile.sceneStyle}`,
            protocolJson: profile.stylePreset ? JSON.stringify(profile.stylePreset) : "None",
            expressionContext: expressionsContext
        });

        // --- DEV LOGGING ---
        if (onLog) {
            onLog("🤖 AI DIRECTOR (Planning Phase)", prompt);
        }

        const response = await generateWithRetry({
            model: "gpt-5.5",
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                safetySettings: SAFETY_SETTINGS
            }
        });

        if (response.text) {
            const json = JSON.parse(response.text) as DirectorConfig;
            
            // LOG THE STRATEGY!
            if (onLog && json.visual_strategy) {
                onLog("🧠 DIRECTOR STRATEGY", json.visual_strategy);
            }
            if (onLog) onLog("🤖 AI DIRECTOR (Output JSON)", JSON.stringify(json, null, 2));
            
            return json;
        }
        throw new Error("Failed to generate director config");
    } catch (e) {
        console.error(e);
        // Fallback
        return {
            concept_title: "Standard Studio",
            visual_strategy: "Fallback strategy due to API error",
            scene_architecture: { environment: "Studio", props: "None", depth_of_field: "f/8" },
            lighting_setup: { type: "Softbox", direction: "Front", shadow_quality: "Soft", color_temperature: "Neutral" },
            camera_direction: { angle: "Eye level", framing: "Full body", lens_choice: "50mm" },
            subject_direction: { pose_vibe: "Confident", facial_expression: "Neutral", interaction_with_garment: "None" },
            color_grading: "Standard"
        };
    }
};

/**
 * Step 4.5: Generate AI Variation Suggestions based on original image.
 */
export const generateVariationSuggestions = async (base64Image: string): Promise<VariationSuggestion[]> => {
    // Kept for compatibility, though currently unused in UI
    return [];
};

/**
 * FIRST AID OPTIMIZATION: Unified Analysis (combines detectFace + analyzeGarment + sceneSuggestions)
 * Single API call to reduce token waste and latency.
 */
export const analyzeGarmentUnified = async (
    base64Image: string,
    mimeType: string = "image/jpeg"
): Promise<UnifiedAnalysisResult> => {
    const sceneOptions = Object.values(SCENE_CONFIG).map(s => s.name);
    const sceneListStr = JSON.stringify(sceneOptions);

    const unifiedSchema: Schema = {
        type: Type.OBJECT,
        properties: {
            hasFace: {
                type: Type.BOOLEAN,
                description: "Whether the image contains a visible real human face (a model).",
            },
            technicalDescription: {
                type: Type.STRING,
                description: "A highly detailed technical description of the garment's construction, stitching, neckline, hem, and closures. In English.",
            },
            fabricType: {
                type: Type.STRING,
                description: "Specific fabric material guess (e.g., Silk Chiffon, Heavy Cotton Twill, Leather). In English.",
            },
            cutAndFit: {
                type: Type.STRING,
                description: "The silhouette and fit of the garment (e.g., A-line, Bodycon, Oversized drop-shoulder). In English.",
            },
            originalStyleVibe: {
                type: Type.STRING,
                description: "The artistic mood of the original photo (e.g., Studio lighting, Boho chic, Streetwear). In English.",
            },
            styleKeywords: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "5 key adjectives describing the visual style. In English.",
            },
            recommendedScenario: {
                type: Type.STRING,
                description: `Select the single best fitting scenario from this exact list: ${sceneListStr}. Return only the name.`,
            },
            productTitle: {
                type: Type.STRING,
                description: "A professional e-commerce product title in English. Example: 'Vintage V-Neck Silk Dress High-Waist Slimming Midi Dress'.",
            },
            garmentLength: {
                type: Type.STRING,
                description: "The length of the garment. Choose strictly from: 'mini' (short/above knee), 'knee' (at knee), 'midi' (calf length), 'ankle' (ankle length), 'floor' (floor length), 'top' (if it is a top/jacket only).",
            },
            sceneSuggestions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        title: { type: Type.STRING, description: "Short commercial name for the scene (English). 2-6 chars." },
                        description: { type: Type.STRING, description: "PHYSICAL LOCATION PROMPT (English). Nouns only." }
                    },
                    required: ["id", "title", "description"]
                }
            }
        },
        required: ["hasFace", "technicalDescription", "fabricType", "cutAndFit", "originalStyleVibe", "styleKeywords", "recommendedScenario", "productTitle", "garmentLength", "sceneSuggestions"],
    };

    try {
        const response = await generateWithRetry({
            model: "gpt-5.5",
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64Image } },
                    {
                        text: `Analyze this fashion image as a professional fashion designer.

TASKS:
1. Detect if the image contains a visible real human face. Set hasFace to true if a human model's face is clearly visible.
2. Extract garment technical details: fabric, cut, fit, style vibe, style keywords, product title, garment length.
3. From these possible scenarios, choose the best one for the garment: ${sceneListStr}.
4. Suggest 4 physical locations where a person would wear this garment.

RULES:
- All text output in English.
- For scene suggestions: use PHYSICAL NOUNS only (objects, materials, places). No camera/lighting terms. No storytelling.
- garmentLength: use the specified single-word values only.
- sceneSuggestions description field: PHYSICAL LOCATION PROMPT with concrete objects and materials, no emotions or vibe words.`
                    }
                ],
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: unifiedSchema,
                systemInstruction: "You are a professional fashion technical designer. Analyze images and output structured JSON. Use English for all output.",
                safetySettings: SAFETY_SETTINGS
            },
        });

        if (response.text) {
            const raw = JSON.parse(response.text);
            const result: UnifiedAnalysisResult = {
                hasFace: raw.hasFace || false,
                analysis: {
                    technicalDescription: raw.technicalDescription || "",
                    fabricType: raw.fabricType || "",
                    cutAndFit: raw.cutAndFit || "",
                    originalStyleVibe: raw.originalStyleVibe || "",
                    styleKeywords: raw.styleKeywords || [],
                    recommendedScenario: raw.recommendedScenario || "",
                    productTitle: raw.productTitle || "",
                    garmentLength: raw.garmentLength || "midi",
                },
                sceneSuggestions: raw.sceneSuggestions || [],
            };
            return result;
        }
        throw new Error("No analysis data returned from unified call");
    } catch (error) {
        console.error("Unified Analysis Error:", error);
        throw error;
    }
};
