'use client';

import React, { useState } from 'react';
import { 
    ShieldAlert, Search, Globe, 
    CheckCircle, AlertOctagon, 
    Loader2, Hash, FileText 
} from 'lucide-react';
import { API_URL } from '@/utils/constants';

interface ScreeningResult {
    entity: string;
    screened_at: string;
    risk_score: number;
    status: 'CLEAR' | 'BLOCKED' | 'REVIEW_REQUIRED';
    sources_checked: string[];
    matches: {
        list: string;
        entry: string;
        program: string;
        similarity: number;
    }[];
}

import { useProject } from '@/store/useProject';
import ForensicPageLayout from '@/app/components/ForensicPageLayout';

export default function SanctionScreeningPage() {
    const { activeProjectId } = useProject();
    const [entityName, setEntityName] = useState('');
    const [isScreening, setIsScreening] = useState(false);
    const [result, setResult] = useState<ScreeningResult | null>(null);

    const handleScreen = async () => {
        if (!entityName) return;
        setIsScreening(true);
        setResult(null);
        try {
            const res = await fetch(`${API_URL}/api/v1/legal/screen/${encodeURIComponent(entityName)}${activeProjectId ? `?project_id=${activeProjectId}` : ''}`);
            if (res.ok) {
                const data = await res.json();
                setTimeout(() => {
                    setResult(data);
                    setIsScreening(false);
                }, 1200);
            } else {
                setIsScreening(false);
            }
        } catch (e) {
            console.error(e);
            setIsScreening(false);
        }
    };

    return (
        <ForensicPageLayout
            title="Global Sanction Monitor"
            subtitle="Live Watchlist Feed // AML Compliance Matrix"
            icon={ShieldAlert}
            headerActions={
                <div className="flex items-center gap-3">
                    <span className="text-[10px] bg-rose-500/10 text-rose-400 px-3 py-1.5 rounded-xl border border-rose-500/20 font-black uppercase tracking-widest">Active Intelligence Feed</span>
                </div>
            }
        >
            <div className="flex-1 overflow-auto custom-scrollbar p-10 flex gap-10 h-full">
                
                {/* Search Panel */}
                <div className="w-[480px] flex flex-col gap-6 shrink-0 h-full">
                    <div className="p-10 rounded-[2.5rem] bg-slate-900/40 border border-white/5 backdrop-blur-md">
                        <h2 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
                            <Search className="w-4 h-4 text-rose-400" /> Screening Parameters
                        </h2>
                        
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Entity Name / Tax ID</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={entityName}
                                        onChange={(e) => setEntityName(e.target.value)}
                                        placeholder="e.g. PT. Global Mega Corp"
                                        className="w-full bg-slate-950 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-white focus:border-rose-500 transition-colors outline-none"
                                        onKeyDown={(e) => e.key === 'Enter' && handleScreen()}
                                    />
                                    <Globe className="w-5 h-5 text-slate-600 absolute left-4 top-1/2 -translate-y-1/2" />
                                </div>
                            </div>

                            <button
                                onClick={handleScreen}
                                disabled={isScreening || !entityName}
                                className="w-full py-5 bg-white text-slate-950 hover:bg-rose-50 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-rose-900/10 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {isScreening ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4 text-rose-600" />}
                                {isScreening ? 'Scanning Databases...' : 'Run Compliance Check'}
                            </button>
                        </div>
                    </div>

                    <div className="p-8 rounded-[2.5rem] bg-rose-500/5 border border-rose-500/10">
                         <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-4 ml-1">Active Watchlists</h3>
                         <div className="grid grid-cols-2 gap-4">
                             {['OFAC SDN', 'UN Consolidated', 'Interpol Red', 'EU Financial Sanctions', 'UK HMT', 'AUSTRAC'].map(item => (
                                 <div key={item} className="flex items-center gap-2 text-[10px] font-bold text-slate-400 bg-slate-900/50 px-3 py-2.5 rounded-xl border border-white/5">
                                     <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> {item}
                                 </div>
                             ))}
                         </div>
                    </div>
                </div>

                {/* Results Area */}
                <div className="flex-1 rounded-[3rem] bg-slate-900/40 border border-white/5 relative overflow-hidden flex flex-col h-full">
                    {result ? (
                        <div className="flex-1 p-10 flex flex-col animate-in slide-in-from-bottom-4 duration-500 overflow-y-auto custom-scrollbar">
                            <div className="flex items-center justify-between mb-8 pb-8 border-b border-white/5">
                                <div className="flex items-center gap-6">
                                    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center border ${
                                        result.status === 'BLOCKED' ? 'bg-rose-500/20 border-rose-500 text-rose-500' :
                                        result.status === 'REVIEW_REQUIRED' ? 'bg-amber-500/20 border-amber-500 text-amber-500' :
                                        'bg-emerald-500/20 border-emerald-500 text-emerald-500'
                                    }`}>
                                        {result.status === 'BLOCKED' ? <AlertOctagon className="w-8 h-8" /> : 
                                         result.status === 'REVIEW_REQUIRED' ? <ShieldAlert className="w-8 h-8" /> : 
                                         <CheckCircle className="w-8 h-8" />}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">{result.entity}</h2>
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">
                                            Risk Score: <span className={result.risk_score > 50 ? 'text-rose-400' : 'text-emerald-400'}>{result.risk_score}/100</span>
                                        </p>
                                    </div>
                                </div>
                                <div className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border ${
                                    result.status === 'BLOCKED' ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' :
                                    result.status === 'REVIEW_REQUIRED' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' :
                                    'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                                }`}>
                                    Status: {result.status.replace('_', ' ')}
                                </div>
                            </div>

                            {result.matches.length > 0 ? (
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-rose-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <AlertOctagon className="w-4 h-4" /> Positive Hits Detected ({result.matches.length})
                                    </h3>
                                    {result.matches.map((match, i) => (
                                        <div key={i} className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/20 hover:bg-rose-500/10 transition-colors">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded font-black uppercase tracking-wider">{match.list}</span>
                                                    <span className="text-[10px] font-bold text-rose-300 uppercase tracking-widest">Similarity: {(match.similarity * 100).toFixed(0)}%</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-10">
                                                <div>
                                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Matched Entry</p>
                                                    <p className="text-sm font-bold text-white font-mono">{match.entry}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Sanction Program</p>
                                                    <p className="text-sm font-bold text-white">{match.program}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center p-10 text-center opacity-60 h-full">
                                    <CheckCircle className="w-20 h-20 text-emerald-500 mb-6" />
                                    <h3 className="text-lg font-black text-white uppercase tracking-widest">No Sanctions Found</h3>
                                    <p className="text-xs text-slate-500 font-bold max-w-sm mt-4 leading-relaxed">
                                        No matches found in OFAC, UN, or Interpol databases. Entity appears clean based on current intelligence.
                                    </p>
                                </div>
                            )}

                            <div className="mt-8 pt-8 border-t border-white/5 flex justify-between items-center text-[10px] font-mono text-slate-600 font-black uppercase tracking-widest">
                                <span>REF: {new Date().getTime().toString(16).toUpperCase()}</span>
                                
                                <button className="flex items-center gap-2 hover:text-white transition-colors">
                                    <FileText className="w-3 h-3" /> Export Compliance Certificate
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            {isScreening ? (
                                <div className="flex flex-col items-center">
                                    <div className="w-24 h-24 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin mb-8" />
                                    <h3 className="text-xl font-black text-white uppercase tracking-widest animate-pulse">Running Global Cross-Check...</h3>
                                </div>
                            ) : (
                                <div className="opacity-30">
                                    <Globe className="w-24 h-24 text-slate-600 mb-6 mx-auto" />
                                    <h3 className="text-lg font-black text-slate-500 uppercase tracking-widest">Global Watchlist Feed</h3>
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mt-2">Enter entity details to begin</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </ForensicPageLayout>
    );
}
