'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useProject } from '../../../../store/useProject';
import { ApiClient } from '../../../../lib/apiClient';
import { z } from 'zod';
import { Building2, Box, Activity, AlertTriangle, ChevronRight, Maximize2 } from 'lucide-react';
import { motion } from 'framer-motion';

const ReconstructionSchema = z.object({
    project_id: z.string(),
    reconstruction_id: z.string(),
    metrics: z.object({
        volume_m3: z.number(),
        deviation_percentage: z.number()
    }),
    confidence: z.number()
});

type Reconstruction = z.infer<typeof ReconstructionSchema>;

export default function ArchitectTab() {
    const { activeProjectId } = useProject();
    const [data, setData] = useState<Reconstruction | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchArchitectData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await ApiClient.get(ReconstructionSchema, `/api/v2/architect/reconstruct/${activeProjectId}`);
            setData(res);
        } catch (e) {
            console.error('Architect fetch failed', e);
        } finally {
            setLoading(false);
        }
    }, [activeProjectId]);

    useEffect(() => {
        if (activeProjectId) {
            void fetchArchitectData();
        }
    }, [activeProjectId, fetchArchitectData]);

    return (
        <div className="h-full flex flex-col p-8 bg-transparent">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Spatial_Digital_Twin</h2>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.3em]">Architectural Audit & Physical Verification</p>
                </div>
                <div className="flex gap-3">
                    <div className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2">
                        <Box size={14} className="text-rose-400" />
                        <span className="text-[11px] font-black text-rose-400 uppercase tracking-widest">NeRF Reconstruction Active</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8 flex-1">
                {/* 3D Viewport Area */}
                <div className="col-span-8 bg-slate-900/50 border border-white/5 rounded-[3rem] relative overflow-hidden group">
                    <div className="absolute inset-0 opacity-20 site-grid-bg" />
                    
                    {/* Simulated 3D Scene */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div 
                            animate={{ 
                                rotateY: [0, 360],
                                scale: [1, 1.05, 1]
                            }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="w-64 h-64 bg-indigo-500/20 border-2 border-indigo-500/50 rounded-2xl flex items-center justify-center relative"
                        >
                            <Building2 size={80} className="text-indigo-400 opacity-40" />
                            <div className="absolute inset-0 border border-white/10 animate-pulse" />
                            
                            {/* Deviation Pings */}
                            <div className="absolute top-10 left-10 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                            <div className="absolute bottom-20 right-10 w-2 h-2 bg-rose-500 rounded-full animate-ping delay-500" />
                        </motion.div>
                    </div>

                    <div className="absolute bottom-10 left-10 flex gap-4">
                        <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                            <Activity size={10} className="text-emerald-500" />
                            <span className="text-[8px] font-black text-white uppercase">Point Cloud: 4.2M pts</span>
                        </div>
                        <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                            <Box size={10} className="text-blue-500" />
                            <span className="text-[8px] font-black text-white uppercase">Voxel Size: 5cm</span>
                        </div>
                    </div>

                    <button 
                        title="Maximize Viewport"
                        className="absolute top-10 right-10 p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 text-slate-400"
                    >
                        <Maximize2 size={16} />
                    </button>
                </div>

                {/* Metrics Sidebar */}
                <div className="col-span-4 flex flex-col gap-6">
                    <div className="p-8 bg-slate-900/80 border border-white/10 rounded-[2.5rem] shadow-2xl">
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-6">Physical Discrepancies</span>
                        
                        <div className="space-y-6">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[11px] font-black text-slate-400 uppercase mb-1">Volume Variance</p>
                                    <h4 className="text-3xl font-black text-white font-mono italic">
                                        {data?.metrics.deviation_percentage ?? '0.00'}%
                                    </h4>
                                </div>
                                <div className={`p-2 rounded-lg ${data && data.metrics.deviation_percentage > 5 ? 'bg-rose-500/20 text-rose-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                                    <AlertTriangle size={20} />
                                </div>
                            </div>

                            <div className="p-6 bg-white/[0.03] rounded-2xl border border-white/5">
                                <div className="flex justify-between mb-2">
                                    <span className="text-[11px] font-bold text-slate-500">Confidence Score</span>
                                    <span className="text-[11px] font-black text-indigo-400">{((data?.confidence ?? 0) * 100).toFixed(0)}%</span>
                                </div>
                                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(data?.confidence ?? 0) * 100}%` }}
                                        className="h-full bg-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 p-8 bg-indigo-600/10 border border-indigo-500/20 rounded-[2.5rem]">
                        <h5 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-4">Architectural Reasoning</h5>
                        <p className="text-xs text-slate-300 leading-relaxed italic">
                            &ldquo;The 3D reconstruction identifies a 4.2% discrepancy in structural volume compared to the approved BIM model. Specifically, the foundation footprint appears 12% smaller than claimed in the 2026-01 progress report.&rdquo;
                        </p>
                        
                        <button className="w-full mt-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[11px] font-black uppercase text-white tracking-widest flex items-center justify-center gap-2 transition-all">
                            View Evidence Timeline <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
