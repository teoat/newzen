import React from 'react';

interface TopMetricProps { 
    label: string;
    val: number;
    danger?: boolean;
}

export function TopMetric({ label, val, danger = false }: TopMetricProps) {
    return (
        <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">{label}</span>
            <span className={`text-xl font-black italic tracking-tighter ${danger ? 'text-rose-500' : 'text-white'}`}>{val.toLocaleString()}</span>
        </div>
    );
}
