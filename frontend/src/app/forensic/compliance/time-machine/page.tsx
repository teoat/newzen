'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useProject } from '../../../../store/useProject';
import { ApiClient } from '../../../../lib/apiClient';
import { z } from 'zod';
import ForensicPageLayout from '../../../../app/components/ForensicPageLayout';
import { History, ShieldCheck, User, Clock, ChevronRight, Fingerprint, Lock, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Schema for Audit Log
const AuditLogSchema = z.object({
    id: z.string(),
    entity_type: z.string(),
    entity_id: z.string(),
    action: z.string(),
    field_name: z.string().optional().nullable(),
    old_value: z.string().optional().nullable(),
    new_value: z.string().optional().nullable(),
    changed_by_user_id: z.string().optional().nullable(),
    change_reason: z.string().optional().nullable(),
    previous_hash: z.string().optional().nullable(),
    hash_signature: z.string().optional().nullable(),
    timestamp: z.string(),
});

type AuditLog = z.infer<typeof AuditLogSchema>;

export default function IntegrityTimeMachine() {
    const { activeProjectId } = useProject();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    const fetchLogs = useCallback(async () => {
        if (!activeProjectId) return;
        setLoading(true);
        try {
            const data = await ApiClient.get(z.array(AuditLogSchema), `/api/v1/forensic/compliance/audit-trail?project_id=${activeProjectId}`);
            setLogs(data);
        } catch (e) {
            console.error('Failed to fetch audit logs', e);
        } finally {
            setLoading(false);
        }
    }, [activeProjectId]);

    useEffect(() => {
        if (activeProjectId) {
            void fetchLogs();
        }
    }, [activeProjectId, fetchLogs]);

    return (
        <ForensicPageLayout
            title="Integrity Time-Machine"
            subtitle="Cryptographic Audit Chain Visualization"
            icon={History}
        >
            <div className="flex h-full gap-6 p-6 overflow-hidden">
                {/* Left: Chain Stream */}
                <div className="w-1/2 flex flex-col gap-2 overflow-y-auto pr-4 custom-scrollbar relative">
                    <div className="absolute left-[31px] top-0 bottom-0 w-0.5 bg-indigo-500/20 z-0" />
                    
                    {loading ? (
                        <div className="flex-1 flex items-center justify-center text-slate-600 text-[11px] uppercase font-bold animate-pulse">Syncing Chain...</div>
                    ) : logs.map((log) => (
                        <button
                            key={log.id}
                            onClick={() => setSelectedLog(log)}
                            className={`relative z-10 flex gap-4 p-4 rounded-2xl border text-left transition-all group ${
                                selectedLog?.id === log.id 
                                    ? 'bg-indigo-600/10 border-indigo-500/50 shadow-lg' 
                                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                            }`}
                        >
                            <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0 ${
                                log.hash_signature ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-slate-800 border-slate-700 text-slate-500'
                            }`}>
                                <ShieldCheck size={14} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[11px] font-black uppercase text-indigo-400 tracking-widest">{log.action}</span>
                                    <span className="text-[8px] font-mono text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                                </div>
                                <p className="text-xs font-bold text-white truncate">{log.entity_type}: {log.entity_id}</p>
                                <div className="flex items-center gap-4 mt-2">
                                    <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-500 uppercase">
                                        <User size={10} /> {log.changed_by_user_id || 'SYSTEM'}
                                    </div>
                                    {log.hash_signature && (
                                        <div className="flex items-center gap-1.5 text-[8px] font-black text-emerald-500 uppercase tracking-tighter">
                                            <Fingerprint size={10} /> Chain Verified
                                        </div>
                                    )}
                                </div>
                            </div>
                            <ChevronRight size={14} className="text-slate-700 mt-2" />
                        </button>
                    ))}
                </div>

                {/* Right: Block Inspection */}
                <div className="flex-1 bg-slate-900/50 border border-white/10 rounded-[2.5rem] p-10 flex flex-col shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                        <Lock size={200} />
                    </div>

                    <AnimatePresence mode="wait">
                        {selectedLog ? (
                            <motion.div 
                                key={selectedLog.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="h-full flex flex-col"
                            >
                                <div className="flex items-center gap-4 mb-8 pb-8 border-b border-white/5">
                                    <div className="p-4 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-900/20">
                                        <ShieldCheck className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-white uppercase tracking-tighter">Block Inspection</h2>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Hash ID: {selectedLog.id.slice(0, 8)}...</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8 mb-8">
                                    <div className="space-y-6">
                                        <div>
                                            <span className="text-[11px] font-black uppercase text-slate-500 tracking-widest block mb-2">Subject Entity</span>
                                            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                                <p className="text-xs font-bold text-white">{selectedLog.entity_type}</p>
                                                <p className="text-[11px] font-mono text-indigo-400 mt-1">{selectedLog.entity_id}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-[11px] font-black uppercase text-slate-500 tracking-widest block mb-2">Change Reason</span>
                                            <p className="text-sm text-slate-300 italic">&ldquo;{selectedLog.change_reason || 'No justification provided.'}&rdquo;</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                                            <span className="text-[8px] font-black uppercase text-slate-600 tracking-[0.2em] block mb-2">Previous Hash</span>
                                            <code className="text-[11px] font-mono text-slate-400 break-all">{selectedLog.previous_hash || 'GENESIS'}</code>
                                        </div>
                                        <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                                            <span className="text-[8px] font-black uppercase text-indigo-500 tracking-[0.2em] block mb-2">Current Signature</span>
                                            <code className="text-[11px] font-mono text-indigo-300 break-all">{selectedLog.hash_signature || 'UNAUTHENTICATED'}</code>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-950/50 rounded-3xl p-8 border border-white/5 flex-1 flex flex-col">
                                    <div className="flex items-center gap-2 mb-6">
                                        <Activity size={14} className="text-indigo-400" />
                                        <span className="text-[11px] font-black uppercase tracking-widest text-white">State Transformation</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="flex-1 p-5 bg-rose-500/5 border border-rose-500/10 rounded-2xl">
                                            <span className="text-[8px] font-black text-rose-500 uppercase block mb-2 italic">PRE-ACTION</span>
                                            <p className="text-xs font-mono text-slate-400">{selectedLog.old_value || 'NULL'}</p>
                                        </div>
                                        <ChevronRight className="text-slate-700" />
                                        <div className="flex-1 p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                                            <span className="text-[8px] font-black text-emerald-500 uppercase block mb-2 italic">POST-ACTION</span>
                                            <p className="text-xs font-mono text-white">{selectedLog.new_value || 'NULL'}</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <History size={48} className="text-slate-800 mb-6" />
                                <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-2 italic">Select a Block</h2>
                                <p className="text-slate-500 text-xs max-w-sm uppercase font-bold tracking-widest">
                                    Inspect the cryptographic lineage of any investigative decision.
                                </p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </ForensicPageLayout>
    );
}
