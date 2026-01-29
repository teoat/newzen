'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Landmark, ArrowRightLeft, Settings2, 
  ShieldCheck, 
  Save, 
  Activity, Clock, Percent, Zap
} from 'lucide-react';

import { useProject } from '@/store/useProject';
import { useForensicNotifications } from '@/components/ForensicNotificationProvider';
import { API_ROUTES } from '@/services/apiRoutes';
import { API_URL } from '@/utils/constants';
import AIExplainerModal from '@/app/components/AIExplainerModal';

import { BankRecord, ExpenseRecord, Match, ReconciliationSettings } from '@/types/domain';

// Enhanced interfaces for better type safety
interface MapData {
  bankRecords: BankRecord[];
  expenseRecords: ExpenseRecord[];
  matches: Match[];
}

interface TransactionValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface AutoConfirmResponse {
  auto_confirmed: number;
  flagged_for_review: number;
  message?: string;
}
import { RecordCard } from './components/RecordCard';
import { ConfigSlider } from './components/ConfigSlider';
import { TopMetric } from './components/TopMetric';

export default function ReconciliationWorkspace() {
    const { activeProjectId } = useProject();
    const notifications = useForensicNotifications();
    const [bankRecords, setBankRecords] = useState<BankRecord[]>([]);
    const [expenseRecords, setExpenseRecords] = useState<ExpenseRecord[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [settings, setSettings] = useState<ReconciliationSettings>({
        clearing_window_days: 7,
        amount_tolerance_percent: 0.5,
        batch_window_days: 10,
        auto_confirm_threshold: 0.98
    });
    const [showSettings, setShowSettings] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hoveredMatch, setHoveredMatch] = useState<string | null>(null);
    const [explainingId, setExplainingId] = useState<string | null>(null);

    // Optimization: Memoize Set lookups for O(1) access
    const matchedBankIds = React.useMemo(() => new Set(matches.map(m => m.bank_tx_id)), [matches]);
    const matchedInternalIds = React.useMemo(() => new Set(matches.map(m => m.internal_tx_id)), [matches]);

    useEffect(() => {
        if (!activeProjectId) return;
        const loadWorkspace = async () => {
            setIsLoading(true);
            try {
                // Fetch settings
                const settingsRes = await fetch(API_ROUTES.RECONCILIATION.SETTINGS(activeProjectId));
                if (settingsRes.ok) setSettings(await settingsRes.json());

                // Fetch data
                const [bankRes, expRes, matchRes] = await Promise.all([
                    fetch(API_ROUTES.RECONCILIATION.BANK(activeProjectId)),
                    fetch(API_ROUTES.RECONCILIATION.INTERNAL(activeProjectId)),
                    fetch(API_ROUTES.RECONCILIATION.SUGGESTED_MATCHES(activeProjectId))
                ]);

                if (bankRes.ok) setBankRecords(await bankRes.json());
                if (expRes.ok) setExpenseRecords(await expRes.json());
                if (matchRes.ok) setMatches(await matchRes.json());
            } catch (err) {
                console.error("Failed to load workspace", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadWorkspace();
    }, [activeProjectId]);

    const handleSaveSettings = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(API_ROUTES.RECONCILIATION.SETTINGS(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...settings, project_id: activeProjectId })
            });
            if (res.ok) {
                setShowSettings(false);
                // Refresh matches with new settings
                const matchRes = await fetch(API_ROUTES.RECONCILIATION.SUGGESTED_MATCHES(activeProjectId));
                if (matchRes.ok) setMatches(await matchRes.json());
            }
        } catch (err) {
            console.error("Save failed", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmMatch = async (matchId: string) => {
        try {
            const res = await fetch(API_ROUTES.RECONCILIATION.CONFIRM(activeProjectId, matchId), {
                method: 'POST'
            });
            if (res.ok) {
                notifications.success("MATCH CONFIRMED", "Transaction has been cryptographically linked to bank record.");
                // Update local state
                setMatches(prev => prev.map(m => m.id === matchId ? { ...m, confirmed: true } : m));
            }
        } catch (err) {
            console.error(err);
            notifications.error("CONFIRMATION FAILED", "Uplink to reconciliation engine failed.");
        }
    };

    return (
        <div className="min-h-[80vh] depth-layer-0 text-depth-primary font-sans overflow-hidden flex flex-col rounded-3xl tactical-frame depth-border-medium shadow-3xl">
            {/* Contextual Stats Bar instead of Full Nav */}
            <div className="h-16 border-b depth-border-subtle depth-layer-1 backdrop-blur-xl flex items-center justify-between px-10 shrink-0 z-50">
                <div className="flex items-center gap-8">
                    <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                        <ArrowRightLeft className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">FORENSIC_CONSENSUS_HUB</h1>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1 italic">Handshake Integrity: <span className="text-emerald-500">OPTIMAL</span></p>
                    </div>
                </div>

                <div className="flex items-center gap-10">
                    <div className="flex gap-8">
                        <TopMetric label="Direct Matches" val={matches.filter(m => m.match_type === 'direct').length} />
                        <TopMetric label="Aggregated" val={matches.filter(m => m.match_type === 'aggregate').length} />
                        <TopMetric label="Discrepancies" val={bankRecords.length - matchedBankIds.size} danger />
                    </div>
                    
                    <div className="w-px h-10 bg-white/5" />

                    {/* Auto-Confirm Button */}
                    {matches.some(m => m.ai_reasoning?.includes('AUTO_OK')) && (
                        <button 
                            onClick={async () => {
                                try {
                                    const res = await fetch(API_ROUTES.RECONCILIATION.AUTO_CONFIRM(activeProjectId), { method: 'POST' });
                                    const data: AutoConfirmResponse = await res.json();
                                    
                                    if (res.ok) {
                                        notifications.success(
                                            "AUTO-CONFIRMATION COMPLETE", 
                                            `${data.auto_confirmed} matches confirmed. ${data.flagged_for_review} flagged for review.`
                                        );
                                        // Refresh matches
                                        const matchRes = await fetch(API_ROUTES.RECONCILIATION.SUGGESTED_MATCHES(activeProjectId));
                                        if (matchRes.ok) setMatches(await matchRes.json() as Match[]);
                                    } else {
                                        throw new Error(data.message || 'Auto-confirmation failed');
                                    }
                                } catch (err) {
                                    notifications.error("EXECUTION FAILED", "Auto-confirmation sequence was interrupted.");
                                    console.error(err);
                                }
                            }}
                            className="flex items-center gap-3 bg-emerald-500/10 hover:bg-emerald-500/20 px-6 py-2.5 rounded-xl border border-emerald-500/20 transition-all group depth-elevate depth-shadow-sm hover:depth-shadow-glow"
                        >
                            <ShieldCheck className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform duration-300" />
                            <span className="text-xs font-black uppercase tracking-widest text-emerald-400 italic">
                                Auto-Confirm ({matches.filter(m => m.ai_reasoning?.includes('AUTO_OK')).length})
                            </span>
                        </button>
                    )}

                    <button 
                        onClick={() => setShowSettings(true)}
                        className="flex items-center gap-3 depth-layer-2 hover:depth-layer-3 px-6 py-2.5 rounded-xl depth-border-subtle transition-all group depth-elevate"
                    >
                        <Settings2 className="w-4 h-4 text-depth-secondary group-hover:rotate-90 transition-transform duration-500" />
                        <span className="text-xs font-black uppercase tracking-widest text-depth-primary italic">Engine Config</span>
                    </button>
                </div>
            </div>

            {/* Integrity Line */}
            <div className="integrity-line opacity-50" />

            {/* Main Workspace: SIDE-BY-SIDE */}
            <main className="flex-1 flex overflow-hidden relative">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.05),transparent_50%)] pointer-events-none" />

                {/* Left: BANK TRUTH */}
                <section className="flex-1 border-r depth-border-subtle flex flex-col">
                    <div className="p-6 depth-layer-1 border-b depth-border-subtle flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Landmark className="w-5 h-5 text-indigo-400" />
                            <h2 className="text-sm font-black text-depth-primary italic tracking-widest uppercase">BANK_STATEMENT_TRUTH</h2>
                        </div>
                        <span className="text-[9px] font-bold text-indigo-400 opacity-50 uppercase tracking-[0.3em]">Source: Digital Export</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
                        {bankRecords.map(record => (
                            <RecordCard 
                                key={record.id}
                                id={record.id}
                                date={record.booking_date || record.timestamp}
                                desc={record.description}
                                amount={record.amount}
                                isMatched={matchedBankIds.has(record.id)}
                                isTruth
                                 matches={matches}
                                 onHoverMatch={setHoveredMatch}
                                 hoveredMatchId={hoveredMatch}
                                 onConfirm={handleConfirmMatch}
                                 onExplain={setExplainingId}
                             />

                        ))}
                    </div>
                </section>

                {/* Center: Connectors (Visual Only) */}
                <div className="w-12 flex flex-col items-center justify-center opacity-20 pointer-events-none">
                    <div className="w-px h-full bg-gradient-to-b from-indigo-500/0 via-indigo-500/50 to-indigo-500/0" />
                </div>

                {/* Right: JOURNAL CLAIMS */}
                <section className="flex-1 flex flex-col">
                    <div className="p-6 depth-layer-1 border-b depth-border-subtle flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Building2 className="w-5 h-5 text-amber-400" />
                            <h2 className="text-sm font-black text-depth-primary italic tracking-widest uppercase">EXPENSES_JOURNAL_CLAIM</h2>
                        </div>
                        <span className="text-[9px] font-bold text-amber-400 opacity-50 uppercase tracking-[0.3em]">Source: Internal Ledger</span>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
                        {expenseRecords.map(record => (
                            <RecordCard 
                                key={record.id}
                                id={record.id}
                                date={record.transaction_date}
                                desc={record.description}
                                amount={record.actual_amount}
                                isMatched={matchedInternalIds.has(record.id)}
                                matches={matches}
                                 onHoverMatch={setHoveredMatch}
                                 hoveredMatchId={hoveredMatch}
                                 riskDescription={record.mens_rea_description}
                                 onConfirm={handleConfirmMatch}
                                 onExplain={setExplainingId}
                             />

                        ))}
                    </div>
                </section>
            </main>

            {/* Settings Overlay */}
            <AnimatePresence>
                {showSettings && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowSettings(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                        />
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 bottom-0 w-[400px] depth-layer-3 border-l depth-border-strong p-10 z-[101] shadow-2xl flex flex-col"
                        >
                            <div className="mb-10 flex items-center justify-between">
                                <h2 className="text-2xl font-black text-white italic flex items-center gap-3">
                                    <Zap className="w-6 h-6 text-indigo-500" /> HUB_CONFIG
                                </h2>
                                <button 
                                    onClick={() => setShowSettings(false)} 
                                    className="text-slate-500 hover:text-white transition-colors"
                                    title="Close Configuration"
                                >
                                    <Settings2 className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-10 flex-1 overflow-y-auto no-scrollbar pr-4">
                                <ConfigSlider 
                                    icon={<Clock className="w-4 h-4" />}
                                    label="Clearing Window" 
                                    sub="Max days for bank clearing lag"
                                    val={settings.clearing_window_days} 
                                    min={1} max={30} unit="Days"
                                    onChange={(v: number) => setSettings(prev => ({ ...prev, clearing_window_days: v }))}
                                />
                                <ConfigSlider 
                                    icon={<Percent className="w-4 h-4" />}
                                    label="Amount Tolerance" 
                                    sub="Allowed % variance for fees"
                                    val={settings.amount_tolerance_percent} 
                                    min={0} max={5} step={0.1} unit="%"
                                    onChange={(v: number) => setSettings(prev => ({ ...prev, amount_tolerance_percent: v }))}
                                />
                                <ConfigSlider 
                                    icon={<Activity className="w-4 h-4" />}
                                    label="Batch Window" 
                                    sub="Max lookback for aggregate groups"
                                    val={settings.batch_window_days} 
                                    min={1} max={60} unit="Days"
                                    onChange={(v: number) => setSettings(prev => ({ ...prev, batch_window_days: v }))}
                                />
                                <ConfigSlider 
                                    icon={<ShieldCheck className="w-4 h-4" />}
                                    label="Auto-Confirm Score" 
                                    sub="Confidence required for automation"
                                    val={settings.auto_confirm_threshold * 100} 
                                    min={80} max={100} unit="%"
                                    onChange={(v: number) => setSettings(prev => ({ ...prev, auto_confirm_threshold: v / 100 }))}
                                />
                            </div>

                            <button 
                                onClick={handleSaveSettings}
                                className="mt-10 w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-white font-black italic uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-indigo-500/50"
                            >
                                <Save className="w-5 h-5" /> Calibrate Engine
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* AI Explainer Modal */}
            <AIExplainerModal 
                isOpen={!!explainingId} 
                onClose={() => setExplainingId(null)} 
                transactionId={explainingId || ''} 
            />
        </div>
    );
}
