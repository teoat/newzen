'use client';

import React, { useState, useMemo } from 'react';
import { useProject } from '@/store/useProject';
import ForensicPageLayout from '@/app/components/ForensicPageLayout';
import { 
    AlertTriangle, Play, ChevronRight, 
    CheckCircle, RefreshCw, Terminal as TerminalIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useInvestigation } from '@/store/useInvestigation';
import { forensicBus } from '@/lib/ForensicEventBus';

const SCENARIO_DATA = [
    {
        title: "Phase 1: Anomaly Detection",
        desc: "System detects 45% budget burn with only 12% reported physical progress.",
        action: "Analyze Risk Predictions",
        target: "/forensic/analytics/predictive",
        delay: 1000,
        eventType: 'PROJECT_STALLED' as const,
        eventPayload: { 
            projectId: "ZENITH-001", 
            projectName: "Project Zenith Foundation", 
            stallReason: "Budget/Progress Mismatch", 
            daysStalled: 14 
        }
    },
    {
        title: "Phase 2: Entity Identification",
        desc: "High-risk vendor 'CV. BINTANG TIMUR' identified in ledger.",
        action: "Run Sanction Screening",
        target: "/legal/screening",
        delay: 3000,
        eventType: 'VENDOR_SUSPICIOUS' as const,
        eventPayload: { 
            vendorId: "V-992", 
            vendorName: "CV. BINTANG TIMUR", 
            flags: ["SANCTION_WATCHLIST", "OWNERSHIP_OBSCURITY"], 
            riskLevel: 'CRITICAL' as const 
        }
    },
    {
        title: "Phase 3: Verification",
        desc: "Vendor claims 'Foundation Complete'. Satellite data required.",
        action: "Launch Satellite Verification",
        target: "/forensic/satellite",
        delay: 5000,
        eventType: 'SATELLITE_DISCREPANCY' as const,
        eventPayload: { 
            location: { lat: -6.2088, lng: 106.8456 }, 
            expectedValue: 100, 
            actualValue: 15, 
            discrepancyType: "Structural Absence" 
        }
    },
    {
        title: "Phase 4: Asset Recovery",
        desc: "Funds diverted to shell company. Initiation of asset tracing.",
        action: "Trace Assets",
        target: "/forensic/recovery",
        delay: 7000,
        eventType: 'OFFSHORE_TRANSFER' as const,
        eventPayload: { 
            transferId: "TRX-8821", 
            amount: 350000000, 
            origin: "Primary Project Account", 
            destination: "GLOBAL HOLDINGS LTD (BVI)", 
            flagged: true 
        }
    }
];

export default function SimulationLabPage() {
    const { activeProjectId } = useProject();
    void activeProjectId;
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const { startInvestigation, addAction } = useInvestigation();

    const addLog = React.useCallback((msg: string) => {
        setLogs(prev => [`${new Date().toLocaleTimeString()} > ${msg}`, ...prev]);
    }, []);

    const SCENARIO_MEMO = useMemo(() => SCENARIO_DATA, []);

    const runSimulation = () => {
        setStep(1);
        addLog("INITIALIZING SIMULATION 'OP-RED-SKY'...");
        
        // Log initial scenario
        const current = SCENARIO_MEMO[0];
        addLog(`[SYSTEM_EVENT] ${current.desc}`);
        if (current.eventType) {
            forensicBus.publish(current.eventType, current.eventPayload, 'SimulationLab');
        }

        // Start an investigation session
        startInvestigation("Operation Red Sky - Training Simulation", {
            projectId: "ZENITH-001"
        });
        addLog("[INVESTIGATION_STARTED] Session created");
    };

    const handleAction = (target: string, nextStep: number, toolName: string) => {
        // Log the action to the investigation
        addAction({
            action: `Navigated to ${toolName}`,
            tool: toolName,
            result: { simulated: true }
        });
        
        router.push(target);
    };

    return (
        <ForensicPageLayout
            title="Simulation Lab"
            subtitle="Operational Readiness & Scenario Testing"
            icon={TerminalIcon}
            headerActions={
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => { setStep(0); setLogs([]); }}
                        className="p-3 bg-slate-900 border border-white/5 rounded-2xl hover:bg-white/5 transition-all text-slate-500 hover:text-white"
                        title="Reset Environment"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                    <div className="px-6 py-2 rounded-2xl bg-rose-600/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest">
                        Status: {step === 0 ? 'READY' : 'IN_PROGRESS'}
                    </div>
                </div>
            }
        >
            <div className="h-full flex overflow-hidden">
                {/* Simulation Controller */}
                <div className="w-1/3 border-r border-white/5 bg-slate-900/40 p-10 flex flex-col overflow-y-auto no-scrollbar">
                    {step === 0 ? (
                        <div className="flex-1 flex flex-col justify-center items-center text-center">
                            <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center animate-pulse mb-8 border border-rose-500/30">
                                <AlertTriangle className="w-10 h-10 text-rose-500" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-4">Scenario: &quot;Ghost Foundation&quot;</h2>
                            <p className="text-sm text-slate-400 mb-8 max-w-xs leading-relaxed">
                                Simulate a full forensic loop: from initial budget anomaly to satellite verification and asset seizure.
                            </p>
                            <button 
                                onClick={runSimulation}
                                className="px-10 py-5 bg-white text-black font-black uppercase tracking-widest rounded-3xl hover:bg-slate-200 transition-all flex items-center gap-4 shadow-2xl active:scale-95"
                            >
                                <Play className="w-5 h-5 fill-current" /> Start Simulation
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {SCENARIO_MEMO.map((phase, idx) => (
                                <div 
                                    key={idx} 
                                    className={`p-8 rounded-3xl border transition-all duration-500 ${
                                        step === idx + 1 
                                            ? 'bg-rose-500/10 border-rose-500/50 scale-[1.02] shadow-2xl shadow-rose-900/20' 
                                            : step > idx + 1 
                                                ? 'bg-slate-900/50 border-white/5 opacity-50'
                                                : 'bg-transparent border-transparent opacity-30 shadow-none'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className={`text-[10px] font-black uppercase tracking-widest ${step === idx + 1 ? 'text-white' : 'text-slate-500'}`}>
                                            {phase.title}
                                        </h3>
                                        {step > idx + 1 && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                                    </div>
                                    <p className="text-sm font-bold text-slate-300 mb-6 leading-relaxed">{phase.desc}</p>
                                    
                                    {step === idx + 1 && (
                                        <button 
                                            onClick={() => handleAction(phase.target, idx + 2, phase.action)}
                                            className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 animate-pulse shadow-lg shadow-rose-900/40 transition-all"
                                        >
                                            Execute Action <ChevronRight className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Terminal / Log Output */}
                <div className="flex-1 bg-black/40 backdrop-blur-3xl p-10 font-mono text-xs overflow-auto custom-scrollbar">
                    <div className="mb-6 flex items-center gap-3 text-emerald-500/60">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                        <span className="font-bold tracking-[0.2em] font-mono">ZENITH_KERNEL_LOG // STREAMING</span>
                    </div>
                    <div className="space-y-3">
                        {logs.map((log, i) => (
                            <div key={i} className="text-emerald-500/90 border-l-2 border-emerald-500/20 pl-4 py-1">
                                {log}
                            </div>
                        ))}
                        {logs.length === 0 && <span className="text-slate-700 italic">SYSTEM_IDLE: Waiting for trigger...</span>}
                    </div>
                </div>
            </div>
        </ForensicPageLayout>
    );
}
