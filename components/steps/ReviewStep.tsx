
import React, { useState } from 'react';
import { GarmentAnalysis, ModelType, SceneSuggestion, GenerationMode, DepthType, PoseType, GarmentModification, CategoryOverride } from '../../types';
import { SCENE_CONFIG, MODEL_CONFIG, DEPTH_CONFIG, POSE_CONFIG, SceneConfig } from '../../services/promptConfig';
import { ArrowRightIcon } from '../Icons';
import { Button } from '../Button';
import ElasticSlider from '../UI/ElasticSlider';
import { CustomSelect } from '../UI/CustomSelect';
import Silk from '../Silk';

interface ReviewStepProps {
  isLoading?: boolean;
  originalImage: string;
  backImage: string | null; // NEW PROP
  analysis: GarmentAnalysis | null;
  modelType: ModelType;
  poseType: PoseType;
  depthLevel: DepthType;
  aspectRatio: string;
  aiFeelValue: number;
  flowValue: number;
  stylePrompt: string;
  sceneSuggestions: SceneSuggestion[];
  selectedSceneId: string | null;
  generationMode: GenerationMode;
  ignoreModel: boolean;
  showDnaDetails: boolean;
  categoryOverride: CategoryOverride;
  
  // Setters
  setModelType: (t: ModelType) => void;
  setPoseType: (p: PoseType) => void;
  setDepthLevel: (d: DepthType) => void;
  setAspectRatio: (r: string) => void;
  setAiFeelValue: (v: number) => void;
  setFlowValue: (v: number) => void;
  setStylePrompt: (s: string) => void;
  setSelectedSceneId: (id: string | null) => void;
  setGenerationMode: (m: GenerationMode) => void;
  setIgnoreModel: (b: boolean) => void;
  setShowDnaDetails: (b: boolean) => void;
  setCategoryOverride: (c: CategoryOverride) => void;
  
  // Actions
  onGenerate: (modification?: GarmentModification | null) => void;
}

export const ReviewStep: React.FC<ReviewStepProps> = (props) => {
  const {
    isLoading = false,
    originalImage, backImage, analysis, modelType, poseType, depthLevel, aspectRatio,
    aiFeelValue, flowValue, stylePrompt, sceneSuggestions, selectedSceneId,
    generationMode, ignoreModel, showDnaDetails, categoryOverride,
    setModelType, setPoseType, setDepthLevel, setAspectRatio,
    setAiFeelValue, setFlowValue, setStylePrompt, setSelectedSceneId,
    setGenerationMode, setIgnoreModel, setShowDnaDetails, setCategoryOverride, onGenerate
  } = props;

  const [showGuGuModal, setShowGuGuModal] = useState(false);
  const [showStableWarning, setShowStableWarning] = useState(false);
  
  // Constants
  const scenePresets = Object.values(SCENE_CONFIG);
  const modelOptions = Object.values(MODEL_CONFIG);
  const poseOptions = Object.values(POSE_CONFIG);
  const aspectRatioOptions = ['3:4', '4:3', '1:1', '9:16'].map(r => ({ value: r, label: r }));
  const depthOptions = Object.values(DEPTH_CONFIG).map(d => ({ value: d.id, label: d.label }));

  // Handlers
  const handleModelSelect = (type: string) => {
    const config = MODEL_CONFIG[type];
    if (config?.isGuGuStyle) {
      setShowGuGuModal(true);
    } else {
      setModelType(type);
      if (stylePrompt.includes("咕咕风")) {
        setStylePrompt("");
      }
    }
  };

  const confirmGuGu = () => {
    setModelType('gugu');
    setShowGuGuModal(false);
    setAiFeelValue(15);
    setFlowValue(0);
    setAspectRatio('3:4');
    setStylePrompt("【咕咕风模式: 对镜自拍】(GuGu Style Mirror Selfie). 这是一个极其真实的对镜自拍。");
  };

  const handleSceneSelect = (preset: SceneConfig) => {
    if (modelType === 'gugu') return;
    setStylePrompt(preset.prompt);
    setSelectedSceneId(preset.id);
  };

  const handleAiSceneSelect = (suggestion: SceneSuggestion) => {
    if (modelType === 'gugu') return;
    setStylePrompt(suggestion.description);
    setSelectedSceneId(suggestion.id);
  };

  const handleStableModeClick = () => {
      if (generationMode === 'stable') return;
      setShowStableWarning(true);
  };

  const confirmStableMode = () => {
      setGenerationMode('stable');
      setShowStableWarning(false);
  };

  const handleGenerateClick = () => {
      onGenerate(null);
  };

  return (
    <div className="relative w-full h-[calc(100vh-140px)]">
      
      {/* Loading Overlay */}
      <div 
        className={`absolute inset-0 rounded-[2rem] overflow-hidden flex flex-col items-center justify-center transition-all duration-700 ease-out 
        ${isLoading ? 'opacity-100 z-50 pointer-events-auto' : 'opacity-0 -z-10 pointer-events-none scale-105'}`}
      >
          <div className="absolute inset-0 bg-white">
             <Silk speed={4} scale={1} color="#3370ff" noiseIntensity={1.2} />
             <div className="absolute inset-0 backdrop-blur-[2px] bg-white/5"></div>
          </div>
          <div className="relative z-10 flex flex-col items-center text-center space-y-8 p-10 animate-fade-in">
              <h3 className="text-3xl md:text-5xl font-bold text-white tracking-widest uppercase animate-pulse drop-shadow-2xl leading-relaxed">
                  正在提取服装特性中...
              </h3>
              <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 border-[3px] border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span className="text-xs text-white/50 font-mono tracking-[0.2em] uppercase">AI Analysis V2.0</span>
              </div>
          </div>
      </div>

      <div className={`flex flex-col md:flex-row gap-6 h-full transition-all duration-700 ease-out transform ${isLoading ? 'opacity-0 translate-y-8 scale-[0.98]' : 'opacity-100 translate-y-0 scale-100'}`}>
        
        {/* Modals... (Keep existing GuGu/Stable modals) */}
        {showGuGuModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
            <div className="bg-white border border-white/50 rounded-[2rem] p-8 max-w-sm w-full shadow-2xl">
              <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-12 h-12 bg-fashion-accent/10 rounded-full flex items-center justify-center text-2xl">📸</div>
                  <h3 className="text-xl font-bold text-gray-900">进入咕咕风模式</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">此模式专为<b>人台图</b>或<b>挂拍平铺图</b>设计。<br/>AI将自动生成极其逼真的<b>对镜自拍</b>效果。</p>
                  <div className="flex gap-3 w-full pt-4">
                    <button onClick={() => setShowGuGuModal(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold transition-colors">取消</button>
                    <button onClick={confirmGuGu} className="flex-1 py-3 rounded-xl bg-fashion-accent text-white font-bold hover:bg-blue-600 shadow-lg shadow-blue-500/30 text-xs transition-all">确认开启</button>
                  </div>
              </div>
            </div>
          </div>
        )}
        {showStableWarning && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
                <div className="bg-white border border-white/50 rounded-[2rem] p-8 max-w-sm w-full shadow-2xl">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center text-2xl">🛡️</div>
                        <h3 className="text-xl font-bold text-gray-900">开启稳定模式 (PRO)</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">此模式将启用 <b>AI 质检员</b>，自动检测并修复画面细节错误。</p>
                        <div className="flex gap-3 w-full pt-2">
                            <button onClick={() => setShowStableWarning(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold transition-colors">取消</button>
                            <button onClick={confirmStableMode} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold hover:shadow-lg hover:shadow-amber-500/30 text-xs transition-all">确认开启</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* LEFT COLUMN: IMAGE PREVIEW */}
        <div className="md:w-5/12 relative rounded-[2rem] overflow-hidden bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group flex flex-col z-0">
            <div className="relative flex-1 flex items-center justify-center bg-gray-50/50 p-6">
                <img src={originalImage} alt="Original" className="max-w-full max-h-full object-contain drop-shadow-xl" />
                
                {/* Back Image Indicator - Small floating card */}
                {backImage && (
                    <div className="absolute top-5 left-5 w-16 h-20 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden group/back cursor-pointer transition-transform hover:scale-110">
                        <img src={backImage} className="w-full h-full object-cover opacity-80" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-[8px] text-white font-bold">
                            背面
                        </div>
                    </div>
                )}
            </div>
            
            <div className="absolute top-5 right-5 flex justify-end">
                <div className="bg-white/80 backdrop-blur-md rounded-full pl-4 pr-1 py-1.5 border border-white/50 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                    <span className="text-[10px] font-bold tracking-wide text-gray-700">忽略原图模特</span>
                    <button onClick={() => setIgnoreModel(!ignoreModel)} className={`w-10 h-6 rounded-full p-1 transition-all duration-300 focus:outline-none ${ignoreModel ? 'bg-fashion-accent' : 'bg-gray-200'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${ignoreModel ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                </div>
            </div>

            <div className={`absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-xl border-t border-white/10 transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col`} style={{ transform: showDnaDetails ? 'translateY(0)' : 'translateY(calc(100% - 68px))', height: '70%' }}>
                <div className="px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setShowDnaDetails(!showDnaDetails)}>
                    <div>
                        <h3 className="text-sm font-bold text-white drop-shadow-md truncate max-w-[200px]">{analysis?.productTitle || "服装分析结果"}</h3>
                        <div className="flex items-center gap-2 text-[10px] text-white/70 font-medium tracking-wider mt-1"><span>点击查看完整 DNA 报告</span></div>
                    </div>
                    <div className="text-white/80 bg-white/10 rounded-full p-2 backdrop-blur-md border border-white/10">
                        <ArrowRightIcon className={`w-4 h-4 transition-transform duration-500 ${showDnaDetails ? 'rotate-90' : '-rotate-90'}`} />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-hide">
                    {analysis && (
                      <div className="space-y-4 pt-2">
                          <div className="flex flex-wrap gap-2">
                              <span className="text-[10px] text-white/60 border border-white/20 px-2 py-1 rounded bg-white/5">面料: {analysis.fabricType}</span>
                              <span className="text-[10px] text-white/60 border border-white/20 px-2 py-1 rounded bg-white/5">剪裁: {analysis.cutAndFit}</span>
                          </div>
                          <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                              <p className="text-[10px] uppercase tracking-widest text-fashion-accent font-bold mb-2">技术细节分析</p>
                              <p className="text-xs leading-relaxed text-gray-200 text-justify">{analysis.technicalDescription}</p>
                          </div>
                      </div>
                    )}
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: CONFIGURATION */}
        <div className="flex-1 flex flex-col h-full bg-white/70 backdrop-blur-xl border border-white/60 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden z-0">
          
          <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide space-y-8 min-h-0">
              
                {/* STANDARD MODE UI */}
                <div className="space-y-3">
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold ml-1 flex items-center gap-2">
                        01 场景选择 <span className="h-px bg-gray-200 flex-1"></span>
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {sceneSuggestions.map((scene) => (
                            <button key={scene.id} onClick={() => handleAiSceneSelect(scene)} disabled={modelType === 'gugu'} className={`group relative p-3 rounded-2xl border text-left transition-all h-full ${selectedSceneId === scene.id ? 'bg-fashion-accent text-white border-fashion-accent shadow-lg shadow-blue-500/20' : 'bg-white text-gray-600 border-white hover:border-blue-200 hover:shadow-md'} ${modelType === 'gugu' ? 'opacity-40 cursor-not-allowed' : ''}`}>
                                <span className="text-xs font-bold block mb-1 truncate">{scene.title}</span>
                                <span className="text-[9px] opacity-70 line-clamp-2 leading-tight">{scene.description}</span>
                            </button>
                        ))}
                        {scenePresets.map((preset) => (
                            <button key={preset.id} onClick={() => handleSceneSelect(preset)} disabled={modelType === 'gugu'} className={`px-3 py-3 rounded-2xl border text-xs font-bold transition-all truncate shadow-sm hover:scale-[1.02] ${modelType === 'gugu' ? 'opacity-40 cursor-not-allowed' : ''} ${selectedSceneId === preset.id ? 'bg-fashion-accent text-white border-fashion-accent shadow-lg shadow-blue-500/20' : 'bg-white text-gray-600 border-white hover:border-blue-200 hover:shadow-md'}`}>
                                {preset.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold ml-1 flex items-center gap-2">02 模特选择 <span className="h-px bg-gray-200 flex-1"></span></label>
                    <div className="flex gap-3 overflow-x-auto pb-4 pt-1 px-1 scrollbar-hide snap-x">
                        {modelOptions.map((opt) => (
                            <button key={opt.id} onClick={() => handleModelSelect(opt.id)} className={`snap-start shrink-0 px-5 py-3 rounded-xl border text-xs font-bold whitespace-nowrap transition-all shadow-sm ${modelType === opt.id ? 'bg-fashion-accent text-white border-fashion-accent shadow-lg shadow-blue-500/20 scale-[1.02]' : 'bg-white text-gray-600 border-white hover:shadow-md hover:border-blue-200'}`}>{opt.label}</button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold ml-1">姿态 (Pose)</label>
                        <div className="flex flex-wrap gap-2">
                            {poseOptions.map((opt) => (
                            <button key={opt.id} disabled={modelType === 'gugu'} onClick={() => setPoseType(opt.id as PoseType)} className={`px-3 py-2 rounded-lg text-[10px] font-bold border transition-all ${modelType === 'gugu' ? 'opacity-40 cursor-not-allowed' : ''} ${poseType === opt.id ? 'bg-fashion-accent/10 text-fashion-accent border-fashion-accent/20' : 'bg-white border-transparent text-gray-500 hover:border-gray-200'}`}>{opt.label.split('(')[0]}</button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold ml-1">比例与景深</label>
                        <div className="flex gap-3">
                            <div className="w-1/3"><CustomSelect value={aspectRatio} onChange={setAspectRatio} options={aspectRatioOptions} disabled={modelType === 'gugu'} /></div>
                            <div className="w-2/3"><CustomSelect value={depthLevel} onChange={(val) => setDepthLevel(val as DepthType)} options={depthOptions} /></div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-100/80 backdrop-blur-sm rounded-2xl p-5 border border-white/50 shadow-inner space-y-7">
                    <div className="space-y-3">
                        <div className="flex justify-between items-end px-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Raw (原图)</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pro (大片)</span>
                        </div>
                        <ElasticSlider value={aiFeelValue} onChange={setAiFeelValue} min={0} max={100} />
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">动态风感 (FLOW)</span>
                            <span className="text-xs font-mono font-bold text-fashion-accent bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{flowValue}%</span>
                        </div>
                        <ElasticSlider value={flowValue} onChange={setFlowValue} min={0} max={100} />
                    </div>
                </div>

                {/* --- NEW: MANUAL CATEGORY CORRECTION --- */}
                <div className="bg-white/50 backdrop-blur-sm rounded-xl px-4 py-3 border border-gray-100 flex items-center justify-between shadow-sm">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                       <span className="text-lg leading-none">🛠️</span> 辅助修正
                    </span>
                    <div className="flex bg-white rounded-lg border border-gray-200 p-1 gap-1">
                        {[
                            { id: 'auto', label: '自动识别' },
                            { id: 'top', label: '强制上衣 (配裤)' },
                            { id: 'dress', label: '强制裙装 (露腿)' },
                            { id: 'outerwear', label: '强制外套 (内搭)' }
                        ].map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => setCategoryOverride(opt.id as CategoryOverride)}
                                className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold transition-all
                                    ${categoryOverride === opt.id 
                                        ? 'bg-fashion-accent text-white shadow-sm' 
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                    }
                                `}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
              
          </div>

          {/* FOOTER ACTIONS */}
          <div className="p-5 border-t border-white/50 bg-white/95 space-y-4">
              <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">生成协议</span>
                  <div className="flex bg-gray-100/50 p-1 rounded-lg border border-white/50 w-64 max-w-full">
                      <button 
                        onClick={() => setGenerationMode('standard')}
                        className={`w-1/2 py-1.5 rounded-md text-[10px] font-bold transition-all uppercase tracking-wide flex justify-center items-center
                            ${generationMode === 'standard' ? 'bg-white text-fashion-accent shadow-sm' : 'text-gray-400 hover:text-gray-600'}
                        `}
                      >
                          标准模式
                      </button>
                      <button 
                        onClick={handleStableModeClick}
                        className={`w-1/2 py-1.5 rounded-md text-[10px] font-bold transition-all uppercase tracking-wide flex justify-center items-center gap-1.5 relative
                            ${generationMode === 'stable' 
                                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-md shadow-amber-500/30' 
                                : 'text-gray-400 hover:text-gray-600'}
                        `}
                      >
                          稳定模式
                          {generationMode === 'stable' && (
                             <span className="absolute -top-1 -right-1 flex h-2 w-2">
                               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                               <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                             </span>
                          )}
                          <span className={`text-[8px] px-1 rounded-sm font-extrabold tracking-wider ml-1
                              ${generationMode === 'stable' ? 'bg-white text-amber-600' : 'bg-gray-200 text-gray-400'}
                          `}>PRO</span>
                      </button>
                  </div>
              </div>
              
              <Button 
                  onClick={handleGenerateClick} 
                  disabled={!stylePrompt.trim()} 
                  className={`w-full py-4 text-sm tracking-widest font-bold shadow-xl transition-all
                      ${generationMode === 'stable' 
                            ? 'shadow-amber-500/20 hover:shadow-amber-500/30 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700' 
                            : 'shadow-blue-500/20 hover:shadow-blue-500/30'
                      }
                  `}
              >
                  {generationMode === 'stable' ? '开始稳定生成' : '立即生成'}
              </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
