'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, 
  GitMerge, 
  Cpu, 
  Gavel, 
  Lock, 
  ChevronRight, 
  Activity,
  ShieldCheck,
  Hash,
  Fingerprint,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { useProject } from '../../store/useProject';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { useHubFocus } from '../../store/useHubFocus';
import { useInvestigation } from '../../store/useInvestigation';

export default function MissionHUD() {
  const { activeProjectId, projects } = useProject();
  const { activeInvestigation } = useInvestigation();
  const activeProject = projects.find((p: any) => p.id === activeProjectId);
  const pathname = usePathname();
  const { toast } = useToast();
  const { focusMode, toggleFocusMode } = useHubFocus();
  
  const [showJudge, setShowJudge] = useState(false);
  const [showProphet, setShowProphet] = useState(false);

  // Phase Detection Logic
    const phases = [
      { id: 'acquire', label: 'Acquire', icon: Database, paths: ['/ingestion', '/forensic/evidence'] },
      { id: 'reconcile', label: 'Analysis', icon: GitMerge, paths: ['/reconciliation', '/forensic/ledger'] },
      { id: 'intel', label: 'Discovery', icon: Cpu, paths: ['/forensic/nexus', '/forensic/map', '/forensic/canvas'] },
      { id: 'verdict', label: 'Verdict', icon: Gavel, paths: ['/investigate', '/forensic/report'] },
      { id: 'seal', label: 'Sealed', icon: Lock, paths: ['/forensic/vault'] }
    ];


  const currentPhaseIndex = phases.findIndex(p => p.paths.some(path => pathname.startsWith(path)));
  const [integrityHash, setIntegrityHash] = useState('SHA256:8F2E...91A2');
  const [hoveredPhase, setHoveredPhase] = useState<string | null>(null);

  return (
    <header className="fixed top-0 left-0 right-0 h-20 bg-slate-950/80 backdrop-blur-3xl border-b border-white/5 z-[110] flex items-center px-10 justify-between">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] pointer-events-none" />
      
      {/* LEFT: PROJECT CONTEXT */}
      <div className="flex items-center gap-8 relative z-10">
          <Link href="/" className="group flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/40 group-hover:scale-110 transition-transform">
                  <Fingerprint className="w-6 h-6 text-white" />
              </div>
              <div className="hidden md:block">
                  <h1 className="text-sm font-black text-white uppercase tracking-tighter italic">Zenith <span className="text-indigo-500">Forensic</span></h1>
                  <p className="text-[8px] text-slate-500 font-mono uppercase tracking-[0.4em]">v2.5 // Sovereign-X</p>
              </div>
          </Link>

          <div className="h-8 w-px bg-white/5" />

      <div className="flex flex-col">
          <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Active Lead</span>
              <ChevronRight size={8} className="text-slate-700" />
              {activeInvestigation?.status === 'completed' && (
                <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-rose-600/20 border border-rose-500/30 rounded-full animate-pulse">
                    <Lock size={8} className="text-rose-500" />
                    <span className="text-[7px] font-black text-rose-500 uppercase">Sealed</span>
                </div>
              )}
          </div>
          <span className="text-xs font-black text-white uppercase tracking-tight truncate max-w-[150px]">
              {activeProject?.name || 'Awaiting Selection'}
          </span>
      </div>

      </div>

      {/* CENTER: LIFECYCLE PULSE */}
      <div className="hidden lg:flex items-center gap-12 relative z-10">
          {phases.map((phase, i) => {
              const isActive = i <= currentPhaseIndex;
              const isCurrent = i === currentPhaseIndex;
              
              return (
                  <div 
                    key={phase.id} 
                    className="flex items-center gap-4 group relative"
                    onMouseEnter={() => setHoveredPhase(phase.id)}
                    onMouseLeave={() => setHoveredPhase(null)}
                  >
                      <Link href={phase.paths[0]} className="flex flex-col items-center gap-2 cursor-pointer">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-500 ${
                              isCurrent ? 'bg-indigo-600 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)] scale-110' :
                              isActive ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' :
                              'bg-slate-900 border-white/10 text-slate-600 hover:text-white hover:border-white/30'
                          }`}>
                              <phase.icon size={14} />
                          </div>
                          <span className={`text-[8px] font-black uppercase tracking-widest transition-colors ${
                              isCurrent ? 'text-white' : isActive ? 'text-emerald-500' : 'text-slate-700 group-hover:text-slate-400'
                          }`}>
                              {phase.label}
                          </span>
                      </Link>
                      
                      {i < phases.length - 1 && (
                          <div className={`w-12 h-px transition-colors duration-700 ${
                              i < currentPhaseIndex ? 'bg-emerald-500/50' : 'bg-white/5'
                          }`} />
                      )}

                      <AnimatePresence>
                        {hoveredPhase === phase.id && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute top-16 left-1/2 -translate-x-1/2 w-64 glass-tactical border border-white/10 rounded-2xl p-5 shadow-2xl pointer-events-none"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <phase.icon size={12} className="text-indigo-400" />
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">{phase.label} Stage</span>
                                    </div>
                                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${isActive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border-white/5 text-slate-500'}`}>
                                        {isActive ? 'SYNCHRONIZED' : 'LOCKED'}
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Progress</span>
                                        <span className="text-[11px] font-black text-white font-mono">{isActive ? (isCurrent ? '45%' : '100%') : '0%'}</span>
                                    </div>
                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: isActive ? (isCurrent ? '45%' : '100%') : '0%' }}
                                            className={`h-full ${isCurrent ? 'bg-indigo-500 shadow-[0_0_8px_#6366f1]' : 'bg-emerald-500'}`}
                                        />
                                    </div>
                                    <div className="pt-2 border-t border-white/5">
                                        <p className="text-[9px] text-slate-400 leading-relaxed italic">
                                            {phase.id === 'acquire' && 'Scanning for raw ledger anomalies and neural column alignment.'}
                                            {phase.id === 'reconcile' && 'Resolving 12 identified dialectic conflicts via swarm consensus.'}
                                            {phase.id === 'intel' && 'Tracing 4 circular flow patterns to Ultimate Beneficial Owners.'}
                                            {phase.id === 'verdict' && 'Finalizing statutory mapping for mission verdict sealing.'}
                                            {phase.id === 'seal' && 'Cryptographic vault is awaiting final lead signature.'}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                      </AnimatePresence>
                  </div>
              )
          })}
      </div>

      {/* RIGHT: NODE HEALTH */}
      <div className="flex items-center gap-6 relative z-10">
          <div className="flex items-center gap-2">
            <button 
                onClick={toggleFocusMode}
                className={`p-2 rounded-lg border transition-all ${focusMode ? 'bg-indigo-500 border-indigo-400 text-white shadow-[0_0_10px_#6366f1]' : 'bg-slate-900 border-white/5 text-slate-500 hover:text-white'}`}
                title={focusMode ? "Disable Clear Sight" : "Enable Clear Sight Mode (Focus)"}
            >
                {focusMode ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button 
                onClick={() => { setShowJudge(true); toast("Activating Judge Persona: Autonomous Adjudication In-Progress", "info"); }}
                className={`p-2 rounded-lg border transition-all ${showJudge ? 'bg-amber-500/20 border-amber-500 text-amber-500 shadow-[0_0_10px_#f59e0b]' : 'bg-slate-900 border-white/5 text-slate-500 hover:text-amber-400'}`}
                title="The Judge: Adjudication Engine"
            >
                <Gavel size={16} />
            </button>
            <button 
                onClick={() => { setShowProphet(true); toast("Activating Prophet Persona: Initializing Time-Machine Simulation", "info"); }}
                className={`p-2 rounded-lg border transition-all ${showProphet ? 'bg-indigo-500/20 border-indigo-500 text-indigo-500 shadow-[0_0_10px_#6366f1]' : 'bg-slate-900 border-white/5 text-slate-500 hover:text-indigo-400'}`}
                title="The Prophet: Predictive Forecast"
            >
                <Activity size={16} />
            </button>
          </div>

          <div className="h-8 w-px bg-white/5" />
          
          <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 mb-1">
                  <Activity size={10} className="text-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Neural Stable</span>
              </div>
              <div className="flex items-center gap-2">
                  <Hash size={10} className="text-slate-600" />
                  <span className="text-[8px] font-mono text-slate-600 uppercase">{integrityHash}</span>
              </div>
          </div>

          <div className="h-8 w-px bg-white/5" />

          <Link href="/admin">
              <button className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                  <ShieldCheck size={20} />
              </button>
          </Link>
      </div>

      <AnimatePresence>
          {(showJudge || showProphet) && (
              <motion.div 
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                className="fixed top-20 right-0 bottom-0 w-[400px] bg-slate-900/90 backdrop-blur-3xl border-l border-white/10 z-[100] p-10 shadow-2xl overflow-y-auto custom-scrollbar"
              >
                  <div className="scan-line-overlay" />
                  <div className="flex justify-between items-center mb-10 relative z-10">
                      <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-2xl ${showJudge ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'bg-indigo-500/20 text-indigo-500 border border-indigo-500/30'}`}>
                              {showJudge ? <Gavel size={24} /> : <Activity size={24} />}
                          </div>
                          <div>
                              <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">{showJudge ? 'The Judge' : 'The Prophet'}</h3>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{showJudge ? 'Autonomous Adjudicator' : 'Predictive Compliance'}</p>
                          </div>
                      </div>
                      <button onClick={() => { setShowJudge(false); setShowProphet(false); }} className="p-2 text-slate-500 hover:text-white transition-colors">
                          <X size={24} />
                      </button>
                  </div>

                  <div className="space-y-8 relative z-10">
                      {showJudge ? (
                          <div className="space-y-6">
                              <div className="p-6 bg-slate-950 border border-white/5 rounded-3xl space-y-4">
                                  <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Initial Adjudication</div>
                                  <p className="text-xs text-slate-300 leading-relaxed italic">
                                      &quot;Based on the cross-reference of Pillar II Reconciliation and Pillar III Nexus behavior, there is a 94.2% probability of systematic fund diversion occurring via common contractor shells.&quot;
                                  </p>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                      <div className="text-[9px] font-black text-slate-500 uppercase">Verdict Score</div>
                                      <div className="text-2xl font-black text-rose-500">8.4/10</div>
                                  </div>
                                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                      <div className="text-[9px] font-black text-slate-500 uppercase">Risk Zone</div>
                                      <div className="text-2xl font-black text-rose-500">CRITICAL</div>
                                  </div>
                              </div>
                          </div>
                      ) : (
                          <div className="space-y-6">
                              <div className="p-6 bg-slate-950 border border-white/5 rounded-3xl space-y-4">
                                  <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Time-Machine Projection</div>
                                   <p className="text-xs text-slate-300 leading-relaxed italic">
                                       &quot;If the current siphoning rate to &apos;Indo-Construct Shell&apos; remains constant, project budget exhaustion will occur in exactly 3.4 months, preceding physical completion by 15.2%.&quot;
                                   </p>

                              </div>
                              <div className="p-6 bg-indigo-600/10 border border-indigo-500/20 rounded-3xl">
                                  <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Predicted Leakage (3mo)</div>
                                  <div className="text-3xl font-black text-white italic">Rp 4.2B</div>
                              </div>
                          </div>
                      )}
                      
                      <div className="pt-8 border-t border-white/5">
                          <Button className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-[11px] tracking-[0.2em] rounded-2xl">
                              Generate Full Persona Dossier
                          </Button>
                      </div>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>
    </header>
  );
}
