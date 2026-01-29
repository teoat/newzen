import React from 'react';

interface ConfigSliderProps {
    icon: React.ReactNode;
    label: string;
    sub: string;
    val: number;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    onChange: (val: number) => void;
}

export function ConfigSlider({ icon, label, sub, val, min, max, step = 1, unit, onChange }: ConfigSliderProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                    <div className="p-2 bg-indigo-500/10 rounded-lg h-fit">
                        {icon}
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-white italic uppercase tracking-widest">{label}</h4>
                        <p className="text-[10px] text-slate-500 mt-1">{sub}</p>
                    </div>
                </div>
                <span className="text-sm font-black text-indigo-400 italic bg-indigo-500/5 px-2 py-1 rounded border border-indigo-500/20">{val}{unit && ` ${unit}`}</span>
            </div>
            <input 
                type="range" min={min} max={max} step={step} value={val} 
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                aria-label={label}
            />
        </div>
    );
}
