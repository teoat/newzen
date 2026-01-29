import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Match } from '@/types/domain';

interface RecordCardProps { 
    id: string;
    date: string;
    desc: string;
    amount: number;
    isMatched: boolean;
    isTruth?: boolean;
    matches: Match[];
    onHoverMatch: (id: string | null) => void;
    hoveredMatchId: string | null;
    riskDescription?: string;
    onConfirm?: (matchId: string) => void;
    onExplain?: (id: string) => void;
}

export function RecordCard({ 
    id, date, desc, amount, isMatched, isTruth, 
    matches, onHoverMatch, hoveredMatchId, riskDescription,
    onConfirm, onExplain
}: RecordCardProps) {
    const match = matches.find(m => isTruth ? m.bank_tx_id === id : m.internal_tx_id === id);
    const isHovered = hoveredMatchId === (match?.id || null);
    const isConfirmed = match?.confirmed;

    return (
        <motion.div 
            onHoverStart={() => match && onHoverMatch(match.id)}
            onHoverEnd={() => onHoverMatch(null)}
            className={`
                p-5 tactical-card flex flex-col group
                ${isMatched ? (isConfirmed ? 'border-emerald-500/30 bg-emerald-500/[0.02]' : 'border-indigo-500/30') : 'grayscale opacity-60 hover:grayscale-0 hover:opacity-100'}
                ${isHovered ? 'shadow-[0_0_30px_rgba(79,70,229,0.15)] scale-[1.01] z-10 border-indigo-500/50' : ''}
                transition-all duration-300
            `}
        >
            {/* Depth Accent Line */}
            <div className={isTruth ? 'depth-accent-blue' : 'depth-accent-amber'} />
            
            {/* Corner Decorative Accent */}
            <div className="corner-accent opacity-30 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-start justify-between gap-4 mb-3 relative z-10">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 italic">
                        <Clock className="w-3 h-3" /> {new Date(date).toLocaleDateString()}
                    </span>
                    <h3 className="text-xs font-bold text-slate-200 line-clamp-1 uppercase tracking-tight">{desc}</h3>
                </div>
                <div className="text-right">
                    <p className={`text-sm font-black italic tracking-tighter ${isTruth ? 'text-indigo-400' : 'text-amber-400'}`}>
                        {amount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }).replace(',00', '')}
                    </p>
                    
                    {/* Forensic Risk Badges */}
                    {riskDescription && (
                        <div className="flex flex-wrap justify-end gap-1 mt-1 opacity-80">
                            {riskDescription.includes("Velocity Risk") && (
                                <span className="px-1 py-0.5 rounded border border-purple-500/30 bg-purple-500/10 text-purple-400 text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                                    <Zap className="w-2 h-2" /> VELOCITY
                                </span>
                            )}
                            {riskDescription.includes("Channel Risk") && (
                                <span className="px-1 py-0.5 rounded border border-orange-500/30 bg-orange-500/10 text-orange-400 text-[8px] font-black uppercase tracking-wider">
                                    CHANNEL
                                </span>
                            )}
                            {riskDescription.includes("Structuring") && (
                                <span className="px-1 py-0.5 rounded border border-rose-500/30 bg-rose-500/10 text-rose-400 text-[8px] font-black uppercase tracking-wider">
                                    STRUCTURING
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {isMatched && match && (
                <div className="flex items-center justify-between pt-3 border-t border-white/5 relative z-10">
                    <div className="flex items-center gap-2">
                        <div className={`
                            px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest italic
                            ${match.match_type === 'direct' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-400'}
                        `}>
                            {match.match_type}
                        </div>
                        
                        {/* Tier Badge */}
                        {match.ai_reasoning && (() => {
                            const tierMatch = match.ai_reasoning.match(/TIER_(\d)_(\w+)/);
                            if (!tierMatch) return null;
                            
                            const tierNum = tierMatch[1];
                            const tierColors = {
                                '1': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
                                '2': 'bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.2)]',
                                '3': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40 shadow-[0_0_10px_rgba(234,179,8,0.2)]',
                                '4': 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.2)]',
                            };
                            
                            return (
                                <div className={`
                                    px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-[0.2em] italic
                                    border ${tierColors[tierNum as keyof typeof tierColors] || tierColors['4']}
                                    flex items-center gap-1.5
                                `} title={match.ai_reasoning}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                    TIER_{tierNum}
                                </div>
                            );
                        })()}
                        
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] italic">CONF: {(match.confidence_score * 100).toFixed(0)}%</span>
                    </div>

                    {!isConfirmed && isTruth && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onConfirm) onConfirm(match.id);
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[8px] font-black uppercase tracking-widest transition-all opacity-0 group-hover:opacity-100"
                        >
                            Confirm Match
                        </button>
                    )}
                    
                    {isConfirmed && (
                        <div className="flex items-center gap-1.5 text-emerald-500">
                            <ShieldCheck className="w-3 h-3" />
                            <span className="text-[8px] font-black uppercase tracking-widest italic">MATCH_VERIFIED</span>
                        </div>
                    )}
                </div>
            )}

            {!isMatched && (
                <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2 relative z-10">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3 text-rose-500/50" />
                        <span className="text-[8px] font-black text-rose-500/40 uppercase tracking-widest italic">UNRECONCILED_GAP_DETECTED</span>
                    </div>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onExplain) onExplain(id);
                        }}
                        className="text-[8px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest flex items-center gap-1 group/btn"
                    >
                        AI EXPLAIN <Zap className="w-2 h-2 group-hover/btn:scale-125 transition-transform" />
                    </button>
                </div>
            )}
        </motion.div>
    );
}
