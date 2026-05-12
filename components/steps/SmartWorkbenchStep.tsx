
import React, { useState, useEffect } from 'react';
import { SmartProfile, GeneratedVariation, DirectorConfig } from '../../types';
import { generateStyledGarment, analyzeGarmentImage, generateDirectorConfig, detectFaceInImage, preprocessGarment } from '../../services/geminiService';
import { storageService } from '../../services/storage';
import { Button } from '../Button';
import { UploadIcon } from '../Icons';
import Silk from '../Silk';
import { PresetCenter } from '../smart/workbench/PresetCenter';

interface SmartWorkbenchStepProps {
  profile: SmartProfile;
  onResetProfile: () => void;
  onLoadProfile: (profile: SmartProfile) => void;
  showPresetCenter: boolean;
  onClosePresetCenter: () => void;
}

interface WorkbenchTask {
    id: string;
    previewUrl: string; 
    processedImage: string | null;
    analysis: any | null;
    directorConfig: DirectorConfig | null;
    resultImage: string | null;
    variations: GeneratedVariation[];
    status: 'IDLE' | 'DETECTING' | 'PREPROCESSING' | 'ANALYZING' | 'GENERATING' | 'COMPLETED' | 'FAILED';
    viewStatus: 'IDLE' | 'GENERATING' | 'COMPLETED';
}

interface DevLogEntry {
    timestamp: number;
    title: string;
    content: string;
}

export const SmartWorkbenchStep: React.FC<SmartWorkbenchStepProps> = ({ 
    profile, 
    onResetProfile, 
    onLoadProfile,
    showPresetCenter, 
    onClosePresetCenter 
}) => {
    // --- WORKBENCH STATE ---
    const [tasks, setTasks] = useState<WorkbenchTask[]>([]);
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
    const [isBatchProcessing, setIsBatchProcessing] = useState(false);
    const activeTask = tasks.find(t => t.id === activeTaskId) || null;
    const [loadingMessage, setLoadingMessage] = useState<string>("初始化中...");

    // --- DEV DIARY STATE ---
    const [debugClickCount, setDebugClickCount] = useState(0);
    const [showDevLogs, setShowDevLogs] = useState(false);
    const [devLogs, setDevLogs] = useState<DevLogEntry[]>([]);

    // Persist current profile
    useEffect(() => {
        if (profile && profile.id) {
            storageService.saveProfile(profile);
        }
    }, [profile]);

    // --- LOGGING HELPER ---
    const addDevLog = (title: string, content: string) => {
        const entry: DevLogEntry = { timestamp: Date.now(), title, content };
        setDevLogs(prev => [entry, ...prev]); // Newest first
    };

    // --- WORKBENCH HANDLERS ---
    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            // Fix: Explicitly cast file to File in forEach to avoid 'unknown' type inference which breaks FileReader
            Array.from(files).forEach((file: File) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64 = reader.result as string;
                    setTasks(prev => {
                        const newTask: WorkbenchTask = {
                            id: Date.now().toString() + Math.random(),
                            previewUrl: base64, processedImage: null, analysis: null, directorConfig: null, resultImage: null, variations: [], status: 'IDLE', viewStatus: 'IDLE'
                        };
                        const updated = [...prev, newTask];
                        if (!activeTaskId) setActiveTaskId(newTask.id);
                        return updated;
                    });
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const processTask = async (task: WorkbenchTask) => {
        if (task.status === 'COMPLETED') return;
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'DETECTING' } : t));
        if (activeTaskId === task.id) setLoadingMessage("正在检测主体...");

        // Clear logs for new run if single task
        if (!isBatchProcessing) setDevLogs([]);

        try {
            const originalBase64 = task.previewUrl.split(',')[1];
            let workingBase64 = originalBase64;
            const hasFace = await detectFaceInImage(originalBase64);
            
            if (hasFace) {
                setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'PREPROCESSING' } : t));
                if (activeTaskId === task.id) setLoadingMessage("智能人台处理中...");
                const mannequinBase64 = await preprocessGarment(originalBase64, "image/jpeg");
                workingBase64 = mannequinBase64;
                setTasks(prev => prev.map(t => t.id === task.id ? { ...t, processedImage: `data:image/jpeg;base64,${mannequinBase64}` } : t));
            }

            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'ANALYZING' } : t));
            if (activeTaskId === task.id) setLoadingMessage("提取面料 DNA...");
            const analysis = await analyzeGarmentImage(workingBase64);
            
            if (activeTaskId === task.id) setLoadingMessage("AI 总监规划拍摄脚本...");
            // Pass logger to Director
            const directorConfig = await generateDirectorConfig(analysis, profile, addDevLog);
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, analysis, directorConfig, status: 'GENERATING' } : t));

            if (activeTaskId === task.id) setLoadingMessage("8K 高保真渲染中...");
            // Pass logger to Dispatcher
            const resultBase64 = await generateStyledGarment(
                workingBase64, analysis, profile.sceneStyle, "3:4", 0, 0, 'standard', 'full', 'pan', 'standing', 
                undefined, "image/jpeg", false, null, undefined, 'auto', profile, directorConfig, 
                addDevLog // <--- Logger injected here
            );

            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, resultImage: `data:image/jpeg;base64,${resultBase64}`, status: 'COMPLETED' } : t));
        } catch (e) {
            console.error(e);
            addDevLog("❌ ERROR", JSON.stringify(e));
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'FAILED' } : t));
        }
    };

    const handleStartGeneration = async () => {
        if (tasks.some(t => t.status === 'IDLE')) { setIsBatchProcessing(true); } 
        else if (activeTask && (activeTask.status === 'FAILED' || activeTask.status === 'COMPLETED')) { await processTask(activeTask); }
    };

    // Queue Logic
    useEffect(() => {
        if (!isBatchProcessing) return;
        const activeCount = tasks.filter(t => ['DETECTING', 'PREPROCESSING', 'ANALYZING', 'GENERATING'].includes(t.status)).length;
        const pendingTasks = tasks.filter(t => t.status === 'IDLE');
        if (activeCount < 2 && pendingTasks.length > 0) {
            const tasksToStart = pendingTasks.slice(0, 2 - activeCount);
            tasksToStart.forEach(task => processTask(task));
        } else if (activeCount === 0 && pendingTasks.length === 0) {
            setIsBatchProcessing(false);
        }
    }, [tasks, isBatchProcessing]);

    // Trigger Developer Diary
    const handleTitleClick = () => {
        const newCount = debugClickCount + 1;
        setDebugClickCount(newCount);
        if (newCount >= 5) {
            setShowDevLogs(true);
            setDebugClickCount(0);
        }
    };

    // --- LOGIC CARD DATA PARSING ---
    // Extract Chinese summary parts from profile.stylePreset.summary
    // Format: "Title | Scene | Vibe"
    const summaryParts = profile.stylePreset?.summary?.split('|').map(s => s.trim()) || [];
    const logicTitle = summaryParts[0] || profile.name;
    const logicScene = summaryParts[1] || profile.sceneStyle;
    const logicVibe = summaryParts[2] || "AI 自动匹配";
    const cameraLens = profile.stylePreset?.camera?.lens || "50mm";

    // --- RENDER ---

    return (
        <div className="w-full max-w-[1600px] mx-auto h-[calc(100vh-100px)] flex gap-4 relative p-4">
            
            {showPresetCenter && (
                <PresetCenter 
                    onClose={onClosePresetCenter} 
                    onResetProfile={onResetProfile}
                    onLoadProfile={onLoadProfile}
                    currentProfileId={profile.id}
                />
            )}

            {/* DEV DIARY MODAL */}
            {showDevLogs && (
                <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
                    <div className="w-full max-w-4xl h-[80vh] bg-[#0d1117] border border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden font-mono text-xs">
                        <div className="bg-[#161b22] px-4 py-3 border-b border-gray-700 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span className="ml-2 text-gray-300 font-bold">DEVELOPER DIARY (LIVE TERMINAL)</span>
                            </div>
                            <button onClick={() => setShowDevLogs(false)} className="text-gray-500 hover:text-white">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-6 text-gray-300">
                            {devLogs.length === 0 ? (
                                <div className="opacity-30 text-center mt-20">WAITING FOR PROCESS...</div>
                            ) : (
                                devLogs.map((log, idx) => (
                                    <div key={idx} className="space-y-1">
                                        <div className="flex items-center gap-2 text-blue-400">
                                            <span>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                            <span className="font-bold text-yellow-400">{log.title}</span>
                                        </div>
                                        <div className="pl-4 border-l-2 border-gray-700 text-green-300 whitespace-pre-wrap break-words opacity-80">
                                            {log.content}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* LEFT: ACTIVE AGENT CARD */}
            <div className="w-[300px] shrink-0 flex flex-col h-full gap-4">
                <div className="bg-white rounded-[2.5rem] p-3 shadow-xl shadow-blue-900/5 border border-white/60 relative overflow-hidden group flex-1 flex flex-col">
                    <div className="aspect-[3/4] w-full rounded-[2rem] overflow-hidden relative shadow-inner">
                         <img src={`data:image/jpeg;base64,${profile.anchorImage}`} className="w-full h-full object-cover" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                         <div className="absolute bottom-5 left-5 text-white">
                             <div className="text-[10px] font-bold bg-white/20 backdrop-blur-md px-2 py-1 rounded mb-2 inline-block border border-white/10">当前 Agent</div>
                             <div className="text-xl font-bold">{profile.name.split('+')[0]}</div>
                         </div>
                    </div>
                    <div className="flex-1 p-2 space-y-4 flex flex-col justify-end">
                        {/* REDESIGNED LOGIC CARD */}
                        <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl p-4 border border-blue-100/50 space-y-3 shadow-sm select-none">
                            <div className="flex items-center gap-2 mb-1 cursor-pointer" onClick={handleTitleClick}>
                                <div className="w-1.5 h-1.5 rounded-full bg-fashion-accent animate-pulse"></div>
                                <span className="text-[10px] font-bold text-fashion-accent uppercase tracking-wider">
                                    运行逻辑 (Active Logic)
                                    {debugClickCount > 0 && <span className="ml-1 text-red-500 opacity-50">({5 - debugClickCount})</span>}
                                </span>
                            </div>
                            
                            {/* Main Title */}
                            <div>
                                <div className="text-sm font-black text-gray-900 leading-tight">{logicTitle}</div>
                            </div>

                            {/* Details Grid */}
                            <div className="space-y-2">
                                <div className="flex items-start gap-2 text-xs text-gray-600 bg-white/60 p-1.5 rounded-lg border border-white/50">
                                    <span className="opacity-70 mt-0.5">📍</span>
                                    <span className="font-bold">{logicScene}</span>
                                </div>
                                <div className="flex items-start gap-2 text-xs text-gray-600 bg-white/60 p-1.5 rounded-lg border border-white/50">
                                    <span className="opacity-70 mt-0.5">✨</span>
                                    <span className="font-bold">{logicVibe}</span>
                                </div>
                            </div>
                            
                            {/* Technical Footer */}
                            <div className="pt-2 border-t border-gray-200/50 flex items-center justify-between">
                                 <span className="text-[9px] text-gray-400 font-mono uppercase">Optical Engine</span>
                                 <span className="text-[9px] font-bold text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200 shadow-sm">{cameraLens}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CENTER: CANVAS */}
            <div className="flex-1 bg-white rounded-[2.5rem] shadow-xl shadow-blue-900/5 border border-white/50 relative overflow-hidden flex flex-col">
                <div className="flex-1 relative bg-gray-50/30 overflow-hidden group">
                    {!activeTask ? (
                        <label className="absolute inset-4 flex flex-col items-center justify-center gap-6 cursor-pointer hover:bg-gray-50/50 transition-colors rounded-[2rem] border-2 border-dashed border-gray-200 hover:border-fashion-accent/50 group/upload">
                            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-fashion-accent shadow-sm group-hover/upload:scale-110 transition-transform">
                                <UploadIcon className="w-10 h-10" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-bold text-gray-800">上传服装图片</h3>
                                <p className="text-sm text-gray-400">点击或拖拽上传 (支持批量)</p>
                            </div>
                            <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
                        </label>
                    ) : (
                        <div className="absolute inset-4 flex items-center justify-center">
                            {['DETECTING', 'PREPROCESSING', 'ANALYZING', 'GENERATING'].includes(activeTask.status) && (
                                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
                                    <div className="absolute inset-0 z-0 opacity-50 pointer-events-none">
                                        <Silk speed={3} scale={2} color="#3370ff" />
                                    </div>
                                    <div className="relative z-10 flex flex-col items-center">
                                        <div className="w-16 h-16 border-4 border-gray-200 border-t-fashion-accent rounded-full animate-spin"></div>
                                        <h3 className="text-xl font-bold text-gray-800 mt-6 animate-pulse">{loadingMessage}</h3>
                                    </div>
                                </div>
                            )}
                            <img src={activeTask.resultImage || activeTask.processedImage || activeTask.previewUrl} className="w-full h-full object-contain rounded-xl drop-shadow-2xl" />
                            
                            <div className="absolute top-6 right-6 flex gap-3 z-10">
                                <label className="bg-white/80 backdrop-blur px-4 py-2 rounded-full text-xs font-bold shadow-sm border border-gray-200 hover:bg-white transition-all cursor-pointer">
                                    + 添加更多
                                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* BOTTOM STRIP */}
                <div className="h-28 bg-white border-t border-gray-100 flex flex-col">
                    <div className="h-10 border-b border-gray-50 flex items-center justify-between px-6">
                        <div className="text-xs font-bold text-gray-500">任务队列: {tasks.length}</div>
                        {tasks.length > 0 && (
                            <Button onClick={handleStartGeneration} disabled={isBatchProcessing} className="px-6 py-1 text-xs h-7">
                                {isBatchProcessing ? '处理中...' : '开始队列'}
                            </Button>
                        )}
                    </div>
                    <div className="flex-1 flex items-center px-4 gap-3 overflow-x-auto scrollbar-hide">
                        {tasks.map(task => (
                             <div key={task.id} onClick={() => setActiveTaskId(task.id)} className={`relative h-12 aspect-square rounded-lg overflow-hidden cursor-pointer border-2 ${activeTaskId === task.id ? 'border-fashion-accent' : 'border-gray-200'}`}>
                                 <img src={task.resultImage || task.previewUrl} className="w-full h-full object-cover" />
                                 {task.status === 'COMPLETED' && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-tl-md"></div>}
                             </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
};
