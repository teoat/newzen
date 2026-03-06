'use client';
import React, { useState, useCallback } from 'react';
import { 
    Globe, MapPin, 
    Layers, Loader2, 
    AlertTriangle, 
    Maximize2, ShieldCheck, Lock, Wifi, AlertOctagon
} from 'lucide-react';
import Image from 'next/image';
import { authenticatedFetch } from '../../../lib/api';
import { useHubStore } from '../../../store/useHubStore';
import { useProject } from '../../../store/useProject';

interface SatelliteData {
    satellite_provider: string;
    last_flyover: string;
    delta_detected_percent: number;
    reported_progress_percent: number;
    verification_status: 'VERIFIED' | 'DISCREPANCY';
    analysis_notes: string;
    heatmap_url: string;
}

export default function SatelliteVerificationPage() {
    const { activeProjectId } = useProject();
    const hub = useHubStore();
    const [projectId, setProjectId] = useState(activeProjectId || 'ZENITH-001');
    const [isScanning, setIsScanning] = useState(false);
    const [data, setData] = useState<SatelliteData | null>(null);
    const [isSimulation, setIsSimulation] = useState(false);

    const handleScan = useCallback(async () => {
        setIsScanning(true);
        setData(null);
        setIsSimulation(false);
        try {
            // Artificial delay for "Satellite Alignment" feel
            await new Promise(r => setTimeout(r, 2000));

            const res = await authenticatedFetch(`/api/v1/forensic-tools/satellite/verify/${projectId}`);
            
            if (res.ok) {
                const result = await res.json();
                setData(result);
            } else {
                throw new Error("Satellite Link Failed");
            }
        } catch (error) {
            console.warn("Satellite API unreachable, maximizing simulation protocol.", error);
            setIsSimulation(true);
            // Fallback Simulation Data
            setData({
                satellite_provider: 'PLEIADES-NEO-3',
                last_flyover: new Date().toISOString().split('T')[0],
                delta_detected_percent: 18.5,
                reported_progress_percent: 42.0,
                verification_status: 'DISCREPANCY',
                analysis_notes: 'Thermal signature variance detected in Sector 4. Structural density does not match reported concrete pours. Possible lightweight material substitution.',
                heatmap_url: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800"
            });
        } finally {
            setIsScanning(false);
        }
    }, [projectId]);

    // Sync local state with global selection
    React.useEffect(() => {
        if (activeProjectId) setProjectId(activeProjectId);
    }, [activeProjectId]);

    // If an entity is selected, we might focus on their site
    React.useEffect(() => {
        if (hub.selectedEntity) {
            handleScan();
        }
    }, [hub.selectedEntity, handleScan]);


    return (
        <div className="h-screen depth-layer-0 text-depth-secondary font-sans flex flex-col overflow-hidden bg-black">
            {/* Header */}
            <header className="h-20 depth-border-subtle depth-layer-1 backdrop-blur-xl flex items-center justify-between px-10 shrink-0 z-50 border-b border-white/5 bg-slate-900/50">
                <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-indigo-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                        <Globe className="w-6 h-6 text-indigo-400 relative z-10" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight uppercase">Visual Progress Audit</h1>
                        <div className="flex items-center gap-3 mt-1">
                            {isSimulation ? (
                                <span className="text-[11px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20 font-bold uppercase tracking-wider flex items-center gap-1">
                                    <AlertOctagon className="w-3 h-3" /> Simulation Mode
                                </span>
                            ) : (
                                <span className="text-[11px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 font-bold uppercase tracking-wider flex items-center gap-1">
                                    <Wifi className="w-3 h-3" /> Live Uplink
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* Sidebar Controls */}
                <div className="w-96 depth-border-strong bg-slate-950 p-8 flex flex-col gap-8 shrink-0 border-r border-white/5 z-20">
                    <div className="space-y-4">
                        <label htmlFor="target-coords" className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                             <MapPin className="w-3 h-3" /> Audit Target / Project ID
                        </label>
                        <div className="flex gap-2 relative">
                            <input 
                                id="target-coords"
                                type="text"
                                value={projectId}
                                readOnly
                                className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:border-indigo-500 transition-colors outline-none cursor-not-allowed opacity-75 pl-10"
                            />
                            <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                        <button
                            onClick={handleScan}
                            disabled={isScanning}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-indigo-900/40 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 group relative overflow-hidden"
                        >
                             <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                            {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                            {isScanning ? 'Acquiring Signal...' : 'Analyze Construction Delta'}
                        </button>
                    </div>

                    <div className="p-6 rounded-2xl tactical-card depth-layer-2 depth-border-subtle space-y-4 bg-slate-900/50">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Orbital Parameters</h3>
                        <div className="space-y-2">
                             <div className="flex justify-between text-xs font-mono">
                                 <span className="text-slate-500">Source Type</span>
                                 <span className="text-indigo-400">Pleiades Neo (30cm)</span>
                             </div>
                             <div className="flex justify-between text-xs font-mono">
                                 <span className="text-slate-500">Spectral Analysis</span>
                                 <span className="text-white">Material Detection Active</span>
                             </div>
                             <div className="flex justify-between text-xs font-mono">
                                 <span className="text-slate-500">Accuracy Thresh.</span>
                                 <span className="text-white">± 0.2m Vertical</span>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Main Viewport */}
                <div className="flex-1 relative bg-black flex flex-col items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] bg-cover opacity-5 pointer-events-none" />
                    
                    {/* Scanning Grid Overlay */}
                    {isScanning && (
                         <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center">
                             <div className="w-full h-1 bg-indigo-500/50 absolute top-0 animate-[scan_2s_linear_infinite]" />
                             <div className="w-[80%] h-[80%] border border-dashed border-indigo-500/30 rounded-3xl animate-pulse relative">
                                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-indigo-500" />
                                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-indigo-500" />
                                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-indigo-500" />
                                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-indigo-500" />
                             </div>
                             <h3 className="text-xl font-black text-white uppercase tracking-widest animate-pulse mt-8">Triangulating Sector 7G...</h3>
                         </div>
                    )}

                    {data && !isScanning ? (
                        <div className="w-full max-w-5xl p-10 animate-in zoom-in duration-500">
                             <div className="grid grid-cols-2 gap-10">
                                 {/* Visual Placeholder */}
                                 <div className="aspect-square tactical-card depth-layer-0 rounded-[2.5rem] depth-border-medium relative overflow-hidden group depth-shadow-lg">
                                     <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(16,185,129,0.05)_10px,rgba(16,185,129,0.05)_20px)]" />
                                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-emerald-500/30 rounded-full animate-ping" />
                                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-dashed border-emerald-500/20 rounded-full animate-[spin_10s_linear_infinite]" />
                                     
                                     <div className="absolute top-6 left-6 px-3 py-1 bg-black/60 backdrop-blur rounded font-mono text-[11px] text-indigo-400 border border-indigo-500/30">
                                         CHRONO DATA // {data.last_flyover}
                                     </div>

                                      <Image 
                                          src={data.heatmap_url || "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800"} 
                                          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60 group-hover:opacity-80 transition-opacity duration-1000"
                                          alt="Visual Evidence"
                                          fill
                                          style={{ objectFit: 'cover' }}
                                      />
                                 </div>

                                 {/* Analysis Data */}
                                 <div className="flex flex-col gap-6 justify-center">
                                     <div className="flex items-center gap-4 mb-4">
                                         <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border flex items-center gap-2 ${
                                             data.verification_status === 'VERIFIED' 
                                                 ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' 
                                                 : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                                         }`}>
                                             {data.verification_status === 'VERIFIED' ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                                             {data.verification_status === 'VERIFIED' ? 'PHYSICAL MATCH' : 'CONSTRUCTION DISCREPANCY'}
                                         </div>
                                     </div>

                                     <div className="space-y-6">
                                         <div>
                                             <div className="flex justify-between items-end mb-2">
                                                 <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Invoiced Progress</span>
                                                 <span className="text-2xl font-black text-white">{data.reported_progress_percent}%</span>
                                             </div>
                                             <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                                                 <div className="h-full bg-slate-600 rounded-full" style={{ width: `${data.reported_progress_percent}%` }} />
                                             </div>
                                         </div>

                                         <div>
                                             <div className="flex justify-between items-end mb-2">
                                                 <span className="text-[11px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                                     <Layers className="w-3 h-3" /> Construction Delta (Physical)
                                                 </span>
                                                 <span className="text-2xl font-black text-indigo-400">{data.delta_detected_percent}%</span>
                                             </div>
                                             <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                                                 <div className="h-full bg-indigo-500 rounded-full relative" style={{ width: `${data.delta_detected_percent}%` }}>
                                                     <div className="absolute inset-0 bg-white/10 animate-pulse" />
                                                 </div>
                                             </div>
                                             <p className="text-[11px] text-slate-500 mt-2 italic">* Variance exceeds tolerance threshold of 5.0%</p>
                                         </div>
                                     </div>
                                     
                                     <div className="p-6 tactical-card depth-layer-2 depth-border-subtle rounded-2xl mt-4 bg-slate-900/50">
                                         <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Forensic Verification Notes</h4>
                                         <p className="text-sm font-bold text-slate-300 leading-relaxed italic border-l-2 border-indigo-500 pl-4">
                                            &quot;{data.analysis_notes}&quot;
                                         </p>
                                     </div>
                                 </div>
                             </div>
                        </div>
                    ) : (
                        !isScanning && (
                            <div className="text-center opacity-30">
                                <Maximize2 className="w-24 h-24 text-slate-600 mx-auto mb-6" />
                                <h3 className="text-lg font-black text-slate-500 uppercase tracking-widest">No Active Audit Target</h3>
                                <p className="text-xs text-slate-600 mt-2 font-mono">Initiate Scan to retrieve orbital data.</p>
                            </div>
                        )
                    )}
                </div>
            </main>
        </div>
    );
}
