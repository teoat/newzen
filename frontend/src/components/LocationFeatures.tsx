'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Map as MapIcon } from 'lucide-react';
import { useLocationStore } from '../store/useLocationStore';

export function ProjectRegionTag() {
  const { currentLocation } = useLocationStore();

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full"
    >
      <MapIcon className="w-3 h-3 text-indigo-400" />
      <span className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">
        REGION: {currentLocation.province}
      </span>
    </motion.div>
  );
}
