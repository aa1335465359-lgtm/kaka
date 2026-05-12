
import React from 'react';
import { CameraLensIcon, MagicWandIcon } from '../Icons';

interface ModeSelectionStepProps {
  originalImage: string;
  onSelectMode: (mode: 'review' | 'design') => void;
}

export const ModeSelectionStep: React.FC<ModeSelectionStepProps> = ({ originalImage, onSelectMode }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full animate-fade-in px-4">
      
      <div className="mb-10 text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">选择工作流</h2>
        <p className="text-gray-500 text-sm">AI 已完成 DNA 分析，请选择您想要进行的操作</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Card 1: Photography */}
        <div onClick={() => onSelectMode('review')} className="group cursor-pointer">
           <div className="w-full h-full rounded-[32px] bg-white/60 backdrop-blur-[20px] border border-white/60 shadow-[0_10px_40px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_50px_rgba(51,112,255,0.15)] transition-all duration-300 group-hover:-translate-y-2">
               <div className="p-8 flex flex-col h-full min-h-[280px]">
                   <div className="w-16 h-16 rounded-2xl bg-blue-50 text-fashion-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                       <CameraLensIcon className="w-8 h-8" />
                   </div>
                   <h3 className="text-xl font-bold text-gray-800 mb-2">商业摄影 (Photography)</h3>
                   <p className="text-sm text-gray-500 leading-relaxed">
                       保留原衣版型与设计，更换模特、场景和光影。适用于电商上新、Lookbook 拍摄。
                   </p>
                   <div className="mt-auto pt-6 flex items-center text-xs font-bold text-fashion-accent">
                       进入摄影棚 <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                   </div>
               </div>
           </div>
        </div>

        {/* Card 2: Design Extension */}
        <div onClick={() => onSelectMode('design')} className="group cursor-pointer">
           <div className="w-full h-full rounded-[32px] bg-white/60 backdrop-blur-[20px] border border-white/60 shadow-[0_10px_40px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_50px_rgba(147,51,234,0.15)] transition-all duration-300 group-hover:-translate-y-2">
               <div className="p-8 flex flex-col h-full min-h-[280px]">
                   <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                       <MagicWandIcon className="w-8 h-8" />
                   </div>
                   <h3 className="text-xl font-bold text-gray-800 mb-2">款式延申 (Magic Design)</h3>
                   <p className="text-sm text-gray-500 leading-relaxed">
                       锁定面料材质，重构服装版型。支持改长短、换品类（如上衣变裙子）、加袖子等。
                   </p>
                   <div className="mt-auto pt-6 flex items-center text-xs font-bold text-purple-600">
                       进入设计室 <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                   </div>
               </div>
           </div>
        </div>
      </div>
      
      {/* Visual Indicator of Original Image */}
      <div className="mt-12 flex flex-col items-center opacity-60">
           <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-sm mb-2">
               <img src={originalImage} className="w-full h-full object-cover" />
           </div>
           <span className="text-[10px] text-gray-400 font-mono tracking-widest">SOURCE INPUT</span>
      </div>
    </div>
  );
};
