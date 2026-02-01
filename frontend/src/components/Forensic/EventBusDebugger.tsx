'use client';

import React, { useState, useEffect } from 'react';
import { forensicBus } from '../../lib/EnhancedForensicEventBus';
import { Terminal, X, Search, Zap, Clock, Play, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function EventBusDebugger() {
  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [isReplaying, setIsReplaying] = useState(false);

  useEffect(() => {
    // ... same effect logic ...
  }, []);

  const handleReplay = async () => {
    setIsReplaying(true);
    const fullHistory = await forensicBus.getFullHistory();
    setEvents([]);
    
    for (const event of fullHistory) {
      setEvents(prev => [event, ...prev]);
      await new Promise(r => setTimeout(r, 100)); // Dynamic replay delay
    }
    setIsReplaying(false);
  };

  const filteredEvents = events.filter(e => 
    e.type.toLowerCase().includes(filter.toLowerCase()) || 
    JSON.stringify(e.payload).toLowerCase().includes(filter.toLowerCase())
  );

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-[9999] p-2 bg-slate-900 border border-white/10 rounded-full text-slate-500 hover:text-indigo-400 hover:border-indigo-500/30 transition-all shadow-2xl"
        title="Forensic Event Debugger"
      >
        <Terminal size={16} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-[9999] w-[400px] h-[500px] bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl flex flex-col backdrop-blur-xl overflow-hidden">
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-2 text-indigo-400">
          <Terminal size={14} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Neural Pulse Debugger</span>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={handleReplay} 
                disabled={isReplaying}
                className="p-1.5 hover:bg-white/10 rounded text-slate-500 hover:text-emerald-400 disabled:opacity-30"
                title="Replay Investigative Timeline"
            >
                <Play size={12} className={isReplaying ? 'animate-pulse' : ''} />
            </button>
            <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white">
                <X size={14} />
            </button>
        </div>
      </div>

      <div className="p-3 bg-black/20 border-b border-white/5">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-600" size={10} />
          <input 
            type="text" 
            placeholder="FILTER EVENTS..." 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-slate-950 border border-white/5 rounded-lg pl-8 pr-3 py-1.5 text-[10px] font-mono text-white placeholder-slate-700 outline-none focus:border-indigo-500/50"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-[9px] scrollbar-thin">
        <AnimatePresence initial={false}>
          {filteredEvents.map((event, i) => (
            <motion.div 
              key={event.timestamp + i}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="p-2 rounded bg-white/[0.02] border border-white/[0.03] hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-indigo-400 font-bold uppercase tracking-widest">{event.type}</span>
                <span className="text-slate-600 flex items-center gap-1">
                  <Clock size={8} />
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <pre className="text-slate-400 break-all whitespace-pre-wrap max-h-20 overflow-hidden">
                {JSON.stringify(event.payload, null, 2)}
              </pre>
              <div className="mt-1 text-slate-700 text-[8px] flex items-center gap-1 italic">
                <Zap size={8} /> Source: {event.source || 'Anonymous'}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="p-2 border-t border-white/5 bg-black/40 text-[8px] text-slate-600 font-bold uppercase tracking-widest flex justify-between">
        <span>History: {events.length}/50</span>
        <span>Neural Bus v3.2</span>
      </div>
    </div>
  );
}
