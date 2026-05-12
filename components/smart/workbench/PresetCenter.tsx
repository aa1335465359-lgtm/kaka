
import React, { useState, useEffect } from 'react';
import { SmartProfile, StylePreset } from '../../../types';
import { storageService } from '../../../services/storage';
import { Button } from '../../Button';

interface PresetCenterProps {
    onClose: () => void;
    onResetProfile: () => void;
    onLoadProfile: (profile: SmartProfile) => void;
    currentProfileId?: string;
}

export const PresetCenter: React.FC<PresetCenterProps> = ({ onClose, onResetProfile, onLoadProfile, currentProfileId }) => {
    
    // The "Database" of all assets
    const [savedProfiles, setSavedProfiles] = useState<SmartProfile[]>([]);
    
    // Selection State for the 3 Zones
    const [selectedFaceId, setSelectedFaceId] = useState<string | null>(null);
    const [selectedBodyId, setSelectedBodyId] = useState<string | null>(null);
    const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);

    useEffect(() => {
        const profiles = storageService.loadAllProfiles();
        setSavedProfiles(profiles);
        
        // Init selection
        if (currentProfileId) {
            setSelectedFaceId(currentProfileId);
            setSelectedBodyId(currentProfileId);
            setSelectedStyleId(currentProfileId);
        } else if (profiles.length > 0) {
            setSelectedFaceId(profiles[0].id);
            setSelectedBodyId(profiles[0].id);
            setSelectedStyleId(profiles[0].id);
        }
    }, [currentProfileId]);

    const handleEquipCombination = () => {
        const faceSource = savedProfiles.find(p => p.id === selectedFaceId);
        const bodySource = savedProfiles.find(p => p.id === selectedBodyId);
        const styleSource = savedProfiles.find(p => p.id === selectedStyleId);

        if (!faceSource || !bodySource || !styleSource) return;

        // Create a new "Combined" Active Profile
        const newActiveProfile: SmartProfile = {
            id: `combined_${Date.now()}`,
            name: `${faceSource.faceParams.ethnicity.split('(')[0]} + ${styleSource.name.split('+')[1] || 'Mix'}`,
            market: 'domestic',
            
            // Compose Mix
            faceParams: faceSource.faceParams,
            bodyParams: bodySource.bodyParams,
            stylePreset: styleSource.stylePreset,
            sceneStyle: styleSource.sceneStyle,
            sceneDescription: styleSource.sceneDescription,
            
            anchorImage: faceSource.anchorImage,
            generatedDate: Date.now()
        };

        onLoadProfile(newActiveProfile);
        onClose();
    };

    const handleDeleteProfile = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("确认删除此资产?")) {
            storageService.deleteProfile(id);
            setSavedProfiles(prev => prev.filter(p => p.id !== id));
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-gray-100/90 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-white rounded-[2rem] w-full max-w-7xl h-[85vh] flex flex-col shadow-2xl overflow-hidden relative border border-gray-200">
                
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white z-20">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center text-lg">P</span>
                            预设组装中心 (Preset Assembly)
                        </h2>
                        <p className="text-gray-500 text-xs mt-1 font-mono tracking-wider ml-11">COMBINE FACE + BODY + STYLE LOGIC</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onResetProfile} className="px-6 py-2.5 rounded-xl border border-gray-200 hover:border-fashion-accent text-sm font-bold text-gray-600 hover:text-fashion-accent transition-all flex items-center gap-2">
                            <span>+</span> 新建资产
                        </button>
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors">
                            ✕
                        </button>
                    </div>
                </div>

                {/* 4-COLUMN LAYOUT */}
                <div className="flex-1 flex overflow-hidden">
                    
                    {/* ZONE 1: FACE IDENTITY */}
                    <div className="w-1/4 border-r border-gray-100 bg-blue-50/20 flex flex-col">
                        <div className="p-4 border-b border-gray-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                            <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                Face (面部锚点)
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 scrollbar-hide space-y-3">
                            {savedProfiles.map(p => (
                                <div 
                                    key={p.id} 
                                    onClick={() => setSelectedFaceId(p.id)}
                                    className={`relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer transition-all border-4 group
                                        ${selectedFaceId === p.id ? 'border-blue-500 shadow-xl scale-[1.02]' : 'border-transparent opacity-80 hover:opacity-100'}
                                    `}
                                >
                                    <img src={`data:image/jpeg;base64,${p.anchorImage}`} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                                        <div className="text-white font-bold text-sm">{p.faceParams.ethnicity.split('(')[0]}</div>
                                    </div>
                                    <button onClick={(e) => handleDeleteProfile(e, p.id)} className="absolute top-2 right-2 w-5 h-5 bg-red-500/80 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ZONE 2: BODY PARAMS */}
                    <div className="w-1/4 border-r border-gray-100 bg-orange-50/20 flex flex-col">
                        <div className="p-4 border-b border-gray-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                            <h3 className="text-xs font-bold text-orange-500 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                Body (体态指令)
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 scrollbar-hide space-y-3">
                            {/* In a real app, we might deduplicate body configs. Here we list profiles as sources. */}
                            {savedProfiles.map(p => (
                                <div 
                                    key={p.id} 
                                    onClick={() => setSelectedBodyId(p.id)}
                                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all bg-white
                                        ${selectedBodyId === p.id ? 'border-orange-500 bg-orange-50/30 shadow-md' : 'border-gray-100 hover:bg-orange-50/10'}
                                    `}
                                >
                                    <div className="font-bold text-gray-800 text-sm mb-1">{p.bodyParams.bodyType.split('(')[0]}</div>
                                    <div className="text-[10px] text-gray-500 font-mono space-y-1">
                                        <div>M: {p.bodyParams.muscleDefinition || 'Standard'}</div>
                                        <div>C: {p.bodyParams.chest || 'Avg'} | H: {p.bodyParams.hips || 'Avg'}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ZONE 3: STYLE PROTOCOL */}
                    <div className="w-1/4 border-r border-gray-100 bg-purple-50/20 flex flex-col">
                        <div className="p-4 border-b border-gray-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                            <h3 className="text-xs font-bold text-purple-500 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                Style (风格协议)
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 scrollbar-hide space-y-3">
                            {savedProfiles.map(p => (
                                <div 
                                    key={p.id} 
                                    onClick={() => setSelectedStyleId(p.id)}
                                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all bg-white
                                        ${selectedStyleId === p.id ? 'border-purple-500 bg-purple-50/30 shadow-md' : 'border-gray-100 hover:bg-purple-50/10'}
                                    `}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-gray-800 text-xs">{p.stylePreset?.summary?.split('|')[0] || 'Custom'}</span>
                                        <span className="text-[9px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-mono">{p.stylePreset?.camera.lens}</span>
                                    </div>
                                    <div className="text-[9px] text-gray-400 line-clamp-2">
                                        {p.stylePreset?.summary?.split('|')[1] || p.sceneStyle}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ZONE 4: ASSEMBLY */}
                    <div className="w-1/4 bg-gray-50 flex flex-col">
                        <div className="p-4 border-b border-gray-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                            <h3 className="text-xs font-bold text-green-600 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                Assembly (最终组装)
                            </h3>
                        </div>
                        <div className="flex-1 p-6 flex flex-col items-center justify-center">
                            <div className="relative w-full aspect-[3/4] bg-white rounded-3xl shadow-2xl border-8 border-white overflow-hidden group">
                                {/* Visual representation of combination */}
                                <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
                                {selectedFaceId && (
                                    <img 
                                        src={`data:image/jpeg;base64,${savedProfiles.find(p => p.id === selectedFaceId)?.anchorImage}`} 
                                        className="absolute inset-0 w-full h-full object-cover" 
                                    />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-5 text-white">
                                    <div className="text-[10px] text-green-400 font-bold uppercase tracking-widest mb-2">Configuration</div>
                                    
                                    <div className="space-y-2 text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                            <span>{savedProfiles.find(p => p.id === selectedFaceId)?.faceParams.ethnicity.split('(')[0] || '?'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                                            <span>{savedProfiles.find(p => p.id === selectedBodyId)?.bodyParams.bodyType.split('(')[0] || '?'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                                            <span>{savedProfiles.find(p => p.id === selectedStyleId)?.stylePreset?.summary?.split('|')[0] || '?'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full mt-8">
                                <Button 
                                    onClick={handleEquipCombination}
                                    disabled={!selectedFaceId || !selectedBodyId || !selectedStyleId}
                                    className="w-full py-4 shadow-xl shadow-green-500/20"
                                >
                                    装配并进入影棚
                                </Button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};