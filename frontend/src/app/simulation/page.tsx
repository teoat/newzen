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
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';

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
            <div className="grid grid-cols-12 gap-8 p-10 h-[calc(100vh-100px)] overflow-hidden">
                {/* LEFT: MISSION CONTROL (4 COL) */}
                <aside className="col-span-12 lg:col-span-4 flex flex-col gap-6 overflow-y-auto no-scrollbar pr-2">
                    <div className="glass-tactical p-8 rounded-[3rem] space-y-8 relative overflow-hidden">
                        <div className="scan-line-overlay" />
                        <h3 className="text-sm font-black text-white uppercase tracking-widest italic flex items-center gap-3 relative z-20">
                            <Activity className="w-4 h-4 text-indigo-400" /> Control Parameters
                        </h3>

                        <div className="space-y-4 relative z-20">
                            <button 
                                onClick={runMonteCarlo}
                                disabled={isSimulating}
                                className="w-full h-16 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl flex items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isSimulating ? <Activity className="animate-spin" /> : <BarChart3 size={18} />}
                                Run Stochastic Forecast
                            </button>

                            <button 
                                onClick={runStressTest}
                                className="w-full h-16 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/30 text-rose-500 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-4 transition-all"
                            >
                                <ShieldAlert size={18} /> Engage Red-Teaming
                            </button>
                        </div>
                    </div>

                    {/* VULNERABILITY MATRIX */}
                    <AnimatePresence>
                        {stressTestResult && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-holographic p-8 rounded-[3rem] border-rose-500/20"
                            >
                                <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <AlertTriangle size={14} /> Shadow Scenarios Found
                                </h4>
                                <div className="space-y-4">
                                    <p className="text-[11px] text-slate-300 leading-relaxed italic border-l-2 border-rose-500/40 pl-4">
                                        {stressTestResult.red_team_findings}
                                    </p>
                                    <div className="pt-4 border-t border-white/5">
                                        <Badge variant="outline" className="text-rose-500 border-rose-500/20">VULNERABILITY INDEX: {stressTestResult.vulnerability_index}</Badge>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </aside>

                {/* CENTER: THE ORACLE VIEWPORT (8 COL) */}
                <main className="col-span-12 lg:col-span-8 flex flex-col gap-8 overflow-hidden">
                    {/* FORECAST HUD */}
                    <div className="glass-tactical flex-1 p-10 rounded-[4rem] relative overflow-hidden flex flex-col justify-center items-center text-center">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.05)_0%,transparent_70%)]" />
                        
                        {!simulationResult ? (
                            <div className="relative z-10 opacity-30">
                                <BrainCircuit size={80} className="text-slate-600 mb-8 mx-auto" />
                                <h2 className="text-2xl font-black text-white uppercase tracking-[0.4em]">Oracle Standby</h2>
                                <p className="text-[10px] font-bold text-slate-500 uppercase mt-4 tracking-widest">Awaiting stochastic data stream</p>
                            </div>
                        ) : (
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="relative z-10 w-full max-w-2xl space-y-12"
                            >
                                <div className="space-y-4">
                                    <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                                        {simulationResult.avg_predicted_days_remaining} <span className="text-indigo-500">Days</span>
                                    </h2>
                                    <p className="text-sm font-black text-slate-500 uppercase tracking-[0.3em]">Estimated Mean Project Life</p>
                                </div>

                                <div className="grid grid-cols-2 gap-10">
                                    <div className="p-8 bg-black/40 border border-white/5 rounded-[3rem] space-y-4">
                                        <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Exhaustion Probability</div>
                                        <div className="text-4xl font-black text-white">{(simulationResult.probability_exhaustion_90d * 100).toFixed(1)}%</div>
                                        <p className="text-[9px] text-slate-600 uppercase font-bold tracking-tighter">Failure expected within 90 days</p>
                                    </div>
                                    <div className="p-8 bg-black/40 border border-white/5 rounded-[3rem] space-y-6">
                                        <DualBeliefGauge 
                                            positive={simulationResult.simulation_confidence} 
                                            negative={0.05} 
                                            uncertainty={1 - simulationResult.simulation_confidence - 0.05}
                                            label="Simulation Integrity" 
                                        />
                                        <div className="flex justify-between items-center px-2">
                                            <span className="text-[10px] font-black text-emerald-500">STABLE</span>
                                            <span className="text-[10px] font-black text-slate-700">KERNEL_v3</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* TERMINAL LOGS */}
                    <div className="h-48 bg-black/60 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/5 font-mono text-[10px] overflow-auto custom-scrollbar">
                        <div className="flex items-center gap-3 mb-4 text-emerald-500/60">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="font-bold tracking-widest uppercase">Kernel Logs // Predictive Core</span>
                        </div>
                        <div className="space-y-2">
                            {logs.map((log, i) => (
                                <div key={i} className="text-emerald-500/80">
                                    <span className="opacity-40">[{i}]</span> {log}
                                </div>
                            ))}
                            {logs.length === 0 && <span className="text-slate-800 italic">Waiting for mission start...</span>}
                        </div>
                    </div>
                </main>
            </div>
        </ForensicPageLayout>
    );
}
