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
        'bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl',
        'transform transition-all duration-700 ease-out',
        'animate-fade-in-up',
        hover && 'hover:scale-105 hover:shadow-2xl hover:-translate-y-2',
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}