'use client';

import React from 'react';
import { useInvestigation, Investigation } from '@/store/useInvestigation';
import { motion } from 'framer-motion';
import { 
    Clock, Play, Pause, CheckCircle, 
    Plus, Search, Filter, Archive
} from 'lucide-react';

interface InvestigationListProps {
  onSelect: (id: string) => void;
  selectedId?: string;
}

export default function InvestigationList({ onSelect, selectedId }: InvestigationListProps) {
    const { investigations, startInvestigation } = useInvestigation();
    
    const active = investigations.filter(i => i.status === 'active');
    const paused = investigations.filter(i => i.status === 'paused');
    const completed = investigations.filter(i => i.status === 'completed');

    const handleNew = () => {
        const title = prompt('Investigation Title:');
        if (title) startInvestigation(title);
    };

    return (
        <div className="w-80 border-r border-white/5 bg-slate-950/20 flex flex-col h-full shrink-0">
            <div className="p-6 border-b border-white/5">
                <button 
                    onClick={handleNew}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-900/20"
                >
                    <Plus className="w-4 h-4" /> New Case
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-8">
                <section>
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 px-2">Active Sessions</h3>
                    <div className="space-y-2">
                        {active.map(inv => (
                            <InvItem 
                                key={inv.id} 
                                inv={inv} 
                                isActive={selectedId === inv.id} 
                                onClick={() => onSelect(inv.id)} 
                            />
                        ))}
                        {active.length === 0 && <p className="text-[10px] text-slate-700 italic px-2">No active sessions</p>}
                    </div>
                </section>

                <section>
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 px-2">On Ice</h3>
                    <div className="space-y-2">
                        {paused.map(inv => (
                            <InvItem 
                                key={inv.id} 
                                inv={inv} 
                                isActive={selectedId === inv.id} 
                                onClick={() => onSelect(inv.id)} 
                            />
                        ))}
                    </div>
                </section>

                <section>
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 px-2">Archive</h3>
                    <div className="space-y-2">
                        {completed.map(inv => (
                            <InvItem 
                                key={inv.id} 
                                inv={inv} 
                                isActive={selectedId === inv.id} 
                                onClick={() => onSelect(inv.id)} 
                            />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

function InvItem({ inv, isActive, onClick }: { inv: Investigation; isActive: boolean; onClick: () => void }) {
    const statusIcon = {
        active: <Play className="w-3 h-3 text-emerald-500" />,
        paused: <Pause className="w-3 h-3 text-amber-500" />,
        completed: <CheckCircle className="w-3 h-3 text-indigo-500" />
    };

    return (
        <button
            onClick={onClick}
            className={`w-full p-4 rounded-xl text-left transition-all border ${
                isActive 
                ? 'bg-indigo-600/10 border-indigo-500/50 ring-1 ring-indigo-500/20' 
                : 'bg-slate-900/40 border-white/5 hover:border-white/10'
            }`}
        >
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-white truncate pr-2">{inv.title}</span>
                {statusIcon[inv.status]}
            </div>
            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-500">
                <span>{inv.timeline.length} Acts</span>
                <span className="text-indigo-400">{(inv.riskScore || 0)}% Risk</span>
            </div>
        </button>
    );
}
