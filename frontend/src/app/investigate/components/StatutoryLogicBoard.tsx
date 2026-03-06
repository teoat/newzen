'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gavel, Scale, ShieldAlert, FileCheck, HelpCircle, ChevronRight, Target } from 'lucide-react';
import { EvidenceItem, useInvestigation } from '../../../store/useInvestigation';

interface StatutoryArticle {
    id: string;
    title: string;
    description: string;
    punishment: string;
    confidence_triggers: string[];
}

const TIPIKOR_ARTICLES: StatutoryArticle[] = [
    {
        id: '2',
        title: 'Article 2: Enrichment of Self/Others',
        description: 'Every person who unlawfully performs acts of enriching oneself or another person or a corporation that can harm state finances or the state economy.',
        punishment: 'Life imprisonment or 4-20 years. Fine Rp 200M - 1B.',
        confidence_triggers: ['Personal Leakage', 'Inflation', 'Shell Company']
    },
    {
        id: '3',
        title: 'Article 3: Abuse of Authority',
        description: 'Every person who with the aim of enriching oneself or another person or a corporation, abuses the authority, opportunity or means available to him because of his position or position which can harm the state finances.',
        punishment: 'Life imprisonment or 1-20 years. Fine Rp 50M - 1B.',
        confidence_triggers: ['Authorizer Anomaly', 'Bypassed Approval', 'Conflict of Interest']
    },
    {
        id: '5',
        title: 'Article 5: Bribery (Active)',
        description: 'Giving or promising something to a civil servant or state organizer with the intention that the civil servant or state organizer does or does not do something in his position.',
        punishment: '1-5 years. Fine Rp 50M - 250M.',
        confidence_triggers: ['Kickback Pattern', 'Unusual Commission', 'Cash Withdrawal']
    },
    {
        id: '13',
        title: 'Article 13: Gratification',
        description: 'Giving gifts or promises to civil servants by considering the power or authority inherent in their position or position.',
        punishment: 'Max 3 years. Fine max Rp 150M.',
        confidence_triggers: ['Gift Pattern', 'Holiday Allowance', 'Luxury Expense']
    }
];

interface StatutoryLogicBoardProps {
    investigationId: string;
    evidenceItems: EvidenceItem[];
}

export default function StatutoryLogicBoard({ investigationId, evidenceItems }: StatutoryLogicBoardProps) {
    const { updateEvidenceArticle } = useInvestigation();
    const [selectedEvidenceId, setSelectedEvidenceId] = React.useState<string | null>(null);

    const unmappedEvidence = evidenceItems.filter(item => !item.statutory_article && item.verdict === 'ADMITTED');
    const mappedEvidence = (articleId: string) => evidenceItems.filter(item => item.statutory_article === articleId);

    const handleDrop = (evidenceId: string, articleId: string) => {
        updateEvidenceArticle(investigationId, evidenceId, articleId);
    };

    return (
        <div className="flex flex-col h-full gap-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-rose-600/20 rounded-2xl border border-rose-500/30 shadow-lg shadow-rose-900/20">
                        <Scale className="w-6 h-6 text-rose-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-widest italic text-rose-500">Statutory Logic Board</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">Mapping Forensic Exhibits to Tipikor Articles</p>
                    </div>
                </div>
                
                <div className="flex gap-4">
                    <div className="px-4 py-2 bg-slate-900 border border-white/10 rounded-xl flex items-center gap-2">
                        <Target className="w-4 h-4 text-indigo-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confidence: <span className="text-white">84.2%</span></span>
                    </div>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden">
                {/* UNMAPPED EVIDENCE POOL */}
                <div className="col-span-1 flex flex-col glass-tactical border border-white/5 rounded-3xl overflow-hidden bg-slate-950/50">
                    <div className="p-5 border-b border-white/5 bg-white/[0.02]">
                        <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <HelpCircle className="w-3.5 h-3.5 text-slate-500" /> Admitted Exhibits
                        </h3>
                        <p className="text-[9px] text-slate-500 uppercase font-bold mt-1">Pending statutory classification</p>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {unmappedEvidence.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                                <FileCheck className="w-8 h-8 mb-2" />
                                <p className="text-[9px] font-black uppercase tracking-widest">Pool Depleted</p>
                            </div>
                        ) : (
                            unmappedEvidence.map(item => (
                                <motion.div 
                                    key={item.id}
                                    layoutId={item.id}
                                    draggable
                                    onDragStart={() => setSelectedEvidenceId(item.id)}
                                    className={`p-4 bg-slate-900 border border-white/5 rounded-2xl cursor-grab active:cursor-grabbing hover:border-indigo-500/30 transition-all group ${selectedEvidenceId === item.id ? 'opacity-50' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[8px] font-black text-indigo-400 uppercase bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">{item.type}</span>
                                    </div>
                                    <h4 className="text-[11px] font-black text-white uppercase tracking-tight group-hover:text-indigo-400 transition-colors">{item.label}</h4>
                                    <p className="text-[9px] text-slate-500 mt-2 line-clamp-2 italic">&ldquo;{item.description}&rdquo;</p>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* STATUTORY COLUMNS */}
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto custom-scrollbar pr-2 pb-4">
                    {TIPIKOR_ARTICLES.map(article => (
                        <div 
                            key={article.id}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => selectedEvidenceId && handleDrop(selectedEvidenceId, article.id)}
                            className="flex flex-col glass-tactical border border-white/10 rounded-3xl overflow-hidden min-h-[400px] group/col"
                        >
                            <div className="p-6 border-b border-white/5 bg-slate-900/50">
                                <h3 className="text-sm font-black text-rose-400 uppercase tracking-tighter italic mb-1">{article.title}</h3>
                                <p className="text-[10px] text-slate-400 leading-relaxed">{article.description}</p>
                                
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {article.confidence_triggers.map(trigger => (
                                        <span key={trigger} className="text-[7px] font-black uppercase tracking-widest text-slate-600 bg-black/40 px-2 py-0.5 rounded-full border border-white/5">
                                            {trigger}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="flex-1 p-4 space-y-3 bg-white/[0.01]">
                                {mappedEvidence(article.id).map(item => (
                                    <motion.div 
                                        key={item.id}
                                        layoutId={item.id}
                                        className="p-4 bg-slate-950 border border-indigo-500/20 rounded-2xl relative group"
                                    >
                                        <button 
                                            onClick={() => updateEvidenceArticle(investigationId, item.id, '')}
                                            className="absolute -top-2 -right-2 w-5 h-5 bg-rose-600 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <ChevronRight className="w-3 h-3 rotate-180" />
                                        </button>
                                        <div className="flex justify-between items-center mb-1">
                                             <span className="text-[8px] font-black text-indigo-400 uppercase">{item.type}</span>
                                             <span className="text-[8px] font-mono text-slate-600">CONFIDENCE: 92%</span>
                                        </div>
                                        <h4 className="text-[10px] font-black text-white uppercase">{item.label}</h4>
                                    </motion.div>
                                ))}
                                
                                {mappedEvidence(article.id).length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center opacity-10 border-2 border-dashed border-white/20 rounded-2xl py-12">
                                        <Gavel className="w-10 h-10 mb-2" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Drop Evidence Here</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="p-4 bg-rose-600/5 border-t border-rose-500/10">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Potential Penalty</span>
                                    <span className="text-[9px] font-bold text-rose-400">{article.punishment.split('.')[0]}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
