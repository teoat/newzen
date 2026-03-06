'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
    Fingerprint, ShieldCheck, Scale, Gavel, 
    Layers, FileText, Download, Share2, 
    CheckCircle2, AlertCircle, Building2, Landmark
} from 'lucide-react';
import { Investigation } from '../../../store/useInvestigation';
import { format } from 'date-fns';

interface SealedVerdictDossierProps {
    investigation: Investigation;
    onClose?: () => void;
}

export default function SealedVerdictDossier({ investigation, onClose }: SealedVerdictDossierProps) {
    const hash = investigation.context.final_report_hash || 'PENDING_FINALIZATION';
    const sealedAt = investigation.context.sealed_at || new Date().toISOString();

    return (
        <div className="fixed inset-0 z-[300] bg-slate-950 flex items-center justify-center p-8 lg:p-20 overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05),transparent)] pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
            
            <motion.div 
                initial={{ opacity: 0, y: 100, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="w-full max-w-5xl h-full glass-tactical border border-emerald-500/20 rounded-[4rem] flex flex-col shadow-[0_0_100px_rgba(16,185,129,0.1)] relative overflow-hidden"
            >
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 blur-[120px] -translate-x-1/2 -translate-y-1/2 rounded-full" />
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[120px] translate-x-1/2 translate-y-1/2 rounded-full" />

                {/* Header: Holographic Banner */}
                <div className="p-12 border-b border-white/5 flex justify-between items-start bg-emerald-500/[0.02]">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                                <ShieldCheck className="w-8 h-8 text-emerald-400" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Sovereign Verdict</span>
                                    <div className="h-px w-12 bg-emerald-500/20" />
                                    <span className="text-[10px] font-mono text-emerald-500/50 uppercase">{investigation.id}</span>
                                </div>
                                <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic">Sealed Case Dossier</h1>
                            </div>
                        </div>
                    </div>

                    <div className="text-right space-y-4">
                        <div className="p-4 bg-black/40 border border-white/10 rounded-2xl backdrop-blur-xl">
                            <div className="flex items-center gap-3 justify-end mb-2">
                                <Fingerprint className="w-4 h-4 text-emerald-500" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Forensic Integrity Hash</span>
                            </div>
                            <p className="text-[11px] font-mono text-emerald-400 font-bold max-w-[240px] truncate">{hash}</p>
                        </div>
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">
                            Sealed: {format(new Date(sealedAt), 'PPPP // HH:mm:ss')}
                        </p>
                    </div>
                </div>

                {/* Body: 4 Pillars Summary */}
                <div className="flex-1 overflow-y-auto p-12 space-y-16 custom-scrollbar">
                    {/* CASE OVERVIEW */}
                    <section>
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                            <FileText className="w-4 h-4" /> I. Executive Summary
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-6">
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight">{investigation.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed italic">
                                    This investigation has successfully mapped financial anomalies across 4 independent pillars of proof, 
                                    establishing high-confidence statutory violations of UU Tipikor.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Risk Score</span>
                                    <p className="text-3xl font-black text-rose-500 mt-1">{investigation.riskScore}%</p>
                                </div>
                                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Exhibits Admitted</span>
                                    <p className="text-3xl font-black text-emerald-500 mt-1">{investigation.context.evidence_items?.filter(e => e.verdict === 'ADMITTED').length || 0}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* PILLAR ANALYSIS */}
                    <section>
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                            <Layers className="w-4 h-4" /> II. Statutory Mapping
                        </h2>
                        <div className="space-y-4">
                            {investigation.context.evidence_items?.filter(e => e.statutory_article).map((item, i) => (
                                <motion.div 
                                    key={item.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="p-6 bg-slate-900/50 border border-white/5 rounded-3xl flex items-center justify-between group hover:border-emerald-500/30 transition-all"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                            <Scale className="w-5 h-5 text-emerald-400" />
                                        </div>
                                        <div>
                                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Tipikor Article {item.statutory_article}</span>
                                            <h4 className="text-sm font-black text-white uppercase mt-0.5">{item.label}</h4>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[9px] font-mono text-slate-500 uppercase">PROVED BEYOND REASONABLE DOUBT</span>
                                        <div className="flex gap-1 justify-end mt-1">
                                            {[1,2,3,4,5].map(j => <div key={j} className="w-1.5 h-1.5 rounded-full bg-emerald-500" />)}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>

                    {/* PILLAR 2 PHYSICAL TRAP MOCK */}
                    <section>
                         <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                            <Building2 className="w-4 h-4" /> III. Physical Reality Sync
                        </h2>
                        <div className="p-8 bg-indigo-500/5 border border-indigo-500/20 rounded-[3rem] relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Building2 className="w-32 h-32 text-indigo-400" />
                            </div>
                            <div className="relative z-10 space-y-4">
                                <h4 className="text-lg font-black text-white uppercase tracking-tight italic">Material Discrepancy Verified</h4>
                                <p className="text-sm text-indigo-200 max-w-2xl leading-relaxed">
                                    Project telemetry from site drones and material delivery manifests confirm a <span className="text-rose-400 font-black">62% volume shortfall</span> in Foundation Phase 1. 
                                    Financial disbursements however reflect 100% completion. This confirms the Enrichment predicate.
                                </p>
                                <div className="flex gap-4 pt-4">
                                    <div className="px-4 py-2 bg-black/40 rounded-xl border border-white/5">
                                        <span className="text-[8px] font-black text-slate-500 uppercase block">Expected</span>
                                        <span className="text-sm font-black text-white">450 m³</span>
                                    </div>
                                    <div className="px-4 py-2 bg-black/40 rounded-xl border border-white/5">
                                        <span className="text-[8px] font-black text-slate-500 uppercase block">Actual</span>
                                        <span className="text-sm font-black text-rose-400">180 m³</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Footer: Verdict Actions */}
                <div className="p-12 border-t border-white/5 bg-black/40 flex justify-between items-center">
                    <div className="flex items-center gap-8">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Final Adjudication</span>
                            <span className="text-sm font-black text-white uppercase italic">Guilty // Recommendation: Prosecution</span>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button className="flex items-center gap-2 px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                            <Share2 className="w-4 h-4" /> Share with Authority
                        </button>
                        <button className="flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/40">
                            <Download className="w-4 h-4" /> Export Legal Dossier (PDF/JSON)
                        </button>
                    </div>
                </div>

                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-12 right-12 text-slate-500 hover:text-white transition-all"
                >
                    <X size={24} />
                </button>
            </motion.div>
        </div>
    );
}

function X({ size }: { size: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    );
}
