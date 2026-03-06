'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronUp, ChevronDown, Shield, Zap, Target } from 'lucide-react';

interface PageFeatureCardProps {
  phase: number;
  title: string;
  description: string;
  features: string[];
  howItWorks: string;
}

export default function PageFeatureCard({ 
  phase, 
  title, 
  description, 
  features, 
  howItWorks 
}: PageFeatureCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mt-auto pt-12 w-full max-w-7xl mx-auto">
      <div className="border-t border-white/5 pt-8">
        <div 
          className="group cursor-pointer bg-slate-900/20 border border-white/5 rounded-2xl p-4 hover:bg-slate-900/40 transition-all shadow-lg"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                <BookOpen size={14} />
              </div>
              <div>
                <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] italic">
                  Pillar {phase}: {title} Methodology
                </h4>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                  Reference: Zenith Forensic White Paper v1.0
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
               <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest group-hover:text-slate-400 transition-colors">
                 {isExpanded ? 'Collapse Specs' : 'View Methodology Specs'}
               </span>
               {isExpanded ? <ChevronDown size={12} className="text-slate-500" /> : <ChevronUp size={12} className="text-slate-500" />}
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-white/5 mt-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-indigo-400">
                      <Shield size={10} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Description</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed italic">{description}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-rose-400">
                      <Zap size={10} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Key Capabilities</span>
                    </div>
                    <ul className="space-y-1.5">
                      {features.map((f, i) => (
                        <li key={i} className="text-[9px] text-slate-500 flex items-start gap-2">
                          <span className="text-rose-500/50 mt-0.5">•</span> {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Target size={10} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Forensic Goal</span>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-relaxed font-medium">{howItWorks}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
