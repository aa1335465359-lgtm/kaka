
import { GarmentAnalysis, ModelType, ViewType, DepthType, PoseType, GarmentModification, CategoryOverride, SmartProfile, DirectorConfig } from "../../types";
import { 
  MODEL_CONFIG, 
  PHOTOGRAPHIC_STYLE_MATRIX,
  VIEW_CONFIG, 
  DEPTH_CONFIG, 
  POSE_CONFIG, 
  GLOBAL_RULES,
  FRAMING_RULES,
  DESIGN_EXTENSION_RULES
} from "../promptConfig";
import { ANCHOR_PROMPT, DISPATCHER_PROMPT, DIRECT_DISPATCHER_PROMPT } from "../prompts/templates";
import { generateWithRetry, generateImage, generateImageFromParts, SAFETY_SETTINGS } from "./client";
import { fetchImageBase64 } from "./utils";

// Helper: Pure Angle Randomizer (4 Cases, 25% each)
interface SubjectState {
    head: string;
    eyes: string;
    bodyAngle: string; 
    limbs: string; // NEW: Explicit limb instruction for dynamic posing
    description: string;
}

// UPDATE: Enforce 15-45 degree rotation. NO FRONTAL. NO 90 DEGREE SIDE.
// Enforce LARGE Movements.
const getRandomSubjectState = (): SubjectState => {
    const seed = Math.random();
    if (seed < 0.25) {
        return { 
            head: "HEAD: Turned slightly towards camera.", 
            eyes: "EYES: Looking at camera.", 
            bodyAngle: "BODY ANGLE: Rotated 30 degrees. (Three-quarter view). NOT FRONTAL.", 
            limbs: "LIMBS: Large dynamic walking stride. Arms swinging freely away from body. Fabric flowing.",
            description: "Dynamic Walk 30deg" 
        };
    } else if (seed < 0.50) {
        return { 
            head: "HEAD: Tilted back slightly.", 
            eyes: "EYES: Confident, aloof gaze.", 
            bodyAngle: "BODY ANGLE: Rotated 45 degrees. One shoulder forward.", 
            limbs: "LIMBS: Hands interacting with space (e.g. touching hair, raised). Elbows out. High energy.",
            description: "High Fashion 45deg" 
        };
    } else if (seed < 0.75) {
        return { 
            head: "HEAD: Facing forward.", 
            eyes: "EYES: Soft gaze.", 
            bodyAngle: "BODY ANGLE: Rotated 20 degrees. Slight twist in torso.", 
            limbs: "LIMBS: Leaning pose. Weight shifted drastically. Arms extended to create triangles.",
            description: "Twisted 20deg" 
        };
    } else {
        return { 
            head: "HEAD: Turned to side.", 
            eyes: "EYES: Looking at camera over shoulder.", 
            bodyAngle: "BODY ANGLE: Rotated 35 degrees. S-Curve posture.", 
            limbs: "LIMBS: Asymmetric limbs. One leg forward, one back. Hands asymmetrical. BOLD POSE.",
            description: "Asymmetric 35deg" 
        };
    }
};

// Helper: Determine Framing based on Garment Type (Using Rules Engine)
const determineSmartFraming = (analysis: GarmentAnalysis): string => {
    const text = (analysis.technicalDescription + " " + analysis.productTitle + " " + analysis.garmentLength).toLowerCase();
    
    // Check keyword rules
    if (FRAMING_RULES.fullBodyKeywords.some(k => text.includes(k))) {
        return FRAMING_RULES.outputs.full;
    }
    return FRAMING_RULES.outputs.waist;
};

/**
 * SMART MODE: Generate the Anchor Image (Fixed Asset)
 * Now accepts either a preset object or a constructed description.
 */
export const generateAnchorImage = async (
    modelSpec: { 
        ethnicity: string; 
        bodyType: string; 
        ageGroup: string; 
        features?: string; 
        hairStyle?: string; 
        hairColor?: string;
        market?: string;
        category?: string;
    },
    sceneContext: string
): Promise<string> => {
    
    // INJECT RANDOM POSE for Anchor too, to avoid "Standing Like a Statue"
    const subjectState = getRandomSubjectState();

    // Construct sophisticated prompt based on inputs using Centralized Template
    const categoryVibeMap: Record<string, string> = {
        'Daily': 'Vibe: Natural, approachable, relaxed stance. Lifestyle vibe.',
        'Work': 'Vibe: Standing tall, confident professional, straight posture. Power dressing vibe.',
        'Party': 'Vibe: Elegant, sophisticated, highlighting curves. Evening wear vibe.',
        'Street': 'Vibe: Cool, aloof, dynamic stance. High fashion street vibe.',
        'Sport': 'Vibe: Energetic, athletic. Active vibe.',
        'Home': 'Vibe: Soft, relaxed, comfortable. Intimate vibe.'
    };

    const promptText = ANCHOR_PROMPT({
        ethnicity: modelSpec.ethnicity,
        age: modelSpec.ageGroup,
        body: modelSpec.bodyType,
        features: modelSpec.features || "",
        hair: `${modelSpec.hairStyle || ''}, ${modelSpec.hairColor || ''}`,
        categoryVibe: categoryVibeMap[modelSpec.category || 'Daily'] || categoryVibeMap['Daily'],
        environment: sceneContext,
        // PASS RANDOM POSE
        poseHead: subjectState.head,
        poseEyes: subjectState.eyes,
        poseBody: subjectState.bodyAngle
    });

    try {
        return await generateImage(promptText);
    } catch (e) {
        console.error("Anchor Generation Error", e);
        throw e;
    }
};

/**
 * CORE: Generate Styled Garment (Now supports Smart Mode Injection and Director Config)
 */
export const generateStyledGarment = async (
  base64Original: string,
  analysis: GarmentAnalysis,
  stylePrompt: string, // This is the SCENE prompt
  aspectRatio: string = "4:3",
  aiFeelValue: number = 0, 
  flowValue: number = 0, 
  modelType: ModelType = 'standard',
  viewType: ViewType = 'full',
  depthLevel: DepthType = 'pan',
  poseType: PoseType = 'standing',
  customViewPrompt?: string,
  originalMimeType: string = "image/jpeg",
  ignoreModel: boolean = false,
  modification?: GarmentModification | null,
  backImageBase64?: string,
  categoryOverride: CategoryOverride = 'auto',
  smartProfile?: SmartProfile, // NEW: If present, activates Smart Mode
  directorConfig?: DirectorConfig, // NEW: The "Big Pile of JSON" from AI Director
  onLog?: (title: string, prompt: string) => void // NEW: Debugging Callback
): Promise<string> => {
  try {
    const parts: any[] = [];
    
    // IMAGE 1: FRONT
    parts.push({
      inlineData: { mimeType: originalMimeType, data: base64Original },
    });

    // IMAGE 2: BACK
    if (backImageBase64) {
        parts.push({
            inlineData: { mimeType: originalMimeType, data: backImageBase64 },
        });
    }

    // IMAGE 3: SMART ANCHOR or REFERENCE
    if (smartProfile) {
        // --- SMART MODE INJECTION ---
        parts.push({
            inlineData: { mimeType: "image/jpeg", data: smartProfile.anchorImage },
        });
    } else {
        // --- STANDARD MODE REFERENCE ---
        const modelConfig = MODEL_CONFIG[modelType];
        if (modelConfig?.referenceImage) {
            const refBase64 = await fetchImageBase64(modelConfig.referenceImage);
            if (refBase64) {
                parts.push({
                    inlineData: { mimeType: "image/jpeg", data: refBase64 },
                });
            }
        }
    }

    // ==========================================================================================
    // PATH A: DESIGN EXTENSION
    // ==========================================================================================
    if (modification) {
         const designPrompt = `
${DESIGN_EXTENSION_RULES.core}

**SPECIFIC MODIFICATION REQUEST:**
- Category: ${modification.category}
- Details: ${modification.description}

**EXECUTION:**
Carefully modify the garment in Image 1 according to the request. 
- If the fabric is not explicitly changed in the request, you MUST CLONE the original fabric texture and material exactly.
- Ensure the new parts seamlessly blend with the original lighting and background. 
- Do not alter the model's identity or the environment.
`;
         parts.push({ text: designPrompt });
    } 
    // ==========================================================================================
    // PATH B: GENERATION (SMART vs STANDARD)
    // ==========================================================================================
    else {
        let aestheticEngine = PHOTOGRAPHIC_STYLE_MATRIX.commercial; 
        if (aiFeelValue <= 30) aestheticEngine = PHOTOGRAPHIC_STYLE_MATRIX.lofi;
        else if (aiFeelValue > 70) aestheticEngine = PHOTOGRAPHIC_STYLE_MATRIX.editorial;

        // INJECT PROBABILISTIC POSE (Using Rules Engine)
        const subjectState = getRandomSubjectState();
        
        // Construct Inputs Logic
        let image3Role = "IGNORED.";
        let strictRules = [GLOBAL_RULES.windPhysics];

        if (smartProfile) {
            image3Role = "IDENTITY SOURCE (FACE TEXTURE ONLY). IGNORE THE ANGLE.";
            
            // --- CRITICAL FIX: FORCE DYNAMIC POSING & DISSOCIATE FROM INPUTS ---
            strictRules.push("CRITICAL: The pose in Image 3 (Anchor) is IRRELEVANT. Ignore its geometry completely.");
            strictRules.push("CRITICAL: The pose in Image 1 (Garment/Mannequin) is IRRELEVANT. Do NOT copy the mannequin stiffness.");
            
            // UPDATE: FORCE LARGE MOVEMENTS & 15-45 DEGREE ANGLES
            strictRules.push("POSE INSTRUCTION: Model MUST have DYNAMIC LIMBS. Stretch arms and legs. NO STIFF STANDING. BOLD HIGH FASHION POSES.");
            strictRules.push("BODY ANGLE: STRICTLY 15-45 DEGREES. NEVER 0 (Frontal). NEVER 90 (Side).");
            
            // UPDATE: FORCE FLAT BACKGROUND (NO SPATIAL DEPTH)
            strictRules.push("COMPOSITION: FLAT BACKGROUND. Standard Perspective. No vanishing points. No deep corridors. SHARP BACKGROUND.");
            
            strictRules.push(`REQUIRED HEAD GEOMETRY: ${subjectState.head}`); 
            strictRules.push("FACE CONSISTENCY IS PRIORITY #1, but you must map the features onto the NEW HEAD ANGLE.");
        } else if (ignoreModel) {
            strictRules.push("CRITICAL: The human in Input 1 is NOT the target model.");
        }
        
        strictRules.push("SKIN TEXTURE: Must be realistic with visible pores. NO SMOOTHING. NO PLASTIC SKIN.");

        // --- DIRECTOR MODE PROMPT CONSTRUCTION ---
        let finalSubjectDef, finalEnvDef, finalCameraDef;
        let taskRole = "High-End Fashion Photographer Dispatcher"; // Default Role

        if (directorConfig && smartProfile) {
            // Logic to Smart Frame the shot (Using Rules Engine)
            const smartFraming = determineSmartFraming(analysis);
            
            // -------------------------------------------------------------------------
            // OVERRIDE LOGIC: STYLE PROTOCOL & BASE POSE AUTHORITY
            // -------------------------------------------------------------------------
            const protocol = smartProfile.stylePreset;

            // 1. SUBJECT AUTHORITY (Force 1 of 4 Base Poses)
            // UPDATE: Incorporate BODY PARAMS here
            const bodyDesc = smartProfile.bodyParams 
                ? `${smartProfile.bodyParams.bodyType}, Muscle: ${smartProfile.bodyParams.muscleDefinition || 'Fit'}`
                : `Standard Fashion Model`;

            finalSubjectDef = {
                identity_source: "STRICTLY MATCH IMAGE 3 (ANCHOR) FACE.",
                body_structure: bodyDesc, 
                // HARD CONSTRAINT: The randomizer wins. Director is ignored for geometry.
                head_orientation_override: `MUST BE ${subjectState.head}. IGNORE INPUT IMAGE 3 ANGLE.`,
                eye_direction_override: subjectState.eyes,
                body_architecture: subjectState.bodyAngle, // 15-45 Degrees forced here
                limb_placement: subjectState.limbs, // Large movements forced here
                // SOFT INPUT: Director provides flavor
                micro_action: directorConfig.subject_direction.interaction_with_garment, 
                emotional_layer: directorConfig.subject_direction.pose_vibe 
            };
            
            // 2. CAMERA/LIGHTING AUTHORITY (Force Style Preset)
            // HARD OVERRIDE: FORCE F/32 CLEAR BACKGROUND FOR AGENT MODE
            // PROBLEM: Model hallucinates bokeh if we say "Fashion" or "Portrait". We must be explicit.
            const forcedAperture = "f/32 (Hyperfocal Distance)";
            const forcedDepth = "IMAGE MUST BE SHARP FROM FOREGROUND TO INFINITY. The background texture (bricks, leaves, cars) must be perfectly clear and readable. No depth separation. Flat focus plane.";

            if (protocol) {
                // DETECT IPHONE/PHONE MODE
                const isPhone = (protocol.camera.lens || "").toLowerCase().includes('phone') || 
                                (protocol.camera.lens || "").toLowerCase().includes('iphone') ||
                                (protocol.camera.film_type || "").toLowerCase().includes('phone');

                // RAW SNAPSHOT PROMPT INJECTION - UPDATED FOR DAILY/ORDINARY FEEL
                // CHANGED: From Harsh/Ugly to Ordinary/Daily as requested.
                const rawPhonePrompt = "Authentic daily life snapshot. Ordinary smartphone photo. Casual, candid, unposed feel. Natural imperfections. No professional lighting. Everyday aesthetic. Slightly imperfect composition.";

                // --- ROLE DEMOTION ---
                if (isPhone) {
                    taskRole = "Amateur Smartphone User. Capturing real daily life.";
                }

                // SANITIZE: Director often adds "blurred background" to the environment description. 
                // We must strip these words to prevent conflict.
                let envString = directorConfig.scene_architecture.environment
                    .replace(/backdrop/gi, "real world environment")
                    .replace(/blur/gi, "sharp")
                    .replace(/bokeh/gi, "clear")
                    .replace(/out of focus/gi, "in focus")
                    .replace(/background/gi, "detailed background");

                finalEnvDef = {
                    location: envString, 
                    props: directorConfig.scene_architecture.props,
                    // FORCE NATURAL DAILY LIGHTING FOR PHONES
                    lighting_physics: isPhone 
                        ? "Natural ambient lighting. Ordinary indoor/outdoor light. No professional setup. Realistic daily atmosphere. " + rawPhonePrompt
                        : `${protocol.lighting.setup}. ${protocol.lighting.quality}`,
                    atmosphere: protocol.mood.atmosphere,
                    // Flatten space for phones
                    spatial_structure: isPhone ? "Real world spatial depth. Standard environment." : "FLAT. COMPRESSED. Wall-like background." 
                };

                finalCameraDef = {
                    framing: smartFraming,
                    // FORCE PROTOCOL HARDWARE
                    lens_hardware: protocol.camera.lens,
                    film_medium: isPhone ? "iPhone Sensor. Standard digital capture. True to life colors." : protocol.camera.film_type,
                    // FIX: Force small aperture. Even for phones, simulate 'everything in focus'.
                    aperture: forcedAperture, 
                    // FIX: Explicit instruction to avoid portrait mode
                    depth_field: isPhone ? "Deep Focus. Background texture is fully sharp and readable. No portrait mode blur." : forcedDepth,
                    perspective_control: isPhone ? "Casual handheld angle. Slightly imperfect composition. Natural eye level." : "Standard Perspective (No Distortion)", 
                    color_grade: protocol.mood.color_palette
                };
            } else {
                // Fallback to Director (Legacy behavior if no preset)
                // Sanitize here too
                let envString = directorConfig.scene_architecture.environment
                    .replace(/backdrop/gi, "real world environment")
                    .replace(/blur/gi, "sharp")
                    .replace(/bokeh/gi, "clear");

                finalEnvDef = {
                    location: envString,
                    props: directorConfig.scene_architecture.props,
                    lighting: `${directorConfig.lighting_setup.type}, ${directorConfig.lighting_setup.direction}`,
                    shadows: directorConfig.lighting_setup.shadow_quality
                };
                finalCameraDef = {
                    framing: smartFraming,
                    lens: directorConfig.camera_direction.lens_choice,
                    depth_of_field: forcedDepth, // FORCE OVERRIDE
                    aperture: forcedAperture, // FORCE OVERRIDE
                    perspective_control: "Standard Perspective",
                    color_grading: directorConfig.color_grading
                };
            }

        } else {
            // Use Standard/Manual Inputs (Standard Mode)
            let framing: string | Function = VIEW_CONFIG['standard'][viewType as keyof typeof VIEW_CONFIG['standard']];
            if (viewType === 'full' && typeof framing === 'function') {
                 const isShort = analysis.garmentLength === 'mini' || analysis.garmentLength === 'top';
                 framing = (framing as (isShort: boolean) => string)(isShort);
            } else if (viewType === 'full' && categoryOverride === 'top') {
                 framing = VIEW_CONFIG['standard'].upper;
            } else if (viewType === 'detail' && typeof framing === 'function') {
                 framing = (framing as (features: string) => string)(analysis.fabricType);
            }

            let headOrientation = "Natural head angle";
            let eyeContact = "Looking at camera or slightly away";
            if (viewType === 'back') {
                headOrientation = "Looking away from camera, back of head visible";
                eyeContact = "No eye contact, facing away";
            } else if (viewType === 'side') {
                headOrientation = "Profile view, looking to the side";
                eyeContact = "Looking off-camera";
            } else if (viewType === 'detail') {
                headOrientation = "Not relevant, focus on garment";
                eyeContact = "Not relevant";
            }

            let poseAction = POSE_CONFIG[poseType].prompt;
            if (viewType === 'back') {
                poseAction += " MODEL IS FACING AWAY FROM CAMERA. BACK OF GARMENT VISIBLE.";
            } else if (viewType === 'side') {
                poseAction += " MODEL IS TURNED TO THE SIDE. SIDE PROFILE VISIBLE.";
            }

            finalSubjectDef = {
                physical_appearance: smartProfile ? `Follow Image 3 Identity. ${smartProfile.faceParams?.ethnicity}` : MODEL_CONFIG[modelType].prompt,
                pose_and_action: smartProfile ? `${subjectState.description} (Match Image 3 vibe)` : poseAction,
                head_orientation: smartProfile ? `${subjectState.head} (Match Image 3)` : headOrientation,
                eye_contact_logic: smartProfile ? subjectState.eyes : eyeContact,
                limb_placement: smartProfile ? subjectState.limbs : "Natural limb placement matching the pose",
                micro_action: "Natural posing"
            };
            
            finalEnvDef = {
                location: stylePrompt || "Neutral studio background",
                lighting_physics: aestheticEngine.lighting,
                atmosphere: aestheticEngine.vibe,
                spatial_structure: "Standard perspective"
            };

            finalCameraDef = {
                framing: framing,
                lens_hardware: aestheticEngine.camera,
                film_medium: "High Quality Digital Sensor",
                aperture: DEPTH_CONFIG[depthLevel].prompt,
                depth_field: DEPTH_CONFIG[depthLevel].prompt,
                perspective_control: "Standard Perspective",
                color_grade: aestheticEngine.name
            };
        }

        const promptStructure = {
            task_definition: {
                role: taskRole, // Use the dynamic role (Professional vs Amateur)
                objective: smartProfile ? "Execute Smart Pipeline Protocol" : "Generate Standard Fashion Photo",
                command_type: "STRICT_EXECUTION"
            },
            
            strict_constraints: {
                camera_hardware: finalCameraDef,
                lighting_physics: finalEnvDef.lighting || finalEnvDef.lighting_physics,
                // Pass strict head angle instructions here
                head_rotation_order: finalSubjectDef.head_orientation_override || finalSubjectDef.head_orientation,
                body_orientation: finalSubjectDef.body_architecture || finalSubjectDef.pose_and_action,
                limb_placement: finalSubjectDef.limb_placement, // Pass dynamic limbs
                face_source: image3Role,
                fabric_source: "Image 1 (Garment)",
                rules: strictRules.join("\n")
            },
            
            creative_context: {
                environment: finalEnvDef.location,
                mood: finalEnvDef.atmosphere || "Neutral",
                model_micro_interaction: finalSubjectDef.micro_action || "None",
                spatial_structure: finalEnvDef.spatial_structure // Ensure this is passed
            },
            
            garment_definition: {
                silhouette: analysis.cutAndFit,
                material: analysis.fabricType,
                type: analysis.productTitle
            }
        };

        // USE CENTRALIZED TEMPLATE - UPDATED: PASS OBJECT DIRECTLY
        const fullTextPrompt = DISPATCHER_PROMPT({ 
            config: promptStructure 
        });
        
        // --- DEV LOGGING ---
        if (onLog) {
            onLog("📸 DISPATCHER (Execution Phase)", fullTextPrompt);
        }
        
        parts.push({ text: fullTextPrompt });
    }

    // Send structured parts directly to Chat Completions API (proper multimodal format)
    return await generateImageFromParts(parts);
    
  } catch (error) {
    console.error("Generation Error:", error);
    throw error;
  }
};

/**
 * FIRST AID OPTIMIZATION: Direct generation (bypasses AI Director JSON middleware).
 * Extracts camera/lighting/framing directly from profile.stylePreset with code rules.
 */
export const generateStyledGarmentDirect = async (
    base64Original: string,
    analysis: GarmentAnalysis,
    smartProfile: SmartProfile | null,
    onLog?: (title: string, prompt: string) => void,
    originalMimeType: string = "image/jpeg"
): Promise<string> => {
  try {
    const parts: any[] = [];

    // IMAGE 1: Original garment
    parts.push({
        inlineData: { mimeType: originalMimeType, data: base64Original },
    });

    // IMAGE 2: Anchor face identity (Smart Mode only)
    if (smartProfile) {
        parts.push({
            inlineData: { mimeType: "image/jpeg", data: smartProfile.anchorImage },
        });
    }

    // --- FRAMING RULE (code-based, no AI call) ---
    const length = (analysis.garmentLength || "").toLowerCase();
    let framing: string;
    if (["mini", "knee"].includes(length)) {
        framing = "FRAMING: American Shot (Knees up). Full leg visible.";
    } else if (["midi", "ankle", "floor"].includes(length)) {
        framing = "FRAMING: Full Body Shot. Head to toe visible.";
    } else if (length === "top") {
        framing = "FRAMING: Waist-Up Shot (Medium Shot). Focus on upper body. Crop at hips.";
    } else {
        // Fallback: check analysis text for clues
        const text = (analysis.productTitle + " " + analysis.cutAndFit).toLowerCase();
        if (/dress|gown|skirt|pants|jeans|coat|连体/.test(text)) {
            framing = "FRAMING: Full Body Shot. Head to toe visible.";
        } else {
            framing = "FRAMING: Waist-Up Shot (Medium Shot). Focus on upper body.";
        }
    }

    // --- EXTRACT STYLE PRESET DATA (code-based extraction, no AI) ---
    const preset = smartProfile?.stylePreset;
    const cameraInfo = {
        lens: preset?.camera?.lens || "50mm (Standard)",
        aperture: preset?.camera?.aperture || "f/5.6",
        film_type: preset?.camera?.film_type || "Digital RAW",
    };
    const lightingInfo = {
        setup: preset?.lighting?.setup || "Natural Softbox",
        quality: preset?.lighting?.quality || "Soft Diffused",
    };
    const sceneInfo = {
        environment: preset?.scene_context?.environment_type || smartProfile?.sceneDescription || "Studio",
        atmosphere: preset?.mood?.atmosphere || "Natural",
        color_palette: preset?.mood?.color_palette || "True to life",
    };
    const modelInfo = {
        expression: (preset?.allowed_expressions && preset.allowed_expressions.length > 0)
            ? preset.allowed_expressions[0]
            : "Confident natural expression",
        microAction: "Natural posing. Hands relaxed or interacting with garment lightly.",
    };

    // --- BUILD PROMPT VIA DIRECT DISPATCHER TEMPLATE ---
    const directPrompt = DIRECT_DISPATCHER_PROMPT({
        cameraInfo,
        lightingInfo,
        sceneInfo,
        garmentInfo: {
            type: analysis.productTitle,
            material: analysis.fabricType,
            silhouette: analysis.cutAndFit,
        },
        modelInfo,
        framingRule: framing,
    });

    if (onLog) {
        onLog("⚡ DIRECT DISPATCHER", directPrompt);
    }

    parts.push({ text: directPrompt });

    return await generateImageFromParts(parts);

  } catch (error) {
    console.error("Direct Generation Error:", error);
    throw error;
  }
};
