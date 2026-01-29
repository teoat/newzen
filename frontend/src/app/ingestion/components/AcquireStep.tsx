import React from 'react';
import { motion } from 'framer-motion';
import { Upload, Info, Table, MapPin, Landmark, Box, DatabaseZap, Download } from 'lucide-react';
import { FileEntry, IngestionHistoryItem } from '../types';
import { BatchProcessingPanel } from './BatchProcessingPanel';

interface AcquireStepProps {
    tab: 'NEW' | 'HISTORY';
    setTab: (tab: 'NEW' | 'HISTORY') => void;
    isDragging: boolean;
    setIsDragging: (v: boolean) => void;
    handleFiles: (files: FileList | null) => void;
    history: IngestionHistoryItem[];
    exportAuditExcel: () => void;
    fetchHistory: () => void;
}

export function AcquireStep({
    tab, setTab, isDragging, setIsDragging, handleFiles, history, exportAuditExcel, fetchHistory
}: AcquireStepProps) {
    return (
        <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="flex-1 p-10 flex flex-col gap-10 overflow-hidden"
        >
            <BatchProcessingPanel projectId={history[0]?.projectId || 'PROJ-DEFAULT'} />

            <div className="flex justify-center">
                <div className="bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 flex gap-2">
                    <button 
                        onClick={() => setTab('NEW')}
                        className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'NEW' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        New Payload
                    </button>
                    <button 
                        onClick={() => { setTab('HISTORY'); fetchHistory(); }}
                        className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'HISTORY' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        History Archive
                    </button>
                </div>
            </div>

            {tab === 'NEW' ? (
                <div 
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                    className={`flex-1 border-2 border-dashed rounded-[3.5rem] flex flex-col items-center justify-center relative transition-all duration-700 ${
                        isDragging ? 'border-indigo-500 bg-indigo-500/5 shadow-[inset_0_0_100px_rgba(79,70,229,0.05)] scale-[0.99]' : 'border-white/5 bg-slate-900/10 hover:border-white/10'
                    }`}
                >
                    <input 
                        type="file" 
                        multiple 
                        className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                        onChange={(e) => handleFiles(e.target.files)} 
                        aria-label="Upload forensic data files"
                        title="Upload forensic data files"
                    />
                    
                    <div className="relative group">
                        <div className="absolute inset-0 bg-indigo-600 blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity rounded-full animate-pulse" />
                        <div className="w-36 h-36 bg-indigo-600 rounded-[3rem] flex items-center justify-center relative z-10 shadow-indigo-900/40 shadow-[0_30px_60px_-10px_rgba(0,0,0,0.5)] transform transition-all group-hover:scale-110 group-hover:-rotate-3">
                            <Upload className="w-14 h-14 text-white" />
                        </div>
                    </div>
                    <h2 className="text-4xl font-black text-white mt-12 mb-4 tracking-tighter italic">Acquisition Tunnel</h2>
                    <p className="text-slate-500 text-sm max-w-sm text-center leading-relaxed font-medium uppercase tracking-tight">
                        Stream site ledgers, bank telemetry, or spatial archives for forensic reconstruction.
                    </p>
                    
                    <div className="mt-8 flex items-center gap-4 px-6 py-3 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 text-[10px] font-bold text-indigo-300 uppercase tracking-widest backdrop-blur-sm">
                        <Info className="w-4 h-4 text-indigo-400" />
                        <span>Supported: CSV, Excel (.xlsx), PDF bank statements</span>
                    </div>

                    <div className="flex gap-12 mt-20 opacity-20 grayscale hover:grayscale-0 transition-all duration-700 hover:opacity-100">
                        <EntityIcon icon={Table} label="CSV / SYMBOLIC" />
                        <EntityIcon icon={MapPin} label="SPATIAL DATA" />
                        <EntityIcon icon={Landmark} label="BANK_LEDGER" />
                        <EntityIcon icon={Box} label="IMAGE_PACKS" />
                    </div>
                </div>
            ) : (
                <div className="flex-1 bg-slate-900/20 border border-white/5 rounded-[3.5rem] overflow-hidden flex flex-col p-10">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Forensic Ingress Logs</h2>
                        <button 
                            onClick={exportAuditExcel}
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-3 border border-emerald-500/20 active:scale-95"
                        >
                            <Download className="w-4 h-4" /> Export Audit Trail (.xlsx)
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar pr-2">
                        <table className="w-full text-left border-separate border-spacing-y-3">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] italic">
                                    <th className="px-6 pb-2">Batch ID</th>
                                    <th className="px-6 pb-2">Asset Name</th>
                                    <th className="px-6 pb-2">Timestamp</th>
                                    <th className="px-6 pb-2 text-right">Records</th>
                                    <th className="px-6 pb-2 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((h) => (
                                    <tr key={h.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4 bg-slate-900/50 rounded-l-2xl border-y border-l border-white/5 font-mono text-[10px] text-indigo-400">
                                            {h.id.slice(0, 12)}...
                                        </td>
                                        <td className="px-6 py-4 bg-slate-900/50 border-y border-white/5 font-black text-xs text-white uppercase tracking-tight">
                                            {h.fileName}
                                        </td>
                                        <td className="px-6 py-4 bg-slate-900/50 border-y border-white/5 text-[10px] text-slate-500 font-bold">
                                            {new Date(h.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 bg-slate-900/50 border-y border-white/5 text-right font-mono text-xs text-slate-400">
                                            {h.recordsProcessed.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 bg-slate-900/50 rounded-r-2xl border-y border-r border-white/5 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                h.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                            }`}>
                                                {h.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {history.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-32 text-center">
                                            <div className="flex flex-col items-center gap-6 opacity-20">
                                                <DatabaseZap className="w-16 h-16" />
                                                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Vault Registry Empty</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

function EntityIcon({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>, label: string }) {
    return (
        <div className="flex flex-col items-center gap-5 group cursor-default">
            <div className="p-6 bg-slate-900/60 border border-white/5 rounded-3xl text-slate-700 group-hover:text-white group-hover:border-indigo-500/50 group-hover:bg-slate-900 transition-all shadow-inner transform group-hover:-translate-y-2">
                <Icon className="w-8 h-8" />
            </div>
            <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] italic group-hover:text-slate-400 transition-colors">{label}</span>
        </div>
    );
}
