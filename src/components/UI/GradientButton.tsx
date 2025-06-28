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
  const baseClasses = 'relative inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 ease-out transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden group';
  
  const variants = {
    primary: 'bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white hover:from-red-600 hover:via-red-700 hover:to-red-800 focus:ring-red-500/50 shadow-lg hover:shadow-red-500/25',
    secondary: 'bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800 text-white hover:from-gray-700 hover:via-gray-800 hover:to-gray-900 focus:ring-gray-500/50 shadow-lg hover:shadow-gray-500/25',
    danger: 'bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white hover:from-red-700 hover:via-red-800 hover:to-red-900 focus:ring-red-500/50 shadow-lg hover:shadow-red-500/25',
    success: 'bg-gradient-to-r from-green-500 via-green-600 to-green-700 text-white hover:from-green-600 hover:via-green-700 hover:to-green-800 focus:ring-green-500/50 shadow-lg hover:shadow-green-500/25'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
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
      <span className={clsx('relative z-10', isLoading && 'opacity-0')}>
        {children}
      </span>
    </button>
  );
}