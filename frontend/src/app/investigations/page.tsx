'use client';

import React from 'react';
import { useInvestigation } from '@/store/useInvestigation';
import type { Investigation } from '@/store/useInvestigation';
import { motion } from 'framer-motion';
import { 
    Clock, Play, Pause, CheckCircle, 
    FileText, Plus,
    Archive
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function InvestigationDashboardPage() {
    const router = useRouter();
    const { 
        investigations, 
        startInvestigation,
        resumeInvestigation,
        clearAllInvestigations
    } = useInvestigation();

    const handleNewInvestigation = () => {
        const title = prompt('Enter investigation title:');
        if (title) {
            startInvestigation(title);
            router.push('/');
        }
    };

    const activeInvestigations = investigations.filter(inv => inv.status === 'active');
    const pausedInvestigations = investigations.filter(inv => inv.status === 'paused');
    const completedInvestigations = investigations.filter(inv => inv.status === 'completed');

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 p-8 font-sans">
            {/* Header */}
            <div className="mb-10">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">
                            Investigation Command Center
                        </h1>
                        <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">
                            Manage all forensic investigations • {investigations.length} Total Cases
                        </p>
                    </div>
                    <button
                        onClick={handleNewInvestigation}
                        className="px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest rounded-xl flex items-center gap-3 transition-colors shadow-lg shadow-indigo-900/20"
                    >
                        <Plus className="w-5 h-5" />
                        New Investigation
                    </button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-6">
                    <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Play className="w-5 h-5 text-emerald-500" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active</span>
                        </div>
                        <p className="text-3xl font-black text-white">{activeInvestigations.length}</p>
                    </div>
                    <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Pause className="w-5 h-5 text-amber-500" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Paused</span>
                        </div>
                        <p className="text-3xl font-black text-white">{pausedInvestigations.length}</p>
                    </div>
                    <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <CheckCircle className="w-5 h-5 text-indigo-500" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Completed</span>
                        </div>
                        <p className="text-3xl font-black text-white">{completedInvestigations.length}</p>
                    </div>
                    <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <FileText className="w-5 h-5 text-rose-500" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Actions</span>
                        </div>
                        <p className="text-3xl font-black text-white">
                            {investigations.reduce((sum, inv) => sum + inv.timeline.length, 0)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Active Investigations */}
            {activeInvestigations.length > 0 && (
                <section className="mb-10">
                    <h2 className="text-xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                        <Play className="w-5 h-5 text-emerald-500" />
                        Active Investigations
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {activeInvestigations.map(inv => (
                            <InvestigationCard key={inv.id} investigation={inv} resumeInvestigation={resumeInvestigation} router={router} />
                        ))}
                    </div>
                </section>
            )}

            {/* Paused Investigations */}
            {pausedInvestigations.length > 0 && (
                <section className="mb-10">
                    <h2 className="text-xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                        <Pause className="w-5 h-5 text-amber-500" />
                        Paused Investigations
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {pausedInvestigations.map(inv => (
                            <InvestigationCard key={inv.id} investigation={inv} resumeInvestigation={resumeInvestigation} router={router} />
                        ))}
                    </div>
                </section>
            )}

            {/* Completed Investigations */}
            {completedInvestigations.length > 0 && (
                <section className="mb-10">
                    <h2 className="text-xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-indigo-500" />
                        Completed Investigations
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {completedInvestigations.map(inv => (
                            <InvestigationCard key={inv.id} investigation={inv} compact resumeInvestigation={resumeInvestigation} router={router} />
                        ))}
                    </div>
                </section>
            )}

            {investigations.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20">
                    <Archive className="w-16 h-16 text-slate-700 mb-6" />
                    <h3 className="text-xl font-bold text-slate-600 mb-3">No Investigations Yet</h3>
                    <p className="text-sm text-slate-700 mb-6">Start your first investigation to track forensic workflows</p>
                    <button
                        onClick={handleNewInvestigation}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-widest rounded-lg transition-colors"
                    >
                        Create Investigation
                    </button>
                </div>
            )}

            {investigations.length > 0 && (
                <button
                    onClick={() => {
                        if (confirm('Clear all investigations? This cannot be undone.')) {
                            clearAllInvestigations();
                        }
                    }}
                    className="mt-10 px-4 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors"
                >
                    Clear All Investigations
                </button>
            )}
        </div>
    );
}

function InvestigationCard({ 
    investigation, 
    compact = false,
    resumeInvestigation,
    router
}: { 
    investigation: Investigation; 
    compact?: boolean;
    resumeInvestigation: (id: string) => void;
    router: ReturnType<typeof useRouter>;
}) {

    const timeElapsed = Math.floor(
        (new Date(investigation.updatedAt).getTime() - new Date(investigation.startedAt).getTime()) / 1000 / 60
    );

    const statusConfig = {
        active: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
        paused: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
        completed: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400' }
    };

    const config = statusConfig[investigation.status as keyof typeof statusConfig];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-slate-900/50 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all ${
                compact ? '' : ''
            }`}
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h3 className="text-lg font-black text-white mb-2">{investigation.title}</h3>
                    <p className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">
                        {investigation.id}
                    </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${config.bg} ${config.border} ${config.text} border`}>
                    {investigation.status}
                </span>
            </div>

            {!compact && (
                <>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div>
                            <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Actions</p>
                            <p className="text-xl font-bold text-white">{investigation.timeline.length}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Suspects</p>
                            <p className="text-xl font-bold text-white">{investigation.context.suspects.length}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Tools Used</p>
                            <p className="text-xl font-bold text-white">{investigation.context.toolsUsed.length}</p>
                        </div>
                    </div>

                    {investigation.riskScore && (
                        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Risk Score</span>
                                <span className="text-lg font-black text-rose-400">{investigation.riskScore}%</span>
                            </div>
                        </div>
                    )}
                </>
            )}

            <div className="flex items-center justify-between text-[10px] text-slate-600 mb-4">
                <span className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {timeElapsed}m elapsed
                </span>
                <span>{new Date(investigation.updatedAt).toLocaleDateString()}</span>
            </div>

            {investigation.status === 'paused' && (
                <button
                    onClick={() => {
                        resumeInvestigation(investigation.id);
                        router.push('/');
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                    <Play className="w-3 h-3" />
                    Resume Investigation
                </button>
            )}

            {investigation.status === 'completed' && (
                <button
                    className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/20 rounded-lg font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                    <FileText className="w-3 h-3" />
                    View Dossier
                </button>
            )}
        </motion.div>
    );
}
