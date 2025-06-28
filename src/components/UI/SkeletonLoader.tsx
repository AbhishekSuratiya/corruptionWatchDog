import React from 'react';
import { clsx } from 'clsx';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular' | 'card';
  lines?: number;
  height?: string;
  width?: string;
}

export default function SkeletonLoader({
  className,
  variant = 'rectangular',
  lines = 1,
  height = 'h-4',
  width = 'w-full'
}: SkeletonLoaderProps) {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer';
  
  if (variant === 'text') {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={clsx(
              baseClasses,
              height,
              index === lines - 1 ? 'w-3/4' : width,
              'rounded',
              className
            )}
          />
        ))}
      </div>
    );
  }

  if (variant === 'circular') {
    return (
      <div
        className={clsx(
          baseClasses,
          'rounded-full aspect-square',
          height,
          width,
          className
        )}
      />
    );
  }

  if (variant === 'card') {
    return (
      <div className={clsx('bg-white rounded-xl shadow-lg overflow-hidden', className)}>
        <div className="h-48 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer" />
        <div className="p-6 space-y-4">
          <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-3/4" />
          <div className="space-y-2">
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded" />
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        baseClasses,
        'rounded-lg',
        height,
        width,
        className
      )}
    />
  );
}