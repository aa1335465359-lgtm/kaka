
import React from 'react';
import { WorkflowStep, AppMode } from '../types';

interface HeaderProps {
  step: WorkflowStep;
  showPortfolio: boolean;
  portfolioCount: number;
  appMode: AppMode;
  onTogglePortfolio: () => void;
  onReset: () => void;
  onSwitchMode: (mode: AppMode) => void;
  onOpenPresets?: () => void; // New Prop
}

export const Header: React.FC<HeaderProps> = ({ 
  step, 
  showPortfolio, 
  portfolioCount, 
  appMode,
  onTogglePortfolio, 
  onReset,
  onSwitchMode,
  onOpenPresets
}) => {
  const getButtonClass = (mode: AppMode) => `
    px-5 py-1.5 rounded-full text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 min-w-[80px]
    ${appMode === mode 
      ? 'bg-gradient-to-r from-fashion-accent to-blue-600 text-white shadow-md' 
      : 'text-gray-500 hover:text-gray-700 hover:bg-black/5'}
  `;

  return (
    <header className="fixed top-4 left-4 right-4 h-16 bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl z-50 flex items-center shadow-[0_4px_30px_rgba(0,0,0,0.03)] transition-all duration-300">
      <div className="w-full px-8 relative flex items-center justify-between h-full">
        {/* LOGO - TYPOGRAPHIC ONLY */}
        <div className="cursor-pointer group flex-shrink-0" onClick={onReset}>
          <h1 className="text-2xl font-black tracking-tighter text-gray-900 group-hover:text-fashion-accent transition-colors">
            咔咔
          </h1>
        </div>
        
        {/* CENTER: MODE SWITCHER - Absolute Center */}
        {step !== WorkflowStep.WELCOME && (
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 hidden md:flex bg-gray-100/80 p-1 rounded-full border border-gray-200 shadow-inner gap-1">
            <button
              onClick={() => onSwitchMode('smart')}
              className={getButtonClass('smart')}
            >
              Agent 模式
            </button>
            <button
              onClick={() => onSwitchMode('design')}
              className={getButtonClass('design')}
            >
              设计模式
            </button>
            <button
              onClick={() => onSwitchMode('batch')}
              className={getButtonClass('batch')}
            >
              批量模式
            </button>
            <button
              onClick={() => onSwitchMode('extension')}
              className={getButtonClass('extension')}
            >
              延申模式
            </button>
          </div>
        )}
        
        {/* RIGHT: ACTIONS */}
        <div className="flex gap-3 items-center justify-end flex-shrink-0">
           {/* PRESET CENTER BUTTON (Smart Mode Only) */}
           {appMode === 'smart' && step !== WorkflowStep.WELCOME && onOpenPresets && (
             <button 
               onClick={onOpenPresets}
               className="text-xs font-semibold px-4 py-2 rounded-full transition-all duration-300 flex items-center gap-2 bg-white/50 border border-white/60 text-gray-600 hover:text-fashion-accent hover:bg-white hover:shadow-md active:scale-95"
             >
               预设中心
             </button>
           )}

           {portfolioCount > 0 && (
            <button 
              onClick={onTogglePortfolio} 
              className={`text-xs font-semibold px-4 py-2 rounded-full transition-all duration-300 flex items-center gap-2
                ${showPortfolio 
                  ? 'bg-fashion-accent text-white shadow-lg shadow-blue-500/30' 
                  : 'text-gray-500 hover:text-fashion-accent hover:bg-white/50'
                }`}
            >
              {showPortfolio ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
                  </svg>
                  返回创作
                </>
              ) : (
                <>
                  作品集
                  <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md text-[10px]">{portfolioCount}</span>
                </>
              )}
            </button>
           )}
           
          <button 
            onClick={onReset} 
            className="text-xs font-medium text-gray-600 hover:text-fashion-accent transition-colors bg-white/50 border border-white/60 px-5 py-2 rounded-full hover:bg-white hover:shadow-md active:scale-95 duration-200"
          >
            新建项目
          </button>
        </div>
      </div>
    </header>
  );
};
