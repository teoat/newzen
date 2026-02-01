'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BrainCircuit, 
  Zap, 
  ShieldCheck, 
  Search, 
  ChevronRight,
  TrendingUp,
  Cpu,
  Fingerprint,
  Network,
  Scale,
  MessageSquare,
  Activity,
  Terminal,
  Trello
} from 'lucide-react';
import { ReasoningService } from '../../../services/ReasoningService';
import { InferenceHypothesis, VerificationResult, SwarmLog } from '../../../schemas';
import { useInvestigation } from '../../../store/useInvestigation';
import { useProject } from '../../../store/useProject';
import ForensicPageLayout from '../../../app/components/ForensicPageLayout';
import NeuralCard from '../../../app/components/NeuralCard';
import { API_URL } from '../../../lib/constants';

export default function ReasoningEnginePage() {
  const { activeInvestigation } = useInvestigation();
  const { activeProjectId } = useProject();
  const activeInvestigationId = activeInvestigation?.id;
  
  const [hypotheses, setHypotheses] = useState<InferenceHypothesis[]>([]);
  const [swarmLogs, setSwarmLogs] = useState<SwarmLog[]>([]);
  const [verifications, setVerifications] = useState<Record<string, VerificationResult>>({});
  const [loading, setLoading] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHypotheses = async () => {
      if (!activeProjectId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const txRes = await fetch(
          `${API_URL}/api/v1/reconciliation/${activeProjectId}/transactions?limit=20`
        );
        
        if (!txRes.ok) throw new Error('Failed to fetch transactions');

        const txData = await txRes.json();
        const transactionIds = txData.transactions?.slice(0, 10).map((t: any) => t.id) || [];

        if (transactionIds.length === 0) {
          setHypotheses([]);
          setLoading(false);
          return;
        }

        const data = await ReasoningService.hypothesize(transactionIds);
        setHypotheses(data.hypotheses);
        setSwarmLogs(data.swarm_logs);
      } catch (err: any) {
        console.error('Hypothesis generation failed:', err);
        setError(err.message || 'Failed to generate hypotheses');
      } finally {
        setLoading(false);
      }
    };

    fetchHypotheses();
  }, [activeInvestigationId, activeProjectId]);

  const handleVerify = async (id: string) => {
    setVerifyingId(id);
    try {
      const result = await ReasoningService.verify(id);
      setVerifications(prev => ({ ...prev, [id]: result }));
    } catch (err) {
      console.error(err);
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <ForensicPageLayout
      title="Neural Reasoning Sovereign"
      subtitle="v3.0 Multi-Agent Swarm Orchestration"
      icon={BrainCircuit}
    >
      <div className="p-12 max-w-7xl mx-auto space-y-16">
        
        {/* v3 Header Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
           <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-4 text-indigo-400">
                 <Activity className="w-5 h-5 animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-[0.4em]">Autonomous Inference Mode</span>
              </div>
              <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none">
                 The Neural <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-500">War Room</span>
              </h2>
              <p className="text-sm font-bold text-slate-400 max-w-2xl leading-relaxed uppercase tracking-widest">
                Zenith v3 utilizes a swarm of forensic personas. The Auditor and the Tracer analyze concurrently, 
                detecting discordance and synthesizing admissible narratives from raw transactional entropy.
              </p>
           </div>
           
           <NeuralCard pulse className="bg-indigo-600/10 border-indigo-500/20">
              <div className="flex items-center gap-4 mb-4">
                 <Terminal className="w-4 h-4 text-indigo-400" />
                 <span className="text-[10px] font-black uppercase text-indigo-300">System Entropy</span>
              </div>
              <div className="text-4xl font-black text-white font-mono italic tracking-tighter">
                 0.42<span className="text-lg opacity-30">ψ</span>
              </div>
              <p className="text-[9px] text-slate-500 mt-2 font-black uppercase tracking-widest">Logic Convergence: HIGH</p>
           </NeuralCard>
        </div>

        {/* Swarm Intelligence Log (War Room) */}
        {!loading && swarmLogs.length > 0 && (
          <div className="space-y-6">
             <div className="flex items-center gap-4 px-2">
                <Trello className="w-4 h-4 text-slate-500" />
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Agent Persona Logs</h4>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {swarmLogs.map((log, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.2 }}
                    key={i} 
                    className="p-6 rounded-3xl bg-slate-900/40 border border-white/5 space-y-4"
                  >
                     <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{log.agent}</span>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                     </div>
                     <p className="text-[10px] font-bold text-slate-400 leading-relaxed font-mono uppercase italic overflow-hidden h-12">
                        {log.thought}
                     </p>
                  </motion.div>
                ))}
             </div>
          </div>
        )}

        {/* Hypotheses Matrix */}
        <div className="space-y-8">
           <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-4">
                 <Network className="w-4 h-4 text-indigo-400" />
                 <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Synthesized Logic Hypotheses</h4>
              </div>
              <div className="flex gap-2">
                <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                   <motion.div animate={{ x: ['-100%', '100%'] }} transition={{ duration: 2, repeat: Infinity }} className="h-full w-12 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                </div>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <AnimatePresence mode="popLayout">
              {loading ? (
                Array.from({length: 4}).map((_, i) => (
                  <div key={i} className="h-72 rounded-[3.5rem] bg-white/5 border border-white/5 animate-pulse" />
                ))
              ) : (
                hypotheses.map((h) => (
                  <NeuralCard 
                    key={h.id}
                    status={verifications[h.id] ? (verifications[h.id].status === 'VERIFIED' ? 'verified' : 'default') : 'default'}
                    pulse={verifyingId === h.id}
                  >
                    <div className="flex justify-between items-start mb-8">
                       <div className="space-y-1">
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] italic">Neural Discovery</span>
                          <h4 className="text-2xl font-black text-white uppercase tracking-tighter leading-none italic">{h.title}</h4>
                       </div>
                       <div className="text-right">
                          <div className={`text-3xl font-black font-mono tracking-tighter ${(h.confidence * 100) > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                             {(h.confidence * 100).toFixed(0)}%
                          </div>
                          <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Confidence</div>
                       </div>
                    </div>

                    <div className="flex-1 bg-black/40 rounded-[2rem] p-8 border border-white/5 relative mb-8 group-hover:bg-black/60 transition-colors">
                       <MessageSquare className="absolute top-6 right-6 w-4 h-4 text-slate-800" />
                       <p className="text-xs font-bold text-slate-300 leading-relaxed uppercase tracking-widest italic">
                          {h.reasoning}
                       </p>
                    </div>

                    <div className="mt-auto flex items-center justify-between">
                       {verifications[h.id] ? (
                          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-6 w-full">
                             <div className={`px-6 py-2.5 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest ${
                               verifications[h.id].status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                             }`}>
                                {verifications[h.id].status === 'VERIFIED' ? <ShieldCheck className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                                {verifications[h.id].status}
                             </div>
                             <div className="flex-1 text-[9px] font-black text-slate-500 italic uppercase tracking-[0.1em]">
                                {verifications[h.id].summary}
                             </div>
                          </motion.div>
                       ) : (
                          <>
                             <div className="flex items-center gap-3">
                                <div className="flex -space-x-3">
                                   {['AUDITOR', 'TRACER', 'SOVEREIGN'].map((p, i) => (
                                     <div key={p} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center group/p">
                                        <Fingerprint className="w-4 h-4 text-slate-400 group-hover/p:text-indigo-400 transition-colors" />
                                     </div>
                                   ))}
                                </div>
                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic">Swarm Consensus: {h.agent_consensus || 'HIGH'}</span>
                             </div>
                             <motion.button 
                               whileHover={{ scale: 1.05 }}
                               whileTap={{ scale: 0.95 }}
                               onClick={() => handleVerify(h.id)}
                               disabled={verifyingId === h.id}
                               className="px-8 py-4 bg-white text-black hover:bg-indigo-400 hover:text-white disabled:opacity-50 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 flex items-center gap-3"
                             >
                                {verifyingId === h.id ? 'Pulse Verifying...' : <><Network className="w-4 h-4" /> Initiate Proof</>}
                             </motion.button>
                          </>
                       )}
                    </div>
                  </NeuralCard>
                ))
              )}
            </AnimatePresence>
           </div>
        </div>

        {/* v3 Global Metadata Footer */}
        <div className="tactical-frame p-10 rounded-[3.5rem] bg-slate-950/80 border-white/5 grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="space-y-4">
               <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Logic Stability</h4>
               <div className="flex items-end gap-2">
                  {Array.from({length: 12}).map((_, i) => (
                    <motion.div 
                      key={i}
                      initial={{ height: 10 }}
                      animate={{ height: Math.random() * 30 + 10 }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse', delay: i * 0.1 }}
                      className="w-1 bg-indigo-500/30 rounded-full"
                    />
                  ))}
               </div>
            </div>
            <div className="lg:col-span-3 flex items-center justify-end gap-12 border-l border-white/5 pl-12 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">
               <div className="flex flex-col">
                  <span className="text-slate-600">Active Swarm</span>
                  <span className="text-white">v3.0.Neural-Horizon</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-slate-600">Admissibility Lock</span>
                  <span className="text-emerald-500 italic">SECURE [99.9% SH_256]</span>
               </div>
            </div>
        </div>
      </div>
    </ForensicPageLayout>
  );
}
