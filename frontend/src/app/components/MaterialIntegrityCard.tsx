'use client';
import { motion } from 'framer-motion';
import { HardHat, Info, AlertTriangle, CheckCircle2, TrendingDown, Coins, Activity, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import NeuralCard from './NeuralCard';

interface MaterialMetric {
  theoretical_kg: number;
  actual_kg: number;
  gap_pct: number;
}

interface MaterialForensics {
  theoretical_material_fund: number;
  actual_material_fund: number;
  gap_percentage: number;
  status: string;
  specific_check: {
    cement: MaterialMetric;
    steel: MaterialMetric;
    sand: MaterialMetric;
    stone: MaterialMetric;
  };
  analysis: string;
}

interface Props {
  data: MaterialForensics;
}

export default function MaterialIntegrityCard({ data }: Props) {
  const router = useRouter();
  const isCritical = data.status === 'CRITICAL_GHOST_SPEND';
  const isModerate = data.status === 'MODERATE_ANOMALY';
  
  const statusColor = isCritical ? 'text-rose-500' : isModerate ? 'text-amber-500' : 'text-emerald-500';
  const statusBg = isCritical ? 'bg-rose-500/10' : isModerate ? 'bg-amber-500/10' : 'bg-emerald-500/10';
  const Icon = isCritical ? AlertTriangle : isModerate ? Info : CheckCircle2;

  const commodities = [
    { key: 'cement', label: 'Cement (OPC)', icon: 'CEM', color: 'text-indigo-400' },
    { key: 'steel', label: 'Steel (Rebar)', icon: 'STL', color: 'text-blue-400' },
    { key: 'sand', label: 'Sand (Pasir)', icon: 'SND', color: 'text-amber-400' },
    { key: 'stone', label: 'Stone (Batu)', icon: 'STN', color: 'text-slate-400' },
  ];

  return (
    <NeuralCard 
      status={isCritical ? 'conflict' : isModerate ? 'default' : 'verified'}
      pulse={isCritical}
      className="w-full"
    >
      <div className="flex flex-col h-full">
        {/* Header: Fund Comparison */}
        <div className="flex justify-between items-start mb-12">
           <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${statusBg} ${statusColor} shadow-lg shadow-black/40`}>
                 <Coins className="w-6 h-6" />
              </div>
              <div>
                 <h4 className="text-2xl font-black text-white uppercase tracking-tighter italic">Global Material Synthesis</h4>
                 <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${statusColor}`}>{data.status}</span>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">/ GMF ANALYSIS MODE</span>
                 </div>
              </div>
           </div>
           
           <div className="text-right">
              <div className={`text-4xl font-black font-mono tracking-tighter ${statusColor}`}>
                 {data.gap_percentage.toFixed(1)}%
              </div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Capital Leakage Gap</div>
           </div>
        </div>

        {/* Financial Flow Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
           <div className="space-y-6">
              <div className="p-8 rounded-[2rem] bg-black/40 border border-white/5 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <TrendingDown className="w-12 h-12" />
                 </div>
                 <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Theoretical Liquidity Target</div>
                 <div className="text-3xl font-black text-white font-mono uppercase italic">
                    <span className="text-sm opacity-50 mr-2">IDR</span>
                    {data.theoretical_material_fund.toLocaleString()}
                 </div>
                 <div className="text-[9px] text-indigo-400 font-bold mt-2 tracking-[0.2em] uppercase italic">
                    Calculated based on Engineering Intensity Matrix
                 </div>
              </div>
              
              <div className="p-8 rounded-[2rem] bg-black/40 border border-white/5 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Activity className="w-12 h-12" />
                 </div>
                 <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Realized Fund Output</div>
                 <div className="text-3xl font-black text-white font-mono uppercase italic">
                    <span className="text-sm opacity-50 mr-2">IDR</span>
                    {data.actual_material_fund.toLocaleString()}
                 </div>
                 <div className="text-[9px] text-slate-500 font-bold mt-2 tracking-[0.2em] uppercase italic">
                    Hashed Ledger Reconciliation Result
                 </div>
              </div>
           </div>

           <div className="flex flex-col justify-center gap-8 p-10 rounded-[2.5rem] bg-indigo-600/5 border border-indigo-500/10">
              <div className="flex items-start gap-6">
                 <Icon className={`w-8 h-8 shrink-0 ${statusColor}`} />
                 <div className="space-y-4">
                    <p className="text-sm font-bold text-slate-300 leading-relaxed uppercase tracking-widest italic">
                       {data.analysis}
                    </p>
                    {isCritical && (
                      <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                         <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest animate-pulse leading-loose">
                            Alert: Structural integrity is compromised. The financial leakage indicates significant material substitution or &quot;Ghost Procurement&quot; schemes.
                         </p>
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>

        {/* Commodity Integrity breakdown */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
           {commodities.map((c) => {
             const metric = data.specific_check[c.key as keyof typeof data.specific_check];
             const isWarning = metric.gap_pct > 20;
             
             const handleCommodityClick = () => {
                const searchKeywords = {
                    cement: 'SEMEN',
                    steel: 'BESI',
                    sand: 'PASIR',
                    stone: 'BATU'
                }[c.key as keyof typeof data.specific_check] || '';
                router.push(`/reconciliation?search=${searchKeywords}`);
             };

             return (
               <div 
                  key={c.key} 
                  onClick={handleCommodityClick}
                  className={`p-5 rounded-3xl bg-white/[0.02] border ${isWarning ? 'border-rose-500/30' : 'border-white/5'} transition-all hover:bg-white/[0.05] cursor-pointer group/item`}
               >
                  <div className="flex justify-between items-start mb-4">
                     <span className={`text-[10px] font-black ${c.color} uppercase tracking-widest`}>{c.icon}</span>
                     <div className="flex items-center gap-1">
                        <span className={`text-[10px] font-mono font-black ${isWarning ? 'text-rose-500' : 'text-slate-500'}`}>
                           {metric.gap_pct.toFixed(0)}% GAP
                        </span>
                        <Search className="w-2.5 h-2.5 text-slate-600 group-hover/item:text-white transition-colors" />
                     </div>
                  </div>
                  <div className="space-y-1">
                     <div className="text-xs font-black text-white uppercase italic">{c.label}</div>
                     <div className="text-[10px] font-mono text-slate-500">
                        {metric.actual_kg.toLocaleString()} / {metric.theoretical_kg.toLocaleString()} KG
                     </div>
                  </div>
                  <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                     <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(0, 100 - metric.gap_pct)}%` }}
                        className={`h-full ${isWarning ? 'bg-rose-500' : 'bg-indigo-500'}`}
                     />
                  </div>
               </div>
             );
           })}
        </div>

        <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">FORENSIC ENGINE: GMF-NEXUS v4.0</span>
           </div>
           <div className="flex gap-4">
              <button className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all">
                 Download Audit Log
              </button>
              <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-900/40">
                 Freeze Settlement
              </button>
           </div>
        </div>
      </div>
    </NeuralCard>
  );
}
