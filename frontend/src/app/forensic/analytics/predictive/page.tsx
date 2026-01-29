'use client';

import React, { useState } from 'react';
import { 
    BrainCircuit, Activity, TrendingUp, 
    Loader2, Zap
} from 'lucide-react';
import { API_URL } from '@/utils/constants';
import { useProject } from '@/store/useProject';
import ForensicPageLayout from '@/app/components/ForensicPageLayout';

interface ForecastResult {
    project_name: string;
    contract_value: number;
    realized_spend: number;
    current_leakage: number;
    leakage_rate_percent: number;
    predicted_total_leakage: number;
    risk_status: string;
}

export default function PredictiveAnalyticsPage() {
    const { activeProjectId } = useProject();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<ForecastResult | null>(null);

    const handlePredict = async () => {
        if (!activeProjectId) return;
        setIsAnalyzing(true);
        setResult(null);
        try {
            const res = await fetch(`${API_URL}/api/v1/forensic/${activeProjectId}/forecast`);
            if (res.ok) {
                const data = await res.json();
                setResult(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <ForensicPageLayout
            title="Forensic Forecasting"
            subtitle="Leakage Vector Prediction Engine"
            icon={BrainCircuit}
        >
            <main className="flex-1 p-10 overflow-auto custom-scrollbar flex gap-10">
                {/* Control Panel */}
                <div className="w-[400px] flex flex-col gap-6 shrink-0">
                    <div className="p-8 rounded-[2.5rem] bg-slate-900/40 border border-white/5 backdrop-blur-md">
                        <h2 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                            <Activity className="w-4 h-4 text-indigo-400" /> Audit Context
                        </h2>
                        
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-slate-950 border border-white/5">
                                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Active Project</p>
                                <p className="text-sm font-black text-white">{activeProjectId || 'NONE_SELECTED'}</p>
                            </div>

                            <button
                                onClick={handlePredict}
                                disabled={isAnalyzing || !activeProjectId}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-indigo-900/40 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                {isAnalyzing ? 'Processing...' : 'Run Leakage Forecast'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results Area */}
                <div className="flex-1 rounded-[3rem] bg-slate-900/20 border border-white/5 relative overflow-hidden flex flex-col">
                    {result ? (
                        <div className="flex-1 p-10 flex flex-col animate-in fade-in zoom-in duration-500">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">{result.project_name}</h2>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                                        Contract Value: <span className="text-indigo-400">Rp {result.contract_value?.toLocaleString()}</span>
                                    </p>
                                </div>
                                <div className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-[0.2em] border ${
                                    result.risk_status === 'CRITICAL' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                                    result.risk_status === 'HIGH' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                                    'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                                }`}>
                                    {result.risk_status} RISK
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 mb-10">
                                <div className="p-8 rounded-[2rem] bg-black/40 border border-white/5 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <TrendingUp className="w-8 h-8 text-indigo-500 mb-4" />
                                    <h3 className="text-4xl font-black text-white mb-2">{result.leakage_rate_percent}%</h3>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Leakage Factor</p>
                                </div>
                                <div className="p-8 rounded-[2rem] bg-black/40 border border-white/5 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <Activity className="w-8 h-8 text-rose-500 mb-4" />
                                    <h3 className="text-3xl font-black text-white mb-2">Rp {(result.predicted_total_leakage / 1000000000).toFixed(2)}B</h3>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Predicted Total Leakage</p>
                                </div>
                            </div>

                            <div className="p-8 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10">
                                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Forensic Inference</h4>
                                <p className="text-lg font-bold text-slate-300 leading-relaxed italic">
                                    Based on current variance of <span className="text-white font-black">Rp {(result.current_leakage/1000000).toFixed(1)}M</span> detected in the first <span className="text-white font-black">Rp {(result.realized_spend/1000000).toFixed(1)}M</span> of realization, the model predicts a terminal leakage of <span className="text-rose-500 font-black">Rp {(result.predicted_total_leakage/1000000).toFixed(1)}M</span> if spending patterns persist.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
                            {isAnalyzing ? (
                                <div className="flex flex-col items-center">
                                    <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-6" />
                                    <h3 className="text-2xl font-black text-white uppercase tracking-widest animate-pulse">Running Inference...</h3>
                                </div>
                            ) : (
                                <>
                                    <BrainCircuit className="w-24 h-24 text-slate-500 mb-6" />
                                    <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">Neural Link Idle</h3>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Execute forecast for project analysis</p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </ForensicPageLayout>
    );
}
