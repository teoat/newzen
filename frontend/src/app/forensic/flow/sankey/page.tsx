'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GitMerge, 
  Activity, 
  Zap, 
  Layers, 
  AlertTriangle, 
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Landmark
} from 'lucide-react';
import { SankeyService, SankeyFlowResponse, VelocityAlert, LayeringAnalysis } from '../../../../services/SankeyService';
import { useProject } from '../../../../store/useProject';
import { useInvestigation } from '../../../../store/useInvestigation';
import ForensicPageLayout from '../../../../app/components/ForensicPageLayout';

export default function SankeyFlowPage() {
  const { activeProjectId } = useProject();
  const { activeInvestigation } = useInvestigation();
  const activeInvestigationId = activeInvestigation?.id;
  const [flow, setFlow] = useState<SankeyFlowResponse | null>(null);
  const [velocity, setVelocity] = useState<VelocityAlert[]>([]);
  const [layering, setLayering] = useState<LayeringAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);

  // In a real scenario, we'd fetch the cases for the project. For now, we'll try to use the current investigator's active case or a default.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveCaseId(activeInvestigationId || 'CASE-001');
  }, [activeInvestigationId]);

  useEffect(() => {
    if (!activeProjectId || !activeCaseId) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([
      SankeyService.getFlow(activeProjectId, activeCaseId),
      SankeyService.getHighVelocity(activeProjectId, activeCaseId),
      SankeyService.getLayering(activeProjectId, activeCaseId)
    ]).then(([flowData, velocityData, layeringData]) => {
      setFlow(flowData);
      setVelocity(velocityData);
      setLayering(layeringData);
    }).catch(err => {
      console.error(err);
    }).finally(() => {
      setLoading(false);
    });
  }, [activeProjectId, activeCaseId]);

  return (
    <ForensicPageLayout
      title="Money Laundering Tracer"
      subtitle="Sankey Flow // Layering Depth // Velocity Alerts"
      icon={GitMerge}
    >
      <div className="p-8 max-w-[1600px] mx-auto space-y-8 h-full flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 min-h-0">
          
          {/* Main Sankey Area */}
          <div className="lg:col-span-3 flex flex-col gap-6 min-h-0">
             <div className="flex-1 tactical-frame rounded-[3.5rem] bg-slate-900/40 border-white/5 relative overflow-hidden flex flex-col p-10">
                <div className="flex justify-between items-center mb-10">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-600 rounded-lg">
                        <Activity className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Capital Propagation Flow</h3>
                   </div>
                   <div className="flex gap-4">
                      <div className="px-4 py-2 rounded-xl bg-slate-950 border border-white/5 flex flex-col items-end">
                         <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Layers</span>
                         <span className="text-xs font-black text-indigo-400 font-mono">{layering.length} Multi-Hop Paths</span>
                      </div>
                   </div>
                </div>

                <div className="flex-1 relative flex items-center justify-center">
                   {loading ? (
                     <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest animate-pulse">Reconstructing Flow Layers...</span>
                     </div>
                   ) : flow ? (
                      <div className="w-full h-full flex justify-between items-stretch gap-12 py-10">
                         {/* SOURCE COLUMN */}
                         <div className="flex flex-col justify-around">
                            <div className="w-48 p-6 rounded-3xl bg-indigo-600 border border-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.3)] relative group">
                               <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
                               <Landmark className="w-8 h-8 text-white mb-4" />
                               <span className="text-[9px] font-black text-indigo-100 uppercase tracking-widest">Project Ledger</span>
                               <span className="text-sm font-black text-white block truncate uppercase">Main Contract Root</span>
                            </div>
                         </div>

                         {/* MID COLUMN (TRANSFERS) */}
                         <div className="flex-1 flex flex-col justify-center gap-8 px-10 relative">
                            {/* Animated SVG Links */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
                               <defs>
                                  <linearGradient id="linkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                     <stop offset="0%" stopColor="#6366f1" />
                                     <stop offset="100%" stopColor="#f43f5e" />
                                  </linearGradient>
                               </defs>
                               {flow.links.slice(0, 10).map((l, i) => (
                                 <motion.path 
                                    key={i}
                                    d={`M 0 ${50 + i * 10} C 200 ${50 + i * 10}, 200 ${50 + (i % 3) * 30}, 400 ${50 + (i % 3) * 30}`}
                                    stroke="url(#linkGrad)"
                                    strokeWidth={Math.log(l.value) / 2}
                                    fill="none"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 2, delay: i * 0.1 }}
                                 />
                               ))}
                            </svg>
                            
                            {flow.links.slice(0, 4).map((link, i) => (
                               <motion.div 
                                 key={i}
                                 initial={{ opacity: 0, scale: 0.9 }}
                                 animate={{ opacity: 1, scale: 1 }}
                                 transition={{ delay: i * 0.1 }}
                                 className="tactical-card p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md flex items-center justify-between group hover:bg-white/10 transition-all cursor-pointer z-10"
                               >
                                  <div className="flex flex-col">
                                     <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Layer Transmute</span>
                                     <span className="text-[11px] font-black text-white uppercase tracking-tighter truncate max-w-[150px]">{link.target}</span>
                                  </div>
                                  <div className="text-right">
                                     <div className="text-xs font-mono font-black text-rose-400">Rp {(link.value / 1000000).toFixed(1)}M</div>
                                     <div className="text-[8px] font-bold text-slate-600 uppercase">ML-PATH #{i+1}</div>
                                  </div>
                               </motion.div>
                            ))}
                         </div>

                         {/* DESTINATION COLUMN */}
                         <div className="flex flex-col justify-center gap-12">
                            {flow.nodes.filter(n => n.id.includes('ent')).slice(0, 3).map((node, i) => (
                               <div key={node.id} className="w-56 p-5 rounded-3xl bg-slate-950 border border-white/10 flex flex-col gap-3 group relative overflow-hidden">
                                  <div className="absolute inset-0 bg-rose-500/5 animate-pulse opacity-0 group-hover:opacity-100" />
                                  <div className="flex justify-between items-center">
                                     <div className={`p-2 rounded-lg ${i === 0 ? 'bg-rose-500/20 text-rose-500' : 'bg-amber-500/20 text-amber-500'}`}>
                                        <Zap className="w-4 h-4" />
                                     </div>
                                     <ShieldAlert className="w-4 h-4 text-slate-800" />
                                  </div>
                                  <div>
                                     <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Ultimate Beneficiary</span>
                                     <span className="text-xs font-black text-white block uppercase tracking-tighter truncate">{node.label}</span>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>
                   ) : (
                      <div className="text-center text-slate-600 italic text-xs font-black uppercase tracking-widest opacity-50">Empty investigation scope</div>
                   )}
                </div>

                <div className="mt-10 p-6 rounded-[2rem] bg-rose-500/5 border border-rose-500/10 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-900/40">
                         <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Displacement Velocity Warning</p>
                         <p className="text-xs font-bold text-slate-300">Detected capital movement exceeding project burn-rate by 420% in specific vendors.</p>
                      </div>
                   </div>
                   <button className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95">
                      Trace Velocity Source
                   </button>
                </div>
             </div>
          </div>

          {/* Sidebar: Alerts & Analysis */}
          <div className="space-y-8 min-h-0 flex flex-col overflow-hidden">
             
             {/* Velocity Alerts */}
             <div className="tactical-frame p-8 rounded-[2.5rem] bg-amber-500/5 border-amber-500/10 flex flex-col min-h-0">
                <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                   <Activity className="w-3 h-3" /> Velocity Alerts
                </h4>
                <div className="flex-1 space-y-4 overflow-auto custom-scrollbar pr-2">
                   {velocity.map((v, i) => (
                     <div key={i} className="p-4 rounded-xl bg-slate-950 border border-white/5 group hover:border-amber-500/30 transition-all">
                        <div className="flex justify-between items-start mb-2">
                           <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Rapid Fund Turnaround</span>
                           <span className="text-[10px] font-mono text-slate-600 font-bold">{v.timestamp}</span>
                        </div>
                        <p className="text-[10px] font-bold text-white mb-2 leading-tight uppercase truncate">{v.source} <ArrowRight className="w-2 h-2 inline text-slate-600" /> {v.target}</p>
                        <div className="flex justify-between items-center text-[11px] font-black">
                           <span className="text-slate-500 font-mono tracking-tighter">Volume:</span>
                           <span className="text-amber-400 font-mono">Rp {v.amount.toLocaleString()}</span>
                        </div>
                     </div>
                   ))}
                   {velocity.length === 0 && (
                     <div className="text-center py-10 text-[10px] text-slate-700 font-black italic uppercase tracking-widest">No rapid movements detected</div>
                   )}
                </div>
             </div>

             {/* Layering Analysis */}
             <div className="tactical-frame p-8 rounded-[2.5rem] bg-indigo-500/5 border-indigo-500/10 flex flex-col min-h-0">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                   <Layers className="w-3 h-3" /> Money Layering Depth
                </h4>
                <div className="flex-1 space-y-4 overflow-auto custom-scrollbar pr-2">
                   {layering.map((l, i) => (
                     <div key={i} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 transition-all">
                        <div className="flex justify-between items-center mb-4">
                           <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white">
                              {l.hops}
                           </div>
                           <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Layering Multiplier</span>
                        </div>
                        <div className="space-y-1">
                           <div className="flex justify-between text-[11px] font-black">
                              <span className="text-slate-400 uppercase">Path Value</span>
                              <span className="text-indigo-400">Rp {l.total_value.toLocaleString()}</span>
                           </div>
                           <div className="mt-4 flex flex-wrap gap-1">
                              {l.entities.map((ent, ei) => (
                                <span key={ei} className="px-2 py-0.5 rounded bg-slate-900 border border-white/5 text-[7px] font-black text-slate-500 uppercase tracking-tighter">{ent}</span>
                              ))}
                           </div>
                        </div>
                     </div>
                   ))}
                   {layering.length === 0 && (
                     <div className="text-center py-10 text-[10px] text-slate-700 font-black italic uppercase tracking-widest">No complex paths mapped</div>
                   )}
                </div>
             </div>

             <div className="p-6 rounded-[2rem] bg-indigo-600 hover:bg-indigo-500 transition-all flex items-center justify-between group cursor-pointer shadow-lg shadow-indigo-900/40">
                <div>
                   <p className="text-[8px] font-black text-indigo-100 uppercase tracking-widest">Report Generator</p>
                   <p className="text-xs font-black text-white uppercase tracking-tighter">Sankey Deep-Dive PDF</p>
                </div>
                <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
             </div>
          </div>
        </div>
      </div>
    </ForensicPageLayout>
  );
}
