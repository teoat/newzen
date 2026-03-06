'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Search, Plus, Briefcase, 
  ChevronRight, AlertTriangle, ShieldCheck, Clock, RefreshCw, AlertOctagon 
} from 'lucide-react';
import { authenticatedFetch } from '../../lib/api';
import { useToast } from '@/components/ui/toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Case {
    id: string;
    title: string;
    status: 'ACTIVE' | 'RESOLVED' | 'PENDING';
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    created_at: string;
    description: string;
}

export default function CasesPage() {
    const { toast } = useToast();
    const [cases, setCases] = useState<Case[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchCases = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await authenticatedFetch(`${API_URL}/api/v1/cases/`);
            if (res.ok) {
                const data = await res.json();
                setCases(data);
            } else {
                throw new Error("Failed to retrieve case registry");
            }
        } catch (error) {
            console.error("Failed to fetch cases:", error);
            setError("Secure Uplink Failed");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCases();
    }, []);

    const filteredCases = cases.filter(c => 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#020617] text-slate-300 p-10 font-sans">
            <header className="flex justify-between items-end mb-16 px-4">
                <div>
                    <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase mb-2">Central Case Registry</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[11px]">Forensic Management & Investigation Archive</p>
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <input 
                            type="text"
                            placeholder="Search Dossiers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-900/50 border border-white/5 rounded-2xl px-12 h-12 text-xs font-bold focus:outline-none focus:border-indigo-500/50 transition-all w-80 shadow-inner"
                        />
                        <Search className="w-4 h-4 text-slate-600 absolute left-5 top-1/2 -translate-y-1/2" />
                    </div>
                    <button 
                        onClick={() => toast("Case creation functionality is restricted to Level 5 Auditors.", "warning")} 
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-900/20 active:scale-95 border border-indigo-400/20"
                    >
                        <Plus className="w-4 h-4" /> New Case
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-24 bg-slate-900/20 rounded-[2rem] border border-white/5 animate-pulse" />
                    ))
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-rose-500/5 rounded-[3rem] border border-rose-500/20">
                        <AlertOctagon className="w-16 h-16 text-rose-500 mb-6" />
                        <h3 className="text-xl font-black text-rose-500 uppercase tracking-widest mb-2">{error}</h3>
                        <p className="text-xs font-bold text-rose-400/60 uppercase tracking-widest mb-8">Connection to Central Archive Interrupted</p>
                        <button 
                            onClick={fetchCases}
                            className="flex items-center gap-2 px-6 py-3 bg-rose-500 hover:bg-rose-400 text-white rounded-xl font-black uppercase text-xs tracking-widest transition-all"
                        >
                            <RefreshCw className="w-4 h-4" /> Retry Connection
                        </button>
                    </div>
                ) : filteredCases.length > 0 ? (
                    filteredCases.map((c) => (
                        <Link 
                            key={c.id} 
                            href={`/cases/${c.id}${c.status === 'ACTIVE' ? '?mode=investigate' : ''}`}
                        >
                            <motion.div 
                                whileHover={{ x: 10, backgroundColor: 'rgba(255,255,255,0.02)' }}
                                className="bg-slate-900/30 border border-white/5 rounded-[2rem] p-8 flex items-center justify-between group transition-all cursor-pointer backdrop-blur-sm shadow-lg"
                            >
                                <div className="flex items-center gap-8">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform ${
                                        c.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 
                                        c.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 
                                        'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                                    }`}>
                                        <Briefcase className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-black text-white italic tracking-tight uppercase group-hover:text-indigo-400 transition-colors">{c.title}</h3>
                                            <span className="text-[11px] font-mono text-slate-600 uppercase tracking-widest">{c.id}</span>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5 text-slate-700" />
                                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{new Date(c.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {c.status === 'ACTIVE' ? <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> : <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
                                                <span className={`text-[11px] font-black uppercase tracking-widest ${c.status === 'ACTIVE' ? 'text-amber-500' : 'text-emerald-500'}`}>{c.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right mr-8">
                                        <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">Priority</p>
                                        <p className={`text-xs font-black italic tracking-tighter uppercase ${
                                            c.priority === 'HIGH' ? 'text-rose-500' : 
                                            c.priority === 'MEDIUM' ? 'text-amber-500' : 
                                            'text-indigo-400'
                                        }`}>{c.priority}</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                                        <ChevronRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    ))
                ) : (
                    <div className="col-span-1 xl:col-span-2 flex flex-col items-center justify-center py-40 relative overflow-hidden rounded-[3rem] border border-white/5 bg-slate-900/20">
                         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0%,transparent_70%)]" />
                         <div className="w-32 h-32 mb-8 relative">
                            <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full animate-pulse" />
                            <Briefcase className="w-32 h-32 text-slate-700 relative z-10" />
                         </div>
                        <h3 className="text-3xl font-black uppercase tracking-tighter text-white z-10">No Cases Active</h3>
                        <p className="text-xs font-bold uppercase tracking-[0.4em] mt-4 text-slate-500 z-10">Forensic archive is currently clear.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
