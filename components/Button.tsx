
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  disabled,
  ...props 
}) => {
  const baseStyles = "px-6 py-3 rounded-2xl font-medium transition-all duration-300 flex items-center justify-center gap-2 tracking-wide text-sm active:scale-95";
  
  const variants = {
    primary: "bg-fashion-accent text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
    secondary: "bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white border border-white/60 shadow-sm hover:shadow-md",
    outline: "border border-fashion-accent text-fashion-accent hover:bg-fashion-accent/5"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className} ${isLoading || disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          处理中...
        </>
      ) : children}
    </button>
  );
};
