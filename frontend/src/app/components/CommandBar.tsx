'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, Zap, ArrowRight, X, LayoutDashboard, Database, Network, Satellite, Landmark, TrendingUp, Gavel, Truck, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useProject } from '@/store/useProject';
import { API_URL } from '@/utils/constants';
import { forensicBus } from '@/lib/ForensicEventBus';

interface TransactionResult {
    id: string;
    description: string;
    actual_amount?: number;
}

interface CaseResult {
    id: string;
    title: string;
}

interface ExhibitResult {
    id: string;
    filename: string;
}

interface SearchResult {
    transactions: TransactionResult[];
    cases: CaseResult[];
    exhibits: ExhibitResult[];
}

interface CommandOption {
    id?: string;
    label: string;
    group?: string;
    icon?: React.ComponentType<{ size?: number; className?: string }>;
    href?: string;
    _type?: string;
    actual_amount?: number;
}

const COMMANDS = [
    { id: 'dash', label: 'Project Command', group: 'General', icon: LayoutDashboard, href: '/' },
    { id: 'ingestion', label: 'Evidence Ingestion', group: 'Phase I', icon: Database, href: '/ingestion' },
    { id: 'nexus', label: 'Vendor Nexus Explorer', group: 'Phase I', icon: Network, href: '/forensic/nexus' },
    { id: 'satellite', label: 'Satellite Intelligence', group: 'Phase I', icon: Satellite, href: '/forensic/satellite' },
    { id: 'recon', label: 'Transaction Reconciliation', group: 'Phase II', icon: Landmark, href: '/reconciliation' },
    { id: 'flow', label: 'Termin Flow Tracer', group: 'Phase II', icon: Zap, href: '/forensic/flow' },
    { id: 'analytics', label: 'S-Curve & RAB Analytics', group: 'Phase II', icon: TrendingUp, href: '/forensic/analytics' },
    { id: 'lab', label: 'Tactical Forensic Lab', group: 'Phase II', icon: Gavel, href: '/forensic/lab' },
    { id: 'discrepancy', label: 'Discrepancy Adjudication', group: 'Phase III', icon: Gavel, href: '/forensic/discrepancy' },
    { id: 'seizure', label: 'Asset Seizure Cabinet', group: 'Phase IV', icon: Truck, href: '/forensic/assets' },
    { id: 'screening', label: 'Sanction Monitor', group: 'Phase IV', icon: Shield, href: '/legal/screening' },
];

export default function CommandBar() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const { activeProjectId } = useProject();
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsOpen(prev => {
                    const next = !prev;
                    if (next) {
                        setQuery('');
                        setSelectedIndex(0);
                        setSearchResults(null);
                    }
                    return next;
                });
            }
            if (e.key === 'Escape') setIsOpen(false);
        };

        const unbind = forensicBus.on('TOGGLE_SEARCH', () => {
            setIsOpen(prev => !prev);
        });

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            unbind();
        };
    }, []);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Unified Search Logic
    useEffect(() => {
        if (query.length < 2 || !activeProjectId) {
            setSearchResults(null);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const response = await fetch(
                    `${API_URL}/api/v1/forensic/${activeProjectId}/search?q=${encodeURIComponent(query)}`
                );
                const data = await response.json();
                setSearchResults(data.results);
            } catch (error) {
                console.error('Intelligence search failed:', error);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query, activeProjectId]);

    const filteredCommands = COMMANDS.filter(cmd => 
        cmd.label.toLowerCase().includes(query.toLowerCase()) || 
        cmd.group.toLowerCase().includes(query.toLowerCase())
    );

    // Flat list for keyboard navigation
    const dataResults = searchResults ? [
        ...(searchResults.transactions || []).map(t => ({ ...t, _type: 'transaction', label: t.description, icon: Landmark })),
        ...(searchResults.cases || []).map(c => ({ ...c, _type: 'case', label: c.title, icon: Gavel })),
        ...(searchResults.exhibits || []).map(e => ({ ...e, _type: 'exhibit', label: e.filename, icon: Database }))
    ] : [];

    const allOptions = [...filteredCommands, ...dataResults];

    const handleSelect = (href: string) => {
        router.push(href);
        setIsOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        } else if (e.key === 'Enter') {
            if (filteredCommands[selectedIndex]) {
                handleSelect(filteredCommands[selectedIndex].href);
            }
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                    />

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative z-10"
                    >
                        <div className="flex items-center gap-4 px-6 py-5 border-b border-white/5 bg-white/[0.02]">
                            <Search className="w-5 h-5 text-slate-500" />
                            <input 
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Search tools, projects, or actions..."
                                className="bg-transparent border-none outline-none flex-1 text-white placeholder-slate-600 font-mono text-sm"
                            />
                            <div className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 border border-white/5 text-[10px] text-slate-500 font-mono">
                                <Command className="w-2.5 h-2.5" /> K
                            </div>
                            <button onClick={() => setIsOpen(false)} title="Close" className="p-1 hover:bg-white/5 rounded text-slate-500 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
                            {allOptions.length > 0 ? (
                                <div className="space-y-1">
                                    {allOptions.map((opt: CommandOption, idx) => (
                                        <div 
                                            key={opt.id || idx}
                                            onClick={() => {
                                                if (opt.href) handleSelect(opt.href);
                                                else if (opt._type === 'case') router.push(`/investigate?id=${opt.id}`);
                                            }}
                                            onMouseEnter={() => setSelectedIndex(idx)}
                                            className={`flex items-center justify-between px-4 py-3.5 rounded-xl cursor-pointer transition-all ${selectedIndex === idx ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'hover:bg-white/[0.03] text-slate-400'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedIndex === idx ? 'bg-white/20' : 'bg-slate-950/50 border border-white/5'}`}>
                                                    {opt.icon ? <opt.icon className="w-4 h-4 text-indigo-400" /> : <Database className="w-4 h-4 text-slate-500" />}
                                                </div>
                                                <div>
                                                    <div className={`text-sm font-black uppercase tracking-tight ${selectedIndex === idx ? 'text-white' : 'text-slate-200'}`}>
                                                        {opt.label}
                                                    </div>
                                                    <div className={`text-[9px] font-bold uppercase tracking-widest ${selectedIndex === idx ? 'text-indigo-200' : 'text-slate-600'}`}>
                                                        {opt.group || opt._type || 'SEARCH RESULT'} 
                                                        {opt.actual_amount && ` • IDR ${opt.actual_amount.toLocaleString()}`}
                                                    </div>
                                                </div>
                                            </div>
                                            {selectedIndex === idx && (
                                                <ArrowRight className="w-4 h-4 opacity-50" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 flex flex-col items-center justify-center text-slate-600 gap-4">
                                    <Search className="w-10 h-10 opacity-20" />
                                    <span className="text-xs uppercase font-black tracking-widest italic">No matches found for &quot;{query}&quot;</span>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 bg-black/40 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                            <div className="flex gap-6 italic">
                                <span>↑↓ to navigate</span>
                                <span>⏎ to select</span>
                                <span>esc to close</span>
                            </div>
                            <div className="flex items-center gap-2 text-indigo-400">
                                <Zap className="w-3 h-3 fill-current" /> Zenith Autopilot Active
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
