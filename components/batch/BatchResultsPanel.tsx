
import React, { useState, useEffect } from 'react';
import { BatchItem, ViewType } from '../../types';
import Silk from '../Silk';

interface BatchResultsPanelProps {
    activeItem: BatchItem;
    onClose: () => void;
}

export const BatchResultsPanel: React.FC<BatchResultsPanelProps> = ({ activeItem, onClose }) => {
    // Determine Main Processing Status
    const isProcessingMain = ['queued', 'preprocessing', 'processing'].includes(activeItem.status);
    const isGeneratingViews = activeItem.viewStatus === 'generating';

    // Collect all viewable images: Main + Variations
    // If processing, we don't really have a "main" image to show yet, but we keep the structure
    const mainImg = activeItem.generatedImage || activeItem.processedImage || activeItem.previewUrl;
    const variations = activeItem.variations || [];
    
    // Create a flat list for navigation
    const galleryImages = [
        { id: 'main', url: mainImg, label: '主图' },
        ...variations.map(v => ({ id: v.id, url: v.imageUrl, label: v.label || v.type }))
    ];

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    
    // Revert Silk color to ByteDance Blue
    const SILK_COLOR = "#3370ff"; 

    // Handle switching images with animation
    const handleSwitch = (index: number) => {
        if (index === currentIndex) return;
        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentIndex(index);
            setIsTransitioning(false);
        }, 150); // Short fade out time
    };

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        const next = (currentIndex + 1) % galleryImages.length;
        handleSwitch(next);
    };

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        const prev = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
        handleSwitch(prev);
    };

    // If variations are added dynamically, ensure index is safe
    useEffect(() => {
        if (currentIndex >= galleryImages.length) {
            setCurrentIndex(0);
        }
    }, [galleryImages.length]);

    const currentImage = galleryImages[currentIndex];

    // Helper to render loading cell with UNIFIED SILK VISUAL
    const renderLoadingCell = (idx: number) => (
        <div key={`loading-${idx}`} className="relative rounded-lg overflow-hidden h-20 sm:h-24 shadow-md bg-gray-900 border border-white/10">
             {/* Background Image Blurred (Use mainImg as context) */}
             <div className="absolute inset-0">
                  <img src={mainImg} className="w-full h-full object-cover opacity-40 filter blur-md scale-125" />
             </div>
             
             {/* Silk Layer - Scaled for small box */}
             <div className="absolute inset-0 opacity-90">
                  <Silk speed={3} scale={2.5} color={SILK_COLOR} noiseIntensity={0.4} />
             </div>
             <div className="absolute inset-0 bg-black/20 z-10"></div>
             
             {/* Spinner */}
             <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-5 h-5 border-2 border-white/90 border-t-transparent rounded-full animate-spin drop-shadow-md"></div>
             </div>
        </div>
    );

    // Get Loading Message based on status
    const getLoadingMessage = () => {
        if (activeItem.status === 'preprocessing') return "智能人台识别中...";
        if (activeItem.status === 'queued') return "正在排队...";
        return "AI 正在重绘...";
    };

    return (
        <div className="flex flex-col h-full w-full">
            {/* Header */}
            <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center bg-white/50 z-20">
                <div>
                    <h3 className="text-sm font-bold text-gray-800">生成详情</h3>
                    <p className="text-[10px] text-gray-500">ID: {activeItem.id.substring(0,8)} | {isProcessingMain ? '处理中' : `${currentIndex + 1}/${galleryImages.length}`}</p>
                </div>
                <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors">
                    关闭
                </button>
            </div>

            {/* Main Content Area - No Scroll, Flex Grow */}
            <div className="flex-1 relative flex flex-col min-h-0 bg-gray-50/30">
                
                {/* Main Image Stage */}
                <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4">
                    
                    {isProcessingMain ? (
                        // --- PROCESSING STATE UI (Immersive & Clean) ---
                        <div className="relative h-full w-full rounded-2xl overflow-hidden flex flex-col items-center justify-center shadow-inner border border-white/50 animate-fade-in">
                            {/* 1. Blurred Background Layer */}
                            <div className="absolute inset-0 z-0">
                                <img 
                                    src={activeItem.previewUrl} 
                                    alt="Background Context" 
                                    className="w-full h-full object-cover opacity-60 filter blur-xl scale-110"
                                />
                                <div className="absolute inset-0 bg-white/20 mix-blend-overlay"></div>
                            </div>
                            
                            {/* 2. Silk Animation Layer */}
                            <div className="absolute inset-0 z-10 mix-blend-soft-light opacity-90">
                                <Silk speed={2} scale={1.5} color={SILK_COLOR} noiseIntensity={0.8} />
                            </div>

                            {/* 3. Foreground Content - DIRECTLY ON BACKGROUND (No Glass Box) */}
                            <div className="relative z-20 flex flex-col items-center gap-4 p-8">
                                <div className="w-16 h-16 border-[4px] border-white/30 border-t-white rounded-full animate-spin drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]"></div>
                                <div className="text-center">
                                    <h4 className="text-xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] tracking-wide">
                                        {getLoadingMessage()}
                                    </h4>
                                    <p className="text-[10px] text-white/90 font-mono mt-2 uppercase tracking-[0.2em] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                                        GENERATING HIGH-FIDELITY DETAILS
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // --- COMPLETED / PREVIEW STATE UI ---
                        <div className={`relative h-full w-full flex items-center justify-center transition-opacity duration-300 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                            <img 
                                src={currentImage?.url} 
                                alt="Main" 
                                className="max-h-full max-w-full object-contain rounded-lg drop-shadow-xl" 
                            />
                            <div className="absolute bottom-2 bg-black/50 backdrop-blur-md text-white text-[10px] px-3 py-1 rounded-full font-bold tracking-wider">
                                {currentImage?.label}
                            </div>
                            
                            {/* Navigation Buttons (Left/Right) - Fixed Buttons */}
                            {galleryImages.length > 1 && (
                                <>
                                    <button 
                                        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/80 hover:bg-white backdrop-blur-md border border-gray-200 shadow-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 text-gray-700 cursor-pointer"
                                        onClick={handlePrev}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                    </button>
                                    <button 
                                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/80 hover:bg-white backdrop-blur-md border border-gray-200 shadow-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 text-gray-700 cursor-pointer"
                                        onClick={handleNext}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Panel: Thumbnails & Feedback */}
            <div className="bg-white/80 border-t border-gray-100 p-4 z-20">
                <div className="flex flex-col gap-3">
                     
                     {/* Feedback Bar */}
                     {activeItem.feedbackReason && !isProcessingMain && (
                        <div className="bg-orange-50 rounded-lg p-2 border border-orange-100 flex items-start gap-2">
                             <div className="text-orange-500 font-bold text-xs mt-0.5">⚠️</div>
                             <p className="text-gray-600 text-[10px] leading-relaxed">{activeItem.feedbackReason}</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                             <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">四视图变体</h4>
                             {isGeneratingViews && (
                                <span className="text-[10px] text-fashion-accent flex items-center gap-1 animate-pulse">
                                    <span>●</span> 生成中...
                                </span>
                             )}
                        </div>

                        {/* Thumbnails Grid */}
                        <div className="grid grid-cols-4 gap-2">
                             {/* If Main Image Processing OR Generating Views: Show UNIFIED Loading Cells with Silk */}
                             {isProcessingMain || isGeneratingViews ? (
                                Array(4).fill(0).map((_, i) => renderLoadingCell(i))
                             ) : (
                                 /* If Complete: Show Variations or Pending Placeholders */
                                 activeItem.variations && activeItem.variations.length > 0 ? (
                                     activeItem.variations.map((v, idx) => {
                                         const galleryIdx = idx + 1; // 0 is main image
                                         const isActive = galleryIdx === currentIndex;
                                         
                                         return (
                                            <div 
                                                key={v.id}
                                                onClick={() => handleSwitch(galleryIdx)}
                                                className={`relative rounded-lg overflow-hidden border cursor-pointer transition-all duration-300 hover:scale-105 h-20 sm:h-24
                                                    ${isActive ? 'border-fashion-accent ring-2 ring-fashion-accent/20 scale-105 shadow-md' : 'border-gray-200 grayscale hover:grayscale-0'}`}
                                            >
                                                <img src={v.imageUrl} className="w-full h-full object-cover" />
                                                <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-center text-white py-0.5 truncate">
                                                    {v.label}
                                                </div>
                                            </div>
                                         );
                                     })
                                 ) : (
                                     /* Empty / Pending */
                                     Array(4).fill(0).map((_, i) => (
                                         <div key={i} className="rounded-lg border border-dashed border-gray-300 flex items-center justify-center bg-gray-50/50 h-20 sm:h-24 transition-colors hover:bg-white hover:border-gray-400 cursor-default">
                                             <span className="text-[9px] text-gray-300 font-bold">待生成</span>
                                         </div>
                                     ))
                                 )
                             )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
