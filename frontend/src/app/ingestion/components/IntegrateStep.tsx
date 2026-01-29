import React from 'react';
import { motion } from 'framer-motion';
import { 
    CheckCircle, ShieldCheck, AlertTriangle, DatabaseZap, 
    Terminal, Activity, Calculator, Landmark, Plus, ChevronRight 
} from 'lucide-react';
import Link from 'next/link';
import { FileEntry, DiagnosticMetrics } from '../types';

interface IntegrateStepProps {
    files: FileEntry[];
    balanceCheckResult: { matched: boolean; message: string } | null;
    consolidationResults: Record<string, DiagnosticMetrics>;
    handleNotarize: (id: string) => void;
    isNotarizing: boolean;
    notarizedBatches: Record<string, { tx: string, time: string }>;
    resetAll: () => void;
}

export function IntegrateStep({
    files, balanceCheckResult, consolidationResults, handleNotarize,
    isNotarizing, notarizedBatches, resetAll
}: IntegrateStepProps) {
    return (
        <motion.div 
            key="step-integrate" 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
            className="flex-1 flex flex-col items-center justify-center p-20 relative overflow-hidden overflow-y-auto custom-scrollbar"
        >
            <div className="absolute inset-0 bg-[#020617]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-600/10 blur-[150px] rounded-full" />
            
            <div className="relative mb-12">
                <motion.div 
                    initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 10, stiffness: 100 }}
                    className="bg-emerald-600 w-32 h-32 rounded-[3rem] flex items-center justify-center shadow-[0_20px_60px_rgba(16,185,129,0.4)] border-2 border-white/20 relative z-20"
                >
                    <CheckCircle className="w-16 h-16 text-white" />
                </motion.div>
                <div className="absolute -inset-4 border border-emerald-500/20 rounded-[4rem] animate-ping opacity-30 pointer-events-none" />
            </div>
            
            <h2 className="text-6xl font-black text-white italic tracking-tighter uppercase mb-2 leading-none tracking-[0.4em] relative z-10">Consensus Sealed</h2>

            {balanceCheckResult && (
                <div className={`mb-10 px-8 py-4 rounded-2xl border flex items-center gap-6 relative z-10 animate-in slide-in-from-top-4 ${balanceCheckResult.matched ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/5 border-rose-500/20 text-rose-400'}`}>
                    {balanceCheckResult.matched ? <ShieldCheck className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6 animate-bounce" />}
                    <div className="space-y-0.5">
                        <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Balance Integrity: {balanceCheckResult.matched ? 'Verified' : 'Failed'}</p>
                        <p className="text-xs font-bold leading-none">{balanceCheckResult.message}</p>
                    </div>
                </div>
            )}

            <p className="text-slate-500 font-bold uppercase tracking-[0.5em] mb-16 max-w-2xl text-center leading-relaxed relative z-10 text-[10px]">
                {Object.keys(consolidationResults).length} forensic packets verified, normalized, and integrated into the system data lake.
            </p>
            
            <div className="grid grid-cols-1 gap-12 mb-20 relative z-10 w-full max-w-4xl">
                {Object.entries(consolidationResults).map(([fileId, metrics]) => (
                    <div key={fileId} className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-10 flex flex-col gap-10 backdrop-blur-xl">
                        <div className="flex items-center justify-between border-b border-white/5 pb-8">
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                                    <DatabaseZap className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-white uppercase tracking-tight">{files.find(f => f.id === fileId)?.file.name}</h4>
                                    <div className="flex items-center gap-4 mt-1">
                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{metrics.ingestion_type} Stream</span>
                                        {metrics.ingestionId && (
                                            <button 
                                                onClick={() => handleNotarize(metrics.ingestionId!)}
                                                disabled={isNotarizing || !!notarizedBatches[metrics.ingestionId!]}
                                                className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border ${
                                                    notarizedBatches[metrics.ingestionId!] 
                                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                                        : 'bg-indigo-600/20 border-indigo-500/40 text-indigo-400 hover:bg-indigo-600 hover:text-white'
                                                }`}
                                            >
                                                {isNotarizing ? 'Anchoring...' : notarizedBatches[metrics.ingestionId!] ? 'Anchored' : 'Notarize Asset'}
                                            </button>
                                        )}
                                    </div>
                                    {notarizedBatches[metrics.ingestionId!] && (
                                        <div className="mt-2 text-[8px] font-mono text-emerald-500/60 uppercase tracking-tighter truncate max-w-[200px]">
                                            Tx: {notarizedBatches[metrics.ingestionId!].tx}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="text-right">
                                    <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Processed</div>
                                    <div className="text-lg font-black text-emerald-500 font-mono leading-none">{metrics.state_dashboard?.processed || 0}</div>
                                </div>
                                <div className="w-px h-8 bg-white/5 mx-2" />
                                <div className="text-right">
                                    <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Pending</div>
                                    <div className="text-lg font-black text-amber-500 font-mono leading-none">{metrics.state_dashboard?.pending || 0}</div>
                                </div>
                                <div className="w-px h-8 bg-white/5 mx-2" />
                                <div className="text-right">
                                    <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Ignored</div>
                                    <div className="text-lg font-black text-slate-500 font-mono leading-none">{metrics.state_dashboard?.ignored || 0}</div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] flex items-center gap-3 italic">
                                    <Terminal className="w-4 h-4" /> Copilot Inner Monologue
                                </h5>
                                <div className="p-8 bg-black/40 rounded-[2rem] border border-white/5 space-y-6 shadow-inner">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center text-[10px] font-black text-indigo-400 shrink-0">P</div>
                                        <div>
                                            <p className="text-[10px] font-black text-white uppercase tracking-tight mb-1">Primary Theory</p>
                                            <p className="text-[11px] text-slate-400 leading-relaxed italic line-clamp-2">&quot;Verified inflow signatures against established Project Funding tranches using temporal amount parity.&quot;</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-amber-600/20 border border-amber-500/20 flex items-center justify-center text-[10px] font-black text-amber-400 shrink-0">A</div>
                                        <div>
                                            <p className="text-[10px] font-black text-white uppercase tracking-tight mb-1">Alternative Theory</p>
                                            <p className="text-[11px] text-slate-500 leading-relaxed italic line-clamp-2">&quot;Partial Reconciliation: 12% of outliers flagged for manual oversight due to metadata variance.&quot;</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-6 flex flex-col">
                                <h5 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] flex items-center gap-3 italic">
                                    <Activity className="w-4 h-4" /> Reconciliation Rigor
                                </h5>
                                <div className="grid grid-cols-2 gap-4 flex-1">
                                     <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6 flex flex-col justify-between shadow-lg">
                                          <ShieldCheck className="w-6 h-6 text-emerald-500" />
                                          <div>
                                            <div className="text-3xl font-black text-white italic tracking-tighter mb-1">94%</div>
                                            <p className="text-[8px] text-emerald-500/70 font-black uppercase tracking-widest">Automation Trust</p>
                                          </div>
                                     </div>
                                     <div className="bg-rose-500/5 border border-rose-500/20 rounded-3xl p-6 flex flex-col justify-between shadow-lg">
                                          <AlertTriangle className="w-6 h-6 text-rose-500" />
                                          <div>
                                            <div className="text-3xl font-black text-white italic tracking-tighter mb-1">{Object.values(metrics.anomalies || {}).reduce((a, b) => a + b, 0)}</div>
                                            <p className="text-[8px] text-rose-500/70 font-black uppercase tracking-widest">Anomalies Isolated</p>
                                          </div>
                                     </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="flex flex-col items-center gap-8 relative z-10 w-full max-w-4xl">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4 flex items-center gap-3 italic">
                    <div className="w-12 h-px bg-slate-800" /> Protocol Escalation <div className="w-12 h-px bg-slate-800" />
                </h4>
                
                <div className="grid grid-cols-3 gap-6 w-full">
                    <Link href="/reconciliation" className="flex-1">
                        <button className="w-full p-8 rounded-[2.5rem] bg-indigo-600/10 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition-all group flex flex-col items-center text-center gap-4 shadow-xl shadow-indigo-900/10 active:scale-95">
                            <div className="w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                <Activity className="w-7 h-7 text-indigo-400 group-hover:text-white" />
                            </div>
                            <div>
                                <span className="text-[11px] font-black uppercase tracking-widest block mb-1 leading-none">Circuit Matcher</span>
                                <span className="text-[9px] text-slate-500 group-hover:text-indigo-100 font-bold uppercase tracking-tight">Handshake Internal Ledger</span>
                            </div>
                        </button>
                    </Link>
                    
                    <Link href="/forensic/analytics" className="flex-1">
                        <button className="w-full p-8 rounded-[2.5rem] bg-emerald-600/5 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white transition-all group flex flex-col items-center text-center gap-4 shadow-xl shadow-emerald-900/10 active:scale-95">
                            <div className="w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                <Calculator className="w-7 h-7 text-emerald-400 group-hover:text-white" />
                            </div>
                            <div>
                                <span className="text-[11px] font-black uppercase tracking-widest block mb-1 leading-none">RAB Divergence</span>
                                <span className="text-[9px] text-slate-500 group-hover:text-emerald-100 font-bold uppercase tracking-tight">Trace Budget Leakage</span>
                            </div>
                        </button>
                    </Link>

                    <Link href="/forensic/nexus" className="flex-1">
                        <button className="w-full p-8 rounded-[2.5rem] bg-amber-600/5 border border-amber-500/20 hover:bg-amber-600 hover:text-white transition-all group flex flex-col items-center text-center gap-4 shadow-xl shadow-amber-900/10 active:scale-95">
                            <div className="w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                <Landmark className="w-7 h-7 text-amber-400 group-hover:text-white" />
                            </div>
                            <div>
                                <span className="text-[11px] font-black uppercase tracking-widest block mb-1 leading-none">Nexus Linkage</span>
                                <span className="text-[9px] text-slate-500 group-hover:text-amber-100 font-bold uppercase tracking-tight">Map Suspect Nodes</span>
                            </div>
                        </button>
                    </Link>
                </div>
            </div>
            
            <div className="flex gap-8 mt-16 relative z-10">
                <button 
                    onClick={resetAll}
                    className="px-12 py-6 bg-slate-900/50 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-[1.8rem] transition-all border border-white/10 shadow-xl backdrop-blur-xl flex items-center gap-3 active:scale-95"
                >
                    <Plus className="w-4 h-4" /> Ingest New Dataset
                </button>
                <Link href="/" className="px-12 py-6 bg-slate-950 hover:bg-indigo-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-[1.8rem] transition-all shadow-2xl shadow-indigo-900/40 active:scale-95 border border-indigo-400/20 flex items-center justify-center gap-3 group">
                    <span className="group-hover:translate-x-[-2px] transition-transform">Forensic Command</span> <ChevronRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </Link>
            </div>
        </motion.div>
    );
}
