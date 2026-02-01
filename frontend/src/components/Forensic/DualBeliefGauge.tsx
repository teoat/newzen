'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface DualBeliefGaugeProps {
  positive: number;  // 0.0 to 1.0
  negative: number;  // 0.0 to 1.0
  uncertainty: number; // 0.0 to 1.0
  label?: string;
}

export default function DualBeliefGauge({ positive, negative, uncertainty, label }: DualBeliefGaugeProps) {
  // Normalize if sum > 1
  const total = positive + negative + uncertainty;
  const p = positive / total;
  const n = negative / total;
  const u = uncertainty / total;

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex justify-between items-center px-1">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
          <span className="text-[8px] font-mono text-indigo-400 font-bold">{(p * 100).toFixed(0)}% CONFIDENCE</span>
        </div>
      )}
      
      <div className="relative w-full h-3 glass-tactical rounded-full overflow-hidden flex perspective-1000 shadow-ao">
        {/* Positive Belief Layer (Emerald) */}
        <motion.div 
          initial={{ width: 0 }} 
          animate={{ width: `${p * 100}%` }}
          className="h-full bg-emerald-500/40 shadow-[inset_0_0_10px_rgba(16,185,129,0.5)] border-r border-emerald-500/20"
        />
        
        {/* Uncertainty Gap (The Fog of War) */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-full bg-slate-800/20 shimmer-unverified"
          style={{ width: `${u * 100}%` }}
        />
        
        {/* Negative Belief Layer (Rose) */}
        <motion.div 
          initial={{ width: 0 }} 
          animate={{ width: `${n * 100}%` }}
          className="h-full bg-rose-500/40 shadow-[inset_0_0_10px_rgba(244,63,94,0.5)] border-l border-rose-500/20"
        />
        
        {/* Gloss Overlay for 3D effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
