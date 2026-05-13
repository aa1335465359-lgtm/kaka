
import { useState, useEffect, useCallback } from 'react';
import { 
    WorkflowStep, GarmentAnalysis, PortfolioItem, GeneratedVariation, 
    ViewType, ModelType, DepthType, PoseType, SceneSuggestion, 
    GenerationMode, DebugLog, BatchItem, InspectionIssue, 
    GarmentModification, CategoryOverride, AppMode, SmartProfile 
} from '../types';
import { 
    analyzeGarmentUnified, analyzeGarmentImage, generateStyledGarment, generateStyledGarmentDirect,
    preprocessGarment, createDummyAnalysis, 
    evaluateGeneratedImage 
} from '../services/geminiService';
import { SCENE_CONFIG } from '../services/promptConfig';
import { storageService } from '../services/storage';

// --- CONSTANTS: INITIAL STATES ---
const INITIAL_CONFIG = {
    stylePrompt: '',
    aspectRatio: '3:4',
    modelType: 'standard' as ModelType,
    depthLevel: 'pan' as DepthType,
    poseType: 'standing' as PoseType,
    aiFeelValue: 0,
    flowValue: 20,
    generationMode: 'standard' as GenerationMode,
    ignoreModel: false,
    categoryOverride: 'auto' as CategoryOverride
};

export const useWorkflow = () => {
    // --- GLOBAL STATE (Persisted) ---
    const [appMode, setAppMode] = useState<AppMode>('smart');
    const [smartProfile, setSmartProfile] = useState<SmartProfile | null>(null);
    const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
    const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
    
    // --- WORKFLOW ROUTING ---
    const [step, setStep] = useState<WorkflowStep>(WorkflowStep.WELCOME);
    const [workflowMode, setWorkflowMode] = useState<'review' | 'design'>('review');

    // --- SESSION STATE (Files & Analysis) ---
    const [rawFile, setRawFile] = useState<string | null>(null);
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [backImage, setBackImage] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<GarmentAnalysis | null>(null);
    
    // --- GENERATION CONFIGURATION ---
    const [stylePrompt, setStylePrompt] = useState<string>(INITIAL_CONFIG.stylePrompt);
    const [aspectRatio, setAspectRatio] = useState<string>(INITIAL_CONFIG.aspectRatio);
    const [modelType, setModelType] = useState<ModelType>(INITIAL_CONFIG.modelType);
    const [depthLevel, setDepthLevel] = useState<DepthType>(INITIAL_CONFIG.depthLevel);
    const [poseType, setPoseType] = useState<PoseType>(INITIAL_CONFIG.poseType);
    const [aiFeelValue, setAiFeelValue] = useState<number>(INITIAL_CONFIG.aiFeelValue);
    const [flowValue, setFlowValue] = useState<number>(INITIAL_CONFIG.flowValue);
    const [generationMode, setGenerationMode] = useState<GenerationMode>(INITIAL_CONFIG.generationMode);
    const [ignoreModel, setIgnoreModel] = useState<boolean>(INITIAL_CONFIG.ignoreModel);
    const [categoryOverride, setCategoryOverride] = useState<CategoryOverride>(INITIAL_CONFIG.categoryOverride);

    // --- RESULTS & UI FLAGS ---
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [currentModification, setCurrentModification] = useState<GarmentModification | null>(null);
    const [variations, setVariations] = useState<GeneratedVariation[]>([]);
    const [currentPortfolioId, setCurrentPortfolioId] = useState<string | null>(null);
    
    const [error, setError] = useState<string | null>(null);
    const [showPortfolio, setShowPortfolio] = useState<boolean>(false);
    const [showDnaDetails, setShowDnaDetails] = useState<boolean>(false);
    const [showDebugPanel, setShowDebugPanel] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string[]>([]);
    
    // Warnings
    const [preprocessWarning, setPreprocessWarning] = useState<string | null>(null);
    const [stableModeIssues, setStableModeIssues] = useState<InspectionIssue[] | null>(null);
    
    // Process Flags
    const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
    const [isPreprocessing, setIsPreprocessing] = useState<boolean>(false);
    const [isPreprocessEnabled, setIsPreprocessEnabled] = useState<boolean>(false);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [variationLoadings, setVariationLoadings] = useState<Record<string, boolean>>({});

    // Batch specific
    const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
    const [isBatchRunning, setIsBatchRunning] = useState<boolean>(false);
    const [isGeneratingViews, setIsGeneratingViews] = useState<boolean>(false);

    // Suggestions
    const [sceneSuggestions, setSceneSuggestions] = useState<SceneSuggestion[]>([]);
    const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
    
    // Debug & Misc
    const [newProjectClickCount, setNewProjectClickCount] = useState<number>(0);

    // --- EFFECTS: PERSISTENCE (Delegated to storageService) ---
    useEffect(() => {
        setPortfolio(storageService.loadPortfolio());
        setDebugLogs(storageService.loadDebugLogs());
    }, []);

    useEffect(() => {
        if (portfolio.length > 0) {
            storageService.savePortfolio(portfolio);
        }
    }, [portfolio]);

    useEffect(() => {
        storageService.saveDebugLogs(debugLogs);
    }, [debugLogs]);

    // --- HELPER: RESET LOGIC (Deep Cleaning) ---

    const resetGenerationConfig = useCallback(() => {
        setStylePrompt(INITIAL_CONFIG.stylePrompt);
        setAspectRatio(INITIAL_CONFIG.aspectRatio);
        setModelType(INITIAL_CONFIG.modelType);
        setDepthLevel(INITIAL_CONFIG.depthLevel);
        setPoseType(INITIAL_CONFIG.poseType);
        setAiFeelValue(INITIAL_CONFIG.aiFeelValue);
        setFlowValue(INITIAL_CONFIG.flowValue);
        setGenerationMode(INITIAL_CONFIG.generationMode);
        setIgnoreModel(INITIAL_CONFIG.ignoreModel);
        setCategoryOverride(INITIAL_CONFIG.categoryOverride);
    }, []);

    const clearSessionData = useCallback(() => {
        setOriginalImage(null); setBackImage(null); setRawFile(null);
        setAnalysis(null);
        setGeneratedImage(null); setVariations([]);
        setError(null);
        setBatchItems([]); setIsBatchRunning(false);
        setStableModeIssues(null); setPreprocessWarning(null);
        setSceneSuggestions([]); setSelectedSceneId(null);
    }, []);

    // Used when clicking "New Project"
    const resetWorkflow = useCallback(() => {
        clearSessionData();
        resetGenerationConfig();
        // Determine start step based on current mode
        if (appMode === 'smart') {
            setStep(smartProfile ? WorkflowStep.SMART_WORKBENCH : WorkflowStep.SMART_SETUP);
        } else {
            setStep(WorkflowStep.UPLOAD);
        }
    }, [appMode, smartProfile, clearSessionData, resetGenerationConfig]);

    // Used when switching tabs
    const switchMode = useCallback((mode: AppMode) => {
        setAppMode(mode);
        // Sync legacy workflowMode for compatibility
        if (mode === 'design') setWorkflowMode('review');
        if (mode === 'extension') setWorkflowMode('design');

        // CRITICAL: Deep clean when switching modes to prevent state pollution
        clearSessionData();
        resetGenerationConfig();
        
        if (mode === 'smart') {
            setStep(smartProfile ? WorkflowStep.SMART_WORKBENCH : WorkflowStep.SMART_SETUP);
        } else {
            setStep(WorkflowStep.UPLOAD);
        }
    }, [smartProfile, clearSessionData, resetGenerationConfig]);


    // --- HELPER: ERROR HANDLER ---
    const handleError = (e: any, defaultMsg: string) => {
        console.error(e);
        const msg = e?.message || JSON.stringify(e);
        if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
            setError("服务繁忙 (429): API 调用配额已耗尽，请检查 Google Cloud 账单或稍后重试。");
        } else {
            setError(defaultMsg);
        }
    };

    // --- HELPER: UTILS ---
    const getMimeType = (dataUrl: string) => dataUrl.match(/^data:(.*);base64,/)?.[1] || 'image/jpeg';
    const scenePresets = Object.values(SCENE_CONFIG);


    // --- ACTIONS: 1. ANALYSIS ---
    const handleAnalysis = async () => {
        if (!originalImage) return;
        setStep(WorkflowStep.ANALYZING);
        setIsAnalyzing(true);
        setError(null);
        setAnalysis(null);
        setPreprocessWarning(null);
        
        setLoadingMessage(["正在识别面料与场景..."]);

        try {
            // Use unified analysis: one API call for face detection + garment analysis + scene suggestions
            const mimeType = getMimeType(originalImage);
            const raw = originalImage.split(',')[1];
            const unified = await analyzeGarmentUnified(raw, mimeType);

            setAnalysis(unified.analysis);
            setSceneSuggestions(unified.sceneSuggestions || []);

            if (unified.hasFace) {
                setPreprocessWarning("检测到人脸。如需更好的效果，建议上传去掉人台的服装图片。");
            }

            if (appMode === 'extension') {
                setTimeout(() => setStep(WorkflowStep.DESIGN_WORKSPACE), 800);
            } else {
                const rec = scenePresets.find(p => p.name === unified.analysis.recommendedScenario);
                if (rec && modelType !== 'gugu') {
                    setStylePrompt(rec.prompt);
                    setSelectedSceneId(rec.id);
                }
                setStep(WorkflowStep.REVIEW);
            }
        } catch (e) {
            handleError(e, "分析失败，请重试");
            setStep(WorkflowStep.UPLOAD);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // --- ACTIONS: 2. GENERATION ---
    const handleGeneration = async (modification?: GarmentModification | null) => {
        if (!originalImage || !analysis) return;
        
        setStep(WorkflowStep.RESULT);
        setIsGenerating(true);
        setGeneratedImage(null);
        setStableModeIssues(null);
        if (modification !== undefined) {
            setCurrentModification(modification);
        }
        
        setLoadingMessage(modification 
            ? ["AI 设计师重构中...", `正在生成: ${modification.category}`, "应用面料 DNA..."] 
            : ["高保真渲染中...", "计算 8K 纹理细节...", "模拟真实光影追踪..."]);

        try {
            const base64 = originalImage.split(',')[1];
            const mime = getMimeType(originalImage);
            const backB64 = backImage ? backImage.split(',')[1] : undefined;
            
            const fullDesc = analysis.technicalDescription + analysis.fabricType;
            const isTop = /上衣|shirt|top/i.test(fullDesc);
            const targetView: ViewType = modification ? 'full' : (isTop ? 'upper' : 'full');
            const prompt = modification ? modification.promptModifier : stylePrompt;

            // Phase 1
            let resultB64 = await generateStyledGarment(
                base64, analysis, prompt, aspectRatio, aiFeelValue, flowValue,
                modelType, targetView, depthLevel, poseType, undefined, mime, 
                ignoreModel, modification, backB64, categoryOverride
            );

            // Phase 2 (Stable Mode)
            let issues: InspectionIssue[] = [];
            if (generationMode === 'stable') {
                setLoadingMessage(["AI 质检员介入...", "正在对比原图细节...", "评估结构完整性..."]);
                const eval1 = await evaluateGeneratedImage(resultB64, prompt, base64);
                
                const log: DebugLog = {
                    id: Date.now().toString(), attempt: 1, score: eval1.score, 
                    status: eval1.status, issues: eval1.issues, regen_prompt: eval1.regen_prompt,
                    timestamp: Date.now(), promptUsed: prompt, detailedScores: eval1.detailedScores,
                    reason: eval1.issues.map(i => i.description).join('; ')
                };
                setDebugLogs(p => [log, ...p]);

                if (eval1.need_regen) {
                    setLoadingMessage(["检测到细节差异...", "正在自动修复...", "应用修正指令..."]);
                    const fixPrompt = prompt + " CORRECTION: " + eval1.regen_prompt;
                    try {
                        resultB64 = await generateStyledGarment(
                            base64, analysis, fixPrompt, aspectRatio, aiFeelValue, flowValue,
                            modelType, targetView, depthLevel, poseType, undefined, mime,
                            ignoreModel, modification, backB64, categoryOverride
                        );
                        // Optional Re-eval
                        const eval2 = await evaluateGeneratedImage(resultB64, fixPrompt, base64);
                        issues = eval2.issues;
                    } catch (e) {
                        console.warn("Retry failed", e);
                        issues = eval1.issues;
                    }
                } else {
                    issues = eval1.issues;
                }
                if (issues.length > 0) setStableModeIssues(issues);
            }

            const finalImg = `data:image/jpeg;base64,${resultB64}`;
            setGeneratedImage(finalImg);
            
            const newId = Date.now().toString();
            setCurrentPortfolioId(newId);
            setPortfolio(p => [{
                id: newId, originalImage: rawFile || originalImage, mainGeneratedImage: finalImg,
                timestamp: Date.now(), stylePrompt: prompt, aiFeelValue, flowValue,
                modelType, depthValue: depthLevel, poseType, variations: [], debugLogs: []
            }, ...p]);

        } catch (e) {
            handleError(e, "生成失败，请重试");
            setStep(workflowMode === 'design' ? WorkflowStep.DESIGN_WORKSPACE : WorkflowStep.REVIEW);
        } finally {
            setIsGenerating(false);
        }
    };

    // --- ACTIONS: 3. BATCH PROCESSING ---
    
    // Process a single item from the queue
    const processBatchItem = async (itemId: string) => {
        setBatchItems(prev => prev.map(i => i.id === itemId ? { ...i, status: isPreprocessEnabled ? 'preprocessing' : 'processing' } : i));
        const item = batchItems.find(i => i.id === itemId);
        if (!item) return;

        try {
            const getB64 = (f: File): Promise<string> => new Promise(r => {
                const reader = new FileReader();
                reader.onload = () => r((reader.result as string).split(',')[1]);
                reader.readAsDataURL(f);
            });

            let raw = await getB64(item.file);
            let mime = item.file.type || "image/jpeg";
            let working = raw;

            // Optional Preprocessing
            if (isPreprocessEnabled) {
                const processed = await preprocessGarment(raw, mime);
                working = processed;
                setBatchItems(prev => prev.map(i => i.id === itemId ? { 
                    ...i, processedImage: `data:image/jpeg;base64,${processed}`, status: 'processing' 
                } : i));
            }

            // OPTIMIZATION: Real Analysis (Lightweight)
            let analysisResult = createDummyAnalysis();
            try {
                // Use the lightweight analysis if possible to improve prompt quality
                analysisResult = await analyzeGarmentImage(working, "image/jpeg");
            } catch (e) {
                console.warn("Batch analysis failed, using fallback", e);
            }

            // Generate
            const res = await generateStyledGarment(
                working, analysisResult, stylePrompt, aspectRatio, aiFeelValue, flowValue,
                modelType, 'full', depthLevel, poseType, undefined, "image/jpeg", false
            );

            setBatchItems(prev => prev.map(i => i.id === itemId ? {
                ...i, status: 'completed', generatedImage: `data:image/jpeg;base64,${res}`, analysis: analysisResult
            } : i));

        } catch (e) {
            setBatchItems(prev => prev.map(i => i.id === itemId ? { ...i, status: 'failed' } : i));
        }
    };

    // The Effect to drive the batch queue
    useEffect(() => {
        if (!isBatchRunning) return;
        const processQueue = async () => {
            const processing = batchItems.filter(i => i.status === 'processing' || i.status === 'preprocessing');
            const queued = batchItems.filter(i => i.status === 'queued');
            
            // Limit concurrency to 2 to avoid rate limits
            if (processing.length < 2 && queued.length > 0) {
                await processBatchItem(queued[0].id);
            }
            
            if (batchItems.length > 0 && batchItems.every(i => i.status === 'completed' || i.status === 'failed')) {
                setIsBatchRunning(false);
            }
        };
        const interval = setInterval(processQueue, 1500); // Check every 1.5s
        return () => clearInterval(interval);
    }, [isBatchRunning, batchItems, isPreprocessEnabled, stylePrompt, aspectRatio, aiFeelValue, flowValue, modelType, depthLevel, poseType]);


    const handleBatchGenerateViews = async () => {
        const ids = batchItems.filter(i => i.selectedForViews && i.status === 'completed').map(i => i.id);
        if (ids.length === 0) return;
        
        setIsGeneratingViews(true);
        setBatchItems(p => p.map(i => ids.includes(i.id) ? { ...i, viewStatus: 'generating' } : i));
        
        const views: ViewType[] = ['back', 'side', 'upper', 'detail'];
        
        try {
            // Process sequentially per item, parallel per view could be too much
            await Promise.all(ids.map(async (id) => {
                const item = batchItems.find(i => i.id === id);
                if (!item?.generatedImage) return;
                
                const b64 = item.generatedImage.split(',')[1];
                const itemVars: GeneratedVariation[] = [];
                
                await Promise.all(views.map(async (v) => {
                    try {
                        const res = await generateStyledGarment(
                            b64, item.analysis || createDummyAnalysis(), stylePrompt, aspectRatio,
                            aiFeelValue, flowValue, modelType, v, depthLevel, poseType, 
                            undefined, "image/jpeg", false
                        );
                        itemVars.push({
                            id: Date.now() + Math.random().toString(), type: v,
                            imageUrl: `data:image/jpeg;base64,${res}`, timestamp: Date.now(),
                            label: v === 'back' ? '背面' : v === 'side' ? '侧面' : v === 'upper' ? '半身' : '细节'
                        });
                    } catch (e) { console.warn(e); }
                }));

                setBatchItems(p => p.map(i => i.id === id ? {
                    ...i, viewStatus: 'completed', variations: [...(i.variations || []), ...itemVars]
                } : i));
            }));
        } catch (e) { console.error(e); } 
        finally { setIsGeneratingViews(false); }
    };

    // --- ACTIONS: 4. VARIATIONS ---
    const handleVariation = async (type: ViewType, modification?: GarmentModification) => {
        const sourceImage = (workflowMode === 'design' && generatedImage) ? generatedImage : originalImage;
        if (!sourceImage || !analysis || variationLoadings[type]) return;
        setVariationLoadings(p => ({ ...p, [type]: true }));

        try {
            const b64 = sourceImage.split(',')[1];
            const mime = getMimeType(sourceImage);
            const backB64 = backImage ? backImage.split(',')[1] : undefined;
            const prompt = modification ? modification.promptModifier : stylePrompt;

            const res = await generateStyledGarment(
                b64, analysis, prompt, aspectRatio, aiFeelValue, flowValue,
                modelType, type, depthLevel, poseType, undefined, mime, 
                ignoreModel, undefined, backB64, categoryOverride // Pass undefined for modification to force PATH B
            );

            const newVar: GeneratedVariation = {
                id: Date.now().toString() + Math.random(), type,
                imageUrl: `data:image/jpeg;base64,${res}`, timestamp: Date.now(),
                label: type === 'back' ? '背面' : type === 'side' ? '侧面' : type === 'upper' ? '半身' : '细节'
            };
            setVariations(p => [newVar, ...p]);
            
            if (currentPortfolioId) {
                setPortfolio(p => p.map(i => i.id === currentPortfolioId ? { ...i, variations: [newVar, ...(i.variations||[])] } : i));
            }
        } catch (e) { 
            handleError(e, "变体生成失败");
        }
        finally { setVariationLoadings(p => ({ ...p, [type]: false })); }
    };

    // --- UTILS ---
    const handleDebugTrigger = () => {
        setNewProjectClickCount(p => p + 1);
        if (newProjectClickCount + 1 >= 6) { setShowDebugPanel(true); setNewProjectClickCount(0); }
        else { resetWorkflow(); }
    };

    const handlePortfolioRestore = (item: PortfolioItem) => {
        setOriginalImage(item.originalImage); setRawFile(item.originalImage);
        setGeneratedImage(item.mainGeneratedImage); setBackImage(null);
        setStylePrompt(item.stylePrompt); setAiFeelValue(item.aiFeelValue); setFlowValue(item.flowValue);
        setModelType(item.modelType); setDepthLevel(item.depthValue || 'pan'); setPoseType(item.poseType || 'standing');
        setVariations(item.variations || []); setCurrentPortfolioId(item.id);
        setStep(WorkflowStep.RESULT); setShowPortfolio(false);
    };

    const handleBatchUpload = (files: FileList) => {
        const items = Array.from(files).map(f => ({
            id: Date.now() + Math.random().toString(), file: f, previewUrl: URL.createObjectURL(f),
            status: 'pending' as const, selectedForViews: false, viewStatus: 'idle' as const, variations: []
        }));
        setBatchItems(items); setStep(WorkflowStep.BATCH_PROCESS);
    };

    const handleStartBatch = () => {
        setBatchItems(p => p.map(i => ({ ...i, status: 'queued' })));
        setIsBatchRunning(true);
    };

    return {
        // State
        appMode, smartProfile, step, workflowMode,
        rawFile, originalImage, backImage, analysis,
        stylePrompt, aspectRatio, modelType, depthLevel, poseType, aiFeelValue, flowValue, generationMode, ignoreModel, categoryOverride,
        generatedImage, variations, portfolio, currentPortfolioId,
        error, showPortfolio, showDnaDetails, showDebugPanel, loadingMessage, preprocessWarning, stableModeIssues,
        isAnalyzing, isPreprocessing, isPreprocessEnabled, isGenerating, variationLoadings,
        batchItems, isBatchRunning, isGeneratingViews,
        sceneSuggestions, selectedSceneId, debugLogs,

        // Setters
        setAppMode, setSmartProfile, setStep, setWorkflowMode,
        setOriginalImage, setBackImage, setRawFile,
        setStylePrompt, setAspectRatio, setModelType, setDepthLevel, setPoseType, setAiFeelValue, setFlowValue, setGenerationMode, setIgnoreModel, setCategoryOverride,
        setGeneratedImage, setShowPortfolio, setShowDnaDetails, setShowDebugPanel, setIsPreprocessEnabled,
        setBatchItems, setSelectedSceneId,
        setPreprocessWarning, setStableModeIssues,

        // Actions
        switchMode, resetWorkflow, handleDebugTrigger,
        handleAnalysis, handleGeneration,
        processBatchItem, handleBatchGenerateViews, handleVariation,
        handlePortfolioRestore, handleBatchUpload, handleStartBatch
    };
};
