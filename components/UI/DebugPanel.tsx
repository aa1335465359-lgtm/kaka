
import React from 'react';
import { DebugLog } from '../../types';

interface DebugPanelProps {
  logs: DebugLog[];
  onClose: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ logs, onClose }) => {
  return (
    <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
        <div className="w-full max-w-5xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden font-mono text-xs text-gray-400">
            <div className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <h3 className="text-gray-200 font-bold uppercase tracking-widest">Global Work Logs (Persistent)</h3>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[10px] text-gray-500">Total Entries: {logs.length}</span>
                    <button onClick={onClose} className="text-white/30 hover:text-white transition-colors text-lg px-2">✕</button>
                </div>
            </div>
            <div className="p-6 h-[70vh] overflow-y-auto space-y-6 scrollbar-hide">
                {logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-30 gap-4">
                        <div className="text-4xl">⚡</div>
                        <div>NO ACTIVE LOGS. SYSTEM IDLE.</div>
                    </div>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} className="relative pl-6 border-l border-white/10 group hover:border-fashion-accent/50 transition-colors">
                            <div className={`absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full border bg-[#0a0a0a] transition-colors ${
                                log.status === 'PASS' ? 'border-green-500 bg-green-500/20' : 
                                log.status === 'WARN' ? 'border-yellow-500 bg-yellow-500/20' : 'border-red-500 bg-red-500/20'
                            }`}></div>
                            
                            <div className="flex flex-wrap gap-4 items-center mb-3">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider ${
                                    log.status === 'PASS' ? 'bg-green-500/10 text-green-400' :
                                    log.status === 'WARN' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'
                                }`}>
                                    {log.status} (Score: {log.score})
                                </span>
                                <span className="bg-white/5 text-gray-400 px-2 py-1 rounded text-[10px]">Attempt #{log.attempt}</span>
                                <span className="text-gray-600">{new Date(log.timestamp).toLocaleString()}</span>
                            </div>

                            {/* Detailed Scores Grid */}
                            {log.detailedScores && (
                                <div className="grid grid-cols-5 gap-2 mb-4">
                                    <div className="bg-white/5 p-2 rounded text-center">
                                        <div className="text-[9px] text-gray-500 uppercase">Reference</div>
                                        <div className="text-white font-bold">{log.detailedScores.referenceSimilarity}/35</div>
                                    </div>
                                    <div className="bg-white/5 p-2 rounded text-center">
                                        <div className="text-[9px] text-gray-500 uppercase">Instruction</div>
                                        <div className="text-white font-bold">{log.detailedScores.instructionCompliance}/30</div>
                                    </div>
                                    <div className="bg-white/5 p-2 rounded text-center">
                                        <div className="text-[9px] text-gray-500 uppercase">Structure</div>
                                        <div className="text-white font-bold">{log.detailedScores.structuralIntegrity}/15</div>
                                    </div>
                                    <div className="bg-white/5 p-2 rounded text-center">
                                        <div className="text-[9px] text-gray-500 uppercase">Visual</div>
                                        <div className="text-white font-bold">{log.detailedScores.visualQuality}/15</div>
                                    </div>
                                    <div className="bg-white/5 p-2 rounded text-center">
                                        <div className="text-[9px] text-gray-500 uppercase">Usability</div>
                                        <div className="text-white font-bold">{log.detailedScores.styleUsability}/5</div>
                                    </div>
                                </div>
                            )}

                            {(log.status === 'FAIL' || log.status === 'WARN') && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/5 rounded-lg p-4">
                                    <div>
                                        <div className="text-red-400/80 uppercase tracking-wider text-[9px] mb-1.5 font-bold">Issues Detected</div>
                                        <div className="text-gray-300 leading-relaxed border-l-2 border-red-500/20 pl-3">{log.reason}</div>
                                    </div>
                                    <div>
                                        <div className="text-blue-400/80 uppercase tracking-wider text-[9px] mb-1.5 font-bold">Auto-Correction Prompt</div>
                                        <div className="text-gray-300 leading-relaxed border-l-2 border-blue-500/20 pl-3">{log.regen_prompt}</div>
                                    </div>
                                </div>
                            )}
                            
                            <div className="mt-2">
                                <details className="group/details">
                                    <summary className="cursor-pointer text-gray-600 hover:text-gray-400 text-[10px] select-none">View Full Prompt Used</summary>
                                    <div className="mt-2 p-3 bg-black/30 rounded text-gray-500 whitespace-pre-wrap break-all">
                                        {log.promptUsed}
                                    </div>
                                </details>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    </div>
  );
};
