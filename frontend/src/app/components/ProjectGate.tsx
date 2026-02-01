'use client';

import React, { useEffect, useState } from 'react';
import { useProject } from '../../store/useProject';
import { motion } from 'framer-motion';
import { FolderOpen, Plus, Loader2, ArrowRight, Shield } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import CreateProjectModal from './CreateProjectModal';

interface ProjectGateProps {
    children: React.ReactNode;
}

export default function ProjectGate({ children }: ProjectGateProps) {
    const { activeProjectId, projects, fetchProjects, isLoading, setActiveProject } = useProject();
    const pathname = usePathname();
    const router = useRouter();
    const { status } = useSession();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectingProject, setSelectingProject] = useState<string | null>(null);
    const [mounting, setMounting] = useState(true);

    useEffect(() => {
        setMounting(false); // eslint-disable-line react-hooks/set-state-in-effect
    }, []);

    useEffect(() => {
        if (projects.length === 0 && !pathname?.includes('/login')) {
            fetchProjects();
        }
    }, [projects.length, fetchProjects, pathname]);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    if (typeof window === 'undefined' || mounting || status === 'loading') {
        if (typeof window === 'undefined') return <>{children}</>;
        return null;
    }

    // Bypass gate for auth pages
    if (pathname?.includes('/login') || pathname?.includes('/register')) {
        return <>{children}</>;
    }

    // If not authenticated, return null while redirecting
    if (status === 'unauthenticated') {
        return null;
    }

    // If we have an active project, render children (Dashboard/App)
    if (activeProjectId) {
        return <>{children}</>;
    }

    const handleProjectCreated = async (projectId: string) => {
        // Refresh project list
        await fetchProjects();
        // Auto-select the newly created project
        setSelectingProject(projectId);
        setActiveProject(projectId);
    };

    const handleProjectSelect = async (projectId: string) => {
        setSelectingProject(projectId);
        setActiveProject(projectId);
    };

    // If no active project, show the "Forensic Case Selector"
    return (
        <>
            <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 relative overflow-hidden">
                {/* Background Ambience */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none" />
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

                {/* Central Panel */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-5xl z-10"
                >
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div className="text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20 mb-4">
                                <Shield className="w-3 h-3 text-indigo-400" />
                                <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Secure Terminal</span>
                            </div>
                            <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
                                SELECT <span className="text-indigo-500">OPERATION</span>
                            </h1>
                            <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.2em]">
                                Load secure context for forensic auditing
                            </p>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-3 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all font-black uppercase tracking-tighter text-sm"
                        >
                            <Plus className="w-5 h-5" />
                            Launch New Case
                        </motion.button>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center p-12 space-y-4">
                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                            <span className="text-indigo-400 font-mono text-xs uppercase animate-pulse">
                               Retrieving Case Files...
                            </span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {projects.map((project, i) => (
                                <motion.button
                                    key={project.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    onClick={() => handleProjectSelect(project.id)}
                                    disabled={selectingProject === project.id}
                                    className={`group relative p-6 border rounded-[2rem] text-left transition-all overflow-hidden h-64 flex flex-col justify-between ${
                                        selectingProject === project.id 
                                            ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/20 shadow-[0_0_40px_rgba(99,102,241,0.2)]' 
                                            : 'border-white/5 hover:border-white/20 hover:bg-slate-900/80 bg-slate-900/40'
                                    }`}
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <FolderOpen className="w-24 h-24 text-white" />
                                    </div>
                                    
                                    <div className="relative z-10 flex flex-col h-full items-start">
                                        <div className="flex justify-between w-full mb-6">
                                            <div className="p-2.5 bg-slate-950 rounded-xl border border-white/5 group-hover:border-indigo-500/30 transition-colors">
                                                <FolderOpen className="w-5 h-5 text-indigo-500" />
                                            </div>
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">
                                                ID-{project.id.substring(0, 4)}
                                            </span>
                                        </div>

                                        <div className="mb-auto">
                                            <h3 className="text-xl font-black text-white mb-2 leading-tight">
                                                {project.name}
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                                                    Exposure: Low
                                                </span>
                                                <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase tracking-widest border border-indigo-500/20">
                                                    Audit Ready
                                                </span>
                                            </div>
                                        </div>

                                        <div className="w-full flex items-center justify-between pt-6 border-t border-white/5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[8px] font-black text-white">A</div>
                                                <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-300">Admin Lead</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-indigo-400 group-hover:translate-x-1 transition-transform">
                                                {selectingProject === project.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <ArrowRight className="w-4 h-4" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Creation Modal */}
            <CreateProjectModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={handleProjectCreated}
            />
        </>
    );
}
