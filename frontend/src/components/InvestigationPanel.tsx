/**
 * Investigation Panel Component
 * Persistent split-view panel that stays visible while using forensic tools
 */

'use client';

import React from 'react';
import { useInvestigation } from '@/store/useInvestigation';
import { DossierCompiler } from '@/lib/DossierCompiler';
import { 
    Target, Clock, Users, FileText, 
    ChevronDown, ChevronUp, TrendingUp,
    AlertCircle, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useForensicNotification } from '@/components/ForensicNotificationProvider';

export function InvestigationPanel() {
    const { activeInvestigation, endInvestigation, pauseInvestigation, addAction } = useInvestigation();
    const { notify } = useForensicNotification();
    // Removed unused isExpanded state
    const [isMinimized, setIsMinimized] = React.useState(false);
    const [isDraggingOver, setIsDraggingOver] = React.useState(false);

    // Use state for time calculation to avoid purity issues
    const [timeElapsed, setTimeElapsed] = React.useState(0);

    React.useEffect(() => {
        if (activeInvestigation) {
            const updateTime = () => {
                setTimeElapsed(Math.floor(
                    (Date.now() - new Date(activeInvestigation.startedAt).getTime()) / 1000 / 60
                ));
            };
            updateTime();
            // Update every minute (optional)
            const interval = setInterval(updateTime, 60000);
            return () => clearInterval(interval);
        }
    }, [activeInvestigation]);

    const handleGenerateDossier = () => {
        if(!activeInvestigation) return;
        
        const dossier = DossierCompiler.compile(activeInvestigation);
        DossierCompiler.download(dossier, 'markdown');
        
        // Also complete the investigation
        endInvestigation();
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(true);
    };

    const handleDragLeave = () => {
        setIsDraggingOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(false);
        
        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            
            if (data.type === 'hotspot_evidence') {
                addAction({
                    action: `Evidence Link: ${data.location}`,
                    tool: 'Map Drop',
                    result: {
                        evidenceId: data.id,
                        value: data.value,
                        context: data.context
                    }
                });
                
                notify({
                    title: 'Evidence Secured',
                    message: `Linked ${data.location} to case file.`,
                    type: 'success'
                });
            }
        } catch (err) {
            console.error('Drop failed', err);
        }
    };

    if (!activeInvestigation) return null;

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ 
                y: isMinimized ? 'calc(100% - 80px)' : 0, 
                opacity: 1 
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`fixed bottom-0 right-0 left-64 bg-slate-950 border-t ${
                isDraggingOver ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'border-white/10'
            } shadow-2xl z-50 transition-all duration-300`}
            style={{
                height: isMinimized ? '80px' : '320px',
            }}
        >
            {/* Header */}
            <div 
                className="h-20 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl flex items-center justify-between px-8 cursor-pointer hover:bg-slate-900/70 transition-colors"
                onClick={() => setIsMinimized(!isMinimized)}
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-900/20">
                        <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-sm font-black text-white uppercase tracking-tight">
                                {activeInvestigation.title}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                activeInvestigation.status === 'active' 
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                                {activeInvestigation.status}
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mt-1">
                            ID: {activeInvestigation.id} • Started {timeElapsed}m ago
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Quick Stats */}
                    <div className="flex items-center gap-6 mr-6">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-500" />
                            <span className="text-sm font-bold text-white">
                                {activeInvestigation.timeline.length}
                            </span>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Actions</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-500" />
                            <span className="text-sm font-bold text-white">
                                {activeInvestigation.context.suspects.length}
                            </span>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Suspects</span>
                        </div>
                        {activeInvestigation.riskScore && (
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-rose-500" />
                                <span className="text-sm font-bold text-rose-400">
                                    {activeInvestigation.riskScore}%
                                </span>
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Risk</span>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsMinimized(!isMinimized);
                        }}
                        className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                    >
                        {isMinimized ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                    </button>
                </div>
            </div>

            {/* Content (only shown when expanded) */}
            <AnimatePresence>
                {!isMinimized && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-60 overflow-hidden"
                    >
                        <div className="grid grid-cols-3 h-full">
                            {/* Timeline */}
                            <div className="border-r border-white/5 p-6 overflow-auto custom-scrollbar">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Clock className="w-3 h-3" /> Recent Actions
                                </h4>
                                <div className="space-y-3">
                                    {activeInvestigation.timeline.slice(-5).reverse().map((action, i) => (
                                        <div key={i} className="pb-3 border-b border-white/5 last:border-0">
                                            <p className="text-xs font-bold text-white mb-1">
                                                {action.action}
                                            </p>
                                            <p className="text-[10px] text-slate-500 font-mono">
                                                {new Date(action.timestamp).toLocaleTimeString()} • {action.tool}
                                            </p>
                                        </div>
                                    ))}
                                    {activeInvestigation.timeline.length === 0 && (
                                        <p className="text-xs text-slate-600 italic">No actions logged yet</p>
                                    )}
                                </div>
                            </div>

                            {/* Context */}
                            <div className="border-r border-white/5 p-6 overflow-auto custom-scrollbar">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Users className="w-3 h-3" /> Investigation Context
                                </h4>
                                <div className="space-y-4">
                                    {activeInvestigation.context.suspects.length > 0 && (
                                        <div>
                                            <p className="text-[9px] text-slate-600 uppercase tracking-wider mb-2">Suspects</p>
                                            {activeInvestigation.context.suspects.map((suspect, i) => (
                                                <div key={i} className="text-xs font-bold text-rose-400 mb-1">
                                                    • {suspect}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {activeInvestigation.context.transactionIds.length > 0 && (
                                        <div>
                                            <p className="text-[9px] text-slate-600 uppercase tracking-wider mb-2">Transactions</p>
                                            <p className="text-xs font-mono text-slate-400">
                                                {activeInvestigation.context.transactionIds.length} flagged
                                            </p>
                                        </div>
                                    )}
                                    {activeInvestigation.context.toolsUsed.length > 0 && (
                                        <div>
                                            <p className="text-[9px] text-slate-600 uppercase tracking-wider mb-2">Tools Used</p>
                                            <div className="flex flex-wrap gap-2">
                                                {activeInvestigation.context.toolsUsed.map((tool, i) => (
                                                    <span key={i} className="px-2 py-1 bg-indigo-600/10 text-indigo-400 text-[10px] font-bold rounded border border-indigo-500/20">
                                                        {tool}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Findings & Actions */}
                            <div className="p-6 overflow-auto custom-scrollbar">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <AlertCircle className="w-3 h-3" /> Key Findings
                                </h4>
                                <div className="space-y-3 mb-6">
                                    {activeInvestigation.findings.map((finding, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                            <p className="text-xs text-slate-300 leading-relaxed">{finding}</p>
                                        </div>
                                    ))}
                                    {activeInvestigation.findings.length === 0 && (
                                        <p className="text-xs text-slate-600 italic">No findings recorded yet</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    {activeInvestigation.status === 'active' && (
                                        <button
                                            onClick={pauseInvestigation}
                                            className="w-full py-2 bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 border border-amber-500/20 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-colors"
                                        >
                                            Pause Investigation
                                        </button>
                                    )}
                                    <button
                                        onClick={handleGenerateDossier}
                                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest transition-colors"
                                    >
                                        Complete & Generate Dossier
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
