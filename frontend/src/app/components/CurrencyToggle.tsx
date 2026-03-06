import React from 'react';
import { useProject } from '../../store/useProject';

export function CurrencyToggle() {
    const { preferredCurrency, setPreferredCurrency } = useProject();
    
    return (
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10 h-8">
            <button 
                onClick={() => setPreferredCurrency('IDR')}
                className={`px-2 h-full flex items-center rounded-md text-[11px] font-black transition-all ${preferredCurrency === 'IDR' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
            >
                IDR
            </button>
            <button 
                onClick={() => setPreferredCurrency('USD')}
                className={`px-2 h-full flex items-center rounded-md text-[11px] font-black transition-all ${preferredCurrency === 'USD' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
            >
                USD
            </button>
        </div>
    );
}
