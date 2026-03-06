'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useProject } from '../../store/useProject';
import ForensicPageLayout from '../../app/components/ForensicPageLayout';
import { 
    AlertTriangle, Play, ChevronRight, 
    Zap, Terminal as TerminalIcon, ShieldAlert,
    BrainCircuit, Activity, BarChart3, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authenticatedFetch } from '../../lib/api';
import DualBeliefGauge from '../../components/Forensic/DualBeliefGauge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PageFeatureCard from '../components/PageFeatureCard';

export default function PredictiveControlPage() {
    const { activeProjectId } = useProject();
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulationResult, setSimulationResult] = useState<any>(null);
    const [stressTestResult, setStressTestResult] = useState<any>(null);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => {
        setLogs(prev => [`${new Date().toLocaleTimeString()} > ${msg}`, ...prev]);
    };

    const runMonteCarlo = async () => {
        if (!activeProjectId) return;
        setIsSimulating(true);
        addLog("INITIATING MONTE CARLO SIMULATION [ITERATIONS: 1000]...");
        
        try {
            const res = await authenticatedFetch(`/api/v2/prophet/monte-carlo/${activeProjectId}`);
            const data = await res.json();
            setSimulationResult(data);
            addLog(`SIMULATION COMPLETE. CONFIDENCE: ${(data.simulation_confidence * 100).toFixed(1)}%`);
        } catch (e) {
            addLog("SIMULATION ERROR: CORE_OFFLINE");
        } finally {
            setIsSimulating(false);
        }
    };

    const runStressTest = async () => {
        if (!activeProjectId) return;
        addLog("ENGAGING ADVERSARIAL RED-TEAMING CORE...");
        try {
            const res = await authenticatedFetch(`/api/v2/prophet/adversarial-test/${activeProjectId}`);
            const data = await res.json();
            setStressTestResult(data);
            addLog("ADVERSARIAL VULNERABILITIES IDENTIFIED.");
        } catch (e) {
            addLog("STRESS TEST FAILED: INSUFFICIENT_LOGIC_DEPTH");
        }
    };

    return (
        <ForensicPageLayout
            title="Predictive Oracle"
            subtitle="Bayesian Forecasting & Adversarial Red-Teaming"
            icon={BrainCircuit}
        >
            <div className="flex flex-col h-full bg-[#050a14] relative overflow-hidden">
               {/* TACTICAL GRID OVERLAY */}
               <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
               <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0)_60%,rgba(0,0,0,0.8)_100%)]" />

               {/* Operational Analysis Card */}
               <div className="px-10 py-6 shrink-0 relative z-10">
                    <div className="max-w-6xl w-full">
                        <PageFeatureCard 
                            phase={3}
                            title="Predictive Oracle Engine"
                            description="A stochastic forecasting engine that uses Monte Carlo simulations to predict project exhaustion dates and 'Red Team' adversarial AI to find logic gaps."
                            features={[
                                "Monte Carlo stochastic project lifespan forecasting",
                                "Adversarial 'Red Team' logic vulnerability scanning",
                                "Real-time kernel log streaming",
                                "Dual-Belief confidence gauge visualization"
                            ]}
                            howItWorks="The Oracle uses historical burn rates and 'Ghost' pattern frequency to simulate 1,000 potential project futures. Simultaneously, an adversarial 'Red Team' agent attempts to bypass current validation rules to identify logic gaps."
                        />
                    </div>
               </div>

                <div className="grid grid-cols-12 gap-8 px-10 pb-10 flex-1 overflow-hidden relative z-10">
                    {/* LEFT: MISSION CONTROL (4 COL) */}
                    <aside className="col-span-12 lg:col-span-4 flex flex-col gap-6 overflow-y-auto no-scrollbar pr-2 min-h-0">
                        {/* TACTICAL FRAME WRAPPER */}
                        <div className="bg-slate-900/40 backdrop-blur-md p-1 border-t border-b border-indigo-500/30">
                            <div className="p-8 rounded-none space-y-8 relative overflow-hidden shrink-0 border-x border-indigo-500/20 bg-black/20">
                                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-indigo-500" />
                                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-indigo-500" />
                                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-indigo-500" />
                                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-indigo-500" />
                                
                                <div className="scan-line-overlay opacity-50" />
                                
                                <h3 className="text-sm font-black text-indigo-400 uppercase tracking-[0.2em] italic flex items-center gap-3 relative z-20">
                                    <Activity className="w-4 h-4" /> Control Parameters
                                </h3>

                                <div className="space-y-4 relative z-20">
                                    <button 
                                        onClick={runMonteCarlo}
                                        disabled={isSimulating}
                                        className="w-full h-16 bg-indigo-600 hover:bg-indigo-500 text-white rounded-none border border-indigo-400/50 font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl flex items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-50 relative overflow-hidden group"
                                    >
                                        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.05)_10px,rgba(255,255,255,0.05)_20px)] opacity-0 group-hover:opacity-100 transition-opacity" />
                                        {isSimulating ? <Activity className="animate-spin" /> : <BarChart3 size={18} />}
                                        Run Stochastic Forecast
                                    </button>

                                    <button 
                                        onClick={runStressTest}
                                        className="w-full h-16 bg-rose-950/20 hover:bg-rose-900/40 border border-rose-500/50 text-rose-500 rounded-none font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-4 transition-all relative overflow-hidden"
                                    >
                                        <div className="absolute left-0 top-0 h-full w-1 bg-rose-500" />
                                        <ShieldAlert size={18} /> Engage Red-Teaming
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* VULNERABILITY MATRIX */}
                        <AnimatePresence>
                            {stressTestResult && (
                                <motion.div 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="p-8 border border-rose-500/30 bg-rose-950/10 shrink-0 relative"
                                >
                                    <div className="absolute top-0 right-0 px-2 py-0.5 bg-rose-500 text-black text-[9px] font-black uppercase">Alert</div>
                                    <h4 className="text-[11px] font-black text-rose-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <AlertTriangle size={14} /> Shadow Scenarios Found
                                    </h4>
                                    <div className="space-y-4">
                                        <p className="text-[11px] text-rose-200/80 leading-relaxed italic border-l-2 border-rose-500 pl-4 font-mono">
                                            {">"} {stressTestResult.red_team_findings}
                                        </p>
                                        <div className="pt-4 border-t border-rose-500/20">
                                            <Badge variant="outline" className="text-rose-500 border-rose-500/50 rounded-none">VULNERABILITY INDEX: {stressTestResult.vulnerability_index}</Badge>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </aside>

                    {/* CENTER: THE ORACLE VIEWPORT (8 COL) */}
                    <main className="col-span-12 lg:col-span-8 flex flex-col gap-8 overflow-hidden min-h-0">
                        {/* FORECAST HUD - TACTICAL FRAME */}
                        <div className="relative flex-1 rounded-none border border-slate-700 bg-black/40 flex flex-col justify-center items-center text-center shrink-0 min-h-[400px]">
                            {/* HUD CORNERS */}
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-slate-500" />
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-slate-500" />
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-slate-500" />
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-slate-500" />
                            
                            {/* HUD CROSSHAIRS */}
                            <div className="absolute top-1/2 left-4 w-4 h-0.5 bg-slate-700" />
                            <div className="absolute top-1/2 right-4 w-4 h-0.5 bg-slate-700" />
                            <div className="absolute top-4 left-1/2 w-0.5 h-4 bg-slate-700" />
                            <div className="absolute bottom-4 left-1/2 w-0.5 h-4 bg-slate-700" />

                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.05)_0%,transparent_70%)]" />
                            
                            {!simulationResult ? (
                                <div className="relative z-10 opacity-50">
                                    <div className="w-24 h-24 border border-dashed border-slate-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-[spin_10s_linear_infinite]">
                                        <BrainCircuit size={40} className="text-slate-500" />
                                    </div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-[0.4em]">Oracle Standby</h2>
                                    <p className="text-xs font-bold text-slate-500 uppercase mt-4 tracking-widest font-mono">Awaiting stochastic data stream...</p>
                                </div>
                            ) : (
                                <motion.div 
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="relative z-10 w-full max-w-2xl space-y-12"
                                >
                                    <div className="space-y-4">
                                        <h2 className="text-6xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                                            {simulationResult.avg_predicted_days_remaining} <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">DAYS</span>
                                        </h2>
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="h-[1px] w-12 bg-indigo-500/50" />
                                            <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em]">Estimated Mean Project Life</p>
                                            <div className="h-[1px] w-12 bg-indigo-500/50" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-10">
                                        <div className="p-8 bg-black/60 border border-slate-700 relative group">
                                            <div className="absolute top-0 right-0 w-3 h-3 bg-rose-500/20 group-hover:bg-rose-500 transition-colors" />
                                            <div className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-2">Exhaustion Probability</div>
                                            <div className="text-4xl font-black text-white font-mono">{(simulationResult.probability_exhaustion_90d * 100).toFixed(1)}%</div>
                                            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter mt-2">Failure expected within 90 days</p>
                                        </div>
                                        <div className="p-8 bg-black/60 border border-slate-700 relative">
                                            <DualBeliefGauge 
                                                positive={simulationResult.simulation_confidence} 
                                                negative={0.05} 
                                                uncertainty={1 - simulationResult.simulation_confidence - 0.05}
                                                label="Simulation Integrity" 
                                            />
                                            <div className="flex justify-between items-center px-2 mt-4">
                                                <span className="text-[9px] font-black text-emerald-500">STABLE</span>
                                                <span className="text-[9px] font-black text-slate-600">KERNEL_v3</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* TERMINAL LOGS */}
                        <div className="h-48 bg-[#0a0a0a] border border-emerald-900/30 font-mono text-[10px] overflow-auto custom-scrollbar shrink-0 shadow-inner relative">
                            <div className="sticky top-0 bg-[#0a0a0a]/90 backdrop-blur border-b border-emerald-900/30 p-2 flex items-center gap-3 text-emerald-500/60 z-10">
                                <div className="w-1.5 h-1.5 rounded-sm bg-emerald-500 animate-pulse" />
                                <span className="font-bold tracking-widest uppercase">Kernel Logs // Predictive Core</span>
                            </div>
                            <div className="p-4 space-y-1.5">
                                {logs.map((log, i) => (
                                    <div key={i} className="text-emerald-500/80 border-l border-emerald-900/30 pl-2 hover:bg-emerald-900/5 transition-colors">
                                        <span className="opacity-40 select-none">[{String(i).padStart(3, '0')}]</span> {log}
                                    </div>
                                ))}
                                {logs.length === 0 && <span className="text-emerald-900/50 italic px-2">Waiting for mission start...</span>}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </ForensicPageLayout>
    );
}
