import React from 'react';
import { clsx } from 'clsx';

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
  glow?: boolean;
}

export default function GradientButton({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  children,
  disabled,
  glow = false,
  ...props
}: GradientButtonProps) {
  const baseClasses = 'relative inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] transform hover:scale-[1.03] active:scale-[0.97] focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden group border border-white/10';
  
  const variants = {
    primary: 'bg-gradient-to-r from-red-600 via-rose-600 to-orange-500 text-white hover:from-red-500 hover:via-rose-500 hover:to-orange-400 focus:ring-red-500/25 shadow-lg shadow-red-600/20 hover:shadow-xl hover:shadow-red-500/30',
    secondary: 'bg-gradient-to-r from-slate-900 via-slate-850 to-zinc-900 text-white hover:from-slate-800 hover:via-slate-750 hover:to-zinc-800 focus:ring-slate-550/20 shadow-lg shadow-slate-900/10 hover:shadow-xl hover:shadow-slate-850/25',
    danger: 'bg-gradient-to-r from-red-700 via-rose-700 to-red-800 text-white hover:from-red-600 hover:via-rose-600 hover:to-red-700 focus:ring-red-600/20 shadow-lg shadow-red-700/20 hover:shadow-xl hover:shadow-red-600/30',
    success: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white hover:from-emerald-500 hover:via-teal-500 hover:to-emerald-450 focus:ring-emerald-500/20 shadow-lg shadow-emerald-650/20 hover:shadow-xl hover:shadow-emerald-500/30'
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-2.5 text-sm',
    lg: 'px-8 py-3.5 text-base'
  };

  const glowClasses = glow ? 'before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700' : '';

  return (
    <button
      className={clsx(
        baseClasses,
        variants[variant],
        sizes[size],
        glowClasses,
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
      <span className={clsx('relative z-10 flex items-center space-x-2', isLoading && 'opacity-0')}>
        {children}
      </span>
    </button>
  );
}