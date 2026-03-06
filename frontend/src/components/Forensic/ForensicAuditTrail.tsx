'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Fingerprint, Cpu, Search, CheckCircle2, ShieldAlert, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface AuditStep {
    id: string;
    timestamp: string;
    agent: string;
    action: string;
    reasoning: string;
    confidence: number;
    status: 'success' | 'warning' | 'alert';
}

interface ForensicAuditTrailProps {
    steps: AuditStep[];
}

export function ForensicAuditTrail({ steps }: ForensicAuditTrailProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 px-4">
                <Fingerprint className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Chain of Reasoning (AI Audit Trail)</h3>
            </div>

            <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-12 top-0 bottom-0 w-px bg-white/5" />

                <div className="space-y-8">
                    {steps.map((step, idx) => (
                        <motion.div 
                            key={step.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="relative flex gap-8 group"
                        >
                            {/* Step Marker */}
                            <div className="relative z-10 flex flex-col items-center">
                                <div className={`w-24 h-10 rounded-xl border flex items-center justify-center text-[9px] font-black uppercase tracking-tighter ${
                                    step.status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                    step.status === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                    'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                }`}>
                                    {step.agent}
                                </div>
                                <div className="mt-2 text-[8px] font-mono text-slate-600">{new Date(step.timestamp).toLocaleTimeString()}</div>
                            </div>

                            {/* Content */}
                            <Card className="flex-1 p-6 bg-slate-900/50 border-white/5 rounded-[2rem] group-hover:border-indigo-500/30 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="text-xs font-black text-white uppercase tracking-widest mb-1">{step.action}</h4>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Confidence Index</span>
                                            <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-indigo-500" 
                                                    style={{ width: `${step.confidence * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-[9px] font-mono text-indigo-400">{(step.confidence * 100).toFixed(0)}%</span>
                                        </div>
                                    </div>
                                    <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                                        {step.status === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> :
                                         step.status === 'warning' ? <ShieldAlert className="w-4 h-4 text-amber-500" /> :
                                         <Zap className="w-4 h-4 text-rose-500" />}
                                    </div>
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed italic font-medium">
                                    &quot;{step.reasoning}&quot;
                                </p>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
