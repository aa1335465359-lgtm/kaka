import React, { useState } from 'react';
import { SmartProfile } from '../../types';
import { generateAnchorImage, generateSmartScenePrompt } from '../../services/geminiService';
import { Button } from '../Button';
import Silk from '../Silk';

// MODEL PRESETS CONFIG
const MODEL_PRESETS = [
    { id: 'asian_elegant', label: '东亚-清冷 (Elegant Asian)', ethnicity: 'East Asian (Chinese)', ageGroup: '20s', bodyType: 'Slim', features: 'Sharp features, clear skin, elegant vibe' },
    { id: 'asian_sweet', label: '东亚-甜美 (Sweet Asian)', ethnicity: 'East Asian (Korean)', ageGroup: '20s', bodyType: 'Average', features: 'Soft features, bright eyes, friendly smile' },
    { id: 'western_chic', label: '欧美-时尚 (Western Chic)', ethnicity: 'Caucasian', ageGroup: '25s', bodyType: 'Athletic', features: 'Defined jawline, blue eyes, confident look' },
    { id: 'latina_curvy', label: '拉美-曲线 (Latina Curvy)', ethnicity: 'Latina', ageGroup: '20s', bodyType: 'Curvy Hourglass', features: 'Tanned skin, voluminous hair, confident' },
    { id: 'black_cool', label: '非裔-酷飒 (Cool Black)', ethnicity: 'Black', ageGroup: '20s', bodyType: 'Tall', features: 'Glowing skin, short hair or braids, high fashion' },
];

interface SmartSetupStepProps {
  onProfileCreated: (profile: SmartProfile) => void;
}

export const SmartSetupStep: React.FC<SmartSetupStepProps> = ({ onProfileCreated }) => {
    const [status, setStatus] = useState<'IDLE' | 'GENERATING_PROMPT' | 'GENERATING_ANCHOR' | 'COMPLETE'>('IDLE');
    const [generatedAnchor, setGeneratedAnchor] = useState<string | null>(null);
    const [generatedPrompt, setGeneratedPrompt] = useState<string>('');

    // User Inputs
    const [scenario, setScenario] = useState('');
    const [style, setStyle] = useState('');
    const [selectedModelId, setSelectedModelId] = useState(MODEL_PRESETS[0].id);

    // Derived
    const selectedModel = MODEL_PRESETS.find(m => m.id === selectedModelId) || MODEL_PRESETS[0];

    const handleGenerate = async () => {
        if (!scenario.trim()) {
            alert("请输入使用场景");
            return;
        }

        try {
            // PHASE 1: Generate Prompt
            setStatus('GENERATING_PROMPT');
            const aiPrompt = await generateSmartScenePrompt(scenario, style);
            setGeneratedPrompt(aiPrompt);

            // PHASE 2: Generate Anchor Image
            setStatus('GENERATING_ANCHOR');
            const b64 = await generateAnchorImage(
                { 
                    ethnicity: selectedModel.ethnicity, 
                    ageGroup: selectedModel.ageGroup, 
                    bodyType: selectedModel.bodyType, 
                    features: selectedModel.features 
                }, 
                aiPrompt
            );
            
            setGeneratedAnchor(b64);
            setStatus('COMPLETE');
        } catch (e) {
            console.error(e);
            alert("生成失败，请重试");
            setStatus('IDLE');
        }
    };

    const handleConfirm = () => {
        if (!generatedAnchor) return;

        const profile: SmartProfile = {
            id: Date.now().toString(),
            name: `${selectedModel.label} @ ${scenario}`,
            market: 'domestic', // Defaulting for simplified flow
            
            // Required Complex Params derived from simple selection
            faceParams: {
                ethnicity: selectedModel.ethnicity,
                ageGroup: selectedModel.ageGroup,
                features: selectedModel.features,
                hairStyle: "Standard",
                hairColor: "Standard",
                skinTone: "Standard",
                makeup: "Standard"
            },
            bodyParams: {
                bodyType: selectedModel.bodyType,
                muscleDefinition: "Standard",
                chest: "Average",
                hips: "Average"
            },

            // Legacy top-level fields for compatibility
            ethnicity: selectedModel.ethnicity,
            bodyType: selectedModel.bodyType,
            ageGroup: selectedModel.ageGroup,
            
            sceneStyle: scenario, // User input term
            sceneDescription: generatedPrompt, // Full AI prompt
            anchorImage: generatedAnchor,
            generatedDate: Date.now()
        };
        onProfileCreated(profile);
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center animate-fade-in relative px-4">
             {/* Background Decoration */}
             <div className="absolute inset-0 -z-10 opacity-30 pointer-events-none">
                 <Silk speed={2} color="#3370ff" />
             </div>

             <div className="w-full max-w-5xl bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/60 flex flex-col md:flex-row min-h-[600px]">
                 
                 {/* LEFT: Configuration Input */}
                 <div className="md:w-1/2 p-10 flex flex-col relative z-10">
                     <div className="space-y-2 mb-8">
                         <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-fashion-accent rounded-full text-[10px] font-bold uppercase tracking-wider">
                             <span>🤖</span> Smart Workflow
                         </div>
                         <h2 className="text-3xl font-bold text-gray-900">定义场景与模特</h2>
                         <p className="text-gray-500 text-sm">AI 将根据您的场景描述自动生成环境，并绑定固定模特。</p>
                     </div>

                     <div className="space-y-6 flex-1">
                         {/* 1. SCENE INPUT */}
                         <div className="space-y-3">
                             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                 STEP 1: 场景与风格
                             </label>
                             <div className="grid grid-cols-2 gap-4">
                                 <div>
                                     <input 
                                        value={scenario}
                                        onChange={e => setScenario(e.target.value)}
                                        placeholder="例如：海边咖啡馆"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-fashion-accent focus:ring-4 focus:ring-blue-500/10 transition-all"
                                     />
                                     <p className="text-[10px] text-gray-400 mt-1 ml-1">使用场景 (必填)</p>
                                 </div>
                                 <div>
                                     <input 
                                        value={style}
                                        onChange={e => setStyle(e.target.value)}
                                        placeholder="例如：温暖，午后阳光"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-fashion-accent focus:ring-4 focus:ring-blue-500/10 transition-all"
                                     />
                                     <p className="text-[10px] text-gray-400 mt-1 ml-1">风格关键词 (选填)</p>
                                 </div>
                             </div>
                         </div>

                         {/* 2. MODEL PRESET */}
                         <div className="space-y-3">
                             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                 STEP 2: 选择固定模特
                             </label>
                             <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 scrollbar-hide">
                                 {MODEL_PRESETS.map((preset) => (
                                     <button
                                         key={preset.id}
                                         onClick={() => setSelectedModelId(preset.id)}
                                         className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all group
                                             ${selectedModelId === preset.id 
                                                 ? 'bg-blue-50 border-fashion-accent shadow-md shadow-blue-500/10' 
                                                 : 'bg-white border-gray-100 hover:border-blue-200 hover:bg-gray-50'
                                             }
                                         `}
                                     >
                                         <div>
                                             <div className={`text-sm font-bold ${selectedModelId === preset.id ? 'text-fashion-accent' : 'text-gray-700'}`}>
                                                 {preset.label}
                                             </div>
                                             <div className="text-[10px] text-gray-400 mt-0.5">
                                                 {preset.features}
                                             </div>
                                         </div>
                                         <div className={`w-4 h-4 rounded-full border flex items-center justify-center
                                             ${selectedModelId === preset.id ? 'border-fashion-accent bg-fashion-accent' : 'border-gray-300'}
                                         `}>
                                             {selectedModelId === preset.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                         </div>
                                     </button>
                                 ))}
                             </div>
                         </div>
                     </div>

                     <div className="pt-6 border-t border-gray-100 mt-6">
                         <Button onClick={handleGenerate} isLoading={status !== 'IDLE' && status !== 'COMPLETE'} className="w-full py-4 shadow-xl shadow-blue-500/20 text-sm tracking-widest">
                             {status === 'IDLE' || status === 'COMPLETE' ? '✨ 生成 AI 场景与锚点' : 
                              status === 'GENERATING_PROMPT' ? '正在编写场景提示词...' : '正在生成模特锚点...'}
                         </Button>
                     </div>
                 </div>

                 {/* RIGHT: Output Preview */}
                 <div className="md:w-1/2 bg-gray-50/50 relative flex flex-col border-l border-gray-100">
                     
                     {/* Prompt Display Area */}
                     <div className="h-1/3 p-6 border-b border-gray-100 bg-white/50 backdrop-blur-sm overflow-y-auto">
                         <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">AI Generated Prompt</h3>
                         {generatedPrompt ? (
                             <p className="text-xs text-gray-600 font-mono leading-relaxed bg-blue-50/50 p-3 rounded-lg border border-blue-100 animate-fade-in">
                                 {generatedPrompt}
                             </p>
                         ) : (
                             <div className="h-full flex items-center justify-center text-gray-300 text-xs italic">
                                 等待生成场景描述...
                             </div>
                         )}
                     </div>

                     {/* Anchor Image Area */}
                     <div className="h-2/3 relative flex items-center justify-center p-6">
                         {status === 'GENERATING_ANCHOR' ? (
                             <div className="text-center space-y-4">
                                 <div className="w-16 h-16 border-4 border-fashion-accent/20 border-t-fashion-accent rounded-full animate-spin mx-auto"></div>
                                 <p className="text-sm font-bold text-gray-500 animate-pulse">正在生成 8K 锚点图...</p>
                             </div>
                         ) : generatedAnchor ? (
                             <div className="relative w-full h-full flex flex-col items-center justify-center animate-fade-in">
                                 <div className="relative rounded-2xl overflow-hidden shadow-2xl border-[4px] border-white max-h-[300px] w-auto aspect-[3/4]">
                                     <img src={`data:image/jpeg;base64,${generatedAnchor}`} className="w-full h-full object-cover" />
                                 </div>
                                 
                                 <div className="mt-6 flex gap-4 w-full max-w-xs animate-slide-up">
                                     <button onClick={handleConfirm} className="w-full py-3 bg-green-500 text-white rounded-xl font-bold shadow-lg shadow-green-500/30 hover:bg-green-600 transition-all flex items-center justify-center gap-2">
                                         <span>🔒</span> 锁定模特并开始生产
                                     </button>
                                 </div>
                             </div>
                         ) : (
                             <div className="text-center text-gray-300 space-y-3">
                                 <div className="text-5xl opacity-20">👤</div>
                                 <p className="text-xs font-bold">锚点图预览区域</p>
                             </div>
                         )}
                     </div>
                 </div>
             </div>
        </div>
    );
};