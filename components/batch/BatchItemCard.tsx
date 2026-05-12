
import React, { useState } from 'react';
import { BatchItem } from '../../types';
import Silk from '../Silk';

interface BatchItemCardProps {
  item: BatchItem;
  isActive: boolean;
  onSelect: (item: BatchItem) => void;
  onToggleSelection: (id: string) => void;
}

export const BatchItemCard: React.FC<BatchItemCardProps> = ({ item, isActive, onSelect, onToggleSelection }) => {
    const [dismissed, setDismissed] = useState(false);

    const isGenerating = item.status === 'processing' || item.status === 'preprocessing' || item.status === 'queued';
    // Revert to ByteDance Blue
    const SILK_COLOR = "#3370ff"; 

    return (
        <div 
            className={`relative aspect-[3/4] bg-white rounded-xl overflow-hidden border transition-all duration-200 group select-none cursor-pointer
                ${isActive ? 'ring-2 ring-fashion-accent ring-inset' : 'hover:border-blue-200'}
                ${item.status === 'completed' && item.selectedForViews ? 'border-fashion-accent' : 'border-gray-200'}
                ${isGenerating ? 'shadow-lg' : 'shadow-sm hover:shadow-md'}
            `}
            onClick={() => onSelect(item)}
        >
            <div className="w-full h-full relative">
                <img 
                    src={item.generatedImage || item.processedImage || item.previewUrl} 
                    alt="Preview" 
                    className={`w-full h-full object-cover transition-all duration-500 ${isGenerating ? 'blur-sm scale-110 opacity-50' : ''}`}
                />
                
                {/* VISUAL TRICK: Silk Loading Overlay */}
                {isGenerating && (
                    <div className="absolute inset-0 z-20">
                            <div className="absolute inset-0 opacity-80">
                                {/* Mini Silk Canvas with Blue */}
                                <Silk speed={2.5} scale={1.8} color={SILK_COLOR} noiseIntensity={0.2} />
                            </div>
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-black/20">
                                <div className="w-8 h-8 border-2 border-white/80 border-t-transparent rounded-full animate-spin mb-2 drop-shadow-md"></div>
                                <span className="text-white text-[10px] font-bold tracking-widest uppercase drop-shadow-md">
                                    {item.status === 'preprocessing' ? '智能人台处理' : '正在渲染...'}
                                </span>
                            </div>
                    </div>
                )}
            </div>

            {/* View Status Indicator (Overlay when generating views) */}
            {item.viewStatus === 'generating' && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-30 flex flex-col items-center justify-center animate-fade-in">
                    <div className="w-6 h-6 rounded-full bg-fashion-accent animate-pulse mb-2"></div>
                    <span className="text-white text-[9px] font-bold">正在生成变体...</span>
                </div>
            )}

            {/* FEEDBACK: Film Strip Thumbnails */}
            {item.variations && item.variations.length > 0 && (
                <div className="absolute bottom-0 inset-x-0 h-14 bg-white/90 backdrop-blur-xl border-t border-white/50 z-20 flex items-center justify-between px-2 animate-slide-up">
                    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                        {item.variations.map((v) => (
                            <div 
                                key={v.id} 
                                className="w-8 h-10 rounded border border-gray-200 overflow-hidden flex-shrink-0"
                            >
                                <img src={v.imageUrl} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                    <div className="w-10 flex flex-col items-center justify-center text-[8px] text-gray-400 font-bold leading-tight pl-1 border-l border-gray-200">
                        <span className="text-fashion-accent font-bold">完成</span>
                    </div>
                </div>
            )}

            {/* FEEDBACK OVERLAY (Stable Mode Warnings) */}
            {item.status === 'completed' && item.stableStatus && item.stableStatus !== 'PASS' && !dismissed && (
                <div 
                    className="absolute inset-0 z-20 bg-black/50 backdrop-blur-[2px] p-4 flex flex-col justify-center animate-fade-in"
                    onClick={(e) => e.stopPropagation()} 
                >
                    <button 
                        onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
                        className="absolute top-2 right-2 text-white/60 hover:text-white bg-black/20 hover:bg-black/40 rounded-full w-6 h-6 flex items-center justify-center transition-colors"
                    >
                        ✕
                    </button>
                    
                    <div className="text-center space-y-2">
                        <div className="inline-block bg-orange-500/20 text-orange-200 border border-orange-500/50 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider mb-1">
                            AI 质检 ({item.stableScore}分)
                        </div>
                        <div className="bg-black/30 p-2 rounded-xl border border-white/10 shadow-xl max-h-24 overflow-y-auto scrollbar-hide">
                            {item.feedbackIssues && item.feedbackIssues.length > 0 ? (
                                <div className="space-y-1">
                                    {item.feedbackIssues.map((issue, idx) => (
                                        <div key={idx} className="flex gap-1 text-[9px] text-left text-white/90">
                                            <span className={`px-1 rounded font-mono ${issue.severity==='major'?'bg-red-500/50':'bg-yellow-500/50'}`}>
                                                {issue.area.substring(0,4)}
                                            </span>
                                            <span>{issue.description}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-white">检测到微小差异</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Selection Checkbox */}
            {item.status === 'completed' && (
                <div 
                    className="absolute top-2 right-2 z-10 cursor-pointer p-2"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelection(item.id);
                    }}
                >
                    <div className={`w-5 h-5 rounded-full border border-white shadow-lg flex items-center justify-center transition-all duration-200 ${item.selectedForViews ? 'bg-fashion-accent scale-110' : 'bg-black/30 hover:bg-black/50'}`}>
                        {item.selectedForViews && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        )}
                    </div>
                </div>
            )}

            {/* Status Bar (Hidden if Film Strip is showing) */}
            {(!item.variations || item.variations.length === 0) && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2 pointer-events-none flex justify-between items-end">
                    {!isGenerating && (
                        <span className={`text-white text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase backdrop-blur-md shadow-sm ${
                            item.status === 'completed' ? 'bg-green-500/80' : 
                            item.status === 'failed' ? 'bg-red-500/80' : 'bg-black/40'
                        }`}>
                            {item.status === 'completed' ? '完成' : 
                            item.status === 'failed' ? '失败' : '待机'}
                        </span>
                    )}

                    {item.status === 'completed' && item.stableStatus && (
                        <span className={`text-[8px] px-1.5 py-0.5 rounded border backdrop-blur-md font-bold ${
                            item.stableStatus === 'PASS' ? 'bg-green-500/20 border-green-400 text-green-100' :
                            item.stableStatus === 'WARN' ? 'bg-yellow-500/20 border-yellow-400 text-yellow-100' :
                            'bg-red-500/20 border-red-400 text-red-100'
                        }`}>
                            {item.stableStatus === 'PASS' ? 'Pass' : item.stableStatus === 'WARN' ? 'Warn' : 'Fail'}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};
