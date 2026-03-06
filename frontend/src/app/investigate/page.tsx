'use client';
export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Gavel, Play, Pause, CheckCircle, FileText, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import ForensicPageLayout from '../../app/components/ForensicPageLayout';
import { useInvestigation } from '../../store/useInvestigation';
import InvestigationList from './components/InvestigationList';
import AdjudicationBench from './components/AdjudicationBench';

export default function InvestigatePage() {
    const searchParams = useSearchParams();
    const focusId = searchParams.get('focus');
    const { activeInvestigation, investigations } = useInvestigation();
    const [selectedId, setSelectedId] = useState<string | undefined>(focusId || activeInvestigation?.id);
    
    // Auto-update if focus param changes late
    React.useEffect(() => {
        if (focusId) setSelectedId(focusId);
    }, [focusId]);
    
    const showBench = !!selectedId;

    const handleSelect = (id: string) => {
        setSelectedId(id);
    };

    const activeCount = investigations.filter(i => i.status === 'active').length;
    const pausedCount = investigations.filter(i => i.status === 'paused').length;
    const completedCount = investigations.filter(i => i.status === 'completed').length;
    const totalActions = investigations.reduce((sum, inv) => sum + inv.timeline.length, 0);

    return (
        <ForensicPageLayout
            title="Stage 4: Case Management"
            subtitle="Adjudicatory Verdict Engine"
            icon={Gavel}
        >
            <div className="flex-1 flex overflow-hidden h-full">
                {/* Left Sidebar: Case Selection */}
                <InvestigationList 
                    onSelect={handleSelect} 
                    selectedId={selectedId}
                />

                {/* Right Area: Adjudication Bench or Dashboard */}
                {showBench ? (
                    <AdjudicationBench investigationId={selectedId!} />
                ) : (
                   <div className="flex-1 overflow-y-auto depth-layer-0 p-10">
                       <motion.h2 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-3xl font-black text-depth-primary uppercase tracking-tighter mb-8"
                       >
                           Command Overview
                       </motion.h2>
                       
                       <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                            <StatCard icon={Play} color="emerald" label="Active" value={activeCount} delay={0.1} />
                            <StatCard icon={Pause} color="amber" label="Paused" value={pausedCount} delay={0.2} />
                            <StatCard icon={CheckCircle} color="indigo" label="Closed" value={completedCount} delay={0.3} />
                            <StatCard icon={FileText} color="rose" label="Total Actions" value={totalActions} delay={0.4} />
                       </div>

                       <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 }}
                            className="flex flex-col items-center justify-center py-20 tactical-frame depth-layer-1 border-dashed depth-border-strong rounded-3xl relative overflow-hidden"
                       >
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none" />
                            <div className="w-20 h-20 bg-indigo-600/10 rounded-full flex items-center justify-center mb-6 border border-indigo-500/20 shadow-lg shadow-indigo-900/20 z-10">
                                <Activity className="w-8 h-8 text-indigo-500 animate-pulse" />
                            </div>
                            <p className="text-depth-secondary font-bold text-xs uppercase tracking-widest leading-relaxed text-center max-w-sm z-10">
                                Select an active case from the sidebar to enter the Adjudication Bench or waiting for inbound evidence from the Forensic Hub.
                            </p>
                       </motion.div>
                   </div>
                )}
            </div>
        </ForensicPageLayout>
    );
}

function StatCard({ icon: Icon, color, label, value, delay }: { icon: React.ComponentType<{ className?: string }>, color: string, label: string, value: number, delay: number }) {
    const colorClasses = {
        emerald: 'text-emerald-500',
        amber: 'text-amber-500',
        indigo: 'text-indigo-500',
        rose: 'text-rose-500',
    };
    
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            className="tactical-card depth-layer-2 p-6 relative overflow-hidden group hover:depth-layer-3 transition-colors depth-elevate"
        >
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${colorClasses[color as keyof typeof colorClasses]}`}>
                <Icon className="w-16 h-16" />
            </div>
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                    <Icon className={`w-5 h-5 ${colorClasses[color as keyof typeof colorClasses]}`} />
                    <span className="text-[11px] font-black text-depth-secondary uppercase tracking-widest">{label}</span>
                </div>
                <p className="text-4xl font-black text-depth-primary tracking-tight">{value}</p>
            </div>
        </motion.div>
    );
}
