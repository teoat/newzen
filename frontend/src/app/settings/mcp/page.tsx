'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Terminal, Shield, Key, RefreshCw, Zap, Server, Globe, ExternalLink } from 'lucide-react';
import ForensicPageLayout from '../../components/ForensicPageLayout';

interface MCPTool {
    id: string;
    name: string;
    description: string;
    status: 'ACTIVE' | 'IDLE';
    endpoint: string;
}

export default function MCPToolingPage() {
    const [apiKey, setApiKey] = useState('zenith_mcp_prod_0x4482a...');
    const [tools] = useState<MCPTool[]>([
        { id: 't1', name: 'NexusQuery', description: 'Query entity relationship data via natural language', status: 'ACTIVE', endpoint: '/api/v1/mcp/nexus' },
        { id: 't2', name: 'DossierSynthesizer', description: 'Generate structured legal briefs from case context', status: 'ACTIVE', endpoint: '/api/v1/mcp/dossier' },
        { id: 't3', name: 'RiskPredictor', description: 'Access predictive leakage scores for external agents', status: 'IDLE', endpoint: '/api/v1/mcp/predict' },
    ]);

    const [isRotating, setIsRotating] = useState(false);

    const rotateKey = () => {
        setIsRotating(true);
        setTimeout(() => {
            setApiKey(`zenith_mcp_${Math.random().toString(36).substring(7)}`);
            setIsRotating(false);
        }, 1500);
    };

    return (
        <ForensicPageLayout
            title="MCP Forensic Server"
            subtitle="Model Context Protocol: External Agent Integration"
            icon={Cpu}
        >
            <div className="p-8 space-y-8 max-w-5xl mx-auto overflow-y-auto max-h-full custom-scrollbar">
                {/* Server Status Hero */}
                <div className="p-10 rounded-[3rem] bg-indigo-600/5 border border-indigo-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-10">
                        <Server size={150} />
                    </div>
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-3">
                            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-black text-emerald-400 uppercase tracking-[0.3em]">Zenith-MCP Server: Online</span>
                        </div>
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-tight">
                            Autonomous Agent <br /> Bridge Protocol
                        </h2>
                        <p className="text-sm text-slate-400 max-w-xl leading-relaxed uppercase tracking-widest font-bold">
                            Zenith now exposes its forensic intelligence layer to standardized Model Context Protocol (MCP) clients, enabling external reasoning engines to audit the platform securely.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Security & Auth */}
                    <div className="tactical-card p-8 bg-slate-900 border border-white/5 rounded-[2.5rem] space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Shield size={20} className="text-indigo-400" />
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">API Security</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">Primary Access Token</label>
                                <div className="flex gap-3">
                                    <div className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-3 font-mono text-xs text-indigo-300 flex items-center overflow-hidden">
                                        {apiKey}
                                    </div>
                                    <button 
                                        onClick={rotateKey}
                                        disabled={isRotating}
                                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-400 transition-all"
                                    >
                                        <RefreshCw size={18} className={isRotating ? 'animate-spin' : ''} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-5 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                                <div className="flex items-center gap-2 text-amber-400 mb-2">
                                    <Key size={14} />
                                    <span className="text-[11px] font-black uppercase tracking-widest">Enforcement Notice</span>
                                </div>
                                <p className="text-[11px] text-slate-400 leading-tight">
                                    All MCP sessions are cryptographically logged and bound to the &quot;Integrity Time-Machine&quot; audit chain.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Available Tools */}
                    <div className="tactical-card p-8 bg-slate-900 border border-white/5 rounded-[2.5rem] space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Terminal size={20} className="text-indigo-400" />
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Exposed Tools</h3>
                        </div>

                        <div className="space-y-3">
                            {tools.map((tool) => (
                                <div key={tool.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:bg-white/[0.04] transition-all">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-white uppercase tracking-tight">{tool.name}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[7px] font-black ${tool.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                                {tool.status}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-0.5">{tool.description}</p>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-[8px] font-mono text-slate-600">{tool.endpoint}</span>
                                        <ExternalLink size={12} className="text-indigo-400" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Documentation Link */}
                <div className="p-8 rounded-[2.5rem] bg-slate-950 border border-white/5 flex items-center justify-between shadow-2xl">
                    <div className="flex items-center gap-6">
                        <div className="p-4 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-900/40">
                            <Globe size={24} className="text-white" />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-white uppercase tracking-tight italic">Protocol Documentation</h4>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Read the full MCP specification for Zenith</p>
                        </div>
                    </div>
                    <button className="px-8 py-3 bg-white text-black rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-400 hover:text-white transition-all">
                        View Schema
                    </button>
                </div>
            </div>
        </ForensicPageLayout>
    );
}
