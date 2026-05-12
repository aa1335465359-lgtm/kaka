
import React from 'react';
import { ShirtIcon, CameraLensIcon, LightningIcon } from '../Icons';
import Silk from '../Silk';

interface WelcomeStepProps {
  onStart: () => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen flex items-center justify-center relative px-6 md:px-12 lg:px-24 overflow-hidden animate-fade-in">
      
      {/* 3D Background */}
      <div className="absolute inset-0 -z-10">
        <Silk
          speed={5}
          scale={1}
          color="#3370ff"
          noiseIntensity={1.5}
          rotation={0}
        />
      </div>

      {/* Internal Header for Welcome Screen */}
      <nav className="absolute top-0 left-0 right-0 px-8 py-8 flex justify-between items-center z-20">
        <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/20">
                <span className="text-white font-bold text-sm">K</span>
             </div>
             <span className="text-white font-medium tracking-wide text-sm">咔咔 StyleWeave</span>
        </div>
        <div className="hidden md:flex gap-8 text-white/70 text-sm font-medium">
             <a href="#" className="hover:text-white transition-colors">首页</a>
             <a href="#" className="hover:text-white transition-colors">功能</a>
             <a href="#" className="hover:text-white transition-colors">案例</a>
             <a href="#" className="hover:text-white transition-colors">关于</a>
        </div>
      </nav>

      {/* Main Grid Layout - Expanded Max Width */}
      <div className="w-full max-w-[90rem] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
          
          {/* LEFT: Text Content - Slightly wider */}
          <div className="lg:col-span-6 space-y-10 pt-20 lg:pt-0">
             <div className="space-y-6">
                <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight leading-none drop-shadow-2xl">
                    咔咔 <br/>StyleWeave
                </h1>
                <p className="text-lg md:text-xl text-white/80 font-light tracking-wide max-w-lg leading-relaxed mix-blend-overlay">
                    上传服装图，一键生成商业级模特上身效果。
                </p>
             </div>
             
             <button 
                onClick={onStart}
                className="group relative px-10 py-4 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white font-bold tracking-widest overflow-hidden transition-all duration-300 hover:bg-white/20 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
             >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <span className="relative z-10">立即体验</span>
             </button>
          </div>

          {/* RIGHT: Feature Cards - Shifted Right, Larger, No Bounce */}
          <div className="lg:col-span-6 relative flex flex-col gap-6 lg:pl-16 perspective-1000 justify-center">
             
             {/* Decorative Glowing Lines Effect (CSS) */}
             <div className="absolute -inset-20 bg-gradient-to-tr from-white/10 to-gray-500/10 blur-3xl rounded-full opacity-40 animate-pulse-slow pointer-events-none"></div>

             {/* Card 1 - AI 智能试衣 */}
             <div className="transform transition-transform duration-300 hover:scale-[1.02]">
                <div className="w-full h-auto rounded-[24px] bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.1)] group transition-all duration-300">
                    <div className="p-8 flex items-center justify-between w-full text-white min-h-[120px]">
                        <div className="flex flex-col gap-1">
                            <div className="text-2xl font-bold tracking-wide">AI 智能试衣</div>
                            <div className="text-sm text-white/60 font-light">Smart Fitting</div>
                        </div>
                        <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center border border-white/10 group-hover:bg-white/20 transition-colors">
                            <ShirtIcon className="w-7 h-7 text-white" />
                        </div>
                    </div>
                </div>
             </div>

             {/* Card 2 - 商业级渲染 */}
             <div className="transform transition-transform duration-300 hover:scale-[1.02]">
                <div className="w-full h-auto rounded-[24px] bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.1)] group transition-all duration-300">
                    <div className="p-8 flex items-center justify-between w-full text-white min-h-[120px]">
                         <div className="flex flex-col gap-1">
                             <div className="text-2xl font-bold tracking-wide">商业级渲染</div>
                             <div className="text-sm text-white/60 font-light">Pro Rendering</div>
                         </div>
                         <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center border border-white/10 group-hover:bg-white/20 transition-colors">
                             <CameraLensIcon className="w-7 h-7 text-white" />
                         </div>
                    </div>
                </div>
             </div>

             {/* Card 3 - 即时出图 */}
             <div className="transform transition-transform duration-300 hover:scale-[1.02]">
                <div className="w-full h-auto rounded-[24px] bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.1)] group transition-all duration-300">
                    <div className="p-8 flex items-center justify-between w-full text-white min-h-[120px]">
                         <div className="flex flex-col gap-1">
                             <div className="text-2xl font-bold tracking-wide">即时出图</div>
                             <div className="text-sm text-white/60 font-light">Instant Result</div>
                         </div>
                         <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center border border-white/10 group-hover:bg-white/20 transition-colors">
                             <LightningIcon className="w-7 h-7 text-white" />
                         </div>
                    </div>
                </div>
             </div>
          </div>
      </div>
      
    </div>
  );
};
