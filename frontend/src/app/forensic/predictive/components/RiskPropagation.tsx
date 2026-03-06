'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { PredictiveExposure } from '../../../../services/PredictiveService';

interface RiskPropagationProps {
  exposure: PredictiveExposure | null;
}

export const RiskPropagation: React.FC<RiskPropagationProps> = ({ exposure }) => {
  return (
    <div className="tactical-card p-8 bg-slate-900 border border-white/5 rounded-[2.5rem] flex flex-col">
      <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-6 italic">Risk Propagation</h3>
      <div className="space-y-6 flex-1">
        {exposure?.highRiskSectors.map((sector: any, i: number) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-1">{sector.sector}</span>
                <span className="text-sm font-black text-white">Rp {(sector.estimatedValue / 1e6).toFixed(0)}M</span>
              </div>
              <span className="text-xs font-mono text-rose-400 font-bold">{(sector.probability * 100).toFixed(0)}% PROB</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: 'var(--risk-progress)' }}
                className="h-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)] w-[var(--risk-progress)]"
                style={{ '--risk-progress': `${sector.probability * 100}%` } as React.CSSProperties}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-5 bg-white/5 border border-white/5 rounded-2xl">
        <div className="flex items-center gap-3 text-indigo-400 mb-2">
          <Zap size={14} />
          <span className="text-[11px] font-black uppercase tracking-widest">Predictive Recommendation</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed font-medium italic">
          System suggests immediate audit of &ldquo;Subcontractor Over-billing&rdquo; clusters in Region 4 to mitigate 35% of predicted exposure.
        </p>
      </div>
    </div>
  );
};
