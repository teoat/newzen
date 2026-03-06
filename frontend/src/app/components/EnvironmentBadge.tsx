'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Terminal, ShieldAlert, Cpu } from 'lucide-react';

export default function EnvironmentBadge() {
  const env = process.env.NEXT_PUBLIC_APP_ENV || 'development';
  const isProd = env === 'production';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-xl border font-black uppercase tracking-[0.2em] text-[11px]
        ${isProd 
          ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
          : 'bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]'}
      `}
      title={isProd ? 'LIVE_OPS / SOVEREIGN TIER' : 'DEV_ENV / TIER_0'}
    >
      {isProd ? (
        <>
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>LIVE_OPS</span>
          <span className="opacity-30">/</span>
          <span className="font-mono">SOV_TIER</span>
          <span className="ml-2 px-1.5 py-0.5 rounded bg-indigo-500/20 text-[8px] border border-indigo-500/30">STATIC</span>
        </>
      ) : (
        <>
          <Terminal className="w-3.5 h-3.5" />
          <span>DEV_ENV</span>
          <span className="opacity-30">/</span>
          <span className="font-mono">TIER_0</span>
          <div className="ml-2 flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-amber-500/20 text-[8px] border border-amber-500/30">
            <div className="w-1 h-1 bg-amber-400 rounded-full animate-pulse" />
            <span>HOT_RELOAD: ACTIVE</span>
          </div>
        </>
      )}
      
      {/* Decorative scan-line or pulse */}
      <motion.div
        animate={{ opacity: [0.1, 0.4, 0.1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className={`w-1.5 h-1.5 rounded-full ${isProd ? 'bg-indigo-400' : 'bg-amber-400'}`}
      />
    </motion.div>
  );
}
