
import React, { useState, useEffect } from 'react';
import { GeneratedVariation, ViewType } from '../../types';
import { Button } from '../Button';
import { ArrowRightIcon, MagicWandIcon } from '../Icons';
import Silk from '../Silk';

interface ResultStepProps {
  isLoading?: boolean;
  loadingMessage?: string[]; // New prop for dynamic messages
  generatedImage: string | null;
  variations: GeneratedVariation[];
  aspectRatio: string;
  aiFeelValue: number;
  flowValue: number;
  variationLoadings: Record<string, boolean>;
  
  // Setters
  setGeneratedImage: (img: string) => void;
  setAiFeelValue: (v: number) => void;
  setFlowValue: (v: number) => void;
  onBack: () => void;
  onReRoll: () => void;
  onVariation: (type: ViewType) => void;
  onBatchVariation: () => void;
  onUseForBackground?: () => void;
}

export const ResultStep: React.FC<ResultStepProps> = ({
  isLoading = false,
  loadingMessage,
  generatedImage, variations, aspectRatio, aiFeelValue, flowValue, variationLoadings,
  setGeneratedImage, setAiFeelValue, setFlowValue, onBack, onReRoll, onVariation, onBatchVariation, onUseForBackground
}) => {
  
  // Message Cycling Logic for consistency with LoadingScreen
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (!loadingMessage || loadingMessage.length <= 1) return;
    const interval = setInterval(() => {
        // Cycle through messages excluding the first one (title)
        setMsgIndex((prev) => (prev + 1) % (loadingMessage.length - 1));
    }, 2500);
    return () => clearInterval(interval);
  }, [loadingMessage]);

  const title = loadingMessage && loadingMessage.length > 0 ? loadingMessage[0] : "高保真渲染中...";
  const subtitle = loadingMessage && loadingMessage.length > 1 ? loadingMessage[msgIndex + 1] : null;

  return (
    <div className="relative pb-12 w-full">
      
      {/* --- FULL PAGE LOADING OVERLAY WITH SILK BACKGROUND --- */}
      <div 
        className={`absolute inset-0 rounded-[2.5rem] overflow-hidden flex flex-col items-center justify-center transition-all duration-700 ease-out shadow-[0_20px_50px_rgba(0,0,0,0.05)] bg-white
        ${isLoading ? 'opacity-100 z-50 pointer-events-auto min-h-[80vh]' : 'opacity-0 -z-10 pointer-events-none scale-110 min-h-0 h-0'}`}
      >
          {/* Background Silk Layer */}
          <div className="absolute inset-0 bg-white">
             <Silk speed={3} scale={1.2} color="#3370ff" noiseIntensity={0.8} />
             {/* Subtle Blur Overlay */}
             <div className="absolute inset-0 backdrop-blur-[2px] bg-white/5"></div>
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-6 p-8">
               
               <div className="flex flex-col items-center gap-2">
                 <h3 className="text-2xl md:text-3xl font-bold text-white tracking-widest uppercase animate-pulse drop-shadow-lg leading-relaxed">
                     {title}
                 </h3>
                 <span className="text-[10px] text-white/60 font-mono tracking-[0.2em] uppercase">8K Textures</span>
              </div>
              
              {/* Spinner */}
              <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin drop-shadow-md"></div>

              {/* Secondary Message - No Pill, Direct on Background */}
              {subtitle && (
                  <div className="text-sm text-white/90 font-medium tracking-wide animate-fade-in px-4 py-1.5">
                    {subtitle}
                  </div>
              )}
          </div>
      </div>


      {/* --- MAIN CONTENT (Reveals when loading finishes) --- */}
      <div className={`transition-all duration-1000 ease-out transform ${isLoading ? 'opacity-0 translate-y-8 scale-[0.98]' : 'opacity-100 translate-y-0 scale-100'}`}>
        
        <div className="flex justify-between items-center mb-6 px-2">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">最终成片</h2>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> 已自动保存至作品集
            </p>
          </div>
          <div className="flex gap-3">
            {onUseForBackground && (
                <Button onClick={onUseForBackground} disabled={isLoading} className="px-5 py-2 text-xs rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40">
                    <MagicWandIcon className="w-3 h-3 mr-1" /> 以此图为基础去改背景
                </Button>
            )}
            <Button variant="secondary" onClick={onBack} disabled={isLoading} className="px-5 py-2 text-xs rounded-xl border border-gray-200 hover:border-gray-300">
              <ArrowRightIcon className="rotate-180 w-3 h-3" /> 返回编辑
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Result */}
          <div className="lg:col-span-8 flex items-center justify-center min-h-[60vh] bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-gray-100 p-6 relative group transition-all duration-500">
                  <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none rounded-[2.5rem]"></div>
                  {generatedImage && (
                    <img 
                      src={generatedImage} 
                      alt="Generated" 
                      className="rounded-[1.5rem] shadow-2xl shadow-gray-200 max-h-[75vh] w-auto max-w-full object-cover transition-transform duration-500 animate-fade-in"
                      style={{ aspectRatio: aspectRatio.replace(':', '/') }}
                    />
                  )}
          </div>

          {/* Sidebar Controls */}
          <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* Refine Panel */}
              <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 space-y-5 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">实时调整</h3>
                    <button onClick={onReRoll} disabled={isLoading} className="text-[10px] text-fashion-accent bg-blue-50 px-3 py-1 rounded-full hover:bg-fashion-accent hover:text-white transition-all font-bold">
                      ↻ 重新生成
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase">
                          <span>艺术感</span>
                          <span>{aiFeelValue}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={aiFeelValue} 
                          disabled={isLoading}
                          onChange={(e) => setAiFeelValue(Number(e.target.value))}
                          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-fashion-accent"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase">
                          <span>动态风感</span>
                          <span>{flowValue}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={flowValue} 
                          disabled={isLoading}
                          onChange={(e) => setFlowValue(Number(e.target.value))}
                          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-fashion-accent"
                        />
                    </div>
                  </div>
              </div>

              {/* Variations Panel */}
              <div className="bg-white/50 backdrop-blur-md border border-white/50 rounded-[2rem] p-6 shadow-sm flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">视角变体</h3>
                    <button 
                        onClick={onBatchVariation}
                        disabled={isLoading}
                        className="text-[10px] bg-gradient-to-r from-fashion-accent to-blue-500 text-white font-bold px-3 py-1.5 rounded-full shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <MagicWandIcon className="w-3 h-3" /> 批量生成
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                    {[
                      {id: 'back', label: '背面'}, 
                      {id: 'side', label: '侧面'}, 
                      {id: 'upper', label: '半身'}, 
                      {id: 'detail', label: '细节'}
                    ].map((v) => (
                        <button 
                        key={v.id}
                        onClick={() => onVariation(v.id as ViewType)} 
                        disabled={variationLoadings[v.id] || isLoading}
                        className="relative p-3 rounded-xl bg-white hover:bg-gray-50 border border-gray-100 hover:border-blue-200 transition-all text-[10px] font-bold text-gray-700 shadow-sm active:scale-95 text-left flex justify-between items-center group disabled:opacity-50"
                        >
                        <span>{v.label}</span>
                        {variationLoadings[v.id] ? (
                            <span className="animate-spin h-3 w-3 border-2 border-fashion-accent border-t-transparent rounded-full"></span>
                        ) : (
                            <span className="opacity-0 group-hover:opacity-100 text-fashion-accent transition-opacity">→</span>
                        )}
                        </button>
                    ))}
                </div>
                
                {/* Gallery */}
                <div className="flex-1 overflow-y-auto max-h-[300px] scrollbar-hide grid grid-cols-2 gap-3 pb-2">
                  {variations.map((v) => (
                        <div 
                            key={v.id} 
                            className="relative rounded-xl overflow-hidden border border-white/60 bg-white shadow-sm hover:shadow-lg animate-fade-in group cursor-pointer transition-all duration-300 hover:scale-[1.02]" 
                            style={{ aspectRatio: aspectRatio.replace(':', '/') }}
                            onClick={() => setGeneratedImage(v.imageUrl)}
                          >
                            <img src={v.imageUrl} className="w-full h-full object-cover" />
                            <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[8px] text-white uppercase font-bold tracking-wider">
                              {v.label || v.type}
                            </div>
                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ))}
                </div>
              </div>
          </div>
        </div>
      </div>

    </div>
  );
};
