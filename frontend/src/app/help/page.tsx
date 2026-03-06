'use client';

import React from 'react';
import ForensicPageLayout from '@/app/components/ForensicPageLayout';
import { Info, BookOpen, Layers, ShieldCheck, GitMerge, Gavel } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HelpPage() {
    return (
        <ForensicPageLayout
            title="User Journey & Documentation"
            subtitle="Operational Protocols & Strategic Alignment"
            icon={Info}
        >
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                <div className="max-w-5xl mx-auto space-y-12">
                    
                    {/* HERO SECTION */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
                                <BookOpen className="w-8 h-8 text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Zenith Forensic Platform</h2>
                                <p className="text-indigo-400 font-bold uppercase tracking-widest text-sm">Standard Operating Procedures</p>
                            </div>
                        </div>
                        <p className="text-slate-400 max-w-2xl leading-relaxed">
                            The Zenith Platform is designed around a 4-Stage forensic pipeline that transforms raw unstructured evidence into legally admissible adjudications. This guide outlines the core philosophy and operational flow.
                        </p>
                    </section>

                    {/* STAGE CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <StageCard 
                            number="01" 
                            title="Data Ingress" 
                            icon={Layers}
                            color="emerald"
                            desc="The secure entry point (`/ingestion`). Raw CSVs, PDFs, and Evidence are neutralized, schema-aligned, and hashed for immutability."
                        />
                        <StageCard 
                            number="02" 
                            title="Transaction Match" 
                            icon={GitMerge}
                            color="indigo"
                            desc="The Dialectic Engine (`/reconciliation`). Multi-operator swarms (Auditor, Tracer, Judge) debate transaction anomalies and force consensus."
                        />
                        <StageCard 
                            number="03" 
                            title="Investigation Board" 
                            icon={ShieldCheck}
                            color="amber"
                            desc="The War Room (`/forensic/theory-board`). Triangulates Mathematical Proof (Benford), Relational Proof (Nexus), and Visual Proof (GPS/Chat)."
                        />
                        <StageCard 
                            number="04" 
                            title="Case Management" 
                            icon={Gavel}
                            color="rose"
                            desc="The Verdict (`/investigate`). Final adjudication assembly, report generation, and freezing of the case timeline."
                        />
                    </div>

                    {/* DETAILED DOCUMENTATION (Embedded Content) */}
                    <div className="prose prose-invert prose-slate max-w-none">
                        <div className="p-8 bg-slate-900/50 border border-white/5 rounded-3xl space-y-8">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-4">Core Philosophy: &quot;The Dialectic&quot;</h3>
                                <p>
                                    Zenith moves beyond simple &quot;matching&quot; of rows. We believe truth emerges from conflict. 
                                    By pitting three specialized AI agents against each other on every transaction, we uncover 
                                    complex layering schemes that linear logic misses.
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-2">
                                    <h4 className="font-bold text-indigo-400">1. The Auditor</h4>
                                    <p className="text-sm text-slate-400">Searches for mathematical anomalies, round-tripping, and Benford&apos;s Law violations.</p>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-bold text-rose-400">2. The Tracer</h4>
                                    <p className="text-sm text-slate-400">Follows the money. Looks for UBO (Ultimate Beneficial Owner) connections and circular flows.</p>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-bold text-amber-400">3. The Judge</h4>
                                    <p className="text-sm text-slate-400">Weighs the conflicting evidence and issues a calibrated &quot;Probability of Fraud&quot;.</p>
                                </div>
                            </div>

                            <div className="border-t border-white/10 pt-8">
                                <h3 className="text-xl font-bold text-white mb-4">Global Tools</h3>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3">
                                        <div className="mt-1 w-2 h-2 rounded-full bg-indigo-500" />
                                        <div>
                                            <strong className="text-slate-200">Global Repair (Stethoscope):</strong> 
                                            <span className="text-slate-400 ml-2">Accessible from the Top Nav. Allows instant repair of &quot;Quarantined&quot; data rows without leaving your current screen.</span>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="mt-1 w-2 h-2 rounded-full bg-indigo-500" />
                                        <div>
                                            <strong className="text-slate-200">Mission Control (Search):</strong> 
                                            <span className="text-slate-400 ml-2">Omni-search bar (&quot;/&quot;) to jump to any Transaction, Entity, or Evidence file instantly.</span>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ForensicPageLayout>
    );
}

function StageCard({ number, title, icon: Icon, color, desc }: { number: string, title: string, icon: React.ComponentType<{ className?: string }>, color: string, desc: string }) {
    const colorClasses = {
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
        amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    };

    return (
        <motion.div 
            whileHover={{ y: -5 }}
            className={`p-6 rounded-3xl border border-white/5 bg-slate-900/40 relative overflow-hidden group`}
        >
            <div className={`absolute top-0 right-0 p-4 opacity-10 font-black text-6xl ${colorClasses[color as keyof typeof colorClasses].split(' ')[0]}`}>
                {number}
            </div>
            <div className="relative z-10 space-y-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color as keyof typeof colorClasses]}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-black text-slate-200 uppercase tracking-tight mb-2">{title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        {desc.split('`').map((part, i) => i % 2 === 1 ? <code key={i} className="text-indigo-400 font-mono text-xs">{part}</code> : part)}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
