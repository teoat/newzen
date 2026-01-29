'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import { useProject } from '@/store/useProject';
import HolographicBadge from '@/app/components/HolographicBadge';

export default function AnalyticsWorkspace() {
    const { activeProject } = useProject();

    return (
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar animate-in fade-in duration-500 relative">
            <div className="absolute top-8 right-8 z-10"><HolographicBadge /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard 
                    label="Budget Burn" 
                    value="42.8%" 
                    icon={Activity} 
                    color="text-indigo-400" 
                    trend="+12% vs last month"
                />
                <MetricCard 
                    label="Physical Progress" 
                    value="15.2%" 
                    icon={TrendingUp} 
                    color="text-emerald-400" 
                    trend="Behind Schedule"
                    warning
                />
                <MetricCard 
                    label="Risk Index" 
                    value="0.87" 
                    icon={AlertTriangle} 
                    color="text-rose-500" 
                    trend="High Anomaly Density"
                />
                <MetricCard 
                    label="Verified Output" 
                    value="Rp 12.4B" 
                    icon={ShieldCheck} 
                    color="text-indigo-400" 
                    trend="Quality Assured"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-10 h-[400px] flex flex-col">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                            <BarChart3 className="w-4 h-4 text-indigo-400" /> S-Curve Divergence
                        </h3>
                    </div>
                    <div className="flex-1 flex items-end gap-4">
                        {[40, 60, 45, 80, 55, 90, 70, 85, 65, 100].map((h, i) => (
                           <motion.div 
                             key={i} 
                             initial={{ height: 0 }} 
                             animate={{ height: `${h}%` }} 
                             transition={{ delay: i * 0.1 }}
                             className="flex-1 bg-indigo-600/20 rounded-t-xl group relative cursor-help"
                           >
                               <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                               <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-white">
                                   {h}%
                               </div>
                           </motion.div>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-10 h-[400px] flex flex-col justify-center">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-48 h-48 border-8 border-indigo-600/20 rounded-full relative flex items-center justify-center mb-8">
                             <div className="absolute inset-x-0 top-0 h-2 bg-indigo-500 rounded-full rotate-45" />
                             <span className="text-4xl font-black text-white">87%</span>
                        </div>
                        <h3 className="text-lg font-black text-white uppercase tracking-widest mb-2">Confidence Level</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Across all forensic streams</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ label, value, icon: Icon, color, trend, warning = false }: { 
    label: string; 
    value: string; 
    icon: React.ComponentType<{ className?: string }>; 
    color: string; 
    trend: string; 
    warning?: boolean;
}) {
    return (
        <div className={`p-6 rounded-3xl border ${warning ? 'border-rose-500/20 bg-rose-500/5' : 'border-white/5 bg-slate-900/30'} flex flex-col justify-between h-40 group hover:border-indigo-500/30 transition-all`}>
            <div className="flex justify-between items-start">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
               <Icon className={`w-5 h-5 ${color} group-hover:scale-110 transition-transform`} />
            </div>
            <div>
                <div className={`text-2xl font-black font-mono mb-1 ${color}`}>{value}</div>
                <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{trend}</div>
            </div>
        </div>
    );
}
