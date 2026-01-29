'use client';

import React, { useState, useEffect } from 'react';
import { 
    Radar, Share2, DollarSign, 
    ArrowRight, Lock, Loader2, 
    Database, Globe, Target
} from 'lucide-react';
import { API_URL } from '@/utils/constants';

interface TraceNode {
    id: string;
    label: string;
    type: 'FIAT' | 'ENTITY' | 'CRYPTO' | 'OFFSHORE' | 'ASSET';
    risk: number;
}

interface TraceLink {
    source: string;
    target: string;
    value: number;
    currency: string;
}

interface RecoverResult {
    trace_id: string;
    confidence: number;
    recoverable_amount_estimate: number;
    graph: {
        nodes: TraceNode[];
        links: TraceLink[];
    };
}

export default function AssetRecoveryPage() {
    const [projectId, setProjectId] = useState('ZENITH-001');
    const [isTracing, setIsTracing] = useState(false);
    const [result, setResult] = useState<RecoverResult | null>(null);

    const handleTrace = async () => {
        setIsTracing(true);
        setResult(null);
        try {
            const res = await fetch(`${API_URL}/api/v1/forensic-tools/recovery/trace/${projectId}`);
            if (res.ok) {
                const data = await res.json();
                setTimeout(() => {
                    setResult(data);
                    setIsTracing(false);
                }, 2000);
            } else {
                setIsTracing(false);
            }
        } catch (e) {
            console.error(e);
            setIsTracing(false);
        }
    };

    // Helper to format currency
    const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(n);

    return (
        <div className="h-screen depth-layer-0 text-depth-secondary font-sans flex flex-col overflow-hidden">
             {/* Header */}
             <header className="h-20 depth-border-subtle depth-layer-1 backdrop-blur-xl flex items-center justify-between px-10 shrink-0 z-50">
                <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-cyan-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-cyan-900/20 ring-1 ring-white/10">
                        <Radar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">Flux Capital Tracer</h1>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20 font-bold uppercase tracking-wider">Multi-Ledger Recovery</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* Control Panel */}
                <div className="w-96 depth-border-strong depth-layer-1 p-8 flex flex-col gap-8 shrink-0">
                    <div className="space-y-4">
                        <label htmlFor="project-id" className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                             <Target className="w-3 h-3" /> Target Project
                        </label>
                        <input 
                            id="project-id"
                            type="text"
                            value={projectId}
                            onChange={(e) => setProjectId(e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:border-cyan-500 transition-colors outline-none"
                        />
                        <button
                            onClick={handleTrace}
                            disabled={isTracing}
                            className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 rounded-2xl text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-cyan-900/40 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 group"
                        >
                            {isTracing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4 group-hover:rotate-180 transition-transform" />}
                            {isTracing ? 'Tracing Ledgers...' : 'Initiate Asset Trace'}
                        </button>
                    </div>

                    <div className="p-6 rounded-2xl tactical-card depth-layer-2 depth-border-subtle">
                        <h3 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-4">Coverage Map</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {['SWIFT / SEPA', 'Ethereum (ERC20)', 'Tron (TRC20)', 'Bitcoin Omni', 'Offshore Leaks', 'Property Registries'].map(item => (
                                <div key={item} className="flex items-center gap-2 text-[9px] font-bold text-slate-400">
                                    <div className="w-1 h-1 rounded-full bg-cyan-500" /> {item}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Graph View */}
                <div className="flex-1 relative bg-black flex items-center justify-center overflow-auto p-10">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1),transparent_70%)] pointer-events-none" />
                    
                    {result ? (
                        <div className="w-full max-w-5xl animate-in zoom-in duration-500">
                            <div className="flex justify-between items-end mb-10 pb-6 border-b border-white/5">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Trace Identification</p>
                                    <h2 className="text-3xl font-black text-white font-mono">{result.trace_id}</h2>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-1">Estimated Recoverable Value</p>
                                    <h2 className="text-3xl font-black text-cyan-400 text-shadow-glow">{fmt(result.recoverable_amount_estimate)}</h2>
                                </div>
                            </div>

                            {/* Node Visualization (Simplified Flow) */}
                            <div className="relative space-y-4">
                                {result.graph.nodes.map((node, i) => {
                                    // Identify links from this node
                                    const outgoing = result.graph.links.filter(l => l.source === node.id);
                                    
                                    return (
                                        <div key={node.id} className="relative flex items-center gap-10 group">
                                            {/* Node */}
                                            <div className="w-64 p-4 rounded-xl tactical-card depth-layer-2 depth-border-subtle relative z-10 flex items-center gap-4 hover:depth-border-accent transition-colors depth-elevate">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${
                                                    node.type === 'CRYPTO' ? 'bg-indigo-600' :
                                                    node.type === 'OFFSHORE' ? 'bg-rose-600' :
                                                    node.type === 'ASSET' ? 'bg-emerald-600' :
                                                    'bg-slate-700'
                                                }`}>
                                                    {node.type === 'CRYPTO' ? <Database className="w-5 h-5" /> :
                                                     node.type === 'OFFSHORE' ? <Globe className="w-5 h-5" /> :
                                                     node.type === 'ASSET' ? <Lock className="w-5 h-5" /> :
                                                     <DollarSign className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{node.type}</p>
                                                    <p className="text-sm font-bold text-white truncate">{node.label}</p>
                                                </div>
                                            </div>

                                            {/* Links */}
                                            {outgoing.length > 0 && (
                                                <div className="flex flex-col gap-2">
                                                    {outgoing.map((link, idx) => (
                                                        <div key={idx} className="flex items-center gap-2">
                                                            <div className="w-16 h-px bg-cyan-500/30" />
                                                            <div className="px-3 py-1 rounded bg-cyan-950 border border-cyan-500/20 text-[10px] font-mono text-cyan-400 whitespace-nowrap">
                                                                {link.currency} {link.value.toLocaleString()} 
                                                                <ArrowRight className="w-3 h-3 inline ml-2" /> 
                                                                {/* Target Label would be nice here but we only have ID in link */}
                                                                <span className="text-white ml-2">{result.graph.nodes.find(n => n.id === link.target)?.label}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                        </div>
                    ) : (
                        <div className="text-center opacity-30">
                            {isTracing ? (
                                <div className="flex flex-col items-center">
                                    <div className="relative">
                                        <div className="w-24 h-24 border-4 border-cyan-500/20 rounded-full animate-ping absolute" />
                                        <div className="w-24 h-24 border-4 border-cyan-500 rounded-full animate-spin" />
                                    </div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-widest mt-8 animate-pulse">Following the Money...</h3>
                                </div>
                            ) : (
                                <>
                                    <Share2 className="w-24 h-24 text-slate-600 mx-auto mb-6" />
                                    <h3 className="text-lg font-black text-slate-500 uppercase tracking-widest">Ready to Trace</h3>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
