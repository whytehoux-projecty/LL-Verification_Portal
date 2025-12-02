import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  footer?: React.ReactNode;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  title, 
  description, 
  footer,
  noPadding = false 
}) => {
  return (
    <div className={`bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/60 rounded-xl overflow-hidden shadow-2xl shadow-black/20 ${className}`}>
      {(title || description) && (
        <div className="px-6 py-5 border-b border-zinc-800/60">
          {title && <h3 className="text-lg font-semibold text-zinc-100 tracking-tight">{title}</h3>}
          {description && <p className="mt-1 text-sm text-zinc-400">{description}</p>}
        </div>
      )}
      <div className={noPadding ? '' : 'px-6 py-5'}>
        {children}
      </div>
      {footer && (
        <div className="px-6 py-4 bg-zinc-900/50 border-t border-zinc-800/60">
          {footer}
        </div>
      )}
    </div>
  );
};