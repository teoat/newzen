'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ForecastData {
    project_name: string;
    contract_value: number;
    realized_spend: number;
    current_leakage: number;
    leakage_rate_percent: number;
    predicted_total_leakage: number;
    risk_status: string;
}

export function LeakageForecast({ data }: { data: ForecastData | null }) {
    if (!data) return null;

    const riskColor = data.risk_status === 'CRITICAL' ? 'rose' : data.risk_status === 'HIGH' ? 'amber' : 'emerald';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Forensic Leakage Projection</h3>
                </div>
                <div className={`px-2 py-1 rounded bg-${riskColor}-500/10 border border-${riskColor}-500/20 text-${riskColor}-500 text-[8px] font-black uppercase tracking-widest`}>
                    Status: {data.risk_status}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Current Leakage Rate</p>
                    <p className={`text-2xl font-black text-${riskColor}-500 tracking-tighter`}>{data.leakage_rate_percent}%</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Predicted Leakage</p>
                    <p className="text-2xl font-black text-white tracking-tighter">
                        Rp {(data.predicted_total_leakage / 1000000000).toFixed(2)}B
                    </p>
                </div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-400 leading-relaxed italic">
                    Based on current variance across Material and Labor categories, the projected final leakage at project completion is 
                    <span className="text-white font-bold mx-1">Rp {(data.predicted_total_leakage / 1000000).toFixed(0)}M</span>. 
                    Immediate audit of Sub-Contractor B is recommended.
                </p>
            </div>
        </div>
    );
}
