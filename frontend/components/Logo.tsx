import React from 'react';

interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  variant?: 'full' | 'icon-only';
  theme?: 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({ 
  className = "", 
  iconClassName = "h-8 w-8", 
  textClassName = "text-xl",
  variant = 'full',
  theme = 'dark'
}) => {
  const textColor = theme === 'dark' ? 'text-white' : 'text-zinc-900';
  const subTextColor = theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500';

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Icon: Scales of Justice */}
      <svg 
        viewBox="0 0 64 64" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className={`${iconClassName} text-violet-500`}
        aria-label="LexNova Legal Logo"
      >
        {/* Balance Beam */}
        <path d="M8 18H56" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        {/* Center Post */}
        <path d="M32 10V54" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        {/* Base */}
        <path d="M22 54H42" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        
        {/* Left Pan Chains */}
        <path d="M12 18L12 34" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M20 18L20 34" stroke="currentColor" strokeWidth="1.5"/>
        
        {/* Right Pan Chains */}
        <path d="M44 18L44 34" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M52 18L52 34" stroke="currentColor" strokeWidth="1.5"/>
        
        {/* Left Pan Bowl */}
        <path d="M8 34C8 34 8 42 16 42C24 42 24 34 24 34H8Z" 
          fill="currentColor" 
          fillOpacity="0.1" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinejoin="round"
        />
        
        {/* Right Pan Bowl */}
        <path d="M40 34C40 34 40 42 48 42C56 42 56 34 56 34H40Z" 
          fill="currentColor" 
          fillOpacity="0.1" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinejoin="round"
        />
        
        {/* Top Ring */}
        <circle cx="32" cy="10" r="3" stroke="currentColor" strokeWidth="2" />
      </svg>

      {variant === 'full' && (
        <div className="flex flex-col justify-center">
          <span className={`font-serif font-bold leading-none tracking-tight ${textClassName} ${textColor}`}>
            LexNova
          </span>
          <span className={`font-sans font-bold text-[0.4em] tracking-[0.3em] uppercase ml-[2px] mt-1 ${subTextColor}`}>
            Legal Systems
          </span>
        </div>
      )}
    </div>
  );
};