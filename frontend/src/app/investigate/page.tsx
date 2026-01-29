'use client';

import React, { useState } from 'react';
import { Gavel, Play, Pause, CheckCircle, FileText, Activity } from 'lucide-react';
import ForensicPageLayout from '@/app/components/ForensicPageLayout';
import { useInvestigation } from '@/store/useInvestigation';
import InvestigationList from './components/InvestigationList';
import AdjudicationBench from './components/AdjudicationBench';

export default function VerdictCommandPage() {
    const { activeInvestigation, investigations } = useInvestigation();
    const [selectedId, setSelectedId] = useState<string | undefined>(activeInvestigation?.id);
    // Derived state instead of effect
    // const showDashboard = !selectedId;
    
    // Actually, let's keep showDashboard state but update it in handleSelect, and init based on selectedId
    // Or just use the derivation directly in render.
    // If we want to allow manually showing dashboard even if ID is selected (e.g. "Close" button), we need state.
    // But here, the effect just mirrors selectedId presence.
    
    // Removing the effect and variable, deriving directly in render logic or making it a toggle.
    // Let's stick to the behavior: if selectedId is present, show bench.
    
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
            title="Verdict Command"
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
                       <h2 className="text-3xl font-black text-depth-primary uppercase tracking-tighter mb-8">Command Overview</h2>
                       
                       <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                            <StatCard icon={Play} color="emerald" label="Active" value={activeCount} />
                            <StatCard icon={Pause} color="amber" label="Paused" value={pausedCount} />
                            <StatCard icon={CheckCircle} color="indigo" label="Closed" value={completedCount} />
                            <StatCard icon={FileText} color="rose" label="Total Actions" value={totalActions} />
                       </div>

                       <div className="flex flex-col items-center justify-center py-20 tactical-frame depth-layer-1 border-dashed depth-border-strong rounded-3xl">
                            <div className="w-20 h-20 bg-indigo-600/10 rounded-full flex items-center justify-center mb-6 border border-indigo-500/20 shadow-lg shadow-indigo-900/20">
                                <Activity className="w-8 h-8 text-indigo-500 animate-pulse" />
                            </div>
                            <p className="text-depth-secondary font-bold text-xs uppercase tracking-widest leading-relaxed text-center max-w-sm">
                                Select an active case from the sidebar to enter the Adjudication Bench or waiting for inbound evidence from the Forensic Hub.
                            </p>
                       </div>
                   </div>
                )}
            </div>
        </ForensicPageLayout>
    );
}

function StatCard({ icon: Icon, color, label, value }: { icon: React.ElementType, color: string, label: string, value: number }) {
    const colorClasses = {
        emerald: 'text-emerald-500',
        amber: 'text-amber-500',
        indigo: 'text-indigo-500',
        rose: 'text-rose-500',
    };
    
    return (
        <div className="tactical-card depth-layer-2 p-6 relative overflow-hidden group hover:depth-layer-3 transition-colors depth-elevate">
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${colorClasses[color as keyof typeof colorClasses]}`}>
                <Icon className="w-16 h-16" />
            </div>
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                    <Icon className={`w-5 h-5 ${colorClasses[color as keyof typeof colorClasses]}`} />
                    <span className="text-[10px] font-black text-depth-secondary uppercase tracking-widest">{label}</span>
                </div>
                <p className="text-4xl font-black text-depth-primary tracking-tight">{value}</p>
            </div>
        </div>
    );
}
