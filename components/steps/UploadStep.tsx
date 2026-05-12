
import React, { useState, useEffect } from 'react';
import { UploadIcon, ArrowRightIcon, MagicWandIcon, CameraLensIcon } from '../Icons';
import { Button } from '../Button';
import { AppMode } from '../../types';

interface UploadStepProps {
  originalImage: string | null;
  backImage: string | null;
  isPreprocessEnabled: boolean;
  isPreprocessing: boolean;
  appMode: AppMode;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBackImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveBackImage: () => void;
  onBatchUpload: (files: FileList) => void;
  onTogglePreprocess: () => void;
  onAnalyze: () => void;
}

export const UploadStep: React.FC<UploadStepProps> = ({
  originalImage,
  backImage,
  isPreprocessEnabled,
  isPreprocessing,
  appMode,
  onFileUpload,
  onBackImageUpload,
  onRemoveBackImage,
  onBatchUpload,
  onTogglePreprocess,
  onAnalyze
}) => {
  // Local state to control the split animation. 
  // Syncs with backImage prop but allows UI to "open" the slot before upload.
  const [showBackSlot, setShowBackSlot] = useState(false);

  useEffect(() => {
    if (backImage) setShowBackSlot(true);
  }, [backImage]);

  const handleRemoveBack = (e: React.MouseEvent) => {
      e.stopPropagation();
      onRemoveBackImage();
      setShowBackSlot(false);
  };

  const handleOpenBackSlot = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowBackSlot(true);
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back') => {
    if (appMode === 'batch') {
        if (event.target.files && event.target.files.length > 0) {
            if (event.target.files.length > 5) {
                alert("批量模式最多支持一次上传 5 张图片");
                return;
            }
            onBatchUpload(event.target.files);
        }
    } else {
        if (type === 'front') {
            onFileUpload(event);
        } else {
            onBackImageUpload(event);
        }
    }
  };

  // --- Sub-Components ---

  const UploadTrigger = ({ label, subLabel, mini = false }: { label: string, subLabel?: string, mini?: boolean }) => (
    <div className={`flex flex-col items-center ${mini ? 'gap-4' : 'gap-6'} text-center transition-all duration-300 group-hover:scale-105 pointer-events-none`}>
        <div className={`${mini ? 'w-12 h-12 rounded-2xl shadow-[0_10px_25px_rgba(51,112,255,0.05)]' : 'w-24 h-24 rounded-[2rem] shadow-[0_20px_40px_rgba(51,112,255,0.1)]'} flex items-center justify-center border bg-gradient-to-tr from-blue-50 to-white text-fashion-accent border-white/60`}>
            <UploadIcon className={`${mini ? 'w-5 h-5' : 'w-10 h-10'}`} />
        </div>
        <div className={`${mini ? 'space-y-1' : 'space-y-2'}`}>
            <span className={`block font-bold tracking-wider text-gray-800 ${mini ? 'text-sm' : 'text-2xl'}`}>
                {label}
            </span>
            {subLabel && <span className={`block font-medium px-4 ${mini ? 'text-xs text-gray-400' : 'text-sm text-gray-500'}`}>{subLabel}</span>}
        </div>
    </div>
  );

  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-[70vh] animate-fade-in w-full">
        
        {/* 1. Main Stage Container (Fixed Limit Frame) */}
        <div className="relative w-full max-w-5xl aspect-[16/10] min-h-[500px] bg-white/40 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/60 overflow-hidden flex transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group/container">
            
            {/* --- SINGLE VS BATCH CONTENT SWITCH --- */}
            
            {appMode !== 'batch' ? (
                <>
                    {/* === LEFT PANEL (FRONT) === */}
                    <div className={`relative h-full transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col items-center justify-center 
                        ${showBackSlot ? 'w-1/2 border-r border-white/20' : 'w-full'}`}
                    >
                        {/* A. Empty State (Front) */}
                        {!originalImage && (
                            <div className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-white/40 transition-colors group">
                                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'front')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                <UploadTrigger label="上传正面图 (Required)" subLabel="支持高清平铺、人台或模特图" />
                            </div>
                        )}

                        {/* B. Preview State (Front) */}
                        {originalImage && (
                            <div className="relative w-full h-full p-6 flex items-center justify-center group/preview">
                                {/* Image */}
                                <img src={originalImage} className="max-w-full max-h-full object-contain drop-shadow-xl" />
                                
                                {/* Hover: Change Image */}
                                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="relative">
                                        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'front')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                        <button className="bg-white/90 backdrop-blur text-gray-800 px-4 py-2 rounded-full text-xs font-bold shadow-lg transform translate-y-4 group-hover/preview:translate-y-0 transition-all">
                                            更换图片
                                        </button>
                                    </div>
                                </div>

                                {/* ADD BACK VIEW TRIGGER (Only visible if split is NOT active) */}
                                {!showBackSlot && (
                                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
                                        <button 
                                            onClick={handleOpenBackSlot}
                                            className="group/btn flex items-center gap-2 px-6 py-3 bg-white/90 text-fashion-accent hover:bg-white rounded-full shadow-lg border border-white/50 transition-all hover:scale-105 active:scale-95"
                                        >
                                            <span className="w-5 h-5 rounded-full bg-fashion-accent/10 flex items-center justify-center text-sm font-bold leading-none">
                                                +
                                            </span>
                                            <span className="text-xs font-bold">
                                                上传背面 (可选)
                                            </span>
                                        </button>
                                    </div>
                                )}

                                {/* SMART MANNEQUIN TOGGLE (Floating Pill) */}
                                <div className={`absolute top-6 left-6 z-20 transition-all duration-500 ${showBackSlot ? 'opacity-0 pointer-events-none scale-90' : 'opacity-100 scale-100'}`}>
                                    <div 
                                        onClick={onTogglePreprocess}
                                        className="flex items-center gap-2 bg-white/60 hover:bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/50 cursor-pointer transition-colors select-none shadow-sm"
                                    >
                                        <div className={`w-2 h-2 rounded-full ${isPreprocessEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                                        <span className={`text-[10px] font-bold ${isPreprocessEnabled ? 'text-gray-800' : 'text-gray-500'}`}>智能人台处理</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* === RIGHT PANEL (BACK) === */}
                    <div className={`relative h-full transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] bg-white/30 backdrop-blur-md overflow-hidden flex flex-col items-center justify-center
                        ${showBackSlot ? 'w-1/2 opacity-100' : 'w-0 opacity-0'}`}
                    >
                         {/* Close Button */}
                         <button 
                            onClick={handleRemoveBack}
                            className="absolute top-4 right-4 z-30 w-8 h-8 flex items-center justify-center rounded-full bg-white/50 hover:bg-white text-gray-500 hover:text-red-500 transition-colors"
                        >
                            ✕
                        </button>

                         {/* A. Empty State (Back) */}
                         {!backImage && (
                            <div className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-white/40 transition-colors group min-w-[300px]">
                                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'back')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                <UploadTrigger label="背面视角" subLabel="补充背面细节，提升一致性" mini={true} />
                            </div>
                         )}

                         {/* B. Preview State (Back) */}
                         {backImage && (
                             <div className="relative w-full h-full p-6 flex items-center justify-center group/preview">
                                <img src={backImage} className="max-w-full max-h-full object-contain drop-shadow-xl opacity-90 mix-blend-multiply" />
                                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="relative">
                                        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'back')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                        <button className="bg-white/90 backdrop-blur text-gray-800 px-4 py-2 rounded-full text-xs font-bold shadow-lg transform translate-y-4 group-hover/preview:translate-y-0 transition-all">
                                            更换背面
                                        </button>
                                    </div>
                                </div>
                             </div>
                         )}
                    </div>
                </>
            ) : (
                // --- BATCH MODE CONTENT ---
                <div className="w-full h-full flex items-center justify-center relative group">
                    <input 
                        type="file" 
                        accept="image/*" 
                        multiple={true}
                        onChange={(e) => handleFileChange(e, 'front')} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    />
                    <div className="text-center space-y-6 pointer-events-none group-hover:scale-105 transition-transform duration-500">
                         <div className="w-24 h-24 mx-auto rounded-[2rem] flex items-center justify-center shadow-[0_20px_40px_rgba(51,112,255,0.1)] border bg-white text-fashion-accent border-white/60">
                            <div className="grid grid-cols-2 gap-1 p-5">
                                <div className="w-3 h-3 rounded-full bg-current opacity-40"></div>
                                <div className="w-3 h-3 rounded-full bg-current opacity-60"></div>
                                <div className="w-3 h-3 rounded-full bg-current opacity-80"></div>
                                <div className="w-3 h-3 rounded-full bg-current"></div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-gray-800">批量上传工作流</h3>
                            <p className="text-sm text-gray-500">拖入或选择多张图片 (JPG/PNG)</p>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* 2. Action Bar (Below Frame - Single Mode Only) */}
        {appMode !== 'batch' && originalImage && (
            <div className="w-full max-w-5xl mt-8 flex justify-center animate-slide-up">
                <Button 
                    onClick={onAnalyze} 
                    className={`w-full md:w-1/2 h-16 text-lg shadow-xl hover:scale-[1.02] rounded-2xl border-none ring-1 ring-white/20 transition-all duration-500
                        ${appMode === 'design' 
                            ? 'bg-fashion-accent hover:bg-blue-600 shadow-blue-500/30' 
                            : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-purple-500/30'
                        }
                    `} 
                    isLoading={isPreprocessing}
                >
                    {isPreprocessing ? "正在预处理..." : 
                    <>
                        开始分析 <ArrowRightIcon className="ml-2 w-5 h-5" />
                    </>
                    }
                </Button>
            </div>
        )}
    </div>
  );
};
