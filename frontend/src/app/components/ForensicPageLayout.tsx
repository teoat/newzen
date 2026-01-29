'use client';

import React from 'react';
import { useProject } from '@/store/useProject';
import { Loader2 } from 'lucide-react';
import HolographicBadge from '@/app/components/HolographicBadge';
import CommandBar from '@/app/components/CommandBar';

interface ForensicPageLayoutProps {
    title: string | React.ReactNode;
    subtitle?: string;
    icon?: React.ElementType;
    headerActions?: React.ReactNode;
    children: React.ReactNode;
    isMockData?: boolean;
    loading?: boolean;
    loadingMessage?: string;
}

export default function ForensicPageLayout({ 
    title, 
    subtitle, 
    icon: Icon,
    headerActions, 
    children,
    isMockData = false,
    loading = false,
    loadingMessage = "Initializing Forensic Module..."
}: ForensicPageLayoutProps) {
    const { activeProject, isLoading: projectLoading } = useProject();

    return (
        <div className="h-screen bg-[#020617] text-slate-300 font-sans flex flex-col overflow-hidden selection:bg-indigo-500/30">
            <CommandBar />
            {/* Standardized Header */}
            <header className="h-16 px-6 border-b border-white/5 bg-slate-900/40 backdrop-blur-xl flex items-center justify-between shrink-0 z-40 transition-all duration-300">
                <div className="flex items-center gap-6">
                    {Icon && (
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/20 ring-1 ring-white/10 group relative overflow-hidden">
                             <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            <Icon className="w-5 h-5 text-white" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-lg font-black text-white tracking-tighter italic uppercase flex items-center gap-3">
                            {title}
                            {isMockData && <HolographicBadge />}
                        </h1>
                        <div className="flex items-center gap-3 mt-1.5">
                            {activeProject ? (
                                <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20 font-bold uppercase tracking-wider">
                                    Project: {activeProject.name}
                                </span>
                            ) : (
                                <span className="text-[9px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                                    NO ACTIVE PROJECT
                                </span>
                            )}
                            {subtitle && (
                                <>
                                    <span className="text-slate-700 font-bold">/</span>
                                    <span className="text-[9px] text-slate-500 font-mono tracking-wide uppercase">{subtitle}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {headerActions}
                </div>
            </header>
            
            {/* Global Integrity Line */}
            <div className="integrity-line opacity-30" />

            {/* Main Content */}
            <main className="flex-1 overflow-hidden relative">
                {/* Global Background Elements */}
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />
                
                {loading || projectLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-50 backdrop-blur-sm">
                         <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                         <span className="text-indigo-400 font-mono text-xs uppercase tracking-[0.3em] animate-pulse">{loadingMessage}</span>
                    </div>
                ) : (
                    children
                )}
            </main>
        </div>
    );
}
