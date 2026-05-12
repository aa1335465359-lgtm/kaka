
import React from 'react';
import { ADVANCED_CONFIG } from './setupData';

interface AdvancedAnatomyPanelProps {
    settings: Record<string, string>;
    onUpdate: (key: string, value: string) => void;
}

export const AdvancedAnatomyPanel: React.FC<AdvancedAnatomyPanelProps> = ({ settings, onUpdate }) => {
    
    const renderSection = (title: string, subtitle: string, sections: any[]) => (
        <div className="bg-white rounded-[1.5rem] border border-gray-100 p-8 mb-8 shadow-sm hover:shadow-md transition-all duration-300">
            {/* Section Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-1.5 h-6 bg-fashion-accent rounded-full"></div>
                    <h3 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h3>
                </div>
                <p className="text-sm text-gray-500 ml-4.5 pl-0.5 border-l-2 border-transparent">{subtitle}</p>
            </div>

            {/* Content Rows */}
            <div className="space-y-8">
                {sections.map((sec) => (
                    <div key={sec.key} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start border-b border-gray-50 pb-8 last:border-0 last:pb-0">
                        {/* Label Side (Left) */}
                        <div className="lg:col-span-2 pt-2 lg:text-right">
                            <label className="text-sm font-bold text-gray-800 block leading-tight">
                                {sec.label.split('(')[0]}
                            </label>
                            <span className="text-[10px] text-gray-400 font-semibold font-mono uppercase tracking-wide block mt-1.5">
                                {sec.label.match(/\((.*?)\)/)?.[1] || sec.key}
                            </span>
                        </div>
                        
                        {/* Options Side (Right) - Grid Layout */}
                        <div className="lg:col-span-10">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                                {sec.options.map((opt: string) => {
                                    const isActive = settings[sec.key] === opt;
                                    // Parse "Chinese (English)" format
                                    const parts = opt.split(' (');
                                    const zh = parts[0];
                                    const en = parts[1] ? parts[1].replace(')', '') : '';
                                    
                                    return (
                                        <button
                                            key={opt}
                                            onClick={() => onUpdate(sec.key, opt)}
                                            className={`
                                                relative group flex flex-col items-center justify-center px-2 py-3 rounded-xl border text-center transition-all duration-200 min-h-[64px]
                                                ${isActive 
                                                    ? 'bg-fashion-accent text-white border-fashion-accent shadow-lg shadow-blue-500/25 transform scale-[1.02] ring-2 ring-blue-500/20 ring-offset-2' 
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm'
                                                }
                                            `}
                                        >
                                            <span className={`text-sm font-bold leading-none mb-1.5 ${isActive ? 'text-white' : 'text-gray-800'}`}>
                                                {zh}
                                            </span>
                                            {en && (
                                                <span className={`text-[9px] font-medium leading-none tracking-tight ${isActive ? 'text-blue-100' : 'text-gray-400'}`}>
                                                    {en}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="w-full pb-10">
            {renderSection(ADVANCED_CONFIG.face.title, ADVANCED_CONFIG.face.subtitle, ADVANCED_CONFIG.face.sections)}
            {renderSection(ADVANCED_CONFIG.makeup.title, ADVANCED_CONFIG.makeup.subtitle, ADVANCED_CONFIG.makeup.sections)}
            {renderSection(ADVANCED_CONFIG.hair.title, ADVANCED_CONFIG.hair.subtitle, ADVANCED_CONFIG.hair.sections)}
            {renderSection(ADVANCED_CONFIG.body.title, ADVANCED_CONFIG.body.subtitle, ADVANCED_CONFIG.body.sections)}
        </div>
    );
};
