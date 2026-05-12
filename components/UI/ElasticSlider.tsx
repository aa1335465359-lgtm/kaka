
import React from 'react';

interface ElasticSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
  // Deprecated/Compatibility props
  defaultValue?: number;
  startingValue?: number;
  maxValue?: number;
  isStepped?: boolean;
  stepSize?: number;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function ElasticSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  className = '',
}: ElasticSliderProps) {
  // Ensure value is within bounds
  const clampedValue = Math.min(max, Math.max(min, value));
  const percentage = ((clampedValue - min) / (max - min)) * 100;

  return (
    <div className={`relative w-full h-5 flex items-center select-none ${className}`}>
      {/* Visual Track Background */}
      <div className="absolute inset-x-0 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        {/* Fill Track */}
        <div 
           className="h-full bg-fashion-accent transition-all duration-75 ease-out" 
           style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Visual Thumb */}
      <div 
        className="absolute top-1/2 -translate-y-1/2 h-4 w-4 bg-white border-[2.5px] border-fashion-accent rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.15)] pointer-events-none transition-transform active:scale-95"
        style={{ 
            left: `${percentage}%`,
            transform: `translate(-50%, -50%)`
        }}
      />

      {/* Interactive Input (Invisible) */}
      <input
        type="range"
        min={min}
        max={max}
        value={clampedValue}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 m-0 p-0 appearance-none"
      />
    </div>
  );
}
