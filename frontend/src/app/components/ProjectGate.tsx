'use client';

import React, { useEffect, useState } from 'react';
import { useProject } from '@/store/useProject';
import { motion } from 'framer-motion';
import { FolderOpen, Plus, Loader2, ArrowRight, Shield } from 'lucide-react';
import { usePathname } from 'next/navigation';
import CreateProjectModal from './CreateProjectModal';

interface ProjectGateProps {
    children: React.ReactNode;
}

export default function ProjectGate({ children }: ProjectGateProps) {
    const { activeProjectId, projects, fetchProjects, isLoading, setActiveProject } = useProject();
    const pathname = usePathname();
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        // Initial fetch if empty and NOT on login
        if (projects.length === 0 && !pathname?.includes('/login')) {
            fetchProjects();
        }
    }, [projects.length, fetchProjects, pathname]);

    // Bypass gate for auth pages
    if (pathname?.includes('/login') || pathname?.includes('/register')) {
        return <>{children}</>;
    }

    // If we have an active project, render children (Dashboard/App)
    if (activeProjectId) {
        return <>{children}</>;
    }

    const handleProjectCreated = async (projectId: string) => {
        // Refresh project list
        await fetchProjects();
        // Auto-select the newly created project
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
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-4xl z-10"
                >
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl mb-6 ring-1 ring-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                            <Shield className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight mb-2">
                            SELECT ACTIVE OPERATION
                        </h1>
                        <p className="text-slate-400 font-mono text-sm uppercase tracking-widest">
                            Initialize Forensic Context
                        </p>
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
                                    onClick={() => setActiveProject(project.id)}
                                    className="group relative p-6 bg-slate-900/40 border border-white/5 hover:border-indigo-500/50 rounded-2xl text-left transition-all hover:bg-slate-900/60 overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-indigo-500/0 to-indigo-500/5 group-hover:to-indigo-500/10 transition-colors" />
                                    
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 bg-slate-950 rounded-lg border border-white/5 group-hover:border-indigo-500/30 transition-colors">
                                            <FolderOpen className="w-5 h-5 text-slate-400 group-hover:text-indigo-400" />
                                        </div>
                                        <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                            project.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500'
                                        }`}>
                                            {project.status}
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-indigo-200 transition-colors">
                                        {project.name}
                                    </h3>
                                    <p className="text-xs text-slate-500 font-mono mb-4">
                                        ID: {project.id.substring(0, 8)}...
                                    </p>

                                    <div className="flex items-center gap-2 text-indigo-400 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 text-xs font-bold uppercase tracking-wide">
                                        Initialize <ArrowRight className="w-3 h-3" />
                                    </div>
                                </motion.button>
                            ))}

                            {/* New Project Button */}
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: projects.length * 0.1 }}
                                onClick={() => setShowCreateModal(true)}
                                className="group p-6 border border-dashed border-white/10 hover:border-indigo-500/30 rounded-2xl flex flex-col items-center justify-center text-center transition-all hover:bg-white/5"
                            >
                                <div className="p-3 bg-white/5 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                    <Plus className="w-6 h-6 text-slate-400" />
                                </div>
                                <span className="text-sm font-bold text-slate-300">New Operation</span>
                            </motion.button>
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
