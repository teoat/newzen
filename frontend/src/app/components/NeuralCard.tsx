'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface NeuralCardProps {
  children: React.ReactNode;
  className?: string;
  pulse?: boolean;
  status?: 'default' | 'verified' | 'conflict';
}

export default function NeuralCard({ 
  children, 
  className = "", 
  pulse = false, 
  status = 'default' 
}: NeuralCardProps) {
  const statusColors = {
    default: 'var(--neural-glow)',
    verified: 'var(--neural-emerald)',
    conflict: 'var(--neural-conflict)'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={`v3-logic-card p-0 rounded-[2.5rem] relative group overflow-hidden ${className}`}
    >
      {/* Neural Focus Border */}
      <div className="absolute inset-0 border border-white/5 rounded-[2.5rem] group-hover:border-indigo-500/30 transition-colors duration-500" />
      
      {/* Pulse Ornament */}
      {pulse && (
        <div 
          className={`absolute top-6 right-6 w-2 h-2 rounded-full animate-pulse shadow-lg ${
            status === 'verified' ? 'bg-emerald-500 shadow-emerald-500/50' :
            status === 'conflict' ? 'bg-rose-500 shadow-rose-500/50' :
            'bg-indigo-500 shadow-indigo-500/50'
          }`}
        />
      )}

      {/* Internal Glare */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10 p-8 h-full flex flex-col">
        {children}
      </div>

      {/* v3 Scanning Line */}
      <motion.div 
        initial={{ top: '-100%' }}
        animate={{ top: '200%' }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-20 bg-gradient-to-b from-transparent via-indigo-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </motion.div>
  );
}
