
import React, { useState } from 'react';
import { WorkflowStep, SmartProfile } from './types';
import { useWorkflow } from './hooks/useWorkflow';

// Components
import { Header } from './components/Header';
import { DebugPanel } from './components/UI/DebugPanel';
import { PortfolioGrid } from './components/PortfolioGrid';
import { LoadingScreen } from './components/UI/LoadingScreen';
import { UploadStep } from './components/steps/UploadStep';
import { ReviewStep } from './components/steps/ReviewStep';
import { ResultStep } from './components/steps/ResultStep';
import { WelcomeStep } from './components/steps/WelcomeStep';
import { BatchProcessStep } from './components/steps/BatchProcessStep';
import { ModeSelectionStep } from './components/steps/ModeSelectionStep';
import { DesignStep } from './components/steps/DesignStep';
import { SmartSetupWizard } from './components/smart/SmartSetupWizard';
import { SmartWorkbenchStep } from './components/steps/SmartWorkbenchStep';

export const App: React.FC = () => {
  const workflow = useWorkflow();
  const [showPresets, setShowPresets] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => { 
              workflow.setOriginalImage(reader.result as string); 
              workflow.setRawFile(reader.result as string); 
          };
          reader.readAsDataURL(file);
      }
  };

  const handleBackImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => { workflow.setBackImage(reader.result as string); };
          reader.readAsDataURL(file);
      }
  };

  return (
    <div className={`min-h-screen text-fashion-text font-sans selection:bg-fashion-accent selection:text-white relative overflow-hidden transition-colors duration-1000 ${workflow.step === WorkflowStep.WELCOME ? 'bg-[#7B7481]' : 'bg-fashion-dark/50'}`}>
      
      <div className={`fixed inset-0 z-0 pointer-events-none transition-all duration-1000 ${workflow.step === WorkflowStep.WELCOME ? 'opacity-0' : 'liquid-acrylic-bg opacity-100'}`}></div>

      {workflow.showDebugPanel && <DebugPanel logs={workflow.debugLogs} onClose={() => workflow.setShowDebugPanel(false)} />}
      
      {/* GLOBAL WARNINGS */}
      {workflow.stableModeIssues && workflow.step === WorkflowStep.RESULT && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[100] animate-fade-in w-full max-w-md px-4">
             <div className="bg-orange-50/95 backdrop-blur-xl border border-orange-200 rounded-2xl p-4 shadow-xl">
                 <div className="flex items-center justify-between mb-2">
                    <span className="text-orange-800 font-bold flex items-center gap-2">⚠️ 检测到细节差异 (WARNED)</span>
                    <button onClick={() => workflow.setStableModeIssues(null)} className="text-orange-400">✕</button>
                 </div>
                 <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-hide">
                     {workflow.stableModeIssues.map((issue, idx) => (
                         <div key={idx} className="flex gap-2 text-xs">
                             <span className={`px-1.5 py-0.5 rounded font-mono ${issue.severity==='major'?'bg-red-100 text-red-600':'bg-yellow-100 text-yellow-600'}`}>{issue.area}</span>
                             <span className="text-gray-700">{issue.description}</span>
                         </div>
                     ))}
                 </div>
             </div>
         </div>
      )}
      {workflow.preprocessWarning && workflow.step === WorkflowStep.REVIEW && (
         <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[100] animate-fade-in w-full max-w-md px-4">
             <div className="bg-yellow-50/90 backdrop-blur-xl border border-yellow-200 rounded-2xl p-4 shadow-xl flex items-start gap-3">
                 <div className="text-yellow-600 font-bold">⚠️</div>
                 <div className="flex-1">
                     <h4 className="text-sm font-bold text-yellow-800">预处理警告</h4>
                     <p className="text-xs text-yellow-700 mt-1">{workflow.preprocessWarning}</p>
                 </div>
                 <button onClick={() => workflow.setPreprocessWarning(null)}>✕</button>
             </div>
         </div>
      )}

      {workflow.step !== WorkflowStep.WELCOME && (
        <Header 
            step={workflow.step} 
            showPortfolio={workflow.showPortfolio} 
            portfolioCount={workflow.portfolio.length} 
            appMode={workflow.appMode}
            onTogglePortfolio={() => workflow.setShowPortfolio(!workflow.showPortfolio)} 
            onReset={workflow.handleDebugTrigger}
            onSwitchMode={workflow.switchMode}
            onOpenPresets={() => setShowPresets(true)}
        />
      )}

      <main className={`relative z-10 ${workflow.step !== WorkflowStep.WELCOME ? 'w-full h-screen pt-24 pb-4 px-4 overflow-hidden' : 'w-full'}`}>
        {workflow.error && <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-3 rounded-2xl mb-6 text-center shadow-sm animate-fade-in mx-auto max-w-md">{workflow.error}</div>}

        {workflow.showPortfolio ? (
          <div className="max-w-7xl mx-auto h-full overflow-y-auto">
            <PortfolioGrid items={workflow.portfolio} onRestore={workflow.handlePortfolioRestore} />
          </div>
        ) : (
          <>
            {workflow.step === WorkflowStep.WELCOME && (
                <WelcomeStep onStart={() => workflow.setStep(workflow.appMode === 'smart' ? WorkflowStep.SMART_SETUP : WorkflowStep.UPLOAD)} />
            )}
            
            {/* SMART MODE */}
            {workflow.step === WorkflowStep.SMART_SETUP && (
                <div className="max-w-7xl mx-auto">
                    <SmartSetupWizard 
                        onProfileCreated={(p) => {
                            workflow.setSmartProfile(p);
                            workflow.setStep(WorkflowStep.SMART_WORKBENCH);
                        }} 
                    />
                </div>
            )}
            
            {workflow.step === WorkflowStep.SMART_WORKBENCH && workflow.smartProfile && (
                <SmartWorkbenchStep 
                    profile={workflow.smartProfile}
                    onResetProfile={() => workflow.setStep(WorkflowStep.SMART_SETUP)}
                    onLoadProfile={(p) => workflow.setSmartProfile(p)}
                    showPresetCenter={showPresets}
                    onClosePresetCenter={() => setShowPresets(false)}
                />
            )}

            {/* DESIGN/REVIEW/BATCH MODE */}
            <div className="max-w-7xl mx-auto h-full">
                {workflow.step === WorkflowStep.UPLOAD && (
                <UploadStep 
                    originalImage={workflow.originalImage}
                    backImage={workflow.backImage}
                    isPreprocessEnabled={workflow.isPreprocessEnabled}
                    isPreprocessing={workflow.isPreprocessing}
                    appMode={workflow.appMode}
                    onFileUpload={handleFileUpload}
                    onBackImageUpload={handleBackImageUpload}
                    onRemoveBackImage={() => workflow.setBackImage(null)}
                    onBatchUpload={workflow.handleBatchUpload}
                    onTogglePreprocess={() => workflow.setIsPreprocessEnabled(!workflow.isPreprocessEnabled)}
                    onAnalyze={workflow.handleAnalysis}
                />
                )}
                
                {workflow.step === WorkflowStep.ANALYZING && (
                    <LoadingScreen 
                        title={workflow.appMode === 'design' ? "正在分析服装DNA..." : "正在提取面料DNA..."} 
                        messages={workflow.loadingMessage} 
                    />
                )}

                {workflow.step === WorkflowStep.BATCH_PROCESS && (
                    <BatchProcessStep 
                        batchItems={workflow.batchItems} isProcessing={workflow.isBatchRunning || workflow.isGeneratingViews}
                        modelType={workflow.modelType} poseType={workflow.poseType} depthLevel={workflow.depthLevel} aspectRatio={workflow.aspectRatio}
                        stylePrompt={workflow.stylePrompt} isPreprocessEnabled={workflow.isPreprocessEnabled} aiFeelValue={workflow.aiFeelValue} flowValue={workflow.flowValue}
                        generationMode={workflow.generationMode} setModelType={workflow.setModelType} setPoseType={workflow.setPoseType} setDepthLevel={workflow.setDepthLevel}
                        setAspectRatio={workflow.setAspectRatio} setStylePrompt={workflow.setStylePrompt} setIsPreprocessEnabled={workflow.setIsPreprocessEnabled}
                        setAiFeelValue={workflow.setAiFeelValue} setFlowValue={workflow.setFlowValue} setGenerationMode={workflow.setGenerationMode}
                        onStartBatch={workflow.handleStartBatch} onToggleItemSelection={(id) => workflow.setBatchItems(prev => prev.map(i => i.id === id ? { ...i, selectedForViews: !i.selectedForViews } : i))}
                        onGenerateViews={workflow.handleBatchGenerateViews} onBack={workflow.resetWorkflow}
                    />
                )}
                
                {workflow.step === WorkflowStep.MODE_SELECTION && workflow.originalImage && (
                    <ModeSelectionStep originalImage={workflow.originalImage} onSelectMode={(mode) => workflow.setStep(mode === 'review' ? WorkflowStep.REVIEW : WorkflowStep.DESIGN_WORKSPACE)} />
                )}
                
                {workflow.step === WorkflowStep.DESIGN_WORKSPACE && workflow.originalImage && (
                    <DesignStep 
                        originalImage={workflow.originalImage}
                        onGenerate={workflow.handleGeneration}
                        onBack={() => workflow.setStep(WorkflowStep.UPLOAD)}
                    />
                )}

                {workflow.step === WorkflowStep.REVIEW && workflow.originalImage && (
                <ReviewStep 
                    isLoading={workflow.isAnalyzing}
                    originalImage={workflow.originalImage} backImage={workflow.backImage}
                    analysis={workflow.analysis} modelType={workflow.modelType} poseType={workflow.poseType}
                    depthLevel={workflow.depthLevel} aspectRatio={workflow.aspectRatio} aiFeelValue={workflow.aiFeelValue} flowValue={workflow.flowValue}
                    stylePrompt={workflow.stylePrompt} sceneSuggestions={workflow.sceneSuggestions} selectedSceneId={workflow.selectedSceneId}
                    generationMode={workflow.generationMode} ignoreModel={workflow.ignoreModel} showDnaDetails={workflow.showDnaDetails}
                    categoryOverride={workflow.categoryOverride}
                    setModelType={workflow.setModelType} setPoseType={workflow.setPoseType} setDepthLevel={workflow.setDepthLevel}
                    setAspectRatio={workflow.setAspectRatio} setAiFeelValue={workflow.setAiFeelValue} setFlowValue={workflow.setFlowValue}
                    setStylePrompt={workflow.setStylePrompt} setSelectedSceneId={workflow.setSelectedSceneId} setGenerationMode={workflow.setGenerationMode}
                    setIgnoreModel={workflow.setIgnoreModel} setShowDnaDetails={workflow.setShowDnaDetails} setCategoryOverride={workflow.setCategoryOverride}
                    onGenerate={workflow.handleGeneration}
                />
                )}
                
                {workflow.step === WorkflowStep.RESULT && (
                <ResultStep 
                    isLoading={workflow.isGenerating} loadingMessage={workflow.loadingMessage} generatedImage={workflow.generatedImage} variations={workflow.variations}
                    aspectRatio={workflow.aspectRatio} aiFeelValue={workflow.aiFeelValue} flowValue={workflow.flowValue} variationLoadings={workflow.variationLoadings}
                    setGeneratedImage={(img) => workflow.setGeneratedImage(img)} setAiFeelValue={workflow.setAiFeelValue} setFlowValue={workflow.setFlowValue}
                    onBack={() => workflow.setStep(workflow.workflowMode === 'design' ? WorkflowStep.DESIGN_WORKSPACE : WorkflowStep.REVIEW)}
                    onReRoll={() => workflow.handleGeneration(null)} onVariation={workflow.handleVariation} onBatchVariation={workflow.handleBatchGenerateViews}
                    onUseForBackground={workflow.workflowMode === 'design' ? () => {
                        if (workflow.generatedImage) {
                            workflow.setOriginalImage(workflow.generatedImage);
                            workflow.setWorkflowMode('review');
                            workflow.setStep(WorkflowStep.REVIEW);
                        }
                    } : undefined}
                />
                )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};
