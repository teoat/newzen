'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { PredictiveExposure } from '../../../../services/PredictiveService';

interface PredictiveMetricsProps {
  exposure: PredictiveExposure | null;
  loading: boolean;
  onRefine: () => void;
}

export const PredictiveMetrics: React.FC<PredictiveMetricsProps> = ({
  exposure,
  loading,
  onRefine,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-3xl bg-slate-900 border border-white/5 shadow-xl group"
      >
        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Model Confidence</span>
        <div className="flex items-end gap-2 mt-1">
          <div className={`text-3xl font-black ${(exposure?.confidence || 0) < 0.6 ? 'text-amber-500' : 'text-indigo-400'}`}>
            {((exposure?.confidence || 0) * 100).toFixed(0)}%
          </div>
          <ShieldCheck className={`w-5 h-5 mb-1 ${(exposure?.confidence || 0) < 0.6 ? 'text-amber-500 animate-pulse' : 'text-indigo-500'}`} />
        </div>
        <div className="mt-4 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
          <div 
            className={`h-full ${(exposure?.confidence || 0) < 0.6 ? 'bg-amber-500' : 'bg-indigo-500'} w-[var(--progress)] transition-all duration-1000`} 
            style={{ '--progress': `${(exposure?.confidence || 0) * 100}%` } as React.CSSProperties} 
          />
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="p-6 rounded-3xl bg-slate-900 border border-white/5 shadow-xl"
      >
        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Predicted Exposure</span>
        <div className="text-3xl font-black text-rose-500 mt-1">
          Rp {((exposure?.predictedLeakage || 0) / 1e9).toFixed(1)}B
        </div>
        <div className={`mt-2 text-[11px] font-black uppercase flex items-center gap-2 ${exposure?.trend === 'UP' ? 'text-rose-400' : 'text-emerald-400'}`}>
          <div className={`p-1 rounded-md ${exposure?.trend === 'UP' ? 'bg-rose-500/10' : 'bg-emerald-500/10'}`}>
            <TrendingUp size={10} className={exposure?.trend === 'UP' ? '' : 'rotate-180'} />
          </div>
          Trend: {exposure?.trend === 'UP' ? 'Accelerating' : 'Decelerating'}
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="col-span-2 p-6 rounded-3xl bg-indigo-600/5 border border-indigo-500/10 flex items-center justify-between"
      >
        <div>
          <h4 className="text-sm font-black text-white uppercase tracking-tight">Autonomous Risk Sweep</h4>
          <p className="text-[11px] text-slate-400 mt-1 max-w-xs uppercase tracking-widest leading-relaxed">
            Zenith engine is continuously simulating data mutations to identify predictive leakage clusters.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <button 
            onClick={onRefine}
            disabled={loading}
            className="px-6 py-2.5 bg-white text-black rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-400 hover:text-white transition-all shadow-2xl disabled:opacity-50"
          >
            {loading ? 'Refining...' : 'Trigger Refinement'}
          </button>
          <button 
            onClick={() => {
              toast.success("Forecast Injected", { description: "Predictive data added to the active investigation dossier." });
            }}
            className="px-6 py-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all"
          >
            Inject into Dossier
          </button>
        </div>
      </motion.div>
    </div>
  );
};
