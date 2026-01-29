'use client';

/**
 * HOLOGRAPHIC LOADING STATES
 * Reusable skeleton components that create a premium "hologram" effect
 * while data is loading. These disappear smoothly when real data arrives.
 */

import React from 'react';
import { motion } from 'framer-motion';

// Base hologram animation
const hologramPulse = {
  animate: {
    opacity: [0.4, 0.8, 0.4],
    scale: [1, 1.02, 1],
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut" as const,
  },
};



/**
 * Metric Card Skeleton
 * Use for dashboard stat cards
 */
export function SkeletonMetricCard() {
  return (
    <motion.div
      {...hologramPulse}
      className="bg-slate-900/40 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden"
    >
      {/* Hologram scan line effect */}
      <div className="absolute inset-0 hologram-scanline" />
      
      {/* Icon placeholder */}
      <div className="w-12 h-12 bg-indigo-500/20 rounded-xl mb-4" />
      
      {/* Value placeholder */}
      <div className="h-10 w-32 bg-indigo-400/20 rounded-lg mb-2" />
      
      {/* Label placeholder */}
      <div className="h-4 w-24 bg-slate-700/30 rounded" />
      
      {/* Trend indicator */}
      <div className="mt-3 flex items-center gap-2">
        <div className="w-16 h-6 bg-emerald-500/20 rounded-full" />
        <div className="w-20 h-3 bg-slate-700/20 rounded" />
      </div>
    </motion.div>
  );
}

/**
 * Chart Skeleton
 * Use for data visualization areas
 */
export function SkeletonChart({ type = 'bar' }: { type?: 'bar' | 'line' | 'pie' }) {
  return (
    <motion.div
      {...hologramPulse}
      className="bg-slate-900/40 border border-indigo-500/20 rounded-2xl p-6 h-80 relative overflow-hidden"
    >
      {/* Hologram grid */}
      <div className="absolute inset-0 hologram-grid opacity-10" />
      
      <div className="h-6 w-40 bg-slate-700/30 rounded mb-6" />
      
      {type === 'bar' && (
        <div className="flex items-end justify-between h-full gap-4 pb-8">
          {[65, 45, 80, 55, 70, 40, 90, 60].map((height, i) => (
            <div
              key={i}
              className="flex-1 bg-gradient-to-t from-indigo-500/30 to-indigo-400/10 rounded-t-lg relative"
              style={{ height: `${height}%` }}
            >
              {/* Glowing top */}
              <div className="absolute top-0 inset-x-0 h-1 bg-indigo-400/50 blur-sm" />
            </div>
          ))}
        </div>
      )}
      
      {type === 'line' && (
        <div className="relative h-full">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <div
              key={y}
              className="absolute left-0 right-0 border-t border-slate-700/20"
              style={{ top: `${y}%` }}
            />
          ))}
          
          {/* Line path */}
          <svg className="w-full h-full" viewBox="0 0 400 200">
            <motion.path
              d="M 0,100 Q 50,80 100,90 T 200,70 T 300,85 T 400,75"
              stroke="url(#hologramGradient)"
              strokeWidth="3"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.6 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' as const }}
            />
            <defs>
              <linearGradient id="hologramGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(99, 102, 241, 0.2)" />
                <stop offset="50%" stopColor="rgba(99, 102, 241, 0.6)" />
                <stop offset="100%" stopColor="rgba(99, 102, 241, 0.2)" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}
      
      {type === 'pie' && (
        <div className="flex items-center justify-center h-full">
          <div className="relative w-48 h-48">
            {/* Rotating hologram ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' as const }}
              className="absolute inset-0 rounded-full border-4 border-indigo-500/30 border-t-indigo-400/60"
            />
            <div className="absolute inset-4 rounded-full bg-slate-900/60 backdrop-blur-sm" />
          </div>
        </div>
      )}
    </motion.div>
  );
}

/**
 * Table Skeleton
 * Use for data tables
 */
export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <motion.div
      {...hologramPulse}
      className="bg-slate-900/40 border border-indigo-500/20 rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="bg-slate-900/60 border-b border-indigo-500/20 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="h-4 bg-slate-700/40 rounded w-24" />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-slate-800/30">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="p-4 hover:bg-slate-800/20 transition-colors">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIdx) => (
                <div
                  key={colIdx}
                  className="h-4 bg-indigo-500/10 rounded"
                  style={{
                    width: colIdx === 0 ? '60%' : '80%',
                    opacity: 0.4 + (rowIdx * 0.1),
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/**
 * List Skeleton
 * Use for feed items, notifications, case lists
 */
export function SkeletonListItem() {
  return (
    <motion.div
      {...hologramPulse}
      className="bg-slate-900/30 border border-indigo-500/10 rounded-xl p-4 flex items-center gap-4"
    >
      {/* Icon/Avatar */}
      <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex-shrink-0 relative overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-400/20 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' as const }}
        />
      </div>
      
      {/* Content */}
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-700/30 rounded w-3/4" />
        <div className="h-3 bg-slate-700/20 rounded w-1/2" />
      </div>
      
      {/* Action/Status */}
      <div className="w-20 h-6 bg-indigo-500/20 rounded-full flex-shrink-0" />
    </motion.div>
  );
}

/**
 * Upload Zone Skeleton
 * Use during file processing
 */
export function SkeletonUploadProcessing() {
  return (
    <motion.div
      animate={{
        boxShadow: [
          '0 0 20px rgba(99, 102, 241, 0.2)',
          '0 0 40px rgba(99, 102, 241, 0.4)',
          '0 0 20px rgba(99, 102, 241, 0.2)',
        ],
      }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' as const }}
      className="bg-slate-900/60 border-2 border-dashed border-indigo-500/40 rounded-2xl p-12 text-center relative overflow-hidden"
    >
      {/* Scanning effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/10 to-transparent"
        animate={{ y: ['-100%', '200%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' as const }}
      />
      
      <div className="relative z-10">
        {/* Processing icon */}
        <motion.div
          animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' as const }}
          className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-indigo-500/30 border-t-indigo-400"
        />
        
        <div className="h-6 w-48 bg-slate-700/40 rounded mx-auto mb-2" />
        <div className="h-4 w-64 bg-slate-700/20 rounded mx-auto" />
        
        {/* Progress bar */}
        <div className="mt-6 h-2 bg-slate-800/50 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400"
            initial={{ width: '0%' }}
            animate={{ width: ['0%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' as const }}
          />
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Page Header Skeleton
 */
export function SkeletonPageHeader() {
  return (
    <motion.div {...hologramPulse} className="mb-8">
      <div className="h-10 w-64 bg-gradient-to-r from-indigo-500/20 to-transparent rounded-lg mb-3" />
      <div className="h-5 w-96 bg-slate-700/20 rounded" />
    </motion.div>
  );
}

/**
 * Network Graph Skeleton
 * For relationship/nexus visualizations
 */
export function SkeletonNetworkGraph() {
  return (
    <motion.div
      {...hologramPulse}
      className="bg-slate-900/40 border border-indigo-500/20 rounded-2xl p-6 h-[600px] relative overflow-hidden"
    >
      {/* Background grid */}
      <div className="absolute inset-0 hologram-grid opacity-5" />
      
      {/* Animated nodes */}
      <svg className="w-full h-full">
        {/* Central node */}
        <motion.circle
          cx="50%"
          cy="50%"
          r="30"
          fill="rgba(99, 102, 241, 0.2)"
          stroke="rgba(99, 102, 241, 0.6)"
          strokeWidth="2"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' as const }}
        />
        
        {/* Orbiting nodes */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const x = 50 + 35 * Math.cos((angle * Math.PI) / 180);
          const y = 50 + 35 * Math.sin((angle * Math.PI) / 180);
          return (
            <motion.g key={i}>
              {/* Connection line */}
              <motion.line
                x1="50%"
                y1="50%"
                x2={`${x}%`}
                y2={`${y}%`}
                stroke="rgba(99, 102, 241, 0.2)"
                strokeWidth="1"
                strokeDasharray="5,5"
                animate={{
                  strokeDashoffset: [0, -10],
                }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' as const }}
              />
              
              {/* Node */}
              <motion.circle
                cx={`${x}%`}
                cy={`${y}%`}
                r="20"
                fill="rgba(99, 102, 241, 0.1)"
                stroke="rgba(99, 102, 241, 0.4)"
                strokeWidth="2"
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'easeInOut' as const,
                }}
              />
            </motion.g>
          );
        })}
      </svg>
    </motion.div>
  );
}

/**
 * Wrapper component for smooth transition
 * Usage: <HologramWrapper loading={isLoading} skeleton={<SkeletonChart />}>{actualContent}</HologramWrapper>
 */
export function HologramWrapper({
  loading,
  skeleton,
  children,
}: {
  loading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.div className="relative">
      {/* Skeleton layer */}
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {skeleton}
        </motion.div>
      )}
      
      {/* Real content layer */}
      {!loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  );
}
