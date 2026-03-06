'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Activity, 
  Pin, 
  FileText, 
  BrainCircuit,
  Gavel,
  Search,
  Monitor
} from 'lucide-react';

import { useProject } from '@/store/useProject';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ForensicPageLayout from '@/app/components/ForensicPageLayout';

const AGENTS = [
    { id: 'judge', name: 'Judge', color: 'amber', icon: Gavel },
    { id: 'tracer', name: 'Tracer', color: 'rose', icon: Search },
    { id: 'auditor', name: 'Auditor', color: 'indigo', icon: Monitor },
];

export default function TheoryBoardPage() {
  const { getToken, isLoaded } = useAuth();
  const { user } = useUser();
  const { activeProjectId } = useProject();

  const [boardData, setBoardState] = useState<any>(null);
  const [debate, setDebate] = useState<any[]>([]);

  useEffect(() => {
    if (!activeProjectId || !isLoaded || !user) return;

    let ws: WebSocket;

    const connectWs = async () => {
        const token = await getToken();
        if (!token) return;

        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
        ws = new WebSocket(`${wsUrl}/ws/${activeProjectId}?token=${token}`);

        ws.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                if (payload.type === 'AGENT_ACTIVITY') {
                    const newEntry = {
                        agent: payload.agent?.toLowerCase().includes('judge') ? 'judge' : 'tracer',
                        message: payload.reason || `Verdict reached: ${payload.status}`,
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    };
                    setDebate(prev => [...prev, newEntry]);
                }
            } catch (e) {
                console.error("Websocket Parse Error", e);
            }
        };
    };

    connectWs();

    return () => {
        if (ws) ws.close();
    };
  }, [activeProjectId, isLoaded, user, getToken]);

  return (
    <ForensicPageLayout
        title="Stage 3: Investigation Board"
        subtitle="Triangulation of Mathematical, Relational, and Visual Truth"
        icon={ShieldCheck}
    >
      <div className="grid grid-cols-12 gap-8 p-8 h-[calc(100vh-100px)] overflow-hidden">
        {/* LEFT: EVIDENCE TRIANGULATION (6 COL) */}
        <div className="col-span-12 lg:col-span-8 space-y-8 overflow-y-auto pr-4 custom-scrollbar">
            {/* CONFLICT MATRIX HUD */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                        <Activity className="w-4 h-4 text-indigo-500" />
                        Triangulation Conflict Matrix
                    </h2>
                    <Badge variant="outline" className="text-rose-400 border-rose-500/30">2 Conflicts Detected</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {boardData?.conflict_matrix.map((row: any) => (
                        <motion.div 
                            key={row.id} 
                            whileHover={{ y: -5 }}
                            className="bg-slate-900/60 border border-white/5 p-6 rounded-[2rem] hover:border-indigo-500/30 transition-all group"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <h4 className="text-sm font-black text-white uppercase tracking-tight truncate max-w-[70%]">{row.label}</h4>
                                <Pin className="w-3.5 h-3.5 text-indigo-500" />
                            </div>

                            <div className="grid grid-cols-3 gap-2 mb-6">
                                <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col items-center">
                                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-2">Math</span>
                                    <div className={`w-2 h-2 rounded-full ${row.math_proof > 0.7 ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]' : 'bg-emerald-500'}`} />
                                </div>
                                <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col items-center">
                                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-2">Nexus</span>
                                    <div className={`w-2 h-2 rounded-full ${row.relational_proof > 0.7 ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]' : 'bg-emerald-500'}`} />
                                </div>
                                <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col items-center">
                                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-2">Reality</span>
                                    <div className={`w-2 h-2 rounded-full ${row.visual_proof > 0.7 ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'}`} />
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <div className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-widest ${row.conflict_status === 'CRITICAL_CONFLICT' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                    {row.conflict_status === 'CRITICAL_CONFLICT' ? 'GHOST_CLAIM' : 'VERIFIED'}
                                </div>
                                <button className="text-[11px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-colors">Inspect Trace</button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* PINNED EVIDENCE WALL */}
            <div className="grid grid-cols-2 gap-6">
                <Card className="bg-slate-900/40 border-white/5 p-8 rounded-[3rem]">
                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-6">Discovery Assets</h3>
                    <div className="space-y-4">
                        {boardData?.pinned_transactions.map((tx: any) => (
                            <div key={tx.id} className="p-4 bg-black/40 border border-white/5 rounded-2xl flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-rose-500 rounded-full" />
                                    <span className="text-xs font-bold text-slate-300 truncate max-w-[150px]">{tx.description}</span>
                                </div>
                                <span className="text-[11px] font-mono text-slate-600">IDR {tx.actual_amount.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </Card>
                <Card className="bg-slate-900/40 border-white/5 p-8 rounded-[3rem]">
                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-6">Visual Artifacts</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {boardData?.pinned_evidence.map((doc: any) => (
                            <div key={doc.id} className="aspect-video bg-black/40 border border-white/5 rounded-xl flex items-center justify-center relative overflow-hidden group">
                                <FileText className="w-6 h-6 text-slate-700" />
                                <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>

        {/* RIGHT: FRENLY AI DIALECTIC (4 COL) */}
        <aside className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            <div className="flex-1 glass-holographic p-8 rounded-[3rem] border border-indigo-500/20 flex flex-col overflow-hidden relative">
                <div className="scan-line-overlay" />
                <div className="flex items-center gap-4 mb-8 relative z-20">
                    <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
                        <BrainCircuit className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Agent Dialectic</h2>
                        <p className="text-[11px] text-indigo-400 font-bold uppercase tracking-widest">Consensus Engine Active</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-4 space-y-6 custom-scrollbar relative z-20">
                    {debate.map((msg, i) => {
                        const agent = AGENTS.find(a => a.id === msg.agent);
                        return (
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.2 }}
                                key={i} 
                                className="space-y-2"
                            >
                                <div className="flex items-center justify-between">
                                    <span className={`text-[11px] font-black uppercase tracking-[0.2em] text-${agent?.color}-400`}>{agent?.name}</span>
                                    <span className="text-[8px] font-mono text-slate-600 uppercase">{msg.timestamp}</span>
                                </div>
                                <div className={`p-5 bg-white/[0.03] border border-white/5 rounded-3xl rounded-tl-none backdrop-blur-md`}>
                                    <p className="text-[11px] text-slate-300 leading-relaxed italic">&ldquo;{msg.message}&rdquo;</p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 relative z-20">
                    <Button className="w-full h-16 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] shadow-[0_0_30px_rgba(79,70,229,0.3)]">
                        Seal Adjudication Verdict
                    </Button>
                </div>
            </div>
        </aside>
      </div>
    </ForensicPageLayout>
  );
}
