
import React, { useState, useRef, useEffect } from 'react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  disabled?: boolean;
  className?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find((opt) => opt.value === value)?.label || value;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between bg-white text-xs font-bold text-gray-700 py-2.5 px-3 rounded-xl shadow-sm transition-all
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:shadow-md cursor-pointer'}
          ${isOpen ? 'ring-2 ring-fashion-accent/20 border-fashion-accent' : 'border border-transparent'}
        `}
      >
        <span className="truncate mr-2">{selectedLabel}</span>
        <svg
          className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 py-1 overflow-hidden animate-fade-in origin-top">
          <div className="max-h-60 overflow-y-auto scrollbar-hide">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 text-xs font-medium transition-colors flex items-center justify-between
                  ${option.value === value ? 'bg-fashion-accent/5 text-fashion-accent' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                `}
              >
                <span>{option.label}</span>
                {option.value === value && (
                  <svg className="w-3 h-3 text-fashion-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
