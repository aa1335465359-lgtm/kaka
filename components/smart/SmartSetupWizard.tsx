
import React, { useState } from 'react';
import { SmartProfile, StylePreset } from '../../types';
import { generateAnchorImage, generateStylePreset } from '../../services/geminiService';
import { Button } from '../Button';
import { CameraLensIcon, MagicWandIcon, LightningIcon } from '../Icons';
import Silk from '../Silk';

// Imports from new structure
import { STEPS, ETHNICITY_OPTIONS, SIMPLE_FACE_FEATURES, SIMPLE_HAIR_STYLES, SIMPLE_BODY_TYPES, SIMPLE_AGE_OPTIONS, CAMERAS, LIGHTING_OPTIONS, SCENE_TAGS, EXPRESSION_OPTIONS } from './setup/setupData';
import { AdvancedAnatomyPanel } from './setup/AdvancedAnatomyPanel';

interface SmartSetupWizardProps {
  onProfileCreated: (profile: SmartProfile) => void;
}

export const SmartSetupWizard: React.FC<SmartSetupWizardProps> = ({ onProfileCreated }) => {
    const [step, setStep] = useState(1);
    
    // --- STEP 1: IDENTITY (FACE) ---
    const [ethnicity, setEthnicity] = useState(ETHNICITY_OPTIONS[0]);
    
    // --- STEP 2: ANATOMY (BODY) & DETAILS ---
    const [isAdvancedMode, setIsAdvancedMode] = useState(false);
    
    // Simple Mode State
    const [simpleAge, setSimpleAge] = useState(SIMPLE_AGE_OPTIONS[0]);
    const [simpleFace, setSimpleFace] = useState(SIMPLE_FACE_FEATURES[0]);
    const [simpleHair, setSimpleHair] = useState(SIMPLE_HAIR_STYLES[0]);
    const [simpleBody, setSimpleBody] = useState(SIMPLE_BODY_TYPES[1]); // Default Standard

    // Advanced Mode State (Maps to both Face and Body Params)
    const [advSettings, setAdvSettings] = useState<Record<string, string>>({
        // Face Params
        faceShape: '鹅蛋脸 (Oval)', eyeType: '杏眼 (Almond)', eyeColor: '常见色 (Brown/Black)', noseShape: '小翘鼻 (Button)', lipShape: 'M唇 (Cupid Bow)', skinTone: '自然 (Natural)', skinTexture: '真实肌理 (Realistic)', imperfections: '无 (None)',
        makeupIntensity: '日常通勤 (Soft Glam)', lipTexture: '哑光 (Matte)', eyebrows: '野生眉 (Feathery)',
        hairTexture: '微卷 (Wavy)', hairLength: '长发 (Long)', hairStyle: '披发 (Down)', hairBangs: '无刘海 (None)', hairColor: '深棕 (Dark Brown)',
        // Body Params
        ageGroup: '18-24 (Gen Z)', bodyShape: '沙漏型 (Hourglass)', bodyDefinition: '紧致 (Toned/Fit)', chestVolume: '适中 (Average)', hipVolume: '适中 (Average)'
    });
    
    // --- STEP 3: FACE ANCHOR GENERATION ---
    const [anchorImage, setAnchorImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // --- STEP 4 & 5: STYLE PROTOCOL ---
    const [camera, setCamera] = useState(CAMERAS[0]);
    const [selectedScenes, setSelectedScenes] = useState<string[]>([]);
    const [lighting, setLighting] = useState(LIGHTING_OPTIONS[0]);
    const [selectedExpressions, setSelectedExpressions] = useState<string[]>([]);
    const [customStyle, setCustomStyle] = useState('');
    const [aiProtocol, setAiProtocol] = useState<StylePreset | null>(null);
    const [isSynthesizing, setIsSynthesizing] = useState(false);
    const [showRawProtocol, setShowRawProtocol] = useState(false);

    // --- ACTIONS ---
    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => Math.max(1, prev - 1));

    const toggleSelection = (list: string[], setFn: (l: string[]) => void, id: string, max: number = 5) => {
        if (list.includes(id)) {
            setFn(list.filter(item => item !== id));
        } else {
            if (list.length < max) setFn([...list, id]);
        }
    };

    const updateAdvSetting = (key: string, value: string) => {
        setAdvSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleGenerateAnchor = async () => {
        setIsGenerating(true);
        try {
            // CONSTRUCT PROMPT FOR HEADSHOT ONLY
            let featuresPrompt = "";
            let hairPrompt = "";
            let bodyPrompt = "";
            let agePrompt = "";

            if (isAdvancedMode) {
                featuresPrompt = `${advSettings.faceShape}, ${advSettings.eyeType}, ${advSettings.eyeColor}, ${advSettings.noseShape}, ${advSettings.lipShape}, ${advSettings.skinTone}, Makeup: ${advSettings.makeupIntensity}`;
                hairPrompt = `${advSettings.hairTexture}, ${advSettings.hairLength}, ${advSettings.hairStyle}, ${advSettings.hairColor}`;
                bodyPrompt = `${advSettings.bodyShape}, ${advSettings.bodyDefinition}`; 
                agePrompt = advSettings.ageGroup;
            } else {
                featuresPrompt = `Feature: ${simpleFace.label}`;
                hairPrompt = `Hair: ${simpleHair.label}`;
                agePrompt = simpleAge.label;
                
                // MAPPING SIMPLE SELECTION TO SPECIFIC FEMALE BODY PROMPTS
                switch (simpleBody.id) {
                    case 'heavy':
                        bodyPrompt = "Female Model, Size 4XL-5XL, Heavyset, Soft full figure, Plus Size Architecture.";
                        break;
                    case 'muscular':
                        bodyPrompt = "Female Bodybuilder, Toned Muscular Physique, Strong definition.";
                        break;
                    case 'petite':
                        bodyPrompt = "Petite Female, Small frame, Short stature.";
                        break;
                    case 'curvy':
                        bodyPrompt = "Curvy Female, Hourglass figure, Voluptuous.";
                        break;
                    case 'plus_size':
                        bodyPrompt = "Plus Size Female (1XL-2XL), Curvy fashion model.";
                        break;
                    default: // Standard
                        bodyPrompt = "Standard Female Model, Fit physique.";
                        break;
                }
            }

            const b64 = await generateAnchorImage(
                { 
                    ethnicity: ethnicity.label, 
                    bodyType: bodyPrompt, 
                    ageGroup: agePrompt, 
                    features: featuresPrompt,
                    hairStyle: hairPrompt
                },
                "Neutral Studio Background"
            );
            setAnchorImage(b64);
        } catch (e: any) {
            const msg = e?.message || "";
            if (msg.includes('429')) alert("服务繁忙 (429): API 配额耗尽，请稍后重试。");
            else alert("生成失败，请重试");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAnalyzeAndSummary = async () => {
        if (selectedScenes.length === 0) {
            alert("请至少选择 1 个适配场景");
            return;
        }
        if (selectedExpressions.length === 0) {
            alert("请至少选择 1 个模特表现力");
            return;
        }

        setStep(5);
        setIsSynthesizing(true);
        try {
            const scenePool = selectedScenes.length > 0 
                ? selectedScenes.map(id => SCENE_TAGS.find(s => s.id === id)?.label).join(' OR ')
                : "Professional Studio";
            
            const expressionLabels = selectedExpressions.length > 0 
                ? selectedExpressions.map(id => EXPRESSION_OPTIONS.find(e => e.id === id)?.label || id)
                : ["Confident", "Natural"];
            
            const preset = await generateStylePreset(
                camera.label, 
                scenePool, 
                lighting.label, 
                expressionLabels,
                customStyle || "Follow standard professional e-commerce photography rules."
            );
            setAiProtocol(preset);
        } catch (e: any) {
            if (e?.message?.includes('429')) alert("服务繁忙 (429): 无法生成风格协议，将使用默认配置。");
            setAiProtocol({
                summary: "标准预设 | 影棚 | 自然光",
                allowed_expressions: ["Confident"],
                camera: { lens: "50mm", aperture: "f/5.6", shutter: "Auto", film_type: "Digital" },
                lighting: { setup: "Natural", quality: "Soft" },
                composition: { depth_of_field: "Standard", framing: "Center", angle: "Eye level" },
                scene_context: { environment_type: "Mixed", props: "None" },
                mood: { atmosphere: "Neutral", color_palette: "Standard" }
            });
        } finally {
            setIsSynthesizing(false);
        }
    };

    const handleFinish = () => {
        if (!anchorImage || !aiProtocol) return;
        const styleLogic = `[AI DIRECTOR PROTOCOL] ${aiProtocol.summary || 'Custom Style'} | LENS: ${aiProtocol.camera.lens}`;
        
        // CONSTRUCT MODULAR PARAMS
        const faceParams = isAdvancedMode ? {
            ethnicity: ethnicity.label,
            ageGroup: advSettings.ageGroup,
            features: `${advSettings.faceShape}, ${advSettings.eyeType}, ${advSettings.noseShape}, ${advSettings.lipShape}`,
            hairStyle: `${advSettings.hairStyle}, ${advSettings.hairLength}`,
            hairColor: advSettings.hairColor,
            skinTone: advSettings.skinTone,
            makeup: advSettings.makeupIntensity
        } : {
            ethnicity: ethnicity.label,
            ageGroup: simpleAge.label,
            features: simpleFace.label,
            hairStyle: simpleHair.label,
            hairColor: 'Natural',
        };

        const bodyParams = isAdvancedMode ? {
            bodyType: advSettings.bodyShape,
            muscleDefinition: advSettings.bodyDefinition,
            chest: advSettings.chestVolume,
            hips: advSettings.hipVolume
        } : {
            bodyType: simpleBody.id === 'heavy' ? '4XL-5XL Heavyset Female' : simpleBody.label,
            muscleDefinition: simpleBody.id === 'muscular' ? 'Very Muscular' : (simpleBody.id === 'heavy' ? 'Soft' : 'Fit'),
        };

        const profile: SmartProfile = {
            id: Date.now().toString(),
            // Title derived from Ethnicity + Style Summary
            name: `${ethnicity.label.split('(')[0]} + ${aiProtocol.summary?.split('|')[0].trim() || 'Style'}`,
            market: 'domestic',
            
            // New Structures
            faceParams,
            bodyParams,

            // Style
            sceneStyle: 'Custom Protocol',
            sceneDescription: styleLogic,
            stylePreset: aiProtocol, 
            
            // Asset
            anchorImage: anchorImage,
            generatedDate: Date.now()
        };
        onProfileCreated(profile);
    };

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center animate-fade-in">
            <div className="w-full max-w-6xl bg-white rounded-[2rem] shadow-xl overflow-hidden flex flex-col h-full max-h-[85vh] border border-white/60 relative">
                
                {/* HEADER */}
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white z-10 shrink-0">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Agent 激活向导</h1>
                        <p className="text-xs text-gray-400 mt-0.5 font-mono uppercase tracking-wider">Step {step} / 5</p>
                    </div>
                    <div className="flex gap-2">
                        {STEPS.map(s => (
                            <div key={s.id} className={`h-1.5 rounded-full transition-all duration-300 ${step >= s.id ? 'w-8 bg-fashion-accent' : 'w-2 bg-gray-200'}`} />
                        ))}
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 overflow-y-auto p-8 relative flex flex-col scrollbar-hide bg-gray-50/30">
                    
                    {/* STEP 1: IDENTITY */}
                    {step === 1 && (
                        <div className="space-y-6 animate-slide-up max-w-3xl mx-auto w-full">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-gray-900">选择核心骨相 (Identity)</h2>
                                <p className="text-gray-500 text-sm mt-2">决定 Agent 的种族基础。此步骤仅影响面部结构。</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {ETHNICITY_OPTIONS.map(opt => (
                                    <button key={opt.id} onClick={() => setEthnicity(opt)}
                                        className={`p-5 rounded-xl border-2 text-left transition-all hover:scale-[1.01] flex flex-col gap-2 ${ethnicity.id === opt.id ? 'border-fashion-accent bg-blue-50/30' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                                    >
                                        <span className={`text-sm font-bold ${ethnicity.id === opt.id ? 'text-fashion-accent' : 'text-gray-900'}`}>{opt.label.split('(')[0]}</span>
                                        <span className="text-xs text-gray-400">{opt.sub}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 2: ANATOMY & DETAILS */}
                    {step === 2 && (
                        <div className="space-y-6 animate-slide-up max-w-5xl mx-auto w-full relative pb-12">
                            <div className="flex justify-between items-end mb-6 px-2">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">定义面部与体态</h2>
                                    <p className="text-gray-500 text-sm mt-2">数据将分流：面部用于生成头像，体态用于生成全身照。</p>
                                </div>
                                <button onClick={() => setIsAdvancedMode(!isAdvancedMode)}
                                    className={`text-xs px-4 py-2 rounded-full font-bold border transition-all flex items-center gap-2 ${isAdvancedMode ? 'bg-fashion-accent text-white border-fashion-accent shadow-lg' : 'bg-white text-gray-500 border-gray-200'}`}
                                >
                                    {isAdvancedMode ? '切换至简易模式' : '开启高级模式 (PRO)'}
                                </button>
                            </div>
                            
                            {isAdvancedMode ? (
                                <AdvancedAnatomyPanel settings={advSettings} onUpdate={updateAdvSetting} />
                            ) : (
                                <div className="space-y-8 max-w-3xl mx-auto bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">五官风格 (Features)</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {SIMPLE_FACE_FEATURES.map(opt => (
                                                <button key={opt.id} onClick={() => setSimpleFace(opt)} className={`py-3 px-4 rounded-lg text-sm font-medium border transition-all ${simpleFace.id === opt.id ? 'bg-fashion-accent text-white border-fashion-accent' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                                                    {opt.label.split('(')[0]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">发型设计 (Hair)</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {SIMPLE_HAIR_STYLES.map(opt => (
                                                <button key={opt.id} onClick={() => setSimpleHair(opt)} className={`py-3 px-4 rounded-lg text-sm font-medium border transition-all ${simpleHair.id === opt.id ? 'bg-fashion-accent text-white border-fashion-accent' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                                                    {opt.label.split('(')[0]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">年龄阶段 (Age)</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {SIMPLE_AGE_OPTIONS.map(opt => (
                                                <button key={opt.id} onClick={() => setSimpleAge(opt)} className={`py-3 px-4 rounded-lg text-sm font-medium border transition-all ${simpleAge.id === opt.id ? 'bg-fashion-accent text-white border-fashion-accent' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                                                    {opt.label.split('(')[0]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">体态特征 (Body)</label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {SIMPLE_BODY_TYPES.map(opt => (
                                                <button key={opt.id} onClick={() => setSimpleBody(opt)} className={`py-3 px-4 rounded-lg text-sm font-medium border transition-all ${simpleBody.id === opt.id ? 'bg-fashion-accent text-white border-fashion-accent' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                                                    {opt.label.split('(')[0]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 3: FACE ANCHOR GENERATION */}
                    {step === 3 && (
                        <div className="flex flex-col items-center justify-center flex-1 animate-slide-up space-y-8 h-full">
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-gray-900">生成面部锚点 (Face Anchor)</h2>
                                <p className="text-gray-500 text-sm mt-2">AI 将根据 Step 1 & 2 的数据生成<b className="text-gray-800">高保真大头照</b>。<br/>此图片仅用于锁定长相，不代表最终生成的身体姿态。</p>
                            </div>
                            <div className="relative w-64 aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden shadow-2xl border-4 border-white flex items-center justify-center group">
                                {isGenerating ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-20">
                                        <div className="absolute inset-0 opacity-50"><Silk speed={3} scale={2} color="#3370ff" /></div>
                                        <div className="w-10 h-10 border-4 border-gray-300 border-t-fashion-accent rounded-full animate-spin z-30 mb-4"></div>
                                        <span className="text-xs font-bold text-gray-600 animate-pulse z-30">生成面部特征...</span>
                                    </div>
                                ) : anchorImage ? (
                                    <img src={`data:image/jpeg;base64,${anchorImage}`} className="w-full h-full object-cover animate-fade-in" />
                                ) : (
                                    <div className="text-gray-300"><CameraLensIcon className="w-12 h-12 opacity-50" /></div>
                                )}
                            </div>
                            {!anchorImage ? (
                                <Button onClick={handleGenerateAnchor} isLoading={isGenerating} className="px-10 py-3 shadow-xl">立即生成头像</Button>
                            ) : (
                                <div className="flex gap-3">
                                    <button onClick={handleGenerateAnchor} className="px-6 py-2 rounded-xl border border-gray-200 text-gray-500 text-xs font-bold hover:bg-gray-50">不满意，重刷</button>
                                    <div className="text-xs text-gray-400 flex items-center">点击下一步配置风格</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 4: STYLE CONFIG */}
                    {step === 4 && (
                        <div className="space-y-8 animate-slide-up max-w-4xl mx-auto w-full pb-10">
                            <div className="text-center mb-6"><h2 className="text-2xl font-bold text-gray-900">配置风格预设包</h2></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><CameraLensIcon className="w-3 h-3" /> 拍摄设备</label>
                                    <div className="flex flex-col gap-2">
                                        {CAMERAS.map(c => (
                                            <button key={c.id} onClick={() => setCamera(c)} className={`flex w-full items-center justify-between p-3 rounded-xl border transition-all ${camera.id === c.id ? 'bg-blue-50 border-fashion-accent text-fashion-accent shadow-sm' : 'bg-transparent border-transparent text-gray-500 hover:bg-gray-50 hover:shadow-sm'}`}>
                                                <span className="text-sm font-bold">{c.label.split('(')[0]}</span><span className="text-[10px] opacity-60 font-normal">{c.desc}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><LightningIcon className="w-3 h-3" /> 光线质感 (Lighting)</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {LIGHTING_OPTIONS.map(l => (
                                            <button key={l.id} onClick={() => setLighting(l)} className={`p-3 rounded-xl text-left border transition-all ${lighting.id === l.id ? 'bg-blue-50 border-fashion-accent shadow-sm' : 'bg-transparent border-transparent hover:bg-gray-50'}`}>
                                                <div className={`text-xs font-bold ${lighting.id === l.id ? 'text-fashion-accent' : 'text-gray-700'}`}>{l.label}</div><div className="text-[9px] text-gray-400 mt-0.5">{l.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            {/* SCENES */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between"><span>适配场景 (Scenes)</span><span className="text-[10px] bg-gray-50 px-2 py-0.5 rounded border border-gray-200 text-gray-500">最多选 5 个</span></label>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                    {SCENE_TAGS.map(s => {
                                        const active = selectedScenes.includes(s.id);
                                        return (
                                            <button key={s.id} onClick={() => toggleSelection(selectedScenes, setSelectedScenes, s.id)} className={`px-2 py-3 rounded-xl text-xs font-medium border transition-all ${active ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-[1.02]' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-200 hover:text-blue-600'}`}>
                                                {s.label}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* MODEL EXPRESSIONS */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
                                    <span>模特表现力 (Vibe Pool)</span>
                                    <span className="text-[10px] bg-gray-50 px-2 py-0.5 rounded border border-gray-200 text-gray-500">AI 将根据衣服风格自动匹配</span>
                                </label>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                    {EXPRESSION_OPTIONS.map(exp => {
                                        const active = selectedExpressions.includes(exp.id);
                                        return (
                                            <button key={exp.id} onClick={() => toggleSelection(selectedExpressions, setSelectedExpressions, exp.id, 8)} className={`px-2 py-3 rounded-xl text-xs font-bold border transition-all ${active ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-200 hover:text-blue-600'}`}>
                                                {exp.label}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-gray-200/50">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><MagicWandIcon className="w-3 h-3" /> 自定义补充 (Optional)</label>
                                <input value={customStyle} onChange={(e) => setCustomStyle(e.target.value)} placeholder="例如：赛博朋克霓虹灯，极简主义水泥风..." className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-fashion-accent focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-gray-300"/>
                            </div>
                        </div>
                    )}

                    {/* STEP 5: SYNTHESIS & REVIEW */}
                    {step === 5 && (
                        <div className="relative flex flex-col items-center justify-center flex-1 w-full max-w-4xl mx-auto h-full">
                            {isSynthesizing ? (
                                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 rounded-2xl border border-gray-100 shadow-sm">
                                    <div className="absolute inset-0 opacity-40 rounded-2xl overflow-hidden"><Silk speed={3} scale={1.5} color="#3370ff" /></div>
                                    <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                                        <div className="w-20 h-20 border-[4px] border-white/50 border-t-fashion-accent rounded-full animate-spin shadow-lg"></div>
                                        <div><h2 className="text-xl font-bold text-gray-900 tracking-wider">AI 总监正在制定拍摄协议...</h2></div>
                                    </div>
                                </div>
                            ) : aiProtocol ? (
                                <div className="w-full flex flex-col md:flex-row gap-8 items-start animate-slide-up h-full justify-center">
                                    <div className="w-full md:w-1/3 shrink-0 flex justify-center">
                                        <div className="aspect-[3/4] w-48 md:w-full rounded-2xl overflow-hidden shadow-xl border-4 border-white transform rotate-[-2deg] relative">
                                            <img src={`data:image/jpeg;base64,${anchorImage}`} className="w-full h-full object-cover" />
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-md p-3">
                                                <div className="text-[10px] text-white/60 uppercase font-bold tracking-widest">Face Anchor</div>
                                                <div className="text-white font-bold text-sm">{ethnicity.label.split('(')[0]}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 w-full bg-white border border-gray-200 rounded-2xl p-6 shadow-lg relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-bl-[4rem] -mr-10 -mt-10 z-0"></div>
                                        <div className="relative z-10 space-y-6">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><span className="w-2 h-6 bg-fashion-accent rounded-full"></span>Style Protocol Generated</h3>
                                                {/* NEW: DISPLAY SUMMARY */}
                                                {aiProtocol.summary && (
                                                    <div className="mt-3 text-sm font-bold text-fashion-accent bg-blue-50 px-4 py-3 rounded-xl border border-blue-100 shadow-sm">
                                                        {aiProtocol.summary}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* PROTOCOL DETAILS GRID */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase">体态数据 (Body Params)</div>
                                                    <div className="text-sm font-bold text-gray-800 mt-1">{isAdvancedMode ? advSettings.bodyShape : simpleBody.label.split('(')[0]}</div>
                                                </div>
                                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase">布光引擎 (Lighting)</div>
                                                    <div className="text-sm font-bold text-gray-800 mt-1">{aiProtocol.lighting.setup}</div>
                                                </div>
                                                
                                                {/* ALLOWED SCENES POOL */}
                                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 col-span-2">
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase flex justify-between">
                                                        <span>允许场景池 (Allowed Scenes)</span>
                                                        <span className="text-blue-500">AI Director 将自动匹配</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {(aiProtocol.allowed_scenes || [aiProtocol.scene_context.environment_type]).map((sc, i) => (
                                                            <span key={i} className="text-[10px] bg-white text-gray-700 px-2 py-1 rounded border border-gray-200 font-medium">
                                                                {sc}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* ALLOWED EXPRESSIONS */}
                                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 col-span-2">
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase">允许表现力 (Allowed Vibes)</div>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {(aiProtocol.allowed_expressions || []).map(exp => (
                                                            <span key={exp} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100 font-bold">
                                                                {exp}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* RAW PROTOCOL TOGGLE */}
                                            <div className="pt-2">
                                                <button 
                                                    onClick={() => setShowRawProtocol(!showRawProtocol)}
                                                    className="text-[10px] text-gray-400 hover:text-fashion-accent underline decoration-dotted underline-offset-2 font-mono"
                                                >
                                                    {showRawProtocol ? 'Hide System Protocol' : 'View System Protocol (Prompt Context)'}
                                                </button>
                                                {showRawProtocol && (
                                                    <div className="mt-2 bg-gray-900 rounded-xl p-4 overflow-x-auto">
                                                        <pre className="text-[9px] text-green-400 font-mono leading-tight whitespace-pre-wrap">
                                                            {JSON.stringify(aiProtocol, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="px-8 py-5 border-t border-gray-100 bg-white flex justify-between items-center shrink-0">
                    <button onClick={handleBack} disabled={step === 1 || isSynthesizing} className="text-gray-400 hover:text-gray-600 font-bold text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-30">上一步</button>
                    {step < 4 ? (
                        <Button onClick={handleNext} disabled={step === 3 && !anchorImage} className="px-8 py-2.5 text-sm shadow-lg">下一步</Button>
                    ) : step === 4 ? (
                        <Button onClick={handleAnalyzeAndSummary} className="px-8 py-2.5 text-sm bg-blue-600 hover:bg-blue-700 shadow-lg">分析并生成协议</Button>
                    ) : (
                        <Button onClick={handleFinish} disabled={isSynthesizing} className="px-8 py-2.5 text-sm bg-green-500 hover:bg-green-600 shadow-green-500/30">确认并创建 Agent</Button>
                    )}
                </div>
            </div>
        </div>
    );
};
