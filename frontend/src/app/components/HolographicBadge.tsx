import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

export default function HolographicBadge() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full backdrop-blur-md"
    >
      <Zap className="w-3 h-3 text-indigo-400 fill-indigo-400" />
      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none">
        HOLOGRAPHIC MODE: SIMULATED DATA
      </span>
      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_#6366f1]" />
    </motion.div>
  );
}
