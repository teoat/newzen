import React from 'react';
import { motion } from 'framer-motion';
import { 
    Box, FileText, Loader2, CheckCircle, Microscope, Plus, 
    Columns, Fingerprint, RefreshCw, Landmark, Activity, Search,
    ChevronLeft, ChevronRight, Layout
} from 'lucide-react';
import { FileEntry, MappingItem } from '../types';
import { SkeletonUploadProcessing } from '@/components/skeletons/SkeletonComponents';
import { AlignmentUnit } from './AlignmentUnit';

interface InspectStepProps {
    files: FileEntry[];
    selectedFileId: string | null;
    setSelectedFileId: (id: string | null) => void;
    isConsolidating: boolean;
    handleConsolidation: () => void;
    selectedFile: FileEntry | undefined;
    addCustomMapping: (id: string) => void;
    updateMapping: (fileId: string, field: string, col: string) => void;
    removeMapping: (fileId: string, field: string) => void;
    moveMapping: (fileId: string, idx: number, dir: 'up' | 'down') => void;
    updateSchemaLabel: (fileId: string, field: string, lbl: string) => void;
    resetSchema: (fileId: string) => void;
    verifyIntegrity: (hash: string, fileName: string) => void;
    beginningBalance: string;
    setBeginningBalance: (v: string) => void;
    endingBalance: string;
    setEndingBalance: (v: string) => void;
    handleAutoMatch: (id: string) => void;
    updateMappingIntent: (fileId: string, field: string, intent: MappingItem['intent']) => void;
}

export function InspectStep({
    files, selectedFileId, setSelectedFileId, isConsolidating, handleConsolidation,
    selectedFile, addCustomMapping, updateMapping, removeMapping, moveMapping,
    updateSchemaLabel, resetSchema, verifyIntegrity, beginningBalance, setBeginningBalance,
    endingBalance, setEndingBalance, handleAutoMatch, updateMappingIntent
}: InspectStepProps) {
    const [archiveCollapsed, setArchiveCollapsed] = React.useState(false);
    const [blueprintCollapsed, setBlueprintCollapsed] = React.useState(false);

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex overflow-hidden"
        >
            <aside className={`${archiveCollapsed ? 'w-16' : 'w-80'} border-r border-white/5 flex flex-col bg-slate-950/40 overflow-hidden shrink-0 transition-all duration-300 relative`}>
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-slate-900/20 overflow-hidden">
                    {!archiveCollapsed && (
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3 whitespace-nowrap">
                            <Box className="w-3.5 h-3.5" /> Payload Archive
                        </h3>
                    )}
                    <button 
                        onClick={() => setArchiveCollapsed(!archiveCollapsed)}
                        className={`p-1.5 hover:bg-white/10 rounded-lg text-slate-500 transition-all ${archiveCollapsed ? 'w-full flex justify-center' : ''}`}
                    >
                        {archiveCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                    {files.map(f => (
                        <button 
                            key={f.id}
                            onClick={() => setSelectedFileId(f.id)}
                            className={`w-full ${archiveCollapsed ? 'p-3 justify-center' : 'p-5'} rounded-[2rem] flex items-center gap-5 transition-all group border ${
                                selectedFileId === f.id ? 'bg-indigo-600 border-indigo-500 shadow-2xl shadow-indigo-900/40 text-white scale-[1.02]' : 'hover:bg-white/5 text-slate-400 border-transparent hover:border-white/5'
                            }`}
                        >
                            <div className={`${archiveCollapsed ? 'w-8 h-8 rounded-lg' : 'w-12 h-12 rounded-2xl'} flex items-center justify-center shrink-0 shadow-lg ${
                                selectedFileId === f.id ? 'bg-white/20' : 'bg-slate-900/80 shadow-black/20'
                            }`}>
                                <FileText className={archiveCollapsed ? "w-4 h-4" : "w-6 h-6"} />
                            </div>
                            {!archiveCollapsed && (
                                <div className="min-w-0 flex-1 text-left">
                                    <p className="text-xs font-black truncate uppercase tracking-tight leading-none mb-1.5">{f.file.name}</p>
                                    <div className="flex items-center gap-2">
                                        {f.status === 'review' ? (
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400/80">Aligned</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5">
                                                <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                                                <span className="text-[9px] font-black uppercase tracking-widest opacity-50">Syncing</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
                <div className="p-8 border-t border-white/5 bg-slate-900/40 backdrop-blur-md">
                    <button 
                        onClick={handleConsolidation}
                        disabled={isConsolidating}
                        className={`w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest transition-all flex items-center justify-center gap-4 active:scale-95 border border-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed ${archiveCollapsed ? 'p-4 rounded-xl' : 'py-6 rounded-[2rem] text-xs'}`}
                    >
                        {isConsolidating ? (
                             <><Loader2 className="w-5 h-5 animate-spin" /> {!archiveCollapsed && 'Sealing Vault...'}</>
                        ) : (
                             archiveCollapsed ? <CheckCircle className="w-5 h-5" /> : <>Vault Consensus <CheckCircle className="w-5 h-5" /></>
                        )}
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden relative">
                {selectedFile ? (
                    selectedFile.status === 'analyzing' ? (
                        <SkeletonUploadProcessing />
                    ) : (
                        <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="h-16 px-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-slate-900/30 backdrop-blur-xl z-20">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-indigo-600/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
                                    <Microscope className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div className="flex items-center gap-4">
                                    <h3 className="text-sm font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                                        Forensic Lens: {selectedFile.file.name}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] bg-slate-800/80 text-slate-500 px-2 py-0.5 rounded-lg border border-white/10 font-mono font-bold">{selectedFile.hash?.slice(0, 10)}...</span>
                                        <button 
                                            onClick={() => selectedFile.hash && verifyIntegrity(selectedFile.hash, selectedFile.file.name)}
                                            className="px-2 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/20 text-[8px] font-black uppercase tracking-widest transition-all"
                                        >
                                            Verify
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button 
                                     onClick={() => addCustomMapping(selectedFile.id)}
                                     className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700 rounded-xl border border-white/10 text-[9px] font-black uppercase tracking-[0.1em] transition-all flex items-center gap-2 active:scale-95"
                                 >
                                     <Plus className="w-3.5 h-3.5 text-emerald-500" /> Add Field
                                 </button>
                                 <button 
                                      onClick={() => handleAutoMatch(selectedFile.id)}
                                      className="px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/20 text-[9px] font-black uppercase tracking-[0.1em] transition-all flex items-center gap-2 active:scale-95"
                                 >
                                     <RefreshCw className="w-3.5 h-3.5" /> Auto-Match Headers
                                 </button>
                                 <div className="w-px h-6 bg-white/5 mx-1" />
                                <div className="flex -space-x-2">
                                    {[1,2].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-950 flex items-center justify-center text-[8px] font-bold text-slate-500 uppercase">{i}</div>
                                    ))}
                                    <div className="w-8 h-8 rounded-lg bg-indigo-600 border border-slate-950 flex items-center justify-center text-[8px] font-bold text-white">+5</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 flex overflow-hidden">
                            <div className={`${blueprintCollapsed ? 'w-16' : 'w-[400px]'} border-r border-white/5 flex flex-col bg-black/20 overflow-hidden relative shadow-2xl transition-all duration-300`}>
                                <div className="p-6 bg-slate-950/40 border-b border-white/5 flex items-center justify-between overflow-hidden">
                                    {!blueprintCollapsed && (
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3 whitespace-nowrap">
                                            <Columns className="w-4 h-4 text-indigo-500" /> Schema Blueprint
                                        </h4>
                                    )}
                                    <button 
                                        onClick={() => setBlueprintCollapsed(!blueprintCollapsed)}
                                        className={`p-1.5 hover:bg-white/10 rounded-lg text-slate-500 transition-all ${blueprintCollapsed ? 'w-full flex justify-center' : ''}`}
                                    >
                                        {blueprintCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                                    </button>
                                </div>
                                {!blueprintCollapsed && (
                                    <>
                                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                                            {selectedFile.mappings.map((m, idx) => (
                                                <AlignmentUnit 
                                                    key={m.systemField} 
                                                    mapping={m} 
                                                    index={idx}
                                                    isFirst={idx === 0}
                                                    isLast={idx === selectedFile.mappings.length - 1}
                                                    columns={selectedFile.metadata.allColumns}
                                                    onUpdate={(val) => updateMapping(selectedFile.id, m.systemField, val)}
                                                    onDelete={() => removeMapping(selectedFile.id, m.systemField)}
                                                    onMove={(dir) => moveMapping(selectedFile.id, idx, dir)}
                                                    onEditLabel={(lbl) => updateSchemaLabel(selectedFile.id, m.systemField, lbl)}
                                                    onUpdateIntent={(intent) => updateMappingIntent(selectedFile.id, m.systemField, intent)}
                                                />
                                            ))}
                                        </div>
                                        <div className="p-6 bg-slate-900/40 border-t border-white/5 backdrop-blur-xl flex justify-between items-center">
                                            <div className="flex items-center gap-4 p-4 bg-indigo-500/[0.03] border-l-4 border-indigo-600 rounded-2xl shadow-inner flex-1 mr-4">
                                                <Fingerprint className="w-5 h-5 text-indigo-400 shrink-0" />
                                                <div>
                                                    <p className="text-[10px] font-black text-white uppercase tracking-tighter italic leading-none">Integrity Calibration</p>
                                                    <p className="text-[9px] text-slate-500 leading-relaxed font-bold mt-1 uppercase">Structural parity stable.</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => resetSchema(selectedFile.id)}
                                                title="Reset to Default Schema"
                                                className="p-2.5 bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-white/10 transition-all active:scale-95"
                                            >
                                                <RefreshCw className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="flex-1 p-6 overflow-hidden flex flex-col gap-6 bg-[#020617]">
                                <div className="flex items-center justify-between gap-6">
                                    <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl flex items-center justify-between gap-6 flex-1">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20">
                                                <Landmark className="w-5 h-5 text-amber-500" />
                                            </div>
                                            <div>
                                                <h4 className="text-[9px] font-black text-amber-500 uppercase tracking-widest leading-none mb-1">Integrity Guard</h4>
                                                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tight">Balance verification protocols.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="space-y-1">
                                                <label className="text-[7px] font-black text-slate-600 uppercase tracking-widest block ml-1">Start</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="0.00" 
                                                    value={beginningBalance}
                                                    onChange={(e) => setBeginningBalance(e.target.value)}
                                                    className="bg-slate-900 border border-white/5 rounded-lg px-3 py-1.5 text-[10px] font-mono text-white w-24 focus:border-amber-500/50 outline-none transition-all" 
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[7px] font-black text-slate-600 uppercase tracking-widest block ml-1">End</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="0.00" 
                                                    value={endingBalance}
                                                    onChange={(e) => setEndingBalance(e.target.value)}
                                                    className="bg-slate-900 border border-white/5 rounded-lg px-3 py-1.5 text-[10px] font-mono text-white w-24 focus:border-amber-500/50 outline-none transition-all" 
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between bg-slate-900/20 px-6 py-4 rounded-2xl border border-white/5 shadow-inner flex-1">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-emerald-500/10 rounded-lg relative">
                                                <Activity className="w-5 h-5 text-emerald-500" />
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] font-black text-white italic tracking-[0.1em] uppercase leading-none mb-1">STREAM_INGRESS</h4>
                                                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1 italic">
                                                    <Search className="w-2.5 h-2.5" /> Sampling Packet
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-6">
                                            <FlowMetric label="Nodes" val="144,201" />
                                            <div className="w-px h-6 bg-white/5" />
                                            <FlowMetric label="Purity" val="99.2%" success />
                                            <div className="w-px h-6 bg-white/5" />
                                            <FlowMetric label="Consensus" val="STABLE" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 border border-white/5 rounded-[2rem] bg-black/40 overflow-hidden shadow-2xl relative group">
                                     <div className="absolute inset-0 overflow-auto custom-scrollbar no-scrollbar scroll-smooth">
                                        <table className="w-full text-left border-collapse border-separate border-spacing-0 min-w-max">
                                            <thead className="sticky top-0 z-30">
                                                <tr className="bg-slate-900/90 backdrop-blur-md">
                                                    <th className="px-8 py-6 text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] border-b border-r border-white/10 sticky left-0 bg-slate-950/80 z-40 italic">RID_ID</th>
                                                    <th className="px-8 py-6 text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] border-b border-r border-white/10 italic">COPILOT_INSIGHT</th>
                                                    {selectedFile.metadata.allColumns.map(col => (
                                                        <th key={col} className="px-10 py-6 text-[10px] font-black text-white uppercase border-b border-r border-white/10 last:border-r-0 italic underline decoration-transparent group-hover:decoration-indigo-500/30 transition-all tracking-widest shadow-inner">
                                                            {col.replace(/_/g, ' ')}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/[0.03]">
                                                {selectedFile.previewData?.map((row, i) => (
                                                    <tr key={i} className="hover:bg-indigo-600/5 transition-all group/row cursor-crosshair">
                                                        <td className="px-8 py-5 text-[10px] font-mono text-slate-700 border-r border-white/[0.02] bg-[#020617] group-hover/row:bg-slate-900 group-hover/row:text-emerald-500 transition-colors sticky left-0 z-20 font-black shadow-xl">{i + 1}</td>
                                                        <td className="px-8 py-5 text-[10px] font-bold text-slate-500 border-r border-white/[0.05] italic group-hover/row:text-emerald-400 max-w-[200px] truncate">
                                                            {selectedFile.validationInsights?.[i]?.primary || "Awaiting Analysis..."}
                                                        </td>
                                                        {selectedFile.metadata.allColumns.map(col => (
                                                            <td key={col} className="px-10 py-5 text-[11px] font-bold text-slate-500 group-hover/row:text-slate-100 border-r border-white/[0.02] last:border-0 transition-colors uppercase tracking-tight">
                                                                {String(row[col] || "—")}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                     </div>
                                </div>
                            </div>
                        </div>
                        </div>
                    )
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.05)_0%,transparent_70%)]" />
                        <div className="w-64 h-64 border border-indigo-600/10 rounded-[4rem] flex items-center justify-center opacity-40 mb-12 relative">
                             <div className="absolute inset-4 border border-dashed border-indigo-600/20 rounded-[3rem] animate-pulse" />
                             <Search className="w-16 h-16 text-slate-700" />
                        </div>
                        <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4 relative z-10">Entity Neutralized</h3>
                        <p className="text-slate-600 text-[11px] max-w-xs mx-auto uppercase font-black tracking-[0.4em] leading-loose relative z-10 italic">Select a staked forensic block from the archive to begin reconstruction protocols.</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

function FlowMetric({ label, val, success }: { label: string, val: string, success?: boolean }) {
    return (
        <div className="flex flex-col items-center gap-2">
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none">{label}</span>
            <span className={`text-xs font-black italic tracking-tighter leading-none ${success ? 'text-emerald-500 shadow-[0_0_10px_#10b981]' : 'text-white'}`}>{val}</span>
        </div>
    );
}
