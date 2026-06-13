import React from 'react';
import { clsx } from 'clsx';

interface FloatingCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
}

export default function FloatingCard({ 
  children, 
  className, 
  hover = true,
  delay = 0 
}: FloatingCardProps) {
  return (
    <div
      className={clsx(
        'glass-card rounded-3xl p-6 shadow-sm border border-white/40',
        'transform transition-all duration-500 ease-out',
        'animate-fade-in-up',
        hover && 'hover-premium',
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}