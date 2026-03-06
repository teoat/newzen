'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Landmark, ArrowRightLeft, Settings2, 
  ShieldCheck, 
  Save, 
  Activity, Clock, Percent, Zap, Search, X, AlertTriangle,
  Lock, Unlock, BrainCircuit, Layers
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';

import { useProject } from '../../store/useProject';
import { useInvestigation, EvidenceItem } from '../../store/useInvestigation';
import { usePresence } from '../../hooks/usePresence';
import { API_ROUTES } from '../../services/apiRoutes';
import { authenticatedFetch } from '../../lib/api';

import { BankRecord, ExpenseRecord, Match } from '../../types/domain';

// Enhanced interfaces for better type safety
interface MapData {
  bankRecords: BankRecord[];
  expenseRecords: ExpenseRecord[];
  matches: Match[];
}

interface AutoConfirmResponse {
  auto_confirmed: number;
  flagged_for_review: number;
  message?: string;
}

import { useVirtualizer } from '@tanstack/react-virtual';
import { User as UserIcon, Map as MapIcon, Compass, Hammer } from 'lucide-react';
import BridgeComponentInfographic from '../../components/ForensicAnalysis/BridgeComponentInfographic';

function TierBadge({ tier }: { tier: string }) {
    const colors: Record<string, string> = {
        'TIER_1_PERFECT': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        'TIER_2_STRONG': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
        'TIER_3_PROBABLE': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        'TIER_4_WEAK': 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    };
    const label = tier.replace('TIER_', '').replace('_', ' ');
    return (
        <span className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${colors[tier] || colors['TIER_4_WEAK']}`}>
            {label}
        </span>
    );
}

export default function ReconciliationWorkspace() {
    const { activeProjectId } = useProject();
    const { activeInvestigation, injectEvidence } = useInvestigation();
    const { others, emitAction } = usePresence();
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('search');
    
    const [allBankRecords, setAllBankRecords] = useState<BankRecord[]>([]);
    const [allExpenseRecords, setAllExpenseRecords] = useState<ExpenseRecord[]>([]);
    const [suggestedMatches, setSuggestedMatches] = useState<Match[]>([]);
    const [showMiniMap, setShowMiniMap] = useState(false);
    const [activeLocation, setActiveLocation] = useState<{lat: number, lng: number, name: string} | null>(null);
    const [showMatchPanel, setShowMatchPanel] = useState(true);
    
    // Pillar II: The Engineer's Trap UI State
    const [showBridgeInfo, setShowBridgeInfo] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<ExpenseRecord | null>(null);
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const [isLocked, setIsLocked] = useState(false);
    const [showConsensus, setShowConsensus] = useState(false);
    const isScrollingRef = useRef<boolean>(false);
    
    // Task 2: Temporal Sync Scrolling (Polished)
    useEffect(() => {
        if (!isLocked) return;

        const bankEl = bankParentRef.current;
        const expenseEl = expenseParentRef.current;

        const handleBankScroll = () => {
            if (!isLocked || !bankEl || !expenseEl || isScrollingRef.current) return;
            isScrollingRef.current = true;
            expenseEl.scrollTop = bankEl.scrollTop;
            // Using requestAnimationFrame to ensure the flag is reset after the scroll event cascade
            window.requestAnimationFrame(() => {
                isScrollingRef.current = false;
            });
        };

        const handleExpenseScroll = () => {
            if (!isLocked || !bankEl || !expenseEl || isScrollingRef.current) return;
            isScrollingRef.current = true;
            bankEl.scrollTop = expenseEl.scrollTop;
            window.requestAnimationFrame(() => {
                isScrollingRef.current = false;
            });
        };

        bankEl?.addEventListener('scroll', handleBankScroll, { passive: true });
        expenseEl?.addEventListener('scroll', handleExpenseScroll, { passive: true });

        return () => {
            bankEl?.removeEventListener('scroll', handleBankScroll);
            expenseEl?.removeEventListener('scroll', handleExpenseScroll);
        };
    }, [isLocked]);

    // Task 1: Agentic Consensus Trigger (Key 'S')
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Avoid triggering when typing in inputs
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) return;

            if (e.key.toLowerCase() === 's') {
                setShowConsensus(true);
                setTimeout(() => setShowConsensus(false), 4000);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const bankRecords = React.useMemo(() => {
        if (!searchQuery) return allBankRecords;
        const lower = searchQuery.toLowerCase();
        return allBankRecords.filter(r => 
            r.description.toLowerCase().includes(lower) || 
            r.amount.toString().includes(lower)
        );
    }, [allBankRecords, searchQuery]);

    const expenseRecords = React.useMemo(() => {
        if (!searchQuery) return allExpenseRecords;
        const lower = searchQuery.toLowerCase();
        return allExpenseRecords.filter(r => 
            r.description.toLowerCase().includes(lower) || 
            r.actual_amount.toString().includes(lower)
        );
    }, [allExpenseRecords, searchQuery]);

    const [hasError, setHasError] = useState(false);
    const { toast } = useToast();

    const bankParentRef = useRef<HTMLDivElement>(null);
    const expenseParentRef = useRef<HTMLDivElement>(null);

    const refreshData = useCallback(async () => {
        if (!activeProjectId) return;
        try {
            const [bankRes, internalRes, suggestedRes] = await Promise.all([
                authenticatedFetch(API_ROUTES.RECONCILIATION.BANK(activeProjectId)),
                authenticatedFetch(API_ROUTES.RECONCILIATION.INTERNAL(activeProjectId)),
                authenticatedFetch(`/api/v1/reconciliation/${activeProjectId}/suggested`)
            ]);

            if (bankRes.ok) {
                const bankData = await bankRes.json();
                setAllBankRecords(bankData);
            }
            if (internalRes.ok) {
                const internalData = await internalRes.json();
                setAllExpenseRecords(internalData);
            }
            if (suggestedRes.ok) {
                const suggestedData = await suggestedRes.json();
                setSuggestedMatches(suggestedData);
            }
        } catch (e) {
            console.error("Failed to fetch reconciliation data", e);
            setHasError(true);
        }
    }, [activeProjectId]);

    const confirmMatch = async (matchId: string) => {
        if (!activeProjectId) return;
        try {
            const res = await authenticatedFetch(`/api/v1/reconciliation/${activeProjectId}/confirm/${matchId}`, {
                method: 'POST'
            });
            if (res.ok) {
                toast("Match confirmed and sealed in ledger.", "success");
                
                // Real-time Evidence Injection
                if (activeInvestigation) {
                    const match = suggestedMatches.find(m => m.id === matchId);
                    if (match) {
                        const internal = allExpenseRecords.find(r => r.id === match.internal_tx_id);
                        if (internal) {
                            injectEvidence(activeInvestigation.id, {
                                id: `MATCH-${matchId}`,
                                type: 'transaction',
                                label: `Match: ${internal.description}`,
                                description: `Autonomous match confirmed with ${match.confidence_score * 100}% confidence. Reasoning: ${match.ai_reasoning}`,
                                sourceTool: 'Reconciliation Intelligence',
                                timestamp: new Date().toISOString(),
                                verdict: 'ADMITTED'
                            });
                        }
                    }
                }
                
                refreshData();
            }
        } catch (e) {
            toast("Failed to confirm match.", "error");
        }
    };

    useEffect(() => {
        if (activeProjectId) {
            emitAction('VIEWING_RECONCILIATION');
            refreshData();
        }
    }, [activeProjectId, emitAction, refreshData]);

    // WebSocket Live-Link
    useEffect(() => {
        if (!activeProjectId) return;
        const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/ws/stats/${activeProjectId}`);
        ws.onmessage = (event) => {
             try {
                 const payload = JSON.parse(event.data);
                 if (payload.type === 'RECONCILIATION_UPDATE' || (payload.type === 'AGENT_ACTIVITY' && payload.subtype === 'MATCH_FOUND')) {
                     toast("New potential matches identified.", "info");
                     refreshData();
                 }
             } catch(e) {}
        };
        return () => ws.close();
    }, [activeProjectId, refreshData, toast]);

    const getBankScrollElement = useCallback(() => bankParentRef.current, []);
    const estimateSize = useCallback(() => 100, []);

    // eslint-disable-next-line react-hooks/incompatible-library
    const bankVirtualizer = useVirtualizer({
        count: bankRecords.length,
        getScrollElement: getBankScrollElement,
        estimateSize: estimateSize,
        overscan: 5,
    });

    const getExpenseScrollElement = useCallback(() => expenseParentRef.current, []);

    const expenseVirtualizer = useVirtualizer({
        count: expenseRecords.length,
        getScrollElement: getExpenseScrollElement,
        estimateSize: estimateSize,
        overscan: 5,
    });

    return (
        <div className="h-full flex flex-col overflow-hidden bg-transparent">
            {!activeProjectId && (
                 <div className="flex-1 flex flex-col items-center justify-center p-20 opacity-50">
                    <Building2 className="w-16 h-16 text-slate-700 mb-6" />
                    <h2 className="text-xl font-black text-slate-500 uppercase tracking-[0.3em]">No Mission Active</h2>
                    <p className="text-xs text-slate-600 mt-2 font-mono">Select a project from the command bar to initialize neural sync.</p>
                 </div>
            )}
            
            {activeProjectId && hasError && (
                 <div className="flex-1 flex flex-col items-center justify-center p-20 opacity-80">
                    <Activity className="w-16 h-16 text-rose-500 mb-6 animate-pulse" />
                    <h2 className="text-xl font-black text-rose-500 uppercase tracking-[0.3em]">Neural Link Severed</h2>
                    <p className="text-xs text-rose-300 mt-2 font-mono uppercase">Bank/Ledger Sync Failed. Retrying consensus protocol...</p>
                    <button onClick={refreshData} className="mt-8 px-8 py-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl uppercase font-black text-xs hover:bg-rose-500 hover:text-white transition-all">
                        Force Reconnect
                    </button>
                 </div>
            )}
            
            {activeProjectId && !hasError && (
            <>
            {/* TACTICAL WORKSPACE: SIDE-BY-SIDE */}
            <main className="flex-1 flex gap-10 overflow-hidden relative p-4">
                {/* SUGGESTED MATCHES HUD (OVERLAY PANEL) */}
                <AnimatePresence>
                    {showMatchPanel && suggestedMatches.length > 0 && (
                        <motion.div 
                            initial={{ x: -400, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -400, opacity: 0 }}
                            className="absolute left-8 top-8 bottom-8 w-96 z-50 glass-tactical border border-indigo-500/30 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl"
                        >
                            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-indigo-500/10">
                                <div className="flex items-center gap-3">
                                    <BrainCircuit className="w-5 h-5 text-indigo-400" />
                                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Suggested Triage</h3>
                                </div>
                                <button onClick={() => setShowMatchPanel(false)} className="text-slate-500 hover:text-white transition-colors">
                                    <X size={18} />
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                {suggestedMatches.map((match) => {
                                    const internal = allExpenseRecords.find(r => r.id === match.internal_tx_id);
                                    const bank = allBankRecords.find(r => r.id === match.bank_tx_id);
                                    if (!internal || !bank) return null;

                                    return (
                                        <div 
                                            key={match.id}
                                            className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl hover:border-indigo-500/30 transition-all cursor-pointer group"
                                            onClick={() => setSelectedMatch(match)}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <TierBadge tier={match.tier || 'TIER_4_WEAK'} />
                                                <span className="text-[10px] font-black text-indigo-400 font-mono">{(match.confidence_score * 100).toFixed(0)}%</span>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                    <p className="text-[10px] text-slate-300 uppercase truncate">{internal.description}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                    <p className="text-[10px] text-slate-300 uppercase truncate">{bank.description}</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 flex gap-2">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); confirmMatch(match.id!); }}
                                                    className="flex-1 h-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                                                >
                                                    Confirm Match
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Reasoning HUD Details */}
                            <AnimatePresence>
                                {selectedMatch && (
                                    <motion.div 
                                        initial={{ y: 100, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        className="p-6 bg-slate-900 border-t border-white/10"
                                    >
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">AI Reasoning Breakdown</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedMatch.ai_reasoning?.split('|').map((part, i) => (
                                                <div key={i} className="px-2 py-1 bg-white/5 border border-white/5 rounded text-[9px] font-mono text-slate-400 uppercase">
                                                    {part.trim()}
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>

                {!showMatchPanel && (
                    <button 
                        onClick={() => setShowMatchPanel(true)}
                        className="absolute left-8 top-8 z-50 w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-900/40 hover:scale-110 transition-all"
                    >
                        <BrainCircuit size={20} />
                    </button>
                )}

                {/* LEFT: BANK TRUTH */}
                <section className="flex-1 flex flex-col glass-tactical rounded-[2.5rem] overflow-hidden border border-white/5 shadow-ao perspective-1000">

                    <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] backdrop-blur-md relative z-20">
                        <div className="flex items-center gap-3">
                            <Landmark className="w-5 h-5 text-indigo-400" />
                            <h2 className="text-sm font-black text-white italic tracking-widest uppercase">BANK_STATEMENT_TRUTH</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <AnimatePresence>
                                {Object.values(others).filter(u => u.action === 'VIEWING_RECONCILIATION').map(u => (
                                    <motion.div 
                                        key={u.id}
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center border border-white/20 shadow-lg"
                                        title={`${u.name} is viewing`}
                                    >
                                        <UserIcon size={10} className="text-white" />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            <Badge variant="outline" className="text-indigo-400 border-indigo-500/20 uppercase text-[8px]">Primary Source</Badge>
                        </div>
                    </div>
                    
                    <div 
                        ref={bankParentRef}
                        className="flex-1 overflow-y-auto custom-scrollbar p-6"
                    >
                        {bankRecords.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-40">
                                <ShieldCheck className="w-8 h-8 text-indigo-400 mb-2" />
                                <span className="text-[11px] uppercase tracking-widest text-indigo-300">No Validated Records</span>
                            </div>
                        ) : (
                        <div
                            className="w-full relative h-[var(--bank-total)]"
                            style={{ '--bank-total': `${bankVirtualizer.getTotalSize()}px` } as React.CSSProperties}
                        >
                            {bankVirtualizer.getVirtualItems().map(virtualRow => {
                                const record = bankRecords[virtualRow.index];
                                return (
                                    <div
                                        key={record.id}
                                        style={{ '--bank-offset': `${virtualRow.start}px` } as React.CSSProperties}
                                        className="absolute top-0 left-0 w-full group hover:bg-white/5 transition-all cursor-pointer pb-4 translate-y-[var(--bank-offset)]"
                                    >
                                        <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex justify-between items-center group/row">
                                            <div className="flex items-center gap-4">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveLocation({
                                                            lat: record.latitude || -6.2,
                                                            lng: record.longitude || 106.8,
                                                            name: record.description
                                                        });
                                                        setShowMiniMap(true);
                                                    }}
                                                    className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 opacity-0 group-hover/row:opacity-100 transition-all hover:bg-indigo-500 hover:text-white"
                                                    title="View physical location"
                                                >
                                                    <MapIcon size={14} />
                                                </button>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-none">{new Date(record.transaction_date || record.timestamp).toLocaleDateString()}</p>
                                                        {record.batch_reference && (
                                                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 animate-pulse">
                                                                <Layers size={8} />
                                                                <span className="text-[7px] font-black uppercase tracking-tighter">Batch Prism</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-xs font-bold text-white uppercase truncate max-w-[200px]">{record.description}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-black text-white font-mono tracking-tighter">IDR {record.amount.toLocaleString()}</p>
                                                <div className="flex justify-end gap-1 mt-1">
                                                    <div className="w-1 h-1 bg-indigo-500 rounded-full" />
                                                    <div className="w-1 h-1 bg-indigo-500 rounded-full opacity-30" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        )}
                    </div>
                </section>

                {/* THE SYNC FLOW (MIDDLE) */}
                <div className="flex flex-col items-center justify-center gap-4">
                    <div className="w-px h-full bg-gradient-to-b from-indigo-500/0 via-indigo-500/50 to-indigo-500/0" />
                    <button 
                        onClick={() => setIsLocked(!isLocked)}
                        className={`w-10 h-10 rounded-full border transition-all flex items-center justify-center shadow-xl ${
                            isLocked 
                            ? 'bg-indigo-500 border-indigo-400 text-white animate-pulse' 
                            : 'bg-slate-900/50 border-white/10 text-slate-500 hover:text-white'
                        }`}
                        title={isLocked ? "Unlock Scrolling" : "Lock Scrolling (Temporal Sync)"}
                    >
                        {isLocked ? <Lock size={16} /> : <Zap size={16} />}
                    </button>
                    <ArrowRightLeft className={`w-6 h-6 my-4 transition-colors ${isLocked ? 'text-indigo-400' : 'text-slate-700'}`} />
                    <div className="w-px h-full bg-gradient-to-b from-indigo-500/0 via-indigo-500/50 to-indigo-500/0" />
                </div>

                {/* RIGHT: JOURNAL CLAIMS */}
                <section className="flex-1 flex flex-col glass-tactical rounded-[2.5rem] overflow-hidden border border-white/5 shadow-ao perspective-1000">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] backdrop-blur-md relative z-20">
                        <div className="flex items-center gap-3">
                            <Building2 className="w-5 h-5 text-amber-400" />
                            <h2 className="text-sm font-black text-white italic tracking-widest uppercase">INTERNAL_LEDGER_CLAIM</h2>
                        </div>
                        <Badge variant="outline" className="text-amber-400 border-amber-500/20 uppercase text-[8px]">Unverified</Badge>
                    </div>

                    <div 
                        ref={expenseParentRef}
                        className="flex-1 overflow-y-auto custom-scrollbar p-6"
                    >
                        <div
                             className="w-full relative h-[var(--expense-total)]"
                             style={{ '--expense-total': `${expenseVirtualizer.getTotalSize()}px` } as React.CSSProperties}
                        >
                            {expenseVirtualizer.getVirtualItems().map(virtualRow => {
                                const record = expenseRecords[virtualRow.index];
                                return (
                                    <div
                                        key={record.id}
                                        style={{ '--expense-offset': `${virtualRow.start}px` } as React.CSSProperties}
                                        onClick={() => {
                                            setSelectedExpense(record);
                                            // Auto-trigger Engineer's Trap if it's a material/const item
                                            if (record.description.toLowerCase().includes('concrete') || record.description.toLowerCase().includes('sand') || record.description.toLowerCase().includes('material')) {
                                                setShowBridgeInfo(true);
                                            }
                                        }}
                                        className="absolute top-0 left-0 w-full group hover:bg-indigo-600/10 hover:border-indigo-500/30 transition-all cursor-pointer shimmer-unverified pb-4 translate-y-[var(--expense-offset)]"
                                    >
                                        <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex justify-between items-center group/row">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="text-[11px] font-black text-amber-500 uppercase tracking-widest leading-none">{new Date(record.transaction_date).toLocaleDateString()}</p>
                                                    {record.potential_misappropriation && <AlertTriangle className="w-3 h-3 text-rose-500" />}
                                                </div>
                                                <p className="text-xs font-bold text-slate-300 uppercase truncate max-w-[200px] group-hover:text-white transition-colors">{record.description}</p>
                                            </div>
                                            <div className="text-right flex flex-col items-end">
                                                <p className="text-xs font-black text-white font-mono tracking-tighter">IDR {record.actual_amount.toLocaleString()}</p>
                                                
                                                <div className="flex items-center gap-2 mt-2">
                                                    {(record.description.toLowerCase().includes('concrete') || record.description.toLowerCase().includes('sand')) && (
                                                        <div className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500" title="Engineer's Trap Available">
                                                            <Hammer size={12} />
                                                        </div>
                                                    )}
                                                    <button 
                                                        title="Initiate Manual Match"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toast("Request sent to Neural Core for forced alignment.", "success");
                                                        }}
                                                        className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.2em] opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center gap-2 hover:text-indigo-300"
                                                    >
                                                        Manual Match <Zap size={10} className="text-amber-500" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </main>

            {/* Pillar II: Engineer's Trap - Structural Reality Overlay */}
            <AnimatePresence>
                {showBridgeInfo && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-12 bg-slate-950/90 backdrop-blur-md">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 50 }}
                            className="w-full max-w-6xl h-full flex flex-col relative"
                        >
                            <button 
                                onClick={() => setShowBridgeInfo(false)}
                                className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-all z-[160]"
                            >
                                <X size={24} />
                            </button>

                            <BridgeComponentInfographic 
                                title={`Pillar II: Engineer's Trap - ${selectedExpense?.description}`}
                                components={[
                                    { id: 'abutment_l', name: 'Foundation East', status: 'verified', progress: 100 },
                                    { id: 'span_1', name: 'Main Deck A', status: 'anomaly', progress: 45, highlight: true },
                                    { id: 'span_2', name: 'Support Beams', status: 'verified', progress: 85 },
                                    { id: 'abutment_r', name: 'Foundation West', status: 'pending', progress: 20 },
                                ]}
                            />

                            <div className="mt-8 p-10 bg-indigo-600/10 border border-indigo-500/20 rounded-[3rem] flex items-center justify-between shadow-2xl">
                                <div className="flex items-center gap-8">
                                    <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                                        <AlertTriangle size={32} className="animate-pulse" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black text-white uppercase tracking-tighter italic">Material Variance Detected</h4>
                                        <p className="text-xs text-indigo-100 font-medium max-w-xl mt-1 leading-relaxed">
                                            The ledger claims 450m³ of concrete was poured for &quot;Main Deck A&quot;, but site telemetry and physical progress verification only account for 180m³. This is a high-confidence Pillar II violation.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-3">
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Proven Leakage</div>
                                        <div className="text-3xl font-black text-rose-500 italic tracking-tighter">Rp 2.4B</div>
                                    </div>
                                    <Button className="h-12 px-8 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase text-[11px] tracking-[0.2em] rounded-xl shadow-lg shadow-rose-900/40">
                                        Flag for Statutory Review
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Agentic Consensus Animation Overlay */}
            <AnimatePresence>
                {showConsensus && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl"
                    >
                        <div className="relative flex flex-col items-center">
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: [0.5, 1.2, 1], opacity: 1 }}
                                transition={{ duration: 1, times: [0, 0.7, 1] }}
                                className="w-48 h-48 rounded-full bg-indigo-500/20 border-2 border-indigo-500/50 flex items-center justify-center mb-12 relative"
                            >
                                <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 rounded-full border-t-2 border-indigo-400 border-dashed"
                                />
                                <BrainCircuit className="w-20 h-20 text-indigo-400" />
                            </motion.div>
                            
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="text-center"
                            >
                                <h2 className="text-6xl font-black text-white italic tracking-tighter uppercase mb-4 leading-none tracking-[0.6em]">Agentic Consensus</h2>
                                <p className="text-indigo-400 font-mono text-sm uppercase tracking-[0.4em]">Synchronizing Multi-Agent Truth Ledger...</p>
                            </motion.div>

                            <div className="mt-20 flex gap-10">
                                {['Auditor', 'Tracer', 'Judge'].map((agent, i) => (
                                    <motion.div
                                        key={agent}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 1 + i * 0.3 }}
                                        className="flex flex-col items-center gap-4"
                                    >
                                        <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                                            <motion.div 
                                                animate={{ x: [-64, 64] }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                                className="w-16 h-full bg-indigo-500"
                                            />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{agent} Linked</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            </>
            )}
        </div>
    );
}
