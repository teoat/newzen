import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Box, FileText, Loader2, CheckCircle, Microscope, Plus, 
    Columns, Fingerprint, RefreshCw, Landmark, Activity, Search,
    ChevronLeft, ChevronRight, Layout, Pin, BrainCircuit, X
} from 'lucide-react';
import DualBeliefGauge from '../../../components/Forensic/DualBeliefGauge';
import { Badge } from '../../../ui/badge';
import { FileEntry, MappingItem } from '../types';
import { SkeletonUploadProcessing } from '../../../components/skeletons/SkeletonComponents';
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
    const [selectedRow, setSelectedRow] = React.useState<number | null>(null);

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex overflow-hidden"
        >
            {/* PAYLOAD ARCHIVE SIDEBAR */}
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

            {/* MAIN INSPECTION AREA */}
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
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                 <button 
                                      onClick={() => handleAutoMatch(selectedFile.id)}
                                      className="px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/20 text-[9px] font-black uppercase tracking-[0.1em] transition-all flex items-center gap-2 active:scale-95"
                                 >
                                     <RefreshCw className="w-3.5 h-3.5" /> Auto-Match
                                 </button>
                            </div>
                        </div>

                        <div className="flex-1 flex overflow-hidden">
                            {/* SCHEMA BLUEPRINT */}
                            <div className={`${blueprintCollapsed ? 'w-16' : 'w-[350px]'} border-r border-white/5 flex flex-col bg-black/20 overflow-hidden relative shadow-2xl transition-all duration-300`}>
                                <div className="p-6 bg-slate-950/40 border-b border-white/5 flex items-center justify-between overflow-hidden">
                                    {!blueprintCollapsed && (
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                            <Columns className="w-4 h-4 text-indigo-500" /> Schema
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
                                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
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
                                )}
                            </div>

                            {/* TACTICAL SPLIT-PANE PREVIEW */}
                            <div className="flex-1 flex overflow-hidden bg-[#020617]">
                                <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-500 ${selectedRow !== null ? 'hidden lg:flex lg:w-1/2' : 'w-full'}`}>
                                    <div className="flex-1 border-r border-white/5 overflow-auto custom-scrollbar">
                                        <table className="w-full text-left border-collapse border-separate border-spacing-0">
                                            <thead className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md">
                                                <tr>
                                                    <th className="px-6 py-4 text-[10px] font-black text-indigo-500 uppercase tracking-widest border-b border-white/5 sticky left-0 bg-slate-950 z-40">#</th>
                                                    {selectedFile.metadata.allColumns.map(col => (
                                                        <th key={col} className="px-6 py-4 text-[10px] font-black text-white uppercase border-b border-white/5 tracking-tighter italic">
                                                            {col.replace(/_/g, ' ')}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedFile.previewData?.map((row, i) => {
                                                    const isVerified = selectedFile.validationInsights?.[i]?.status === 'verified';
                                                    return (
                                                        <tr 
                                                            key={i} 
                                                            onClick={() => setSelectedRow(i)}
                                                            className={`cursor-pointer transition-all border-b border-white/[0.02] 
                                                                ${selectedRow === i ? 'bg-indigo-600/20 text-white' : 'hover:bg-white/[0.02] text-slate-500'}
                                                                ${!isVerified ? 'shimmer-unverified' : ''}
                                                            `}
                                                        >
                                                            <td className="px-6 py-4 text-[10px] font-mono font-black border-r border-white/[0.02] sticky left-0 bg-[#020617] group-hover:bg-slate-900">{i + 1}</td>
                                                            {selectedFile.metadata.allColumns.map(col => (
                                                                <td key={col} className="px-6 py-4 text-[11px] font-bold truncate max-w-[150px]">
                                                                    {String(row[col] || "—")}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* THE REALITY PANE (RAG Visual Proof) */}
                                <AnimatePresence>
                                    {selectedRow !== null && (
                                        <motion.div 
                                            initial={{ x: 300, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            exit={{ x: 300, opacity: 0 }}
                                            className="w-full lg:w-1/2 border-l border-white/10 bg-slate-950 flex flex-col overflow-hidden relative"
                                        >
                                            <div className="scan-line-overlay" />
                                            <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-slate-900/20 relative z-20">
                                                <div className="flex items-center gap-3">
                                                    <Landmark className="w-4 h-4 text-emerald-500" />
                                                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest italic">Reality Verification Pane</h4>
                                                </div>
                                                <button 
                                                    onClick={() => setSelectedRow(null)} 
                                                    className="p-2 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-all"
                                                    title="Close Reality Pane"
                                                    aria-label="Close Reality Pane"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                                {/* Visual Evidence Section */}
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h5 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Site Physical Evidence</h5>
                                                        <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">92% Match</Badge>
                                                    </div>
                                                    <div className="aspect-video bg-slate-900 border border-white/10 rounded-3xl flex items-center justify-center relative overflow-hidden group">
                                                        <Layout className="w-12 h-12 text-slate-800 group-hover:text-emerald-500 transition-all" />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent opacity-60" />
                                                        <p className="absolute bottom-4 left-6 text-[10px] font-bold text-white uppercase tracking-tighter">Site_Visit_Photo_042.jpg</p>
                                                    </div>
                                                </div>

                                                {/* Frenly AI Analysis */}
                                                <div className="p-6 bg-indigo-600/10 border border-indigo-500/20 rounded-3xl space-y-4 relative overflow-hidden group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                                                            <BrainCircuit className="w-4 h-4 text-indigo-400" />
                                                        </div>
                                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Frenly Reality Analysis</span>
                                                    </div>

                                                    <DualBeliefGauge 
                                                        positive={0.88} 
                                                        negative={0.05} 
                                                        uncertainty={0.07} 
                                                        label="Cross-Verification Confidence" 
                                                    />

                                                    <p className="text-[11px] text-indigo-100 leading-relaxed italic">
                                                        &ldquo;I have cross-referenced this ledger entry with the site photo taken on Jan 14. The material quantity (120 bags) is visually consistent with the inventory seen in the background.&rdquo;
                                                    </p>
                                                    <button 
                                                        onClick={(e) => {
                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                            const flyElement = document.createElement('div');
                                                            flyElement.className = 'fixed pointer-events-none z-[200] w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-ao animate-pin-fly';
                                                            flyElement.style.left = `${rect.left}px`;
                                                            flyElement.style.top = `${rect.top}px`;
                                                            flyElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>';
                                                            document.body.appendChild(flyElement);
                                                            setTimeout(() => flyElement.remove(), 1000);
                                                            
                                                            // Logic to actually pin the item would go here (dispatch to store)
                                                        }}
                                                        className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all relative z-10 active:scale-95"
                                                    >
                                                        <Pin className="w-3.5 h-3.5" /> Pin Finding to Theory Board
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
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
