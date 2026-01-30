
import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', title }) => {
  return (
    <div className={`glass rounded-2xl p-6 transition-all duration-300 hover:border-violet-500/30 ${className}`}>
      {title && (
        <h3 className="text-sm font-medium text-violet-400 uppercase tracking-widest mb-4 border-b border-white/10 pb-2">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};

export default GlassCard;
