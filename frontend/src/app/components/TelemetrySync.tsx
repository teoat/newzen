'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, ShieldCheck } from 'lucide-react';

export default function TelemetrySync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  useEffect(() => {
    // Listen for custom 'telemetry-sync' events that we'll fire from fetch calls
    const handleSync = () => {
        setIsSyncing(true);
        setTimeout(() => setIsSyncing(false), 2000);
        setLastUpdate(new Date().toLocaleTimeString());
    };

    window.addEventListener('telemetry-sync', handleSync);
    return () => window.removeEventListener('telemetry-sync', handleSync);
  }, []);

  return (
    <div className="fixed bottom-6 left-6 z-[100] pointer-events-none">
      <AnimatePresence>
        {isSyncing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-xl border border-indigo-500/30 px-4 py-2 rounded-full shadow-2xl"
          >
            <div className="relative">
                <Radio className="w-4 h-4 text-indigo-400 animate-pulse" />
                <div className="absolute inset-0 bg-indigo-500/20 blur-lg animate-ping rounded-full" />
            </div>
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest whitespace-nowrap">
                Telemetry Syncing...
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {!isSyncing && lastUpdate && (
          <div className="flex items-center gap-2 opacity-30 hover:opacity-100 transition-opacity">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span className="text-[8px] font-mono text-slate-500 uppercase tracking-tighter">
                  Last Secure Link: {lastUpdate}
              </span>
          </div>
      )}
    </div>
  );
}
