'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useProject } from '../../../store/useProject';
import { ApiClient } from '../../../lib/apiClient';
import { z } from 'zod';
import ForensicPageLayout from '../../components/ForensicPageLayout';
import { Activity, ShieldAlert, Heart, Save, CheckCircle2, ChevronRight, HelpCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/toast';

// Schema for Quarantine Row
const QuarantineRowSchema = z.object({
    id: z.string(),
    project_id: z.string(),
    raw_data_json: z.record(z.any()),
    error_message: z.string(),
    error_type: z.string(),
    status: z.string(),
    row_index: z.number(),
    created_at: z.string(),
});

type QuarantineRow = z.infer<typeof QuarantineRowSchema>;

export default function IngestionHospital() {
    const { toast } = useToast();
    const { activeProjectId } = useProject();
    const [rows, setRows] = useState<QuarantineRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRow, setSelectedRow] = useState<QuarantineRow | null>(null);
    const [isRepairing, setIsRepairing] = useState(false);
    const [repairData, setRepairData] = useState({
        receiver_name: '',
        amount: '',
        description: '',
        sender: ''
    });

    const fetchQuarantine = useCallback(async () => {
        if (!activeProjectId) return;
        setLoading(true);
        try {
            const data = await ApiClient.get(z.array(QuarantineRowSchema), `/api/v1/ingestion/hospital/${activeProjectId}/quarantine`);
            setRows(data);
        } catch (e) {
            console.error('Failed to fetch quarantine', e);
        } finally {
            setLoading(false);
        }
    }, [activeProjectId]);

    useEffect(() => {
        if (activeProjectId) {
            void fetchQuarantine();
        }
    }, [activeProjectId, fetchQuarantine]);

    const handleSelectRow = (row: QuarantineRow) => {
        setSelectedRow(row);
        setRepairData({
            receiver_name: row.raw_data_json.receiver || '',
            amount: String(row.raw_data_json.amount || row.raw_data_json.credit || row.raw_data_json.debit || 0),
            description: row.raw_data_json.description || '',
            sender: row.raw_data_json.sender || ''
        });
    };

    const handleRepair = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRow || !activeProjectId) return;
        setIsRepairing(true);

        try {
            await ApiClient.post(z.any(), `/api/v1/ingestion/hospital/${activeProjectId}/repair/${selectedRow.id}`, repairData);
            
            // Animation/Transition delay for UX
            await new Promise(r => setTimeout(r, 600));
            
            setRows(prev => prev.filter(r => r.id !== selectedRow.id));
            toast(`Successfully injected Row #${selectedRow.row_index} into the vault.`, "success");
            setSelectedRow(null);
        } catch (e) {
            toast("Could not apply manual override.", "error");
        } finally {
            setIsRepairing(false);
        }
    };

    return (
        <ForensicPageLayout
            title="Ingestion Hospital"
            subtitle="Manual Repair of Quarantined Evidence"
            icon={Heart}
        >
            <div className="flex h-full gap-6 p-6 overflow-hidden">
                {/* Left: Ward List */}
                <div className="w-1/3 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Quarantined Rows ({rows.length})</h3>
                        <Activity size={12} className="text-indigo-400" />
                    </div>
                    
                    {loading ? (
                        <div className="flex-1 flex flex-col gap-3 items-center justify-center text-slate-600 text-[11px] uppercase font-bold animate-pulse">
                            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                            Scanning Ward...
                        </div>
                    ) : rows.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white/[0.02] border border-white/5 rounded-3xl text-center group">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                                <CheckCircle2 size={32} className="text-emerald-500" />
                            </div>
                            <p className="text-xs font-bold text-white uppercase tracking-widest mb-1">All Clear</p>
                            <p className="text-[11px] text-slate-500 font-mono">No anomalies requiring manual intervention.</p>
                        </div>
                    ) : (
                        <AnimatePresence>
                        {rows.map(row => (
                            <motion.button
                                layoutId={row.id}
                                key={row.id}
                                onClick={() => handleSelectRow(row)}
                                className={`p-5 rounded-2xl border text-left transition-all ${
                                    selectedRow?.id === row.id 
                                        ? 'bg-indigo-600/10 border-indigo-500/50 shadow-lg shadow-indigo-900/20' 
                                        : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[11px] font-black font-mono text-slate-500">ROW #{row.row_index}</span>
                                    <ShieldAlert size={12} className={row.error_type === 'missing_entity' ? 'text-amber-500' : 'text-rose-500'} />
                                </div>
                                <p className="text-xs font-bold text-white mb-1 truncate">{row.error_message}</p>
                                <p className="text-[11px] text-slate-500 font-mono truncate">{JSON.stringify(row.raw_data_json)}</p>
                            </motion.button>
                        ))}
                        </AnimatePresence>
                    )}
                </div>

                {/* Right: Repair Bench */}
                <div className="flex-1 bg-slate-900/50 border border-white/10 rounded-[2.5rem] p-10 flex flex-col shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                        <Activity size={200} />
                    </div>

                    <AnimatePresence mode="wait">
                        {selectedRow ? (
                            <motion.div 
                                key={selectedRow.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="h-full flex flex-col"
                            >
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-900/20">
                                        <Activity className="text-white w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-white uppercase tracking-tighter">Forensic Repair</h2>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Resolving Ingestion Conflict</p>
                                    </div>
                                </div>

                                <div className="bg-black/40 border border-white/5 rounded-2xl p-6 mb-8 relative group">
                                    <div className="absolute -left-1 top-6 w-1 h-8 bg-rose-500 rounded-r-full" />
                                    <div className="flex items-center gap-2 mb-4 text-[11px] font-black text-rose-500 uppercase tracking-widest">
                                        <ShieldAlert size={12} />
                                        Diagnosis: {selectedRow.error_type}
                                    </div>
                                    <pre className="text-[11px] font-mono text-slate-400 overflow-x-auto whitespace-pre-wrap leading-relaxed custom-scrollbar max-h-32">
                                        {JSON.stringify(selectedRow.raw_data_json, null, 2)}
                                    </pre>
                                </div>

                                <form onSubmit={handleRepair} className="space-y-6 flex-1 flex flex-col">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                                Receiver / Entity Name <HelpCircle size={10} />
                                            </label>
                                            <input 
                                                title="Receiver Name"
                                                value={repairData.receiver_name}
                                                onChange={e => setRepairData({...repairData, receiver_name: e.target.value})}
                                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                                                placeholder="PT. Example Corp"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Amount (IDR)</label>
                                            <input 
                                                title="Amount"
                                                type="number"
                                                value={repairData.amount}
                                                onChange={e => setRepairData({...repairData, amount: e.target.value})}
                                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none font-mono transition-colors"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Description Override</label>
                                        <input 
                                            title="Description Override"
                                            value={repairData.description}
                                            onChange={e => setRepairData({...repairData, description: e.target.value})}
                                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                                        />
                                    </div>

                                    <div className="flex gap-4 pt-4 mt-auto">
                                        <button 
                                            type="submit"
                                            disabled={isRepairing}
                                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl py-4 font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-900/40 active:scale-95"
                                        >
                                            {isRepairing ? <Loader2 className="animate-spin w-4 h-4" /> : <Save size={16} />} 
                                            {isRepairing ? 'Injecting...' : 'Seal & Inject into Vault'}
                                        </button>
                                        <button 
                                            type="button"
                                            disabled={isRepairing}
                                            onClick={() => setSelectedRow(null)}
                                            className="px-8 bg-white/5 hover:bg-white/10 text-slate-400 rounded-2xl font-black uppercase text-xs tracking-widest border border-white/10 transition-all"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 border border-indigo-500/20">
                                    <Activity className="text-indigo-400" size={32} />
                                </div>
                                <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-2 italic">Waiting for Patient...</h2>
                                <p className="text-slate-500 text-xs max-w-sm uppercase font-bold tracking-widest leading-loose">
                                    Select a quarantined row from the ward to perform manual forensic correction.
                                </p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </ForensicPageLayout>
    );
}
