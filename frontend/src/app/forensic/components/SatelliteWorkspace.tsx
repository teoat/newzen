'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Globe, MapPin, 
    Loader2, AlertTriangle, 
    ShieldCheck 
} from 'lucide-react';
import { useProject } from '@/store/useProject';
import { useHubStore } from '@/store/useHubStore';
import { API_URL } from '@/utils/constants';
import HolographicProjection from '@/app/components/HolographicProjection';

interface SatelliteData {
    satellite_provider: string;
    last_flyover: string;
    delta_detected_percent: number;
    reported_progress_percent: number;
    verification_status: 'VERIFIED' | 'DISCREPANCY';
    analysis_notes: string;
    heatmap_url: string;
}

export default function SatelliteWorkspace() {
    const { activeProjectId } = useProject();
    const [targetId, setTargetId] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [data, setData] = useState<SatelliteData | null>(null);

    // Sync targetId with activeProjectId when it changes
    useEffect(() => {
        if (activeProjectId) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setTargetId(activeProjectId);
        }
    }, [activeProjectId]);

    const handleScan = async () => {
        const id = targetId || activeProjectId;
        if (!id) return;
        setIsScanning(true);
        setData(null);
        try {
            const res = await fetch(`${API_URL}/api/v1/forensic-tools/satellite/verify/${id}`);
            if (res.ok) {
                const result = await res.json();
                setTimeout(() => {
                    setData(result);
                    setIsScanning(false);
                    if (result.verification_status === 'DISCREPANCY') {
                        useHubStore.getState().setSelectedHotspot(`Satellite-${id}`);
                    }
                }, 1500);
            } else {
                setIsScanning(false);
            }
        } catch (error) {
            console.error(error);
            setIsScanning(false);
        }
    };

    return (
        <div className="flex-1 flex overflow-hidden animate-in slide-in-from-right duration-500">
            {/* Sidebar Controls */}
            <div className="w-80 border-r border-white/5 bg-slate-950/30 p-8 flex flex-col gap-8 shrink-0">
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                         <MapPin className="w-3 h-3" /> Target Coordinates
                    </label>
                    <input 
                        type="text"
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:border-indigo-500 transition-colors outline-none"
                        placeholder="Enter Target ID or Coordinates"
                    />
                    <button
                        onClick={handleScan}
                        disabled={isScanning}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-900/40 transition-all flex items-center justify-center gap-3"
                    >
                        {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                        {isScanning ? 'Acquiring Signal...' : 'Initiate Flyover Scan'}
                    </button>
                </div>

                <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5 space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Feed Telemetry</h3>
                    <div className="space-y-2">
                         <div className="flex justify-between text-[10px] font-mono">
                             <span className="text-slate-500">Sentinel-2</span>
                             <span className="text-indigo-400">ESA Optic</span>
                         </div>
                         <div className="flex justify-between text-[10px] font-mono">
                             <span className="text-slate-500">FLYOVER</span>
                             <span className="text-white">Active</span>
                         </div>
                    </div>
                </div>
            </div>

            {/* Main Viewport */}
            <div className="flex-1 relative bg-black/20 flex flex-col items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
                
                {data ? (
                    <div className="w-full max-w-4xl p-10 animate-in zoom-in duration-500">
                         <div className="grid grid-cols-2 gap-10">
                             <div className="aspect-square bg-slate-900/80 rounded-[2.5rem] border border-white/10 relative overflow-hidden shadow-2xl">
                                 <div className="absolute top-6 left-6 px-3 py-1 bg-black/60 backdrop-blur rounded font-mono text-[9px] text-indigo-500 border border-indigo-500/30 font-bold">
                                     LIVE FEED // {data.last_flyover}
                                 </div>
                                 <img 
                                     src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800" 
                                     className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40"
                                     alt="Satellite View"
                                 />
                                 <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-32 h-32 border border-indigo-500/20 rounded-full animate-ping" />
                                 </div>
                             </div>

                             <div className="flex flex-col gap-6 justify-center">
                                 <div className={`px-4 py-2 w-fit rounded-xl text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 ${
                                     data.verification_status === 'VERIFIED' 
                                         ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                                         : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                                 }`}>
                                     {data.verification_status === 'VERIFIED' ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                                     {data.verification_status}
                                 </div>

                                 <div className="space-y-6">
                                     <div>
                                         <div className="flex justify-between items-end mb-2">
                                             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Reported Progress</span>
                                             <span className="text-xl font-black text-white">{data.reported_progress_percent}%</span>
                                         </div>
                                         <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                             <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${data.reported_progress_percent}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                                className="h-full bg-slate-600 rounded-full" 
                                             />
                                         </div>
                                     </div>

                                     <div>
                                         <div className="flex justify-between items-end mb-2">
                                             <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Detected Change</span>
                                             <span className="text-xl font-black text-indigo-400">{data.delta_detected_percent}%</span>
                                         </div>
                                         <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                             <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${data.delta_detected_percent}%` }}
                                                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                                                className="h-full bg-indigo-500 rounded-full relative" 
                                             />
                                         </div>
                                     </div>
                                 </div>
                                 
                                 <div className="p-6 bg-slate-900/50 border border-white/5 rounded-2xl">
                                     <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Analyst Intelligence</h4>
                                     <p className="text-xs font-bold text-slate-300 leading-relaxed italic">&quot;{data.analysis_notes}&quot;</p>
                                 </div>
                             </div>
                         </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        {isScanning ? (
                            <div className="flex flex-col items-center">
                                <div className="w-24 h-24 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-8" />
                                <h3 className="text-sm font-black text-white uppercase tracking-widest animate-pulse">Scanning Surface...</h3>
                            </div>
                        ) : (
                            <HolographicProjection 
                                title="NO_TARGET_LOCK"
                                subtitle="Enter coordinates or select a project to initiate flyover"
                                type="grid"
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
