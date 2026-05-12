
/**
 * STYLEWEAVE AI PROMPT CONFIGURATION
 * Refined for atomic consistency.
 * 
 * OBJECTIVE: 
 * Keep these definitions "Physical" (Nouns/Facts).
 * Remove "Atmospheric" (Adjectives/Vibes) - let generation.ts handle that via sliders.
 */

// --- NEW: THE PHOTOGRAPHIC MATRIX (PHYSICS ENGINES) ---
// This defines the "Laws of Physics" for each aesthetic tier.
export const PHOTOGRAPHIC_STYLE_MATRIX = {
  lofi: {
    // 0% - 30%
    name: "LO-FI RAW (纪实/数码复古)",
    // CHANGE: Emphasized Focus and Smartphone
    camera: "DEVICE: iPhone 15 Pro Max Main Camera. LENS: 24mm Wide. APERTURE: f/16 (Deep Focus). QUALITY: Raw, unedited, sharp edge-to-edge. CRITICAL: The background MUST be sharp. NO PORTRAIT MODE. NO BOKEH. NO BLUR.",
    lighting: "LIGHTING: NATURAL SNAPSHOT LIGHTING. Bright, clear, everyday lighting. If indoors: Natural window light. If outdoors: Bright sunlight. NO COLOR TINTS. NO HEAVY FILTERS.",
    skin: "SKIN: REAL TEXTURE. Visible pores, slight imperfections, natural oil. NOT retouched. NOT plastic. NOT smooth.",
    vibe: "AESTHETIC: Pinterest 'Clean Girl' Snapshot, Y2K Blog style, Candid, Bright, Authentic, 'Woke up like this'."
  },
  commercial: {
    // 31% - 70%
    name: "COMMERCIAL STANDARD (电商/标准)",
    camera: "DEVICE: Sony A7R V. LENS: 50mm Standard. QUALITY: Crystal clear, 8K, High Dynamic Range. Sharp focus on garment texture.",
    lighting: "LIGHTING: Clean, bright, natural daylight or soft studio lighting. Even, flattering illumination. NO HEAVY FILTERS. NO COLOR CASTS.",
    skin: "SKIN: High-quality commercial texture. Pores visible but clean. Natural skin finish. Avoid waxy or plastic looking skin.",
    vibe: "AESTHETIC: High-end E-commerce, Lookbook, Instagram Influencer, Approachable, Clear, Bright."
  },
  editorial: {
    // 71% - 100%
    name: "HIGH FASHION EDITORIAL (艺术/大片)",
    camera: "DEVICE: Medium Format (Hasselblad H6D). LENS: 85mm. QUALITY: Fine Art, Cinematic Depth, Rich Color Grading. Film Grain.",
    lighting: "LIGHTING: Dramatic Spotlight, Chiaroscuro, or Colored Gels. Deep moody shadows. High contrast artistic lighting.",
    skin: "SKIN: Hyper-detailed, Porcelain, Glass Skin. High-fashion creative makeup. Wet look.",
    vibe: "AESTHETIC: Vogue Magazine Cover, Avant-Garde, Cinematic, Storytelling, Alien, Distant."
  }
};

// --- NEW: RULES ENGINE CONFIGURATION ---

// 1. POSE PROBABILITY MATRIX
// Defines the "Alive" behavior of the model.
// UPDATE: Enforce "Frontal/Three-Quarter" dominance for E-commerce safety.
export const POSE_PROBABILITY_RULES = [
    { 
        id: 'avoidance', 
        chance: 0.25, // 0 - 0.25
        data: { 
            head: "HEAD ORIENTATION: Tilted Downward slightly. Chin tucked.", 
            eyes: "EYE DIRECTION: Looking down. Introverted.", 
            bodyAngle: "BODY: Facing forward (Frontal). Legs crossed or relaxed.", 
            description: "Shy / Avoidance Pose (Frontal)" 
        }
    },
    { 
        id: 'side_glance', 
        chance: 0.50, // 0.25 - 0.50
        data: { 
            head: "HEAD ORIENTATION: Turned to side (Profile).", 
            eyes: "EYE DIRECTION: Looking at something off-camera.", 
            // FIXED: Changed from 90deg to 30deg to ensure garment is visible
            bodyAngle: "BODY: Rotated 30 degrees (Three-Quarter View). Show the front design clearly.", 
            description: "Candid Glance (Three-Quarter)" 
        }
    },
    { 
        id: 'movement', 
        chance: 0.75, // 0.50 - 0.75
        data: { 
            head: "HEAD ORIENTATION: Facing forward.", 
            eyes: "EYE DIRECTION: Looking at camera.", 
            bodyAngle: "BODY: Dynamic Walking Stride towards camera. Fabric flowing.", 
            description: "Dynamic Walking (Frontal)" 
        }
    },
    { 
        id: 'stance', 
        chance: 1.0, // 0.75 - 1.0
        data: { 
            head: "HEAD ORIENTATION: Facing camera directly (Frontal).", 
            eyes: "EYE DIRECTION: Intense direct eye contact with lens.", 
            bodyAngle: "BODY: Power stance, strong confident posture, facing forward.", 
            description: "Direct Model Stance (Frontal)" 
        }
    }
];

// 2. FRAMING LOGIC RULES
// Determines default camera crop based on garment keywords.
export const FRAMING_RULES = {
    fullBodyKeywords: ['dress', 'gown', 'maxi', 'midi', 'skirt', 'trousers', 'pants', 'jeans', 'jumpsuit', 'suit', 'coat', 'long', '长裙', '裤', '大衣', '风衣', '连衣裙', '连体'],
    outputs: {
        full: "Framing: FULL BODY SHOT. Head to toe visible.",
        waist: "Framing: WAIST-UP SHOT (Medium Shot). Focus on the upper body garment. Crop at hips. DO NOT SHOW SHOES. CLOSE UP."
    }
};

// --- 1. GLOBAL RULES (PHYSICS & CONSTRAINTS) ---
export const GLOBAL_RULES = {
  windPhysics: `
    1. **NO HALLUCINATIONS**: Do not add fabric.
    2. **Silhouette**: Maintain original cut/length strictly.
    3. **Physics**: Only light fabrics billow. Heavy fabrics stiff.
  `,
  // Gaze logic is now handled in generation.ts with randomization
  
  // Skin logic: Enforce imperfections
  skinControl: (forceImperfection: boolean) => forceImperfection
    ? "SKIN: RAW & UNRETOUCHED. Visible pores, fine lines, slight discoloration, peach fuzz, moles. NO PLASTIC SMOOTHING. NO AI GLOW."
    : "SKIN: High-end magazine texture. Pores visible but clean. Natural skin finish."
};

// --- NEW: DESIGN EXTENSION RULES (EDITING MODE) ---
export const DESIGN_EXTENSION_RULES = {
  core: `
    TASK_TYPE: REALISTIC IMAGE EDITING / RETOUCHING.
    
    CRITICAL CONSTRAINTS (MUST FOLLOW):
    1. **KEEP BACKGROUND**: Do NOT generate a new scene. The background (walls, floor, shadows, props) must remain IDENTICAL to the input image.
    2. **KEEP SUBJECT**: Do NOT change the model's face, pose, skin tone, or the mannequin's shape. Only the clothing changes.
    3. **FABRIC CONSISTENCY**: You act as a digital tailor. You must CLONE the fabric texture from the original image to fill the new areas (extensions).
    4. **SEAMLESS BLENDING**: The extended parts (e.g., longer skirt) must match the lighting and grain of the original photo.
  `
};

// --- 2. DEPTH / APERTURE CONFIG ---
export const DEPTH_CONFIG = {
  'pan': {
    id: 'pan',
    label: '全景清晰 (Pan-Focus)',
    // STRONGER PROMPT FOR SHARPNESS
    prompt: 'Aperture: f/22. Deep Depth of Field. Hyper-focal distance. The Background MUST BE SHARP and clearly visible. NO BLUR. NO BOKEH. Everything from foreground to infinity is in focus.'
  },
  'shallow': {
    id: 'shallow',
    label: '略微虚化 (Slight Blur)',
    prompt: 'Aperture: f/5.6. Subject is sharp, background is recognizable but slightly soft. Natural separation.'
  },
  'blur': {
    id: 'blur',
    label: '大光圈虚化 (Bokeh)',
    prompt: 'Aperture: f/1.4. Extremely shallow depth of field. Creamy, dreamy background bokeh. Subject isolated.'
  }
};

// --- 3. AI FEEL CONFIG (0-100) - 5 TIER SYSTEM ---
// Used for UI Labels primarily now, logic is handled by MATRIX
export const AI_FEEL_CONFIG = [
  {
    max: 20,
    label: "原片直出 (Raw/Amateur)",
    prompt: "Legacy config - overridden by Matrix"
  },
  {
    max: 40,
    label: "胶片氛围 (Film/Vibe)",
    prompt: "Legacy config - overridden by Matrix"
  },
  {
    max: 60,
    label: "电商标准 (Standard)",
    prompt: "Legacy config - overridden by Matrix"
  },
  {
    max: 80,
    label: "精修大片 (High-End)",
    prompt: "Legacy config - overridden by Matrix"
  },
  {
    max: 100,
    label: "超模/艺术 (Editorial)",
    prompt: "Legacy config - overridden by Matrix"
  }
];

// --- 4. FLOW CONFIG (0-100) ---
export const FLOW_CONFIG = [
  {
    max: 0,
    label: "静止 (Static)",
    prompt: "Motion: Completely Static. Fabric hangs heavily with gravity."
  },
  {
    max: 50,
    label: "自然微风 (Breeze)",
    prompt: "Motion: Gentle movement. Hair slightly tousled. Fabric ripples softly."
  },
  {
    max: 100,
    label: "强逆风 (Headwind)",
    prompt: "Motion: High Energy. Strong wind blowing against direction of movement. Dynamic fabric shapes."
  }
];

// --- 5. POSE CONFIG ---
export const POSE_CONFIG = {
  'standing': {
    id: 'standing',
    label: '站立 (Stand)',
    prompt: 'Pose: Standing naturally. Weight on one leg. Hands relaxed at sides.'
  },
  'walking': {
    id: 'walking',
    label: '行走 (Walk)',
    prompt: 'Pose: Walking stride. Movement captured. Natural walking posture.'
  },
  'sitting': {
    id: 'sitting',
    label: '坐姿 (Sit)',
    prompt: 'Pose: Sitting relaxed. Leaning back or forward. Not stiff.'
  },
  'posing': {
    id: 'posing',
    label: '摆拍 (Pose)',
    prompt: 'Pose: Professional fashion editorial pose. Confident, elegant, and stylish. Body slightly angled to show the garment shape. Hands naturally placed (e.g., in pockets, on hip, or gently touching hair). AVOID overly twisted or unnatural contortions.'
  },
  'laptop': {
    id: 'laptop',
    label: '拿电脑 (Laptop)',
    prompt: 'Pose: Professional standing. Holding a laptop clutch-style.'
  }
};

// --- 6. SCENE CONFIGURATION (ATOMIC PHYSICAL LOCATIONS) ---
// REMOVED: Lighting descriptions (e.g. "Spotlight", "Soft light").
// REMOVED: Mood descriptions (e.g. "Romantic", "Dark").
// KEPT: Physical objects, Places.
export interface SceneConfig {
  id: string;
  name: string; 
  prompt: string;
  defaults?: { aiFeel?: number; flow?: number; pose?: string };
  gazeExempt?: boolean;
}

export const SCENE_CONFIG: Record<string, SceneConfig> = {
  'runway': {
    id: 'runway',
    name: '秀场',
    prompt: 'Location: Fashion Runway / Catwalk. Background: Blurred audience in dark seating rows.',
    defaults: { aiFeel: 95, flow: 50, pose: 'walking' },
    gazeExempt: true
  },
  'elegant': {
    id: 'elegant',
    name: '优雅',
    prompt: 'Location: French Garden. Background: Wall of blooming pink and white roses (Briar flowers), manicured hedges.',
    defaults: { pose: 'standing' }
  },
  'indoor': {
    id: 'indoor',
    name: '室内',
    prompt: 'Location: Cozy Bedroom Corner. Background: Soft rug, wooden floor, corner of a bed, beige walls.',
    defaults: { pose: 'standing' }
  },
  'western': {
    id: 'western',
    name: '西部',
    prompt: 'Location: Desert Highway. Background: Asphalt road, yellow divider lines, distant mountains, dry desert brush.',
    gazeExempt: true,
    defaults: { pose: 'standing' }
  },
  'grassland': {
    id: 'grassland',
    name: '草原',
    prompt: 'Location: Open Grassland. Background: Endless green grass, horizon line, blue sky.',
    gazeExempt: true,
    defaults: { pose: 'walking' }
  },
  'nomad': {
    id: 'nomad',
    name: '游牧',
    prompt: 'Location: Grassy Hills / Nature. Background: Natural landscape, wild grass, rolling hills.',
    gazeExempt: true,
    defaults: { pose: 'walking' }
  },
  'street': {
    id: 'street',
    name: '街头',
    prompt: 'Location: Urban Crosswalk (Zebra Crossing). Background: City street, buildings, shop windows, pavement.',
    defaults: { pose: 'walking' }
  },
  'cafe': {
    id: 'cafe',
    name: '咖啡店',
    // REFINED: Removed explicit "Coffee" words to prevent cup hallucination.
    prompt: 'Location: Stylish Outdoor Bistro Terrace. Background: Large glass windows reflecting the street, small round table, metal chairs, pavement. Urban European vibe.',
    defaults: { pose: 'sitting' }
  }
};

// --- 7. MODEL CONFIGURATION (ATOMIC PHYSICAL TRAITS) ---
// REMOVED: Vibe descriptions (e.g. "Approachable", "Aloof").
// KEPT: Physical features (Face, Hair, Age, Ethnicity).
export interface ModelConfig {
  id: string;
  label: string;
  prompt: string;
  isGuGuStyle?: boolean;
  referenceImage?: string;
}

// Re-ordered to make Mature European more visible (2nd slot)
export const MODEL_CONFIG: Record<string, ModelConfig> = {
  'standard': {
    id: 'standard',
    label: 'INS博主',
    // Optimized for "Clean Girl Aesthetic" / California Vibe
    prompt: "Model: Caucasian/Western Top Instagram Fashion Influencer (The 'Clean Girl' Aesthetic). Ethnicity: White/European descent. Physique: Toned, fit 'Pilates body'. Skin: Sunkissed golden tan with a healthy glow. Hair: Long wavy hair with honey-blonde balayage highlights. Face: Symmetrical, photogenic 'Instagram Face', neutral nude makeup."
  },
  'mature_european': {
    id: 'mature_european',
    label: '法式优雅',
    // NEW: Sophisticated, Natural Aging, Intellectual
    prompt: "Model: Sophisticated European Woman (Age 35-45). Style: French Chic / Scandi Minimalist. Face: Elegant, natural beauty with very subtle authentic character lines around eyes (graceful aging). Makeup: Minimalist, natural. Hair: Effortless tousled texture, shoulder length."
  },
  'sweetheart': {
    id: 'sweetheart',
    label: '欧美甜妹',
    prompt: "Model: Young American woman. Face: Rounder face shape with slight natural baby fat (soft cheeks). Features: Big bright doe eyes, cute button nose. Hair: Soft wavy honey-brown hair."
  },
  'asian_korean': {
    id: 'asian_korean',
    label: '韩系清透',
    prompt: "Model: Stunning Young Korean woman, approx 22 years old. Face: Small V-line face, soft feminine features. Makeup: Authentic Korean style (Straight brows, gradient lips, coral tones). Skin: Pale, glowing 'Glass Skin' texture. Hair: Long, silky dark brown."
  },
  'plus_size': {
    id: 'plus_size',
    label: '辣妹曲线',
    // Optimized for Hourglass / Confidence / High Fashion
    prompt: "Model: Voluptuous Latina Plus Size Supermodel (Size 14/1XL). Body: Confident Hourglass figure with a snatched waist and curvy hips. Skin: Firm, glowing, healthy texture. Face: Stunningly beautiful, sharp jawline, defined features. Hair: Voluminous luxurious waves."
  },
  'middle_eastern': {
    id: 'middle_eastern',
    label: '中东浓颜',
    // Optimized: Positive prompt for hair to avoid Hijab, High Contrast features
    prompt: "Model: Glamorous Middle Eastern Beauty Influencer. Hair: Massive, thick, voluminous dark hair blown out and flowing over shoulders (fully visible). Face: High-contrast features, thick groomed eyebrows, long lashes, sharp nose bridge. Skin: Flawless olive skin with a matte finish."
  },
  'black_ordinary': {
    id: 'black_ordinary',
    label: '黑人微胖',
    // Optimized for Natural / Curvy / Relatable as requested
    prompt: "Model: Beautiful Everyday Black Woman. Physique: Curvy, chubby, soft body shape (Plus Size). NOT a high-fashion supermodel. Face: Natural, friendly, full cheeks, authentic beauty. Skin: Deep, rich melanin. Hair: Natural afro texture, braids, or relaxed hair."
  },
  'gugu': {
    id: 'gugu',
    label: '咕咕风',
    isGuGuStyle: true,
    referenceImage: "https://i.ibb.co/LfbZqxs/1766923119.jpg",
    prompt: "Model: Asian Influencer. Mirror Selfie Context."
  }
};

// --- 8. VIEW CONFIGURATION ---
export const VIEW_CONFIG = {
  'gugu_override': {
    upper: "Framing: Close-up Mirror Selfie (Waist up). Phone obscures part of face.",
    full: "Framing: Full Body Mirror Selfie. Phone visible in hand.",
    side: "Framing: Side Profile Mirror Selfie. Body turned.",
  },
  'standard': {
    back: "Framing: BACK VIEW. Model turned 180 degrees AWAY. Focus on back details.",
    side: "Framing: 45-DEGREE ANGLE SIDE VIEW. The model is turned 45 degrees relative to the camera (Three-Quarter View). NOT full frontal, NOT full 90-degree profile. Emphasize the side silhouette of the garment.",
    upper: "Framing: WAIST-UP SHOT (Medium Shot). Camera frame starts at top of head and ends at hips. Focus strictly on the upper body garment. Hands visible.", 
    detail: (features: string) => `Framing: EXTREME CLOSE-UP on fabric texture. Details: ${features}.`,
    full: (isShort: boolean) => isShort 
      ? "Framing: American Shot (Knees up). Perfect for short dresses. Body angled." 
      : "Framing: Full Body Wide Shot. Head to toe visible. Feet visible."
  }
};
