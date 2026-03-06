import React, { useState, useEffect } from 'react';
import { useQuarantine, QuarantineRow } from '../hooks/useVisibleAutonomy';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, Stethoscope, Activity, X } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from 'framer-motion';

export function GlobalRepairDrawer() {
    const { listRows, resolveRow, stats, fetchStats } = useQuarantine();
    const [rows, setRows] = useState<QuarantineRow[]>([]);
    const [selectedRow, setSelectedRow] = useState<QuarantineRow | null>(null);
    const [editContent, setEditContent] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    
    // Poll for stats every 30s or on mount
    useEffect(() => {
        fetchStats();
        // Initial load
        listRows().then(setRows);
        
        const interval = setInterval(() => {
            fetchStats();
        }, 30000);
        return () => clearInterval(interval);
    }, [fetchStats, listRows]); 

    const handleResolve = async () => {
        if (!selectedRow) return;
        await resolveRow(selectedRow.id, editContent);
        // Refresh list
        const updated = await listRows();
        setRows(updated);
        setSelectedRow(null);
        fetchStats();
    };

    const needsAttention = stats?.needs_attention || 0;

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <button className={`relative group flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${needsAttention > 0 ? 'bg-rose-500/10 border-rose-500/50 text-rose-400 animate-pulse' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400 opacity-60 hover:opacity-100'}`}>
                    <Stethoscope size={16} />
                    {needsAttention > 0 && (
                        <span className="text-xs font-bold">{needsAttention} Issues</span>
                    )}
                 </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[540px] bg-slate-950 border-l border-white/10 p-0 text-slate-200">
                <SheetHeader className="p-6 border-b border-white/5 bg-slate-900/50">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${needsAttention > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                <Activity size={20} />
                            </div>
                            <div>
                                <SheetTitle className="text-white">Data Hospital</SheetTitle>
                                <SheetDescription className="text-slate-400">Global Data Repair Center</SheetDescription>
                            </div>
                         </div>
                    </div>
                </SheetHeader>

                <div className="flex flex-col h-[calc(100vh-100px)]">
                    {/* STATS BAR */}
                    <div className="grid grid-cols-3 gap-1 p-4">
                        <div className="bg-slate-900 rounded p-2 text-center border border-white/5">
                            <div className="text-[10px] uppercase text-slate-500 font-bold">Critical</div>
                            <div className="text-xl font-mono font-bold text-rose-400">{needsAttention}</div>
                        </div>
                        <div className="bg-slate-900 rounded p-2 text-center border border-white/5">
                            <div className="text-[10px] uppercase text-slate-500 font-bold">Auto-Fixed</div>
                            <div className="text-xl font-mono font-bold text-yellow-500">{stats?.repaired || 0}</div>
                        </div>
                        <div className="bg-slate-900 rounded p-2 text-center border border-white/5">
                            <div className="text-[10px] uppercase text-slate-500 font-bold">Total Processed</div>
                            <div className="text-xl font-mono font-bold text-blue-400">{stats?.total || 0}</div>
                        </div>
                    </div>

                    {/* MAIN CONTENT AREA */}
                    <div className="flex-1 overflow-hidden relative">
                        <AnimatePresence mode="wait">
                            {selectedRow ? (
                                <motion.div 
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: 20, opacity: 0 }}
                                    className="absolute inset-0 p-4 flex flex-col gap-4 bg-slate-900/50"
                                >
                                    <div className="flex items-center justify-between">
                                        <Button variant="ghost" size="sm" onClick={() => setSelectedRow(null)} className="text-slate-400 hover:text-white">
                                            ← Back to List
                                        </Button>
                                        <Badge variant="outline" className="border-rose-500/30 text-rose-400">{selectedRow.error_type}</Badge>
                                    </div>

                                    <div className="p-3 bg-rose-950/30 border border-rose-500/20 rounded-md text-xs text-rose-300 font-mono">
                                        {selectedRow.error_message}
                                    </div>

                                    <div className="flex-1 flex flex-col gap-2">
                                        <label className="text-xs font-bold text-slate-400">RAW DATA PATCH</label>
                                        <Textarea 
                                            value={editContent} 
                                            onChange={(e) => setEditContent(e.target.value)}
                                            className="flex-1 font-mono text-xs bg-black/50 border-slate-700 text-green-400 resize-none p-3 focus:ring-emerald-500/50"
                                        />
                                    </div>

                                    <Button onClick={handleResolve} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
                                        APPLY FIX & RE-INGEST
                                    </Button>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    className="absolute inset-0"
                                >
                                     <ScrollArea className="h-full">
                                        <div className="space-y-1 p-2">
                                            {rows.map(row => (
                                                <div 
                                                    key={row.id} 
                                                    onClick={() => {
                                                        setSelectedRow(row);
                                                        setEditContent(row.raw_content);
                                                    }}
                                                    className="group flex flex-col gap-1 p-3 rounded-lg border border-white/5 bg-slate-900/40 hover:bg-slate-800 hover:border-indigo-500/30 cursor-pointer transition-all"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <span className="text-[10px] font-mono text-slate-500">{new Date(row.created_at).toLocaleTimeString()}</span>
                                                        <Badge variant={row.status === 'new' ? 'destructive' : 'outline'} className="text-[10px] px-1 h-5">
                                                            {row.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-xs font-bold text-slate-300 truncate group-hover:text-indigo-300">
                                                        {row.error_type}
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 truncate">
                                                        {row.error_message}
                                                    </div>
                                                </div>
                                            ))}
                                            {rows.length === 0 && (
                                                <div className="text-center py-10 text-slate-600 italic">
                                                    No quarantined items found.
                                                </div>
                                            )}
                                        </div>
                                     </ScrollArea>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
