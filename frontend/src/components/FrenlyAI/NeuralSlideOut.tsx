'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, ChevronLeft, ChevronRight, Zap, ShieldCheck, Mic, Pin, MessageSquare, AlertTriangle } from 'lucide-react';

export default function NeuralSlideOut() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  return (
    <div className="fixed right-0 top-1/4 z-[100] flex items-center">
      {/* Trigger Tab */}
      {mounted && (
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="bg-indigo-600 p-3 rounded-l-2xl shadow-[-10px_0_30px_rgba(79,70,229,0.3)] text-white hover:bg-indigo-500 transition-all border-y border-l border-white/20"
        >
          <span suppressHydrationWarning>
            {isOpen ? <ChevronRight size={20} /> : <BrainCircuit size={20} className="animate-pulse" />}
          </span>
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className="w-[380px] h-[700px] bg-slate-900/95 backdrop-blur-3xl border-l border-white/10 shadow-[-20px_0_60px_rgba(0,0,0,0.6)] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                        <ShieldCheck className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-tighter">Neural Contextualist</h3>
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Active Mission Assistant</p>
                    </div>
                </div>
                <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-rose-500 animate-ping' : 'bg-indigo-500'}`} />
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {/* AI Contextual Observation */}
                <div className="space-y-3">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Contextual Insight</h4>
                    <div className="p-5 bg-indigo-600/10 rounded-3xl border border-indigo-500/20 relative overflow-hidden">
                        <MessageSquare className="absolute -right-2 -bottom-2 w-12 h-12 text-indigo-500/10" />
                        <p className="text-[11px] text-indigo-100 leading-relaxed font-medium">
                            &ldquo;Analyzing the current BOQ line item for &lsquo;Cement&rsquo;. No matching delivery photos found in project repository. This constitutes a <span className="text-rose-400 font-black">Visual Integrity Gap</span>.&rdquo;
                        </p>
                    </div>
                </div>

                {/* Voice Interaction */}
                <div className="space-y-4">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Voice Commands</h4>
                    <button 
                        onClick={() => setIsListening(!isListening)}
                        className={`w-full p-6 rounded-[2rem] border transition-all flex flex-col items-center justify-center gap-3 group
                            ${isListening ? 'bg-rose-500/20 border-rose-500/50' : 'bg-slate-950 border-white/5 hover:border-indigo-500/30'}
                        `}
                    >
                        <div className={`p-4 rounded-full ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-indigo-600/20 text-indigo-400'}`}>
                            <Mic size={24} />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white">
                            {isListening ? 'Listening for Verdict...' : 'Hold to Speak Verdict'}
                        </span>
                    </button>
                </div>

                {/* Tactical Actions */}
                <div className="space-y-3">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Mission Actions</h4>
                    <div className="grid grid-cols-1 gap-2">
                        <button className="w-full p-4 bg-slate-950 hover:bg-indigo-600/20 rounded-2xl border border-white/5 transition-all text-left flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <Pin size={14} className="text-indigo-500" />
                                <span className="text-[11px] font-bold text-slate-300 group-hover:text-white uppercase">Pin current view to Theory</span>
                            </div>
                            <Zap size={12} className="text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                        <button className="w-full p-4 bg-slate-950 hover:bg-rose-600/20 rounded-2xl border border-white/5 transition-all text-left flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <AlertTriangle size={14} className="text-rose-500" />
                                <span className="text-[11px] font-bold text-slate-300 group-hover:text-white uppercase">Flag Integrity Conflict</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Status Footer */}
            <div className="p-4 bg-black/20 border-t border-white/5 text-center">
                <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest italic">NEURAL_STREAM_SYNC_v3.0</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
