
import React from 'react';
import { ModelType, PoseType, DepthType, GenerationMode } from '../../types';
import { MODEL_CONFIG, SCENE_CONFIG, DEPTH_CONFIG, POSE_CONFIG, SceneConfig } from '../../services/promptConfig';
import { Button } from '../Button';
import ElasticSlider from '../UI/ElasticSlider';
import { CustomSelect } from '../UI/CustomSelect';

interface BatchConfigPanelProps {
    batchCount: number;
    isProcessing: boolean;
    allCompleted: boolean;
    
    // Config Props
    modelType: ModelType;
    poseType: PoseType;
    depthLevel: DepthType;
    aspectRatio: string;
    stylePrompt: string;
    aiFeelValue: number;
    flowValue: number;
    generationMode: GenerationMode;
    selectedSceneId: string | null;

    // Actions
    onModelSelect: (id: string) => void;
    onSceneSelect: (preset: SceneConfig) => void;
    onPoseChange: (val: PoseType) => void;
    onDepthChange: (val: DepthType) => void;
    onRatioChange: (val: string) => void;
    onAiFeelChange: (val: number) => void;
    onFlowChange: (val: number) => void;
    onPromptChange: (val: string) => void;
    onModeChange: (mode: GenerationMode) => void;
    onStableModeClick: () => void;
    onStartBatch: () => void;
}

export const BatchConfigPanel: React.FC<BatchConfigPanelProps> = (props) => {
    const {
        batchCount, isProcessing, allCompleted,
        modelType, poseType, depthLevel, aspectRatio, stylePrompt, aiFeelValue, flowValue, generationMode, selectedSceneId,
        onModelSelect, onSceneSelect, onPoseChange, onDepthChange, onRatioChange, onAiFeelChange, onFlowChange, onPromptChange, onModeChange, onStableModeClick, onStartBatch
    } = props;

    // Constants
    const scenePresets = Object.values(SCENE_CONFIG);
    const modelOptions = Object.values(MODEL_CONFIG);
    const poseOptions = Object.values(POSE_CONFIG);
    const aspectRatioOptions = ['3:4', '4:3', '1:1', '9:16'].map(r => ({ value: r, label: r }));
    const depthOptions = Object.values(DEPTH_CONFIG).map(d => ({ value: d.id, label: d.label }));

    const interactionDisabled = isProcessing;

    return (
        <div className="flex flex-col h-full w-full">
            <div className={`flex-1 overflow-y-auto px-6 py-6 scrollbar-hide space-y-8 min-h-0 ${interactionDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="space-y-3">
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold ml-1 flex items-center gap-2">
                        01 场景选择 <span className="h-px bg-gray-200 flex-1"></span>
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                         {scenePresets.map(preset => {
                             const isSelected = selectedSceneId === preset.id;
                             return (
                                 <button
                                    key={preset.id}
                                    onClick={() => onSceneSelect(preset)}
                                    disabled={modelType === 'gugu'}
                                    className={`px-3 py-3 rounded-2xl border text-xs font-bold transition-all truncate shadow-sm hover:scale-[1.02]
                                        ${modelType === 'gugu' ? 'opacity-40 cursor-not-allowed' : ''}
                                        ${isSelected
                                            ? 'bg-fashion-accent text-white border-fashion-accent shadow-lg shadow-blue-500/20'
                                            : 'bg-white text-gray-600 border-white hover:border-blue-200 hover:shadow-md'
                                        }
                                    `}
                                >
                                    {preset.name}
                                </button>
                             );
                         })}
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold ml-1 flex items-center gap-2">
                        02 模特选择 <span className="h-px bg-gray-200 flex-1"></span>
                    </label>
                    <div className="flex gap-3 overflow-x-auto pb-4 pt-1 px-1 scrollbar-hide snap-x">
                        {modelOptions.map((opt) => {
                            const isSelected = modelType === opt.id;
                            return (
                                <button
                                    key={opt.id}
                                    onClick={() => onModelSelect(opt.id)}
                                    className={`snap-start shrink-0 px-5 py-3 rounded-xl border text-xs font-bold whitespace-nowrap transition-all shadow-sm
                                        ${isSelected
                                            ? 'bg-fashion-accent text-white border-fashion-accent shadow-lg shadow-blue-500/20 scale-[1.02]'
                                            : 'bg-white text-gray-600 border-white hover:shadow-md hover:border-blue-200'
                                        }
                                    `}
                                >
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold ml-1">姿态 (Pose)</label>
                        <div className="flex flex-wrap gap-2">
                          {poseOptions.map((opt) => (
                            <button
                              key={opt.id}
                              onClick={() => onPoseChange(opt.id as PoseType)}
                              disabled={modelType === 'gugu'}
                              className={`px-3 py-2 rounded-lg text-[10px] font-bold border transition-all
                                  ${modelType === 'gugu' ? 'opacity-40 cursor-not-allowed' : ''}
                                  ${poseType === opt.id 
                                      ? 'bg-fashion-accent/10 text-fashion-accent border-fashion-accent/20' 
                                      : 'bg-white border-transparent text-gray-500 hover:border-gray-200'
                                  }
                              `}
                            >
                              {opt.label.split('(')[0]}
                            </button>
                          ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold ml-1">比例与景深</label>
                        <div className="flex gap-3">
                             <div className="w-1/3">
                                 <CustomSelect 
                                     value={aspectRatio}
                                     onChange={(val) => onRatioChange(val)}
                                     options={aspectRatioOptions}
                                     disabled={modelType === 'gugu'}
                                 />
                             </div>
                             <div className="w-2/3">
                                 <CustomSelect 
                                     value={depthLevel}
                                     onChange={(val) => onDepthChange(val as DepthType)}
                                     options={depthOptions}
                                 />
                             </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-100/80 backdrop-blur-sm rounded-2xl p-5 border border-white/50 shadow-inner space-y-7">
                    <div className="space-y-3">
                        <div className="flex justify-between items-end px-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Raw (原图)</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pro (大片)</span>
                        </div>
                        <ElasticSlider 
                            value={aiFeelValue} 
                            onChange={onAiFeelChange} 
                            min={0} 
                            max={100} 
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">动态风感 (FLOW)</span>
                            <span className="text-xs font-mono font-bold text-fashion-accent bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{flowValue}%</span>
                        </div>
                        <ElasticSlider 
                            value={flowValue} 
                            onChange={onFlowChange} 
                            min={0} 
                            max={100} 
                        />
                    </div>
                </div>
                
                 <div className="relative group">
                    <textarea 
                        value={stylePrompt}
                        onChange={(e) => onPromptChange(e.target.value)}
                        placeholder={modelType === 'gugu' ? "场景已锁定 (Scene Locked)" : "补充细节描述... 例如 '金色夕阳', '手持咖啡杯', '走在斑马线上'..."}
                        disabled={modelType === 'gugu'}
                        className="w-full h-20 bg-white border border-transparent rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:border-fashion-accent focus:ring-4 focus:ring-blue-500/10 outline-none resize-none p-4 transition-all shadow-sm group-hover:shadow-md disabled:bg-gray-50 disabled:text-gray-400"
                    />
                     <div className="absolute bottom-2 right-2 text-[9px] text-gray-300 pointer-events-none uppercase font-bold">自定义提示词</div>
                 </div>
            </div>

             <div className="p-5 border-t border-white/50 bg-white/95 space-y-4">
                 
                 <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">生成协议</span>
                      <div className="flex bg-gray-100/50 p-1 rounded-lg border border-white/50 w-64 max-w-full">
                          <button 
                            onClick={() => onModeChange('standard')}
                            disabled={interactionDisabled}
                            className={`w-1/2 py-1.5 rounded-md text-[10px] font-bold transition-all uppercase tracking-wide flex justify-center items-center
                                ${generationMode === 'standard' ? 'bg-white text-fashion-accent shadow-sm' : 'text-gray-400 hover:text-gray-600'}
                            `}
                          >
                              标准模式
                          </button>
                          <button 
                            onClick={onStableModeClick}
                            disabled={interactionDisabled}
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
                    onClick={onStartBatch} 
                    disabled={isProcessing || allCompleted}
                    className={`w-full py-4 text-sm tracking-widest font-bold shadow-xl transition-all
                        ${generationMode === 'stable' 
                            ? 'shadow-amber-500/20 hover:shadow-amber-500/30 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700' 
                            : 'shadow-blue-500/20 hover:shadow-blue-500/30'
                        }
                    `}
                 >
                     {isProcessing 
                        ? `批量生成进行中...` 
                        : allCompleted 
                            ? '全部任务已完成'
                            : generationMode === 'stable' 
                                ? `开始批量稳定生成 (${batchCount})` 
                                : `开始批量生成 (${batchCount})`
                     }
                 </Button>
             </div>
        </div>
    );
};
