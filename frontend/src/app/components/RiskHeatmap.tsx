'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface HeatmapData {
    category: string;
    variance: number;
    risk: number; // 0-1
}

interface RiskHeatmapProps {
    data: HeatmapData[];
}

export function RiskHeatmap({ data }: RiskHeatmapProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-white uppercase tracking-widest italic">Budget Category Risk Variance</h4>
                <div className="flex gap-2">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded bg-emerald-500" />
                        <span className="text-[8px] font-bold text-slate-500 uppercase">Low</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded bg-rose-500" />
                        <span className="text-[8px] font-bold text-slate-500 uppercase">High</span>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {data.map((item, i) => (
                    <motion.div
                        key={item.category}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className={`
                            p-3 rounded-xl border flex flex-col justify-between h-20 transition-all cursor-crosshair
                            ${item.risk > 0.7 ? 'bg-rose-500/10 border-rose-500/30' : 
                              item.risk > 0.4 ? 'bg-amber-500/10 border-amber-500/30' : 
                              'bg-emerald-500/10 border-emerald-500/30'}
                        `}
                    >
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter truncate">{item.category}</span>
                        <div className="flex items-baseline justify-between">
                            <span className="text-sm font-black text-white italic">{(item.variance / 1000000).toFixed(1)}M</span>
                            <span className={`text-[8px] font-bold ${(item.risk * 100) > 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {Math.round(item.risk * 100)}%
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
