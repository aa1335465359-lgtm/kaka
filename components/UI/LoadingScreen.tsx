
import React, { useState, useEffect } from 'react';
import Silk from '../Silk';

interface LoadingScreenProps {
  title: string;
  subTitle?: string;
  messages?: string[];
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ title, subTitle, messages }) => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 2500); 
    return () => clearInterval(interval);
  }, [messages]);

  return (
    <div className="relative w-full min-h-[80vh] rounded-[2.5rem] overflow-hidden flex flex-col items-center justify-center animate-fade-in shadow-[0_20px_50px_rgba(0,0,0,0.05)] bg-white">
          {/* Background Silk Layer */}
          <div className="absolute inset-0 bg-white">
             <Silk speed={3} scale={1.2} color="#3370ff" noiseIntensity={0.8} />
             <div className="absolute inset-0 backdrop-blur-[2px] bg-white/5"></div>
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-6 p-8">
               <div className="flex flex-col items-center gap-2">
                 <h3 className="text-2xl md:text-3xl font-bold text-white tracking-widest uppercase animate-pulse drop-shadow-lg leading-relaxed">
                     {title}
                 </h3>
                 <span className="text-[10px] text-white/60 font-mono tracking-[0.2em] uppercase">AI Analysis V2.0</span>
              </div>
              
              {/* Spinner */}
              <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin drop-shadow-md"></div>

              {/* Dynamic Message - Directly on background, no frosted pill */}
              {((messages && messages.length > 0) || subTitle) && (
                  <div className="text-sm text-white/90 font-medium tracking-wide animate-fade-in px-4 py-1.5">
                    {messages ? messages[msgIndex] : subTitle}
                  </div>
              )}
          </div>
    </div>
  );
};
