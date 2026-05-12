
/**
 * GEMINI SERVICE (BARREL FILE)
 * This file re-exports functionality from the /gemini sub-modules.
 * This ensures strict backward compatibility with existing imports in the application.
 * 
 * CORE LOGIC IS NOW LOCATED IN: src/services/gemini/
 */

export { createDummyAnalysis } from './gemini/utils';
export { preprocessGarment, evaluatePreprocessing } from './gemini/preprocessing';
export { evaluateGeneratedImage } from './gemini/evaluation';
export { analyzeGarmentImage, detectFaceInImage, generateSceneSuggestions, generateVariationSuggestions, generateSmartScenePrompt, generateDirectorConfig, generateStylePreset } from './gemini/analysis';
export { generateStyledGarment, generateAnchorImage } from './gemini/generation';
