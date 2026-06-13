import React, { useState } from 'react';
import { clsx } from 'clsx';

interface ModernInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export default function ModernInput({
  label,
  error,
  helperText,
  icon,
  className,
  id,
  ...props
}: ModernInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-2">
      {label && (
        <label 
          htmlFor={inputId} 
          className={clsx(
            'block text-sm font-medium transition-colors duration-200',
            error ? 'text-red-600' : 'text-gray-700'
          )}
        >
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors duration-200">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={clsx(
            'block w-full rounded-2xl border bg-white/60 backdrop-blur-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
            'placeholder-gray-400 focus:outline-none',
            icon ? 'pl-10 pr-4 py-3' : 'px-4 py-3',
            error 
              ? 'border-red-300 focus:border-red-500 focus:bg-red-50/30' 
              : 'border-slate-200 focus:border-red-500 focus:bg-white/90 hover:border-slate-300',
            'transform hover:translate-y-[-1px] focus:translate-y-[-1px]',
            className
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        <div className={clsx(
          'absolute inset-0 rounded-2xl pointer-events-none transition-all duration-300',
          isFocused ? 'ring-4 ring-red-500/10 shadow-lg' : ''
        )} />
      </div>
      {error && (
        <p className="text-sm text-red-600 animate-fade-in">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}