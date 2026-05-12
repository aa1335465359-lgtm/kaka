
import React, { useState, useEffect } from 'react';
import { BatchItem, ModelType, PoseType, DepthType, GenerationMode } from '../../types';
import { MODEL_CONFIG, SCENE_CONFIG, SceneConfig } from '../../services/promptConfig';
import { Button } from '../Button';
import { MagicWandIcon, DownloadIcon } from '../Icons';
// @ts-ignore
import JSZip from 'jszip';

// Import New Refactored Components
import { BatchItemCard } from '../batch/BatchItemCard';
import { BatchConfigPanel } from '../batch/BatchConfigPanel';
import { BatchResultsPanel } from '../batch/BatchResultsPanel';
import { GuGuModal, StableWarningModal } from '../batch/BatchModals';

interface BatchProcessStepProps {
  batchItems: BatchItem[];
  isProcessing: boolean;
  
  // Configuration State
  modelType: ModelType;
  poseType: PoseType;
  depthLevel: DepthType;
  aspectRatio: string;
  stylePrompt: string;
  isPreprocessEnabled: boolean;
  aiFeelValue: number;
  flowValue: number;
  generationMode: GenerationMode;
  
  // Setters
  setModelType: (t: ModelType) => void;
  setPoseType: (p: PoseType) => void;
  setDepthLevel: (d: DepthType) => void;
  setAspectRatio: (r: string) => void;
  setStylePrompt: (s: string) => void;
  setIsPreprocessEnabled: (b: boolean) => void;
  setAiFeelValue: (v: number) => void;
  setFlowValue: (v: number) => void;
  setGenerationMode: (m: GenerationMode) => void;
  
  // Actions
  onStartBatch: () => void;
  onToggleItemSelection: (id: string) => void;
  onGenerateViews: () => void;
  onBack: () => void;
}

export const BatchProcessStep: React.FC<BatchProcessStepProps> = (props) => {
  const {
    batchItems, isProcessing,
    modelType, poseType, depthLevel, aspectRatio, stylePrompt, isPreprocessEnabled, aiFeelValue, flowValue, generationMode,
    setModelType, setPoseType, setDepthLevel, setAspectRatio, setStylePrompt, setIsPreprocessEnabled, setAiFeelValue, setFlowValue, setGenerationMode,
    onStartBatch, onToggleItemSelection, onGenerateViews
  } = props;
  
  // Local UI State - CHANGED to store ID to avoid stale state
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const activeItem = activeItemId ? batchItems.find(i => i.id === activeItemId) || null : null;

  const [showGuGuModal, setShowGuGuModal] = useState(false);
  const [showStableWarning, setShowStableWarning] = useState(false);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Initialize Defaults
  useEffect(() => {
    if (!stylePrompt) {
        setStylePrompt(SCENE_CONFIG['cafe'].prompt);
        setSelectedSceneId('cafe');
    }
  }, []);

  // Handlers for Config Panel
  const handleModelSelect = (id: string) => {
      const config = MODEL_CONFIG[id];
      if (config?.isGuGuStyle) {
          setShowGuGuModal(true);
      } else {
          setModelType(id);
          if (stylePrompt.includes("咕咕风")) {
              setStylePrompt(SCENE_CONFIG['cafe'].prompt);
              setSelectedSceneId('cafe');
              setAiFeelValue(0); 
              setFlowValue(20);
          }
      }
  };

  const handleSceneSelect = (preset: SceneConfig) => {
    if (modelType === 'gugu') return;
    setStylePrompt(preset.prompt);
    setSelectedSceneId(preset.id);
  };

  const confirmGuGu = () => {
    setModelType('gugu');
    setShowGuGuModal(false);
    setAiFeelValue(15);
    setFlowValue(0);
    setAspectRatio('3:4');
    setStylePrompt("【咕咕风模式: 对镜自拍】(GuGu Style Mirror Selfie). 这是一个极其真实的对镜自拍。");
  };

  const confirmStableMode = () => {
    setGenerationMode('stable');
    setShowStableWarning(false);
  };
  
  // --- UPDATED: Start Batch & Auto Switch to View ---
  const handleStartBatchClick = () => {
      onStartBatch();
      // Automatically switch to the first item to show the new "Processing" state
      if (batchItems.length > 0) {
          setActiveItemId(batchItems[0].id);
      }
  };

  const handleBatchDownload = async () => {
    const selectedItems = batchItems.filter(i => i.selectedForViews && i.status === 'completed');
    if (selectedItems.length === 0) return;

    setIsDownloading(true);
    try {
        const zip = new JSZip();
        const folderName = `StyleWeave_Batch_${new Date().toISOString().slice(0,10)}`;
        const rootFolder = zip.folder(folderName);

        selectedItems.forEach((item, index) => {
             const cleanId = item.id.substring(0, 8);
             const itemFolder = rootFolder?.folder(`item_${index + 1}_${cleanId}`);
             
             // 1. Main Image
             if (item.generatedImage) {
                 const data = item.generatedImage.split(',')[1];
                 itemFolder?.file(`main_${cleanId}.jpg`, data, {base64: true});
             } else if (item.processedImage) {
                  const data = item.processedImage.split(',')[1];
                  itemFolder?.file(`processed_${cleanId}.jpg`, data, {base64: true});
             }

             // 2. Variations
             if (item.variations && item.variations.length > 0) {
                 item.variations.forEach((v, vIdx) => {
                      const vData = v.imageUrl.split(',')[1];
                      itemFolder?.file(`var_${v.type}_${vIdx + 1}.jpg`, vData, {base64: true});
                 });
             }
        });

        const content = await zip.generateAsync({type:"blob"});
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${folderName}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

    } catch (e) {
        console.error("Batch download failed", e);
        alert("打包下载失败，请稍后重试");
    } finally {
        setIsDownloading(false);
    }
  };

  // Logic to switch Right Panel
  const showResultsPanel = activeItem !== null; 

  const allCompleted = batchItems.length > 0 && batchItems.every(i => i.status === 'completed' || i.status === 'failed');
  const selectedCount = batchItems.filter(i => i.selectedForViews).length;
  const anyProcessing = batchItems.some(i => i.status === 'processing' || i.status === 'queued' || i.status === 'preprocessing');

  return (
    <div className="relative w-full h-[calc(100vh-140px)]">
      
      {showGuGuModal && <GuGuModal onClose={() => setShowGuGuModal(false)} onConfirm={confirmGuGu} />}
      {showStableWarning && <StableWarningModal onClose={() => setShowStableWarning(false)} onConfirm={confirmStableMode} />}

      <div className="flex flex-col md:flex-row gap-6 h-full">
        
        {/* LEFT COLUMN: ITEM GRID */}
        <div className="md:w-5/12 relative rounded-[2rem] overflow-hidden bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col group">
            
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/20 bg-white/30 backdrop-blur-md flex justify-between items-center z-10">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-800">批量任务</h3>
                    <span className="text-[10px] bg-white/60 px-2 py-0.5 rounded-full text-gray-500 font-medium border border-white/30">
                        {batchItems.length} items
                    </span>
                </div>
                
                <div 
                    onClick={() => setIsPreprocessEnabled(!isPreprocessEnabled)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-all border ${isPreprocessEnabled ? 'bg-fashion-accent/10 border-fashion-accent/20' : 'bg-white/40 border-white/40'}`}
                >
                    <span className={`text-[10px] font-bold ${isPreprocessEnabled ? 'text-fashion-accent' : 'text-gray-500'}`}>智能人台处理</span>
                    <div className={`w-6 h-3 rounded-full p-0.5 transition-all ${isPreprocessEnabled ? 'bg-fashion-accent' : 'bg-gray-300'}`}>
                        <div className={`w-2 h-2 rounded-full bg-white shadow-sm transform transition-transform ${isPreprocessEnabled ? 'translate-x-3' : 'translate-x-0'}`} />
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-hide min-h-0">
                <div className="grid grid-cols-2 gap-3">
                    {batchItems.map((item) => (
                        <BatchItemCard 
                            key={item.id}
                            item={item}
                            isActive={activeItem?.id === item.id}
                            onSelect={(item) => setActiveItemId(item.id)} // Pass ID setter
                            onToggleSelection={onToggleItemSelection}
                        />
                    ))}
                </div>
            </div>
            
            {/* Footer States */}
            {anyProcessing && (
                <div className="px-5 py-3 border-t border-white/20 bg-white/30 backdrop-blur-md text-xs text-gray-600 flex justify-center items-center gap-2">
                     <div className="w-3 h-3 border-2 border-fashion-accent border-t-transparent rounded-full animate-spin"></div>
                     正在并发处理队列...
                </div>
            )}

            {allCompleted && (
                 <div className="p-4 border-t border-white/20 bg-white/40 backdrop-blur-md z-10 animate-slide-up">
                      <div className="bg-white/80 rounded-2xl p-3 shadow-lg border border-white/60 flex items-center justify-between gap-3">
                          <div className="flex flex-col pl-2">
                              <div className="text-xs font-bold text-gray-700 flex items-center gap-1">
                                  已选 <span className="text-fashion-accent text-lg">{selectedCount}</span> 张
                              </div>
                              <div className="text-[9px] text-gray-400">勾选右上角圆圈选择</div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                                variant="secondary"
                                onClick={handleBatchDownload}
                                disabled={selectedCount === 0 || isProcessing || isDownloading}
                                className="text-xs px-3 py-2 h-10 rounded-xl border border-gray-200 hover:border-blue-200 transition-all shadow-sm"
                            >
                                {isDownloading ? (
                                    <div className="w-4 h-4 border-2 border-fashion-accent border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <DownloadIcon className="w-4 h-4" />
                                )}
                            </Button>

                            <Button 
                                onClick={onGenerateViews} 
                                disabled={selectedCount === 0 || isProcessing}
                                className={`text-xs px-4 py-2 h-10 rounded-xl transition-all shadow-md ${
                                    selectedCount > 0 
                                        ? 'bg-fashion-accent text-white shadow-blue-500/20 hover:scale-105' 
                                        : 'bg-gray-200 text-gray-400 shadow-none'
                                }`}
                            >
                                {isProcessing ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>生成中...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <MagicWandIcon className="w-4 h-4" /> 
                                        <span>生成四视图</span>
                                    </div>
                                )}
                            </Button>
                          </div>
                      </div>
                 </div>
            )}
        </div>

        {/* RIGHT COLUMN: STATIC SHELL (Prevents Layout Shifts) */}
        <div className="md:w-7/12 h-full relative bg-white/70 backdrop-blur-xl border border-white/60 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all duration-300">
            {showResultsPanel && activeItem ? (
                <BatchResultsPanel 
                    activeItem={activeItem} 
                    onClose={() => setActiveItemId(null)} 
                />
            ) : (
                <BatchConfigPanel
                    batchCount={batchItems.length}
                    isProcessing={isProcessing}
                    allCompleted={allCompleted}
                    modelType={modelType}
                    poseType={poseType}
                    depthLevel={depthLevel}
                    aspectRatio={aspectRatio}
                    stylePrompt={stylePrompt}
                    aiFeelValue={aiFeelValue}
                    flowValue={flowValue}
                    generationMode={generationMode}
                    selectedSceneId={selectedSceneId}
                    onModelSelect={handleModelSelect}
                    onSceneSelect={handleSceneSelect}
                    onPoseChange={setPoseType}
                    onDepthChange={setDepthLevel}
                    onRatioChange={setAspectRatio}
                    onAiFeelChange={setAiFeelValue}
                    onFlowChange={setFlowValue}
                    onPromptChange={setStylePrompt}
                    onModeChange={setGenerationMode}
                    onStableModeClick={() => setShowStableWarning(true)}
                    onStartBatch={handleStartBatchClick}
                />
            )}
        </div>

      </div>

    </div>
  );
};
