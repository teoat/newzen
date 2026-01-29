import React from 'react';
import { CheckCircle } from 'lucide-react';

export default function StepToggle({ num, label, active, complete, onClick }: { 
    num: number, label: string, active: boolean, complete: boolean, onClick?: () => void 
}) {
    return (
        <button 
            onClick={onClick}
            disabled={!onClick}
            className={`flex items-center gap-3 px-6 py-2 rounded-xl transition-all relative group ${
                active ? 'bg-slate-800 text-white shadow-lg shadow-black/20' : 
                complete ? 'text-emerald-500 hover:bg-emerald-500/10' : 'text-slate-600'
            } ${!onClick ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border transition-all ${
                active ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/40' : 
                complete ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-slate-900 border-slate-800'
            }`}>
                {complete ? <CheckCircle className="w-3.5 h-3.5" /> : num}
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest">{label}</span>
            {active && (
                <div className="absolute inset-0 border border-white/5 rounded-xl pointer-events-none" />
            )}
        </button>
    );
}
