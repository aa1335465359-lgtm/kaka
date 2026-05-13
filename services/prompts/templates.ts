
/**
 * PROMPT ASSETS (Prompt as Code)
 * Centralized template engine to decouple Prompt Engineering from Business Logic.
 * 
 * ARCHITECTURE NOTES:
 * 1.  Pure Functions: All prompts must be pure functions returning strings.
 * 2.  Strict Typing: Input data must be defined via exported interfaces.
 * 3.  Logic Separation: Do not include complex business logic (if/else) inside templates; pass pre-computed values.
 * 
 * CATEGORIES:
 * - LAYER 1: AGENT SETUP (Persona Creation)
 * - LAYER 2: PROTOCOL LAYER (The "Lawmaker")
 * - LAYER 3: EXECUTION LAYER (Runtime Direction)
 */

// ==========================================================================================
// LAYER 1: AGENT SETUP
// Used during the "Smart Setup" phase to create the visual asset (Anchor Image).
// ==========================================================================================

export interface AnchorPromptInput {
    ethnicity: string;
    age: string;
    body: string; // NOTE: Used for context, but framing is HEADSHOT.
    features: string;
    hair: string;
    categoryVibe: string;
    environment: string;
    // New: Explicit Pose Control
    poseHead?: string;
    poseEyes?: string;
    poseBody?: string;
}

/**
 * [ANCHOR GENERATOR]
 * Generates the prompt for the "Anchor Image" - the reference face/body for the Agent.
 * 
 * Consumer: `gemini-2.5-flash-image` (Text-to-Image)
 * Output: High-fidelity portrait.
 */
export const ANCHOR_PROMPT = (data: AnchorPromptInput) => `
Authentic Commercial Portrait - Raw Unedited Style (Waist-Up).

**CRITICAL STYLE RULES:**
1. **NO RETOUCHING**: The skin must look like a raw camera file. Visible pores, texture, and natural imperfections are REQUIRED. No "plastic" or "airbrushed" AI skin.
2. **FRAMING**: WAIST-UP shot (Half Body). Do NOT crop at the neck. We must see the torso and body shape.
3. **POSE**: Natural, relaxed, and "alive". Slight body movement, turning, or hand gestures are encouraged. Avoid stiff "mugshot" poses.
4. **NO BOKEH / NO BLUR**: The image must be sharp from edge to edge. Do not use shallow depth of field. Background must be clear or solid wall.

**SUBJECT SPECIFICATIONS:**
- **Identity**: ${data.ethnicity}, ${data.age}.
- **Face**: ${data.features}.
- **Hair**: ${data.hair}.
- **Body Type**: ${data.body}. (Ensure the ${data.body} physique is clearly visible in the upper body structure).
- **Expression**: Natural, approachable, can be smiling or relaxed. Not overly intense.

**SCENE:**
- Background: ${data.environment || "Neutral Studio Grey"}.
- Lighting: Soft studio strobe, dimensional.

**ATTIRE:**
- Simple fitted solid-color top (Tank top or T-shirt) that hugs the body to show the form.
`;

// ==========================================================================================
// LAYER 2: PROTOCOL LAYER (THE LAWMAKER)
// Used to translate high-level user selection into strict physical parameters.
// ==========================================================================================

export interface ProtocolInput {
    visualStyle: string;
    scene: string;
    lighting: string;
    expressions: string;
    customInstruction?: string;
}

/**
 * [CHIEF PROTOCOL OFFICER]
 * Generates the System Instruction for the Logic Model to define physical laws.
 * 
 * Consumer: `gemini-3-flash-preview` (Text-to-JSON)
 * Output: `StylePreset` JSON object.
 */
export const PROTOCOL_OFFICER_PROMPT = (data: ProtocolInput) => `
Role: Chief Visual Protocol Officer.
Task: Define the STRICT PHYSICAL LAWS (Hardware & Physics) for a photoshoot based on user input.

USER SELECTIONS:
- Visual Style: ${data.visualStyle}
- Scene Pool: ${data.scene} (User allowed multiple)
- Lighting: ${data.lighting}
- Allowed Expressions (Vibes): ${data.expressions}
${data.customInstruction ? `- OVERRIDE INSTRUCTION: "${data.customInstruction}"` : ''}

MAPPING RULES (CRITICAL OVERRIDES):
1. **UNIVERSAL FOCUS RULE**: REGARDLESS of the style (Editorial, Film, iPhone), you MUST enforce **Infinite Depth of Field** unless explicitly asked for bokeh.
   - If Style is "iPhone" or "Lo-Fi": Aperture MUST be 'f/22' or 'f/16'. Depth MUST be 'Infinite/Hyperfocal'.
2. Lens Choice: Match the style (e.g. 24mm for Phone, 50mm for Commercial).
3. Lighting: Match the user selection.

OUTPUT:
1. A Chinese Summary string strictly in this format: "TITLE | SCENE_SUMMARY | VIBE".
2. The physical JSON configuration.
3. **IMPORTANT**: Pass the user's Scene Pool into 'allowed_scenes' array.
4. Pass through the 'Allowed Expressions' list.
`;

// ==========================================================================================
// LAYER 3: EXECUTION LAYER (THE DIRECTOR & DISPATCHER)
// Used during the actual image generation loop (Workbench).
// ==========================================================================================

export interface CreativeDirectorInput {
    garmentDna: string;
    brandIdentity: string;
    protocolJson: string;
    expressionContext: string;
    garmentLength?: string; // New: To determine framing
}

/**
 * [AI CREATIVE DIRECTOR] - THE BRAIN
 * Plans the specific shot based on the garment DNA and established Protocol.
 * 
 * Consumer: `gemini-3-flash-preview` (Text-to-JSON)
 * Output: `DirectorConfig` JSON execution plan.
 * 
 * UPDATED STRATEGY: 
 * - PHYSICS (Light/Cam) are IMMUTABLE.
 * - CREATIVITY is confined to SCENE (Context) and ACTING (Model).
 * - FRAMING LOGIC: Determine shot size based on garment type.
 */
export const CREATIVE_DIRECTOR_PROMPT = (data: CreativeDirectorInput) => `
ROLE: You are an Elite Fashion Creative Director. 
You are working under strict Technical Constraints (The Protocol).

INPUTS:
1. GARMENT DNA: "${data.garmentDna}".
   - Length: ${data.garmentLength}
2. BRAND IDENTITY: "${data.brandIdentity}".
3. PROTOCOL (IMMUTABLE LAWS): ${data.protocolJson}
4. ${data.expressionContext}

**YOUR SHACKLES (DO NOT BREAK):**
1. **NO LIGHTING CHANGES**: You cannot change the Lighting Type (e.g., Flash, Softbox) defined in the Protocol. You can only define how it interacts with the scene.
2. **NO CAMERA CHANGES**: Lens and Filter are locked.
3. **NO WEIRD ANGLES**: The garment must be clearly visible. Keep the model mostly FRONTAL or THREE-QUARTER.

**YOUR CREATIVE FREEDOM (SOLVE THE PUZZLE):**
1. **SCENE SELECTION**: 
   - Check if the Protocol has 'allowed_scenes'. IF YES, YOU MUST PICK THE ONE BEST SUITED FOR THIS GARMENT.
   - Example: If Garment is 'Pajamas' and Allowed Scenes are ['Street', 'Bedroom'], PICK 'Bedroom'.
   - If no list, choose from commercial standards: [Modern Home, City Street, Minimal Studio, Cafe, Office, Park].
2. **MODEL ACTING**: Define the "Micro-Action" (hands/posture) to sell the garment features.
3. **FRAMING LOGIC (MANDATORY)**:
   - IF Garment is 'top', 'shirt', 'blouse' -> Use 'Waist-Up' or 'Medium Shot'. (Don't show legs unnecessarily).
   - IF Garment is 'dress', 'gown', 'pants', 'skirt', 'full body' -> Use 'Full Body' or 'Knee-Up'.
   - *ACTION*: Output this in 'camera_direction.framing'.

**REASONING LOGIC (Internal Monologue -> Output):**
- **Analyze Garment**: "${data.garmentDna}" -> What scene makes sense? What framing is needed?
- **Analyze Protocol**: The Protocol dictates the "Vibe".
- **Strategy**: "Because this is a [Knit Sweater (Top)] and Allowed Scenes include [Cafe], I select [Cafe]. Framing set to [Waist-Up] to focus on texture."

**OUTPUT JSON REQUIREMENTS:**
- **visual_strategy**: A concise English sentence explaining your SCENE choice, FRAMING choice, and ACTION choice.
- **scene_architecture**: Must be specific physical nouns. e.g. "Unmade bed, wooden floor".
- **subject_direction**: Specific instructions for limbs and face.

Generate the JSON execution plan.
`;

export interface DispatcherInput {
    // We now accept the full object structure to convert to Natural Language
    config: {
        task_definition: { role: string; objective: string; command_type: string };
        strict_constraints: { 
            camera_hardware: any; 
            lighting_physics: string; 
            head_rotation_order: string; 
            body_orientation: string; 
            limb_placement: string;
            face_source: string;
            fabric_source: string;
            rules?: string;
        };
        creative_context: { environment: string; mood: string; model_micro_interaction: string; spatial_structure?: string };
        garment_definition: { silhouette: string; material: string; type: string };
    }
}

/**
 * [FINAL DISPATCHER]
 * The Final Prompt sent to the Image Generation Model.
 * It strictly instructs the model to execute the Director's plan without hallucination.
 * 
 * Consumer: `gemini-2.5-flash-image` (Image-to-Image)
 * Output: Final Image Pixel Data.
 * 
 * UPDATED: Now converts JSON to Structured Natural Language for better model adherence.
 */
export const DISPATCHER_PROMPT = (data: DispatcherInput) => {
    const c = data.config;
    const cam = c.strict_constraints.camera_hardware;

    return `
**PHOTOGRAPHY DISPATCH ORDER - STRICT EXECUTION**

[ROLE]: ${c.task_definition.role}
[OBJECTIVE]: ${c.task_definition.objective}

**1. HARDWARE & OPTICS (IMMUTABLE)**
- **Camera Sensor**: ${cam.film_medium}
- **Lens**: ${cam.lens_hardware}
- **Aperture**: ${cam.aperture}
- **Focus/Depth**: ${cam.depth_field}
- **Perspective**: ${cam.perspective_control}
- **Color Grading**: ${cam.color_grade}
- **Framing**: ${cam.framing}

**2. LIGHTING PHYSICS**
- ${c.strict_constraints.lighting_physics}
- **FACE ILLUMINATION (CRITICAL)**: MANDATORY FILL LIGHT on the face. Even if the scene is backlit, harsh, or moody, the model's face must be bright, clear, and evenly lit. Use a "Beauty Dish" or "Reflector" simulation to eliminate deep shadows under eyes/nose.

**3. SCENE ARCHITECTURE**
- **Location**: ${c.creative_context.environment}
- **Structure**: ${c.creative_context.spatial_structure || "Standard"}
- **Atmosphere**: ${c.creative_context.mood}

**4. SUBJECT DIRECTIVES**
- **Head Angle**: ${c.strict_constraints.head_rotation_order}
- **Body Pose**: ${c.strict_constraints.body_orientation}
- **Limb Action**: ${c.strict_constraints.limb_placement}
- **Identity Source**: ${c.strict_constraints.face_source}
- **Micro-Action**: ${c.creative_context.model_micro_interaction}

**5. GARMENT SPECIFICATIONS (HIGH FIDELITY)**
- **Item**: ${c.garment_definition.type}
- **Material**: ${c.garment_definition.material}
- **Silhouette**: ${c.garment_definition.silhouette}
- **Source**: ${c.strict_constraints.fabric_source}

**6. ADDITIONAL RULES & CONSTRAINTS**
${c.strict_constraints.rules || "None"}
`;
};

// ==========================================================================================
// DIRECT DISPATCHER (Optimization: bypasses JSON middleware)
// ==========================================================================================

export interface DirectDispatcherInput {
    cameraInfo: {
        lens: string;
        aperture: string;
        film_type: string;
    };
    lightingInfo: {
        setup: string;
        quality: string;
    };
    sceneInfo: {
        environment: string;
        atmosphere: string;
        color_palette: string;
    };
    garmentInfo: {
        type: string;
        material: string;
        silhouette: string;
    };
    modelInfo: {
        expression: string;
        microAction: string;
    };
    framingRule: string;
    hasAnchor: boolean;
}

/**
 * [DIRECT DISPATCHER] - Compact prompt for direct generation.
 * Bypasses AI Director JSON middleware. Uses code-extracted parameters.
 * Pure English, no internal monologue, physical nouns only.
 */
export const DIRECT_DISPATCHER_PROMPT = (data: DirectDispatcherInput): string => {
    const { cameraInfo, lightingInfo, sceneInfo, garmentInfo, modelInfo, framingRule } = data;
    const hasAnchor = data.hasAnchor;

    // Build reference image instruction based on how many images are passed
    const refInstruction = hasAnchor
        ? `[REFERENCE IMAGES ABOVE]
REF 1 = GARMENT: The original garment photo. You MUST preserve its fabric texture, weave, color, sheen, pattern, stitching details, neckline, hem, and overall silhouette EXACTLY.
REF 2 = MODEL FACE: The anchor identity portrait. You MUST match this person's facial features, bone structure, skin tone, and hair exactly. Pose the face to match the head angle specified below.
`
        : `[REFERENCE IMAGE ABOVE]
REF 1 = GARMENT: The original garment photo. You MUST preserve its fabric texture, weave, color, sheen, pattern, stitching details, neckline, hem, and overall silhouette EXACTLY. Put this exact garment on a fashion model matching the subject description below.
`;

    return `
**FASHION PHOTOGRAPHY DISPATCH**

${refInstruction}
---
**CAMERA**:
- Sensor: ${cameraInfo.film_type}
- Lens: ${cameraInfo.lens}
- Aperture: ${cameraInfo.aperture}

**LIGHTING**:
- Setup: ${lightingInfo.setup}
- Quality: ${lightingInfo.quality}

**SCENE**:
- Location: ${sceneInfo.environment}
- Atmosphere: ${sceneInfo.atmosphere}
- Color Palette: ${sceneInfo.color_palette}

**SUBJECT**:
- Expression: ${modelInfo.expression}
- Action: ${modelInfo.microAction}
- ${framingRule}

**GARMENT SPEC**:
- Item: ${garmentInfo.type}
- Material: ${garmentInfo.material}
- Silhouette: ${garmentInfo.silhouette}

**CRITICAL CONSTRAINTS**:
- Reference image garment details are GROUND TRUTH. Do not hallucinate different fabric, color, or design.
- Sharp focus edge to edge. No bokeh. No background blur.
- Natural skin texture with visible pores. No plastic or airbrushed skin.
- Professional e-commerce lighting. Model face clearly lit.
`;
};
