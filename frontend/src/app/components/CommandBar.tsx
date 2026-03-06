'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, Zap, ArrowRight, X, LayoutDashboard, Database, Network, Satellite, Landmark, TrendingUp, Gavel, Truck, Shield, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useProject } from '../../store/useProject';
import { API_URL } from '../../lib/constants';
import { forensicBus } from '../../lib/ForensicEventBus';
import { useDebounced } from '../../hooks/useDebounced';

interface TransactionResult {
    id: string;
    description: string;
    actual_amount?: number;
    sender?: string;
    receiver?: string;
}

interface CaseResult {
    id: string;
    title?: string;
    status?: string;
    priority?: string;
}

interface ExhibitResult {
    id: string;
    filename?: string;
    label?: string;
    hash_signature?: string;
    hash?: string;
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
    { id: 'report', label: 'Final Mission Verdict', group: 'Phase V', icon: Gavel, href: '/forensic/report' },
];

export default function CommandBar() {
    const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounced(query, 300);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const { activeProjectId } = useProject();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

    // Helper to open command bar with reset state
    const openCommandBar = useCallback(() => {
        setQuery('');
        setSelectedIndex(0);
        setSearchResults(null);
        setIsOpen(true);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsOpen(prev => {
                    if (!prev) {
                        // Opening - schedule state reset to avoid setState-in-effect
                        setTimeout(() => {
                            setQuery('');
                            setSelectedIndex(0);
                            setSearchResults(null);
                        }, 0);
                    }
                    return !prev;
                });
            }
            if (e.key === 'Escape') setIsOpen(false);
        };

        const unbind = forensicBus.on('TOGGLE_SEARCH', () => {
            setIsOpen(prev => {
                if (!prev) {
                    // Opening - schedule state reset to avoid setState-in-effect
                    setTimeout(() => {
                        setQuery('');
                        setSelectedIndex(0);
                        setSearchResults(null);
                    }, 0);
                }
                return !prev;
            });
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

    // Unified Search Logic - now using debounced query
    useEffect(() => {
        if (debouncedQuery.length < 2 || !activeProjectId) {
            setSearchResults(null);
            setIsSearching(false);
            return;
        }

        const performSearch = async () => {
            setIsSearching(true);
            
            // Task 4: Natural Language Intent Extraction (Polished)
            const lowerQuery = debouncedQuery.toLowerCase();
            let finalQuery = debouncedQuery;
            let intentType: 'SEARCH' | 'RISK' | 'UBO' | 'ACTION' = 'SEARCH';
            
            // Detect Intent
            if (lowerQuery.includes('risk') || lowerQuery.includes('anomaly') || lowerQuery.includes('danger')) intentType = 'RISK';
            if (lowerQuery.includes('owner') || lowerQuery.includes('ubo') || lowerQuery.includes('control')) intentType = 'UBO';
            if (lowerQuery.startsWith('go to') || lowerQuery.startsWith('open')) intentType = 'ACTION';

            // Semantic handling: strip conversational filler
            finalQuery = debouncedQuery.replace(/show me|find all|all the|search for|tell me about|who is|investigate/gi, '').trim();

            try {
                // If it's an action intent and matches a command, we could prioritize it, 
                // but for now we stick to the unified API search.
                const response = await fetch(
                    `${API_URL}/api/v1/forensic/${activeProjectId}/search?q=${encodeURIComponent(finalQuery)}`
                );
                const data = await response.json();
                
                // Post-process results based on intent
                if (data.results.transactions) {
                    data.results.transactions = data.results.transactions.map((t: any) => ({ 
                        ...t, 
                        high_risk: intentType === 'RISK' || t.actual_amount > 1000000000, // Semantic boost
                        ubo_match: intentType === 'UBO' && t.description.toLowerCase().includes('director')
                    }));
                }

                setSearchResults(data.results);
            } catch (error) {
                console.error('Intelligence search failed:', error);
                setSearchResults(null);
            } finally {
                setIsSearching(false);
            }
        };

        performSearch();
    }, [debouncedQuery, activeProjectId]);

    const filteredCommands = COMMANDS.filter(cmd => 
        cmd.label.toLowerCase().includes(query.toLowerCase()) || 
        cmd.group.toLowerCase().includes(query.toLowerCase())
    );

    // Flat list for keyboard navigation
    const dataResults = searchResults ? [
        ...(searchResults.transactions || []).map(t => ({ 
            ...t, 
            _type: 'transaction', 
            label: t.description, 
            icon: Landmark,
            sender: t.sender || 'INTERNAL',
            receiver: t.receiver || 'EXTERNAL'
        })),
        ...(searchResults.cases || []).map(c => ({ 
            ...c, 
            _type: 'case', 
            label: c.title ?? 'Untitled Case', 
            icon: Gavel,
            status: c.status || 'OPEN',
            priority: c.priority || 'LOW'
        })),
        ...(searchResults.exhibits || []).map(e => ({ 
            ...e, 
            _type: 'exhibit', 
            label: e.filename || e.label || 'Unnamed Exhibit', 
            icon: Database,
            hash: e.hash_signature || e.hash || 'UNVERIFIED'
        }))
    ] : [];

    const allOptions = [...filteredCommands, ...dataResults];

    const handleSelect = (href: string) => {
        router.push(href);
        setIsOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % allOptions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + allOptions.length) % allOptions.length);
        } else if (e.key === 'Enter') {
            const opt = allOptions[selectedIndex];
            if (opt) {
                if ('href' in opt && opt.href) handleSelect(opt.href);
                else if ('_type' in opt && opt._type === 'case') router.push(`/investigate?id=${(opt as CaseResult & { _type: string }).id}`);
                else if ('_type' in opt && opt._type === 'transaction') router.push(`/investigate?transaction=${(opt as TransactionResult & { _type: string }).id}`);
                else if ('_type' in opt && opt._type === 'exhibit') router.push(`/investigate?evidence=${(opt as ExhibitResult & { _type: string }).id}`);
                setIsOpen(false);
            }
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-modal flex items-start justify-center pt-[15vh] px-4">
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
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
                                disabled={isSearching}
                                className={`bg-transparent border-none outline-none flex-1 text-white placeholder:text-slate-600 font-mono text-sm ${
                                  isSearching ? 'opacity-50 cursor-wait' : ''
                                }`}
                            />
                            <div className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 border border-white/5 text-[11px] text-slate-500 font-mono">
                                <Command className="w-2.5 h-2.5" /> K
                            </div>
                            <button onClick={() => setIsOpen(false)} title="Close" className="p-1 hover:bg-white/5 rounded text-slate-500 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
                            {allOptions.length > 0 ? (
                                <div className="space-y-1">
                                    {/* Render by Category if searching */}
                                    {searchResults ? (
                                        <div className="space-y-6">
                                            {/* Category: Commands */}
                                            {filteredCommands.length > 0 && (
                                                <div>
                                                    <div className="px-4 mb-2 text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                        <Zap className="w-3 h-3" /> System Protocols
                                                    </div>
                                                    {filteredCommands.map((cmd, idx) => (
                                                        <CommandItem 
                                                            key={cmd.id} 
                                                            opt={cmd} 
                                                            idx={idx} 
                                                            selectedIndex={selectedIndex} 
                                                            onSelect={handleSelect}
                                                            onHover={setSelectedIndex}
                                                        />
                                                    ))}
                                                </div>
                                            )}

                                            {/* Category: Intelligence */}
                                            {dataResults.length > 0 && (
                                                <div>
                                                    <div className="px-4 mb-2 text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                        <Database className="w-3 h-3" /> Intelligence Bank
                                                    </div>
                                                    {dataResults.map((opt, idx) => (
                                                        <CommandItem 
                                                            key={'id' in opt ? opt.id : idx} 
                                                            opt={opt} 
                                                            idx={filteredCommands.length + idx} 
                                                            selectedIndex={selectedIndex} 
                                                            onSelect={() => {
                                                                if ('id' in opt) {
                                                                    if (opt._type === 'case') router.push(`/investigate?id=${opt.id}`);
                                                                    else if (opt._type === 'transaction') router.push(`/investigate?transaction=${opt.id}`);
                                                                    else if (opt._type === 'exhibit') router.push(`/investigate?evidence=${opt.id}`);
                                                                }
                                                                setIsOpen(false);
                                                            }}
                                                            onHover={setSelectedIndex}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        filteredCommands.map((cmd, idx) => (
                                            <CommandItem 
                                                key={cmd.id} 
                                                opt={cmd} 
                                                idx={idx} 
                                                selectedIndex={selectedIndex} 
                                                onSelect={handleSelect}
                                                onHover={setSelectedIndex}
                                            />
                                        ))
                                    )}
                                </div>
                            ) : (
                                <div className="py-20 flex flex-col items-center justify-center text-slate-600 gap-4">
                                    <Search className="w-10 h-10 opacity-20" />
                                    <span className="text-xs uppercase font-black tracking-widest italic">No matches found for &quot;{query}&quot;</span>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 bg-black/40 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500 font-bold uppercase tracking-widest">
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

type CommandItemData = {
    id?: string;
    label: string;
    icon?: React.ComponentType<{ size?: number; className?: string }>;
    href?: string;
    _type?: string;
    group?: string;
    sender?: string;
    receiver?: string;
    status?: string;
    priority?: string;
    hash?: string;
    actual_amount?: number;
};

function CommandItem({ opt, idx, selectedIndex, onSelect, onHover }: { 
    opt: CommandItemData, 
    idx: number, 
    selectedIndex: number, 
    onSelect: (href: string) => void,
    onHover: (idx: number) => void
}) {
    return (
        <div 
            onClick={() => {
                if (opt.href) onSelect(opt.href);
                else if (opt._type === 'case' && opt.id) onSelect(`/investigate?id=${opt.id}`);
                else if (opt._type === 'transaction' && opt.id) onSelect(`/investigate?transaction=${opt.id}`);
                else if (opt._type === 'exhibit' && opt.id) onSelect(`/investigate?evidence=${opt.id}`);
            }}
            onMouseEnter={() => onHover(idx)}
            className={`flex items-center justify-between px-4 py-3.5 rounded-xl cursor-pointer transition-all ${selectedIndex === idx ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'hover:bg-white/[0.03] text-slate-400'}`}
        >
            <div className="flex items-center gap-4 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedIndex === idx ? 'bg-white/20' : 'bg-slate-950/50 border border-white/5'}`}>
                    {opt.icon ? <opt.icon className="w-4 h-4 text-indigo-400" /> : <Database className="w-4 h-4 text-slate-500" />}
                </div>
                <div className="min-w-0">
                    <div className={`text-sm font-black uppercase tracking-tight truncate ${selectedIndex === idx ? 'text-white' : 'text-slate-200'}`}>
                        {opt.label}
                    </div>
                    <div className={`text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${selectedIndex === idx ? 'text-indigo-200' : 'text-slate-600'}`}>
                        <span>{opt.group || opt._type || 'SEARCH RESULT'}</span>
                        {(opt as any).high_risk && (
                            <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[7px] uppercase font-black animate-pulse">
                                Semantic Risk Detected
                            </span>
                        )}
                        {opt._type === 'transaction' && opt.sender && opt.receiver && (
                            <span className="opacity-60 italic">({opt.sender} → {opt.receiver})</span>
                        )}
                        {opt._type === 'case' && opt.status && opt.priority && (
                            <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-white/5 text-[7px] uppercase font-black">
                                {opt.status} • {opt.priority}
                            </span>
                        )}
                        {opt.actual_amount && ` • IDR ${opt.actual_amount.toLocaleString()}`}
                    </div>
                </div>
            </div>
            {selectedIndex === idx && (
                <ArrowRight className="w-4 h-4 opacity-50 flex-shrink-0" />
            )}
        </div>
    );
}
