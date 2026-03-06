import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, Flame, Clock, ShieldCheck } from 'lucide-react';

interface ProphetBurnCounterProps {
  initialDays: number;
  burnRate: number; // Rp per Day
  totalBudget: number;
  remainingBudget: number;
}

const ProphetBurnCounter: React.FC<ProphetBurnCounterProps> = ({ 
  initialDays, 
  burnRate, 
  totalBudget, 
  remainingBudget 
}) => {
  const [days, setDays] = useState(initialDays);
  
  // Simulated countdown effect
  useEffect(() => {
    const timer = setInterval(() => {
      setDays(prev => Math.max(0, prev - 0.0001));
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const percentage = (remainingBudget / totalBudget) * 100;

  return (
    <div className="bg-slate-950 border border-white/5 rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
      {/* Background Pulse */}
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Flame className="w-32 h-32 text-rose-500 animate-pulse" />
      </div>

      <div className="flex justify-between items-start mb-8 relative z-10">
        <div>
          <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">Prophet exhaustion forecast</h3>
          <p className="text-slate-500 text-[11px] font-mono tracking-[0.3em] uppercase mt-1">Real-Time Burn Rate Analysis</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full">
            <TrendingDown className="w-3 h-3 text-rose-500" />
            <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest">Accelerated Alpha</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
        <div className="space-y-8">
            <div>
                <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Estimated Days to Depletion</div>
                <div className="text-6xl font-black text-white italic tracking-tighter tabular-nums">
                    {days.toFixed(4)}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Capital Reservoir</span>
                    <span className="text-xs font-black text-white uppercase">{percentage.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className={`h-full ${percentage < 20 ? 'bg-rose-500 shadow-[0_0_12px_#f43f5e]' : 'bg-indigo-500'}`}
                    />
                </div>
            </div>
        </div>

        <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                    <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Current Burn Rate</div>
                    <div className="text-sm font-black text-white uppercase">Rp {burnRate.toLocaleString()}/Day</div>
                </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                    <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Prophet Confidence</div>
                    <div className="text-sm font-black text-white uppercase">98.42% Sovereign</div>
                </div>
            </div>
            
            <p className="text-[11px] text-slate-500 leading-relaxed uppercase font-bold italic">
                Zenith Prophet detected a 14% increase in non-BIM related expenses in the last 48 hours.
            </p>
        </div>
      </div>
    </div>
  );
};

export default ProphetBurnCounter;
