'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Box, Layers, Database } from 'lucide-react';

interface HolographicProjectionProps {
  title?: string;
  subtitle?: string;
  type?: 'network' | 'grid' | 'cube';
}

export default function HolographicProjection({ 
  title = "DATA_PENDING", 
  subtitle = "Awaiting Uplink Synchronization",
  type = 'cube'
}: HolographicProjectionProps) {
  return (
    <div className="flex flex-col items-center justify-center p-20 text-center relative pointer-events-none select-none">
      {/* Glow Backdrop */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[100px]" />
      
      {/* Visual Component */}
      <div className="relative mb-16">
        <div className="absolute inset-0 bg-indigo-500/10 blur-2xl rounded-full" />
        
        {type === 'cube' && (
          <motion.div
            animate={{ 
              rotateY: [0, 360],
              y: [0, -20, 0]
            }}
            transition={{ 
              rotateY: { duration: 10, repeat: Infinity, ease: "linear" },
              y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
            }}
            className="w-32 h-32 relative preserve-3d"
          >
            {[0, 90, 180, 270].map((deg) => (
              <div 
                key={deg}
                className="absolute inset-0 border border-indigo-500/30 bg-indigo-500/5 backdrop-blur-sm"
                style={{ transform: `rotateY(${deg}deg) translateZ(64px)` }}
              />
            ))}
            <div className="absolute inset-0 border border-indigo-500/30 bg-indigo-500/5 backdrop-blur-sm" style={{ transform: 'rotateX(90deg) translateZ(64px)' }} />
            <div className="absolute inset-0 border border-indigo-500/30 bg-indigo-500/5 backdrop-blur-sm" style={{ transform: 'rotateX(-90deg) translateZ(64px)' }} />
            
            <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-indigo-400 animate-pulse" />
          </motion.div>
        )}

        {type === 'grid' && (
            <div className="w-64 h-64 border border-indigo-500/10 rounded-full relative flex items-center justify-center">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 border border-dashed border-indigo-500/20 rounded-full"
                />
                <Database className="w-16 h-16 text-indigo-500/30" />
            </div>
        )}
      </div>

      {/* Text Info */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase flex items-center justify-center gap-4">
            <span className="w-12 h-px bg-indigo-500/50" />
            {title}
            <span className="w-12 h-px bg-indigo-500/50" />
        </h3>
        <p className="text-[10px] font-black text-indigo-400/60 uppercase tracking-[0.5em] font-mono">
            {subtitle}
        </p>
      </motion.div>

      {/* Scanning Line Effect */}
      <motion.div 
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"
      />
      
      {/* System Tags */}
      <div className="mt-12 flex gap-6">
        <SystemTag label="PROTOCOL: 0XF4" value="IDLE" />
        <SystemTag label="SYNC_STAT" value="AWAITING" />
        <SystemTag label="VAULT_LNK" value="ENCRYPTED" />
      </div>
    </div>
  );
}

function SystemTag({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mb-1">{label}</span>
      <span className="text-[10px] font-black text-indigo-500/40 uppercase font-mono">{value}</span>
    </div>
  );
}
