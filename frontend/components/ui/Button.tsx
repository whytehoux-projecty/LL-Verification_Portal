import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  isLoading, 
  className = '', 
  disabled,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const variants = {
    primary: "bg-white text-zinc-950 hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-transparent",
    secondary: "bg-zinc-900 text-zinc-100 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700",
    danger: "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20",
    ghost: "bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-800/50",
    glass: "bg-white/5 text-white backdrop-blur-md border border-white/10 hover:bg-white/10",
  };

  return (
    <button
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {children}
    </button>
  );
};