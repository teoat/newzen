'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Landmark, ArrowRightLeft, Settings2, 
  ShieldCheck, 
  Save, 
  Activity, Clock, Percent, Zap, Search, X, AlertTriangle
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Badge } from '../../ui/badge';

import { useProject } from '../../store/useProject';
import { useForensicNotifications } from '../../components/ForensicNotificationProvider';
import { API_ROUTES } from '../../services/apiRoutes';
import { API_URL } from '../../lib/constants';
import { authenticatedFetch } from '../../lib/api';
import AIExplainerModal from '../../app/components/AIExplainerModal';

import { BankRecord, ExpenseRecord, Match, ReconciliationSettings } from '../../types/domain';

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
import { useVirtualizer } from '@tanstack/react-virtual';
import { RecordCard } from './components/RecordCard';
import { ConfigSlider } from './components/ConfigSlider';
import { TopMetric } from './components/TopMetric';

export default function ReconciliationWorkspace() {
    const { activeProjectId } = useProject();
    const [bankRecords, setBankRecords] = useState<BankRecord[]>([]);
    const [expenseRecords, setExpenseRecords] = useState<ExpenseRecord[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const bankParentRef = useRef<HTMLDivElement>(null);
    const expenseParentRef = useRef<HTMLDivElement>(null);

    const bankVirtualizer = useVirtualizer({
        count: bankRecords.length,
        getScrollElement: () => bankParentRef.current,
        estimateSize: () => 100,
        overscan: 5,
    });

    const expenseVirtualizer = useVirtualizer({
        count: expenseRecords.length,
        getScrollElement: () => expenseParentRef.current,
        estimateSize: () => 100,
        overscan: 5,
    });

    return (
        <div className="h-full flex flex-col overflow-hidden bg-transparent">
            {/* TACTICAL WORKSPACE: SIDE-BY-SIDE */}
            <main className="flex-1 flex gap-10 overflow-hidden relative p-4">
                {/* LEFT: BANK TRUTH */}
                <section className="flex-1 flex flex-col glass-tactical rounded-[2.5rem] overflow-hidden border border-white/5 shadow-ao perspective-1000">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] backdrop-blur-md relative z-20">
                        <div className="flex items-center gap-3">
                            <Landmark className="w-5 h-5 text-indigo-400" />
                            <h2 className="text-sm font-black text-white italic tracking-widest uppercase">BANK_STATEMENT_TRUTH</h2>
                        </div>
                        <Badge variant="outline" className="text-indigo-400 border-indigo-500/20 uppercase text-[8px]">Primary Source</Badge>
                    </div>
                    
                    <div 
                        ref={bankParentRef}
                        className="flex-1 overflow-y-auto custom-scrollbar p-6"
                    >
                        <div
                            style={{
                                height: `${bankVirtualizer.getTotalSize()}px`,
                                width: '100%',
                                position: 'relative',
                            }}
                        >
                            {bankVirtualizer.getVirtualItems().map(virtualRow => {
                                const record = bankRecords[virtualRow.index];
                                return (
                                    <div
                                        key={record.id}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            transform: `translateY(${virtualRow.start}px)`,
                                            paddingBottom: '1rem'
                                        }}
                                        className="group hover:bg-white/5 transition-all cursor-pointer"
                                    >
                                        <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex justify-between items-center">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{new Date(record.transaction_date || record.timestamp).toLocaleDateString()}</p>
                                                <p className="text-xs font-bold text-white uppercase truncate max-w-[200px]">{record.description}</p>
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
                    </div>
                </section>

                {/* THE SYNC FLOW (MIDDLE) */}
                <div className="flex flex-col items-center justify-center opacity-30">
                    <div className="w-px h-full bg-gradient-to-b from-indigo-500/0 via-indigo-500/50 to-indigo-500/0" />
                    <ArrowRightLeft className="w-6 h-6 text-indigo-500 my-4" />
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
                            style={{
                                height: `${expenseVirtualizer.getTotalSize()}px`,
                                width: '100%',
                                position: 'relative',
                            }}
                        >
                            {expenseVirtualizer.getVirtualItems().map(virtualRow => {
                                const record = expenseRecords[virtualRow.index];
                                return (
                                    <div
                                        key={record.id}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            transform: `translateY(${virtualRow.start}px)`,
                                            paddingBottom: '1rem'
                                        }}
                                        className="group hover:bg-indigo-600/10 hover:border-indigo-500/30 transition-all cursor-pointer shimmer-unverified"
                                    >
                                        <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex justify-between items-center">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none">{new Date(record.transaction_date).toLocaleDateString()}</p>
                                                    {record.potential_misappropriation && <AlertTriangle className="w-3 h-3 text-rose-500" />}
                                                </div>
                                                <p className="text-xs font-bold text-slate-300 uppercase truncate max-w-[200px] group-hover:text-white transition-colors">{record.description}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-black text-white font-mono tracking-tighter">IDR {record.actual_amount.toLocaleString()}</p>
                                                <button className="mt-2 text-[8px] font-black text-indigo-400 uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 ml-auto">
                                                    Manual Match <Zap size={10} className="text-amber-500" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
