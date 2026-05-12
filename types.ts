
export enum WorkflowStep {
  WELCOME = 'WELCOME',
  UPLOAD = 'UPLOAD',
  ANALYZING = 'ANALYZING',
  MODE_SELECTION = 'MODE_SELECTION', // New Step: The Fork
  REVIEW = 'REVIEW', // Commercial Photography Path
  DESIGN_WORKSPACE = 'DESIGN_WORKSPACE', // Style Extension Path
  GENERATING = 'GENERATING',
  RESULT = 'RESULT',
  BATCH_PROCESS = 'BATCH_PROCESS',
  // SMART MODE STEPS
  SMART_SETUP = 'SMART_SETUP',
  SMART_WORKBENCH = 'SMART_WORKBENCH'
}

export type AppMode = 'smart' | 'design' | 'batch' | 'extension';

export interface PresetCombo {
  id: string;
  name: string;
  coverImage?: string;
  profile: SmartProfile; // The full model profile
  styleId: string;
  sceneId: string;
  createdAt: number;
}

export interface StylePreset {
  summary?: string; // NEW: AI Generated Summary (Title + Scene + Performance) in Chinese
  allowed_expressions?: string[]; // NEW: The pool of vibes selected by user
  allowed_scenes?: string[]; // NEW: The pool of scenes allowed for this protocol
  camera: {
    lens: string;
    aperture: string;
    shutter: string;
    film_type: string;
  };
  lighting: {
    setup: string;
    quality: string;
  };
  composition: {
    depth_of_field: string;
    framing: string;
    angle: string;
  };
  scene_context: {
    environment_type: string;
    props: string;
  };
  mood: {
    atmosphere: string;
    color_palette: string;
  };
}

export interface SmartProfile {
  id: string;
  name: string;
  market: 'global' | 'domestic'; 
  
  // Dimensions - NEW STRUCTURE
  faceParams: {
    ethnicity: string;
    ageGroup: string;
    features: string;
    hairStyle: string;
    hairColor: string;
    skinTone?: string;
    makeup?: string;
  };

  bodyParams: {
    bodyType: string;
    height?: string;
    muscleDefinition?: string;
    chest?: string;
    hips?: string;
  };

  // Dimension 3: Scene & Vibe (Style Protocol)
  sceneStyle: string; 
  sceneDescription: string;
  stylePreset?: StylePreset; 
  
  // Assets
  anchorImage: string; // Now specifically a "Headshot/Face Anchor"
  generatedDate: number;

  // Legacy/Compat fields (Optional)
  ethnicity?: string;
  bodyType?: string;
  ageGroup?: string;
}

export interface DirectorConfig {
  concept_title: string;
  // NEW: The "Thinking" Output
  visual_strategy: string; 
  scene_architecture: {
    environment: string;
    props: string;
    depth_of_field: string;
  };
  lighting_setup: {
    type: string;
    direction: string;
    shadow_quality: string;
    color_temperature: string;
  };
  camera_direction: {
    angle: string;
    framing: string;
    lens_choice: string;
  };
  subject_direction: {
    pose_vibe: string;
    facial_expression: string;
    interaction_with_garment: string;
  };
  color_grading: string;
}

export interface GarmentAnalysis {
  technicalDescription: string;
  styleKeywords: string[];
  fabricType: string;
  cutAndFit: string;
  originalStyleVibe: string;
  recommendedScenario: string;
  productTitle: string;
  garmentLength: string;
}

// These types now map to keys in our configuration objects
export type ViewType = 'full' | 'back' | 'side' | 'upper' | 'detail' | 'custom'; // Added 'custom'
export type ModelType = string;
export type DepthType = 'pan' | 'shallow' | 'blur'; 
export type PoseType = 'standing' | 'walking' | 'sitting' | 'posing' | 'laptop'; 

export type GenerationMode = 'standard' | 'stable';

// NEW: Category Override for manual fine-tuning
export type CategoryOverride = 'auto' | 'top' | 'dress' | 'outerwear';

// NEW: Style Extension Types
export type ModificationCategory = 'dress' | 'jumpsuit' | 'skirt' | 'cami' | 'short_tee' | 'long_tee';
export interface GarmentModification {
  category: ModificationCategory;
  description: string; // e.g., "Knee length, cinched waist"
  promptModifier: string; // The actual English prompt injection
}

export type BatchStatus = 'pending' | 'preprocessing' | 'queued' | 'processing' | 'completed' | 'failed';

export interface InspectionIssue {
  area: 'Structure' | 'Instruction' | 'Quality' | 'GarmentDetail';
  description: string; // Chinese description
  severity: 'minor' | 'major'; // Used for UI color coding
}

export interface GeneratedVariation {
  id: string;
  type: ViewType;
  imageUrl: string;
  timestamp: number;
  label?: string; // Optional label for custom variations
}

export interface BatchItem {
  id: string;
  file: File;
  previewUrl: string;
  processedImage?: string; // After smart mannequin
  generatedImage?: string;
  status: BatchStatus;
  analysis?: GarmentAnalysis; // Hidden analysis
  selectedForViews?: boolean;
  
  // New for Stable Mode
  stableScore?: number;
  stableStatus?: 'PASS' | 'WARN' | 'FAIL';
  feedbackIssues?: InspectionIssue[]; // Structured issues
  feedbackReason?: string; // Legacy/Simple string fallback

  // New for Multi-View Generation
  viewStatus?: 'idle' | 'generating' | 'completed';
  variations?: GeneratedVariation[];
}

export interface DetailedScores {
  referenceSimilarity: number;
  instructionCompliance: number;
  structuralIntegrity: number;
  visualQuality: number;
  styleUsability: number;
}

export interface DebugLog {
  id: string; // Unique ID for key
  attempt: number;
  score: number;
  status: 'PASS' | 'WARN' | 'FAIL';
  issues?: InspectionIssue[];
  regen_prompt?: string;
  timestamp: number;
  promptUsed: string;
  detailedScores?: DetailedScores;
  reason?: string;
}

export interface PortfolioItem {
  id: string;
  originalImage: string;
  mainGeneratedImage: string;
  timestamp: number;
  stylePrompt: string;
  aiFeelValue: number;
  flowValue: number;
  modelType: ModelType;
  depthValue: DepthType;
  poseType: PoseType; 
  variations: GeneratedVariation[];
  debugLogs?: DebugLog[]; // Store logs if stable mode was used
}

export interface SceneSuggestion {
  id: string;
  title: string;
  description: string; // The actual prompt
}

export interface VariationSuggestion {
  id: string;
  label: string; // Short button text e.g. "Collar Detail"
  prompt: string; // Instruction for the framing/camera
}
