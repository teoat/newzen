'use client';
export const dynamic = 'force-dynamic';

import { useSession } from 'next-auth/react';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, BrainCircuit, Activity, Zap, GitMerge, FileSearch } from 'lucide-react';
import { useProject } from '../../store/useProject';
import ForensicPageLayout from '../../app/components/ForensicPageLayout';
import DualBeliefGauge from '../../components/Forensic/DualBeliefGauge';
import ReconciliationWorkspace from './ReconciliationWorkspace';

export default function ReconciliationPage() {
  const { data: session } = useSession();
  const { activeProjectId } = useProject();
  const [messages, setMessages] = useState([
    { agent: 'Auditor', msg: "Matching Transaction TX-902 (Rp 150M) to Bank Entry BK-44. Amount parity confirmed.", color: 'indigo' },
    { agent: 'Tracer', msg: "Suspicion Flag: The destination account has shared UBO links with the project vendor.", color: 'rose' },
    { agent: 'Judge', msg: "Conflict Identified. Dialectic requires visual site-photo evidence to proceed.", color: 'amber' }
  ]);

  useEffect(() => {
    if (!activeProjectId || !session?.accessToken) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
    const ws = new WebSocket(`${wsUrl}/ws/${activeProjectId}?token=${session.accessToken}`);

    ws.onmessage = (event) => {
        try {
            const payload = JSON.parse(event.data);
            if (payload.type === 'AGENT_ACTIVITY') {
                const colorMap: Record<string, string> = { 'judge': 'amber', 'tracer': 'rose', 'auditor': 'indigo' };
                const agentName = payload.agent?.split(' ')[0] || 'System'; // e.g. "JudgeAgent" -> "Judge"
                const newMessage = {
                    agent: agentName,
                    msg: payload.reason || `Verdict reached: ${payload.status}`,
                    color: colorMap[agentName.toLowerCase()] || 'indigo'
                };
                setMessages(prev => [newMessage, ...prev].slice(0, 50));
            }
        } catch (e) {
            console.error("Websocket Parse Error", e);
        }
    };

    return () => {
        ws.close();
    };
  }, [activeProjectId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ForensicPageLayout
        title="Dialectic Analysis"
        subtitle="Multi-Agent Consensus & Fund Flow Propagation"
        icon={GitMerge}
    >
      <div className="grid grid-cols-12 gap-8 p-10 h-[calc(100vh-100px)] overflow-hidden">
        {/* LEFT: THE DIALECTIC WORKSPACE (8 COL) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-8 overflow-hidden">
            {/* BELIEF ENGINE HUD */}
            <div className="glass-tactical p-8 rounded-[3rem] relative overflow-hidden shrink-0">
                <div className="scan-line-overlay" />
                <div className="flex items-center justify-between mb-8 relative z-20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
                            <BrainCircuit className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Belief Engine</h2>
                            <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest">Autonomous Consensus Confidence</p>
                        </div>
                    </div>
                    <div className="flex gap-10">
                        <div className="w-48">
                            <DualBeliefGauge positive={0.85} negative={0.05} uncertainty={0.1} label="Math Probability" />
                        </div>
                        <div className="w-48">
                            <DualBeliefGauge positive={0.72} negative={0.18} uncertainty={0.1} label="Nexus Affinity" />
                        </div>
                    </div>
                </div>
            </div>

            {/* THE WORKSPACE */}
            <div className="flex-1 min-h-0">
                <React.Suspense fallback={<div className="p-12 text-center text-slate-500 font-mono text-xs uppercase tracking-widest animate-pulse">Initializing Workspace...</div>}>
                    <ReconciliationWorkspace />
                </React.Suspense>
            </div>
        </div>

        {/* RIGHT: AGENT DEBATE & EVIDENCE LOCKER (4 COL) */}
        <aside className="col-span-12 lg:col-span-4 flex flex-col gap-8">
            {/* AGENT STREAM */}
            <div className="flex-1 glass-holographic p-8 rounded-[3rem] border border-indigo-500/20 relative flex flex-col overflow-hidden">
                <div className="scan-line-overlay" />
                <div className="flex items-center gap-4 mb-8 relative z-20">
                    <div className="p-2.5 bg-indigo-500/20 rounded-xl">
                        <Activity className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Agent Dialectic</h3>
                </div>

                <div className="flex-1 overflow-y-auto pr-4 space-y-6 custom-scrollbar relative z-20">
                    {messages.map((m, i) => (
                        <AgentMessage 
                            key={i}
                            agent={m.agent} 
                            msg={m.msg} 
                            color={m.color} 
                        />
                    ))}
                </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="glass-tactical p-8 rounded-[3rem] border border-white/5 space-y-4">
                <button className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95">
                    <FileSearch size={16} /> Run Minimal Fund Flow Scan
                </button>
                <button className="w-full h-14 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition-all">
                    <Zap size={16} className="text-amber-500" /> Auto-Heal 12 Potential Matches
                </button>
            </div>
        </aside>
      </div>
    </ForensicPageLayout>
  );
}

function AgentMessage({ agent, msg, color }: { agent: string, msg: string, color: string }) {
    return (
        <div className="space-y-2">
            <span className={`text-[8px] font-black uppercase tracking-[0.2em] text-${color}-400`}>{agent} Agent</span>
            <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl rounded-tl-none">
                <p className="text-[10px] text-slate-300 leading-relaxed italic">&ldquo;{msg}&rdquo;</p>
            </div>
        </div>
    );
}
