
import React from 'react';
import { PortfolioItem } from '../types';
import { MODEL_CONFIG } from '../services/promptConfig';

interface PortfolioGridProps {
  items: PortfolioItem[];
  onRestore: (item: PortfolioItem) => void;
}

export const PortfolioGrid: React.FC<PortfolioGridProps> = ({ items, onRestore }) => {
  return (
    <div className="animate-fade-in pb-10">
       <div className="flex justify-between items-end mb-8 px-2 border-b border-gray-200/50 pb-4">
           <div>
               <h2 className="text-3xl font-bold text-gray-900 font-serif">作品集</h2>
               <p className="text-xs text-gray-500 mt-2">最近生成的时尚作品</p>
           </div>
           <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
               自动保存 (最近20条)
           </span>
       </div>
       
       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
         {items.map(item => {
           const modelLabel = MODEL_CONFIG[item.modelType]?.label || item.modelType;
           const varCount = item.variations?.length || 0;
           return (
           <div 
              key={item.id} 
              onClick={() => onRestore(item)}
              className="group relative aspect-[3/4] bg-white rounded-[2rem] overflow-hidden border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] transition-all cursor-pointer hover:border-fashion-accent/50"
           >
              <img src={item.mainGeneratedImage} alt="Portfolio" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
              
              {varCount > 0 && (
                  <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md text-white border border-white/30 text-[9px] font-bold px-2 py-1 rounded-full">
                      +{varCount} 变体
                  </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-5">
                 <p className="text-xs text-white line-clamp-2 mb-3 font-medium leading-relaxed">{item.stylePrompt}</p>
                 <div className="flex gap-2 flex-wrap">
                    <span className="text-[9px] px-2 py-1 bg-white/20 backdrop-blur-md rounded-full text-white border border-white/10 uppercase tracking-wide">
                        {modelLabel.split(' ')[0]}
                    </span>
                    <span className="text-[9px] px-2 py-1 bg-white/20 backdrop-blur-md rounded-full text-white border border-white/10">
                        {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                 </div>
              </div>
           </div>
         )})}
         
         {items.length === 0 && (
             <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-[2rem]">
                 <p className="mb-2 text-2xl">📭</p>
                 <p className="text-sm">暂无作品</p>
             </div>
         )}
       </div>
    </div>
  );
};
