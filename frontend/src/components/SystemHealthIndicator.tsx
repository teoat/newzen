'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { useWebSocketUpdates } from '../hooks/useWebSocketUpdates';
import { useProject } from '../store/useProject';

export default function SystemHealthIndicator() {
  const { activeProjectId } = useProject();
  // Using a dummy project ID if none selected to check base connection health
  const { connectionStatus } = useWebSocketUpdates(activeProjectId || 'system');

  const statusConfig = {
    connecting: {
      color: 'text-amber-400',
      icon: RefreshCw,
      label: 'Syncing',
      animate: 'animate-spin',
    },
    connected: {
      color: 'text-emerald-400',
      icon: Wifi,
      label: 'Live',
      animate: '',
    },
    disconnected: {
      color: 'text-slate-500',
      icon: WifiOff,
      label: 'Polling',
      animate: '',
    },
    error: {
      color: 'text-rose-500',
      icon: AlertCircle,
      label: 'Offline',
      animate: 'animate-pulse',
    },
  };

  const config = statusConfig[connectionStatus];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/50 border border-white/5 backdrop-blur-md ${config.color} transition-colors duration-500`}>
      <Icon size={12} className={config.animate} />
      <span className="text-[11px] font-black uppercase tracking-[0.2em]">
        {config.label}
      </span>
      {connectionStatus === 'disconnected' && (
        <div className="flex gap-0.5 ml-1">
          <motion.div 
            animate={{ opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 2, times: [0, 0.5, 1] }}
            className="w-1 h-1 rounded-full bg-current" 
          />
          <motion.div 
            animate={{ opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 2, delay: 0.3, times: [0, 0.5, 1] }}
            className="w-1 h-1 rounded-full bg-current" 
          />
          <motion.div 
            animate={{ opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 2, delay: 0.6, times: [0, 0.5, 1] }}
            className="w-1 h-1 rounded-full bg-current" 
          />
        </div>
      )}
    </div>
  );
}
