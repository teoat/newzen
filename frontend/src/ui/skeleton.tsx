'use client';

/**
 * Skeleton Components
 * Provides loading placeholder components for async content
 * 
 * @example
 * ```tsx
 * <SkeletonCard variant="default" />
 * <SkeletonCard variant="metric" />
 * <SkeletonCard variant="alert" count={3} />
 * 
 * <SkeletonLoader loading={isLoading} skeleton={<SkeletonCard />}>
 *   <ActualContent />
 * </SkeletonLoader>
 * ```
 */

import React from 'react';

/**
 * Skeleton card props
 */
interface SkeletonCardProps {
  /** Visual variant of the skeleton */
  variant?: 'default' | 'alert' | 'metric'
  /** Number of items (for alert variant) */
  count?: number
}

/**
 * SkeletonCard - A placeholder component shown while content loads
 */
export function SkeletonCard({ variant = 'default', count = 1 }: SkeletonCardProps) {
  if (variant === 'metric') {
    return (
      <div className="tactical-card p-6 rounded-3xl">
        <div className="animate-pulse space-y-4">
          <div className="h-3 bg-slate-700/50 rounded w-1/3"></div>
          <div className="h-10 bg-slate-700/50 rounded w-2/3"></div>
          <div className="h-2 bg-slate-700/30 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (variant === 'alert') {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="p-5 rounded-2xl bg-slate-800/30 border border-white/5">
            <div className="animate-pulse flex gap-4">
              <div className="w-1.5 h-12 bg-slate-700/50 rounded-full"></div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-4 bg-slate-700/50 rounded w-16"></div>
                  <div className="h-3 bg-slate-700/30 rounded w-24"></div>
                </div>
                <div className="h-4 bg-slate-700/50 rounded w-full max-w-md"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="tactical-card p-6 rounded-2xl">
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-slate-700/50 rounded w-1/4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-slate-700/30 rounded w-full"></div>
          <div className="h-3 bg-slate-700/30 rounded w-5/6"></div>
        </div>
      </div>
    </div>
  );
}

interface SkeletonLoaderProps {
  loading: boolean;
  children: React.ReactNode;
  skeleton?: React.ReactNode;
}

export function SkeletonLoader({ loading, children, skeleton }: SkeletonLoaderProps) {
  if (loading) {
    return <>{skeleton}</> || <SkeletonCard />;
  }
  return <>{children}</>;
}
