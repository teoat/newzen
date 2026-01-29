'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Coins, Landmark, ArrowRight, Shield, AlertTriangle, Download } from 'lucide-react';
import HolographicBadge from '@/app/components/HolographicBadge';
import { HOLOGRAPHIC_SOURCE } from '@/utils/holographicData';
import { useProject } from '@/store/useProject';
import ForensicPageLayout from '@/app/components/ForensicPageLayout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8200';

interface FlowLink {
  source: string;
  target: string;
  value: number;
}

interface CircleMatch {
  pattern: string;
  amount: number;
}

export default function ForensicFlowPage() {
  const { activeProjectId } = useProject();
  const [links, setLinks] = useState<FlowLink[]>([]);
  const [circles, setCircles] = useState<CircleMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const isMock = links.length === 0 && !loading;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !activeProjectId) return;

    async function fetchData() {
      setLoading(true);
      try {
        const [linksRes, circlesRes] = await Promise.all([
          fetch(`${API_URL}/api/v1/forensic/family-tree?project_id=${activeProjectId}`),
          fetch(`${API_URL}/api/v1/forensic/circular-flow?project_id=${activeProjectId}`)
        ]);
        
        if (linksRes.ok) {
           const lData = await linksRes.json();
           if (lData && lData.length > 0) setLinks(lData);
           else setLinks([]);
        } else {
            setLinks([]);
        }
        if (circlesRes.ok) {
           const cData = await circlesRes.json();
           if (cData && cData.length > 0) setCircles(cData);
           else setCircles([]);
        } else {
            setCircles([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [mounted, activeProjectId]);

  if (!mounted) return null;
  
  return (
    <ForensicPageLayout
        title="Termin Flow Tracer"
        subtitle="Contract Capital // Release Milestones // Realization Flow"
        icon={Coins}
        isMockData={isMock}
        loading={loading}
        loadingMessage="Mapping Financial Intersections..."
        headerActions={
            <div className="flex gap-4">
                 <button 
                    onClick={() => window.location.href = `${API_URL}/api/v1/forensic/export/excel?project_id=${activeProjectId}`}
                    className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 border border-emerald-500/20 px-8 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 active:scale-95 shadow-lg shadow-emerald-900/10"
                 >
                    <Download className="w-5 h-5" /> Master Audit Export (.xlsx)
                 </button>
            </div>
        }
    >
        <div className="p-8 space-y-8 overflow-y-auto h-full custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Termin Sankey Visualization */}
                <div className="lg:col-span-2 glass-panel rounded-[2.5rem] p-10 flex flex-col min-h-[600px] border border-white/5 relative overflow-hidden bg-slate-900/40">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -mr-32 -mt-32" />
                
                <h2 className="text-lg font-black mb-12 flex items-center gap-3 uppercase tracking-tight text-white">
                    <Landmark className="w-5 h-5 text-indigo-400" /> Capital Chain Calibration
                </h2>
                
                <div className="flex-1 flex flex-col justify-around relative">
                    <div className="flex justify-between items-center h-full gap-8 relative z-10">
                        {/* Source: Contract */}
                        <div className="flex flex-col items-center gap-6">
                            <div className="w-28 h-28 rounded-full border border-indigo-500/30 flex flex-col items-center justify-center bg-indigo-500/5 shadow-[0_0_40px_rgba(99,102,241,0.1)] relative">
                                <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500/50 animate-spin" style={{ animationDuration: '4s' }} />
                                <Landmark className="w-10 h-10 text-indigo-400" />
                            </div>
                            <div className="text-center">
                                <span className="text-[10px] uppercase font-black text-slate-500 block tracking-widest mb-1">Contract Root</span>
                                <span className="font-black text-sm uppercase tracking-tighter">Main Project Contract</span>
                            </div>
                        </div>
                        
                        {/* Mid: Milestones */}
                        <div className="flex flex-col gap-10 flex-1 items-center pb-12">
                            {(links.length > 0 ? links : HOLOGRAPHIC_SOURCE.terminFlow).filter(l => l.source === "Project Contract" || l.source.includes("Uang Muka") || l.source.includes("Termin")).slice(0, 5).map((link, i) => (
                                <div key={i} className="flex items-center gap-6 w-full max-w-[280px]">
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex-1 p-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 backdrop-blur-sm relative group overflow-hidden"
                                    >
                                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-50" />
                                        <span className="text-[9px] uppercase font-black text-indigo-400 block tracking-widest mb-1">Milestone RELEASE</span>
                                        <span className="font-black text-xs text-white uppercase tracking-tight block">{link.source === "Project Contract" ? link.target : link.source}</span>
                                        <span className="text-[10px] font-mono block text-slate-500 mt-2 font-bold tracking-tighter">Rp {link.value.toLocaleString()}</span>
                                    </motion.div>
                                    <ArrowRight className="w-4 h-4 text-slate-700 animate-pulse" />
                                </div>
                            ))}
                        </div>

                        {/* End: Vendors / Realization */}
                        <div className="flex flex-col gap-4">
                            {(links.length > 0 ? links : HOLOGRAPHIC_SOURCE.terminFlow).filter(l => !l.source.includes("Project") && !l.source.includes("Termin") && !l.source.includes("Uang Muka")).slice(0, 5).map((link, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="w-56 p-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all cursor-pointer group"
                                >
                                    <span className="text-[9px] uppercase font-black text-emerald-500 block tracking-widest mb-1 group-hover:text-emerald-400">Beneficiary Realization</span>
                                    <span className="font-black text-[11px] truncate w-full uppercase tracking-tighter text-slate-200">{link.target}</span>
                                    <span className="text-[10px] font-mono text-slate-600 font-bold block mt-1">Rp {link.value.toLocaleString()}</span>
                                </motion.div>
                            ))}
                            {(links.length > 0 ? links : HOLOGRAPHIC_SOURCE.terminFlow).length > 5 && <div className="text-center text-[10px] text-slate-600 font-black italic tracking-widest uppercase mt-4">Exploring hidden intersections...</div>}
                        </div>
                    </div>
                    
                    <div className="mt-16 p-6 rounded-2xl bg-rose-500/5 border border-rose-500/10 text-[10px] text-rose-400 font-black uppercase tracking-widest text-center flex items-center gap-4 justify-center shadow-xl">
                        <AlertTriangle className="w-5 h-5 animate-bounce" />
                        {isMock ? "SIMULATED ANOMALY: Detected Rp 1.2B diverted from project accounts to CV. Internal Shell." : "Forensic alert: Flow patterns indicate systematic diversion to unverified beneficiaries."}
                    </div>
                </div>
                </div>

                {/* Kickback Loop Detector */}
                <div className="glass-panel rounded-[2.5rem] p-10 space-y-8 border border-white/5 bg-gradient-to-br from-slate-900/40 to-slate-950/40 shadow-2xl overflow-y-auto max-h-[750px] custom-scrollbar">
                <h2 className="text-xl font-black flex items-center gap-3 uppercase tracking-tight text-white border-b border-white/5 pb-6">
                    <Shield className="w-6 h-6 text-rose-500" /> Loop Detection HUD
                </h2>
                
                <div className="space-y-4">
                    {(circles.length > 0 ? circles : (HOLOGRAPHIC_SOURCE.terminFlow as FlowLink[]).filter(l => l.target === "CV. Internal Shell").map(l => ({ pattern: `DIVERSION TARGET: ${l.target}`, amount: l.value }))).map((match, i) => (
                        <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={i} 
                        className="p-5 rounded-2xl border border-rose-500/20 bg-rose-500/5 flex flex-col gap-3 group hover:border-rose-500/40 transition-all shadow-inner"
                        >
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" /> Critical Path Detected
                            </span>
                            <AlertTriangle className="w-4 h-4 text-rose-500" />
                        </div>
                        <p className="text-xs font-black text-white uppercase tracking-tighter leading-normal">{match.pattern}</p>
                        <div className="flex justify-between items-end mt-2 pt-4 border-t border-rose-500/10">
                            <span className="text-[9px] uppercase font-black text-slate-500 tracking-widest">Washing Volume</span>
                            <span className="text-lg font-black font-mono text-rose-500 tracking-tighter">Rp {match.amount.toLocaleString()}</span>
                        </div>
                        </motion.div>
                    ))}
                    
                    {circles.length === 0 && !isMock && (
                        <div className="text-center py-20 text-slate-700 font-black italic uppercase tracking-widest text-xs opacity-50">No circular flows detected in current batch.</div>
                    )}
                </div>

                <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-[9px] text-slate-500 leading-relaxed font-bold uppercase tracking-widest">
                    <span className="text-indigo-400">Forensic Protocol:</span> Cross-referencing Vendor identifiers against project metadata to reveal hidden affinity circles and beneficial ownership.
                </div>
                </div>
            </div>
        </div>
    </ForensicPageLayout>
  );
}
