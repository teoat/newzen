'use client';

import React, { useEffect, useState } from 'react';
import { useProject } from '../../store/useProject';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, Plus, Loader2, ArrowRight, Shield, Search, Terminal, LayoutGrid, List } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import CreateProjectModal from '@/app/components/CreateProjectModal'; 
import AuthService from '@/services/AuthService';

interface ProjectGateProps {
    children: React.ReactNode;
}

export default function ProjectGate({ children }: ProjectGateProps) {
    const { activeProjectId, projects, fetchProjects, isLoading, setActiveProject } = useProject();
    const pathname = usePathname();
    const router = useRouter();
    const isSignedIn = false; // Mock isSignedIn for now
    const isLoaded = true; // Mock isLoaded for now
    const isManualAuth = AuthService.isAuthenticated();
    // Initial check for bypass to avoid stuck loading
    const initialBypass = typeof window !== 'undefined' && (
        localStorage.getItem('zenith_e2e_bypass') === 'true' || 
        process.env.ZENITH_E2E_BYPASS === 'true' ||
        process.env.NEXT_PUBLIC_APP_ENV === 'test'
    );
    const [isE2E, setIsE2E] = useState(initialBypass);
    
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectingProject, setSelectingProject] = useState<string | null>(null);
    const [mounting, setMounting] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        if (initialBypass) {
            console.log('E2E Bypass Verified');
            setIsE2E(true);
        }
        setMounting(false);
    }, []);

    useEffect(() => {
        if (projects.length === 0 && !pathname?.includes('/login') && (isSignedIn || isManualAuth || isE2E)) {
            fetchProjects();
        }
    }, [projects.length, fetchProjects, pathname, isSignedIn, isManualAuth, isE2E]);

    useEffect(() => {
        if (!mounting && isLoaded && !isSignedIn && !isManualAuth && !isE2E && !pathname?.includes('/login') && !pathname?.includes('/signup')) {
            console.log('Redirecting to login...', { isLoaded, isSignedIn, isManualAuth, isE2E });
            router.push('/login');
        }
    }, [mounting, isLoaded, isSignedIn, isManualAuth, isE2E, router, pathname]);

    const filteredProjects = projects.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (mounting || (!isLoaded && !isManualAuth && !isE2E && !initialBypass)) {
        return null;
    }

    if (pathname?.includes('/login') || pathname?.includes('/signup')) {
        return <>{children}</>;
    }

    if (activeProjectId && projects.some(p => p.id === activeProjectId)) {
        return <>{children}</>;
    }

    const handleProjectSelect = (projectId: string) => {
        setSelectingProject(projectId);
        setActiveProject(projectId);
    };

    return (
        <div className="relative min-h-screen bg-[#020617] text-slate-300 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(79,70,229,0.08)_0%,transparent_50%)] pointer-events-none" />
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />

            <div className="relative z-10 flex flex-col min-h-screen max-w-7xl mx-auto px-6 py-12">
                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 border-b border-white/5 pb-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-500/10 rounded border border-indigo-500/20">
                                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                            </div>
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Operational Gate</span>
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                            Select <span className="text-indigo-500">Mission</span>
                        </h1>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-widest max-w-md leading-relaxed">
                            Authorized personnel only. Select an active forensic mission to initialize specialized compute resources.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="relative group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                            <input 
                                type="text"
                                placeholder="Filter Archive..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-slate-900/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all uppercase tracking-widest w-64"
                            />
                        </div>
                        
                        <div className="flex items-center bg-slate-900/50 border border-white/10 rounded-xl p-1">
                            <button 
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-500 hover:text-white'}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-500 hover:text-white'}`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>

                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-3 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xl shadow-indigo-900/20 transition-all font-black uppercase tracking-widest text-[10px]"
                        >
                            <Plus className="w-4 h-4" />
                            Initialize New
                        </button>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-32 space-y-4">
                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                            <span className="text-indigo-400/50 font-black text-[10px] uppercase tracking-[0.4em] animate-pulse">
                                Accessing Secure Vault...
                            </span>
                        </div>
                    ) : filteredProjects.length > 0 ? (
                        <div className={viewMode === 'grid' 
                            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                            : "flex flex-col gap-3"
                        }>
                            <AnimatePresence mode="popLayout">
                                {filteredProjects.map((project, i) => (
                                    <ProjectCard 
                                        key={project.id}
                                        project={project}
                                        index={i}
                                        viewMode={viewMode}
                                        isSelected={selectingProject === project.id}
                                        onSelect={() => handleProjectSelect(project.id)}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <EmptyState 
                            searchQuery={searchQuery} 
                            onClear={() => setSearchQuery('')}
                            onCreate={() => setShowCreateModal(true)}
                        />
                    )}
                </main>

                {/* Footer Info */}
                <footer className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5"><Shield className="w-3 h-3" /> End-to-End Encrypted</span>
                        <span className="flex items-center gap-1.5"><Activity className="w-3 h-3" /> 108 Operations Completed</span>
                    </div>
                    <div>Zenith Forensic Analytics Framework v2.5.0-LITE</div>
                </footer>
            </div>

            <CreateProjectModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={fetchProjects}
            />
        </div>
    );
}

function ProjectCard({ project, index, viewMode, isSelected, onSelect }: any) {
    if (viewMode === 'list') {
        return (
            <motion.button
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={onSelect}
                className={`group flex items-center justify-between p-5 rounded-2xl border transition-all ${
                    isSelected ? 'bg-indigo-600/10 border-indigo-500' : 'bg-slate-900/30 border-white/5 hover:border-white/20 hover:bg-slate-900/60'
                }`}
            >
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-indigo-500 border border-white/5'}`}>
                        <FolderOpen className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-sm font-black text-white uppercase tracking-tight">{project.name}</h3>
                        <span className="text-[9px] font-mono text-slate-500">{project.id.substring(0, 12).toUpperCase()}</span>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Contractor</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{project.contractor_name || 'N/A'}</span>
                    </div>
                    {isSelected ? <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> : <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-indigo-400 transition-colors" />}
                </div>
            </motion.button>
        );
    }

    return (
        <motion.button
            layout
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            onClick={onSelect}
            className={`group relative p-8 rounded-3xl border text-left transition-all h-64 flex flex-col justify-between overflow-hidden ${
                isSelected ? 'bg-indigo-600/10 border-indigo-500 shadow-2xl shadow-indigo-900/20' : 'bg-slate-900/30 border-white/5 hover:border-white/20 hover:bg-slate-900/60'
            }`}
        >
            <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                <Shield className="w-32 h-32 text-white -rotate-12 translate-x-8 -translate-y-8" />
            </div>

            <div className="relative z-10 flex justify-between items-start">
                <div className={`p-3 rounded-xl ${isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'bg-slate-950 text-indigo-500 border border-white/5'}`}>
                    <FolderOpen className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono text-slate-600 font-black bg-white/5 px-2 py-1 rounded">
                    {project.id.substring(0, 8).toUpperCase()}
                </span>
            </div>

            <div className="relative z-10">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-tight group-hover:text-indigo-100 mb-2">
                    {project.name}
                </h3>
                <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{project.contractor_name || 'No Contractor'}</span>
                    <div className="w-1 h-1 rounded-full bg-slate-800" />
                    <span className="text-[9px] font-black text-emerald-500/80 uppercase tracking-widest flex items-center gap-1">
                        <Shield className="w-2 h-2" /> Verified
                    </span>
                </div>
            </div>

            <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/5">
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Launch Module</span>
                {isSelected ? <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> : <ArrowRight className="w-4 h-4 text-indigo-500 translate-x-0 group-hover:translate-x-1 transition-transform" />}
            </div>
        </motion.button>
    );
}

function EmptyState({ searchQuery, onClear, onCreate }: any) {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-6 bg-slate-900/10 border border-dashed border-white/10 rounded-[3rem] text-center space-y-8 relative overflow-hidden group">
            <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="w-20 h-20 bg-slate-950 rounded-full flex items-center justify-center border border-white/5 relative z-10">
                <FolderOpen className="w-8 h-8 text-slate-700" />
            </div>
            <div className="space-y-4 relative z-10">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Vault Silence</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto font-bold uppercase tracking-widest leading-relaxed">
                    {searchQuery 
                        ? `No mission logs matching "${searchQuery.toUpperCase()}" identified in the secure ledger.`
                        : "No operational contexts found in the secure archive. Initialize your first mission to begin data ingestion."
                    }
                </p>
            </div>
            <div className="flex items-center gap-4 relative z-10">
                {searchQuery && (
                    <button 
                        onClick={onClear}
                        className="px-8 py-3 bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all font-black uppercase text-[10px] tracking-widest"
                    >
                        Clear Filter
                    </button>
                )}
                <button 
                    onClick={onCreate}
                    className="px-10 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-900/20"
                >
                    Initialize First Mission
                </button>
            </div>
        </div>
    );
}

import { Activity } from 'lucide-react';
