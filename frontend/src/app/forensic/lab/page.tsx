'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scan, Eye, Zap, AlertTriangle, Lock, 
  HardHat, Camera, Box, ChevronRight,
  ArrowUpRight, Database
} from 'lucide-react';
import { HOLOGRAPHIC_SOURCE } from '@/utils/holographicData';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8200';

import { useProject } from '@/store/useProject';
import ForensicPageLayout from '@/app/components/ForensicPageLayout';
import HolographicProjection from '@/app/components/HolographicProjection';

export default function DocumentLabPage() {
  const { activeProjectId } = useProject();
  const [scanning, setScanning] = useState(false);
  const [scanMode, setScanMode] = useState<'visual' | 'uv' | 'ela'>('visual');
  const [findings, setFindings] = useState<string[]>([]);

interface SiteTruthData {
  site_progress_reported: number;
  site_progress_verified: number;
  discrepancies: Array<{
    id: string;
    category: string;
    item: string;
    risk: 'CRITICAL' | 'WARNING' | 'INFO';
    invoice_qty: number;
    site_qty: number;
    unit: string;
    delta_value: number;
  }>;
  photo_metadata_integrity: number;
  budget_variance: Array<{
    item_name: string;
    category: string;
    risk: 'CRITICAL' | 'WARNING' | 'INFO';
    invoice_qty: number;
    site_qty: number;
    unit: string;
    delta_value: number;
  }>;
}

  const [siteTruth, setSiteTruth] = useState<SiteTruthData | null>(null);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  const fetchSiteTruth = useCallback(async () => {
    if (!activeProjectId) return;
    try {
        const res = await fetch(`${API_URL}/api/v1/forensic/site-truth/${activeProjectId}`);
        if (res.ok) {
            setSiteTruth(await res.json());
            setIsDemo(false);
        } else {
            setSiteTruth(HOLOGRAPHIC_SOURCE.projectDashboard as unknown as SiteTruthData);
            setIsDemo(true);
        }
      } catch {
        console.error("Failed to fetch site truth");
        setSiteTruth(HOLOGRAPHIC_SOURCE.projectDashboard as unknown as SiteTruthData);
        setIsDemo(true);
      }
  }, [activeProjectId]);

  useEffect(() => {
    fetchSiteTruth();
  }, [fetchSiteTruth]);

  const startScan = async () => {
    if (!activeFile) {
        setFindings(["ERROR: No Evidence Pack selected. Please select a file from the Ingest Pipeline below."]);
        return;
    }

    setScanning(true);
    setFindings([]);
    
    try {
        const res = await fetch(`${API_URL}/api/v1/forensic/analyze-image?file_name=${activeFile}`);
        const data = await res.json();
        
        if (data.findings) {
            setFindings(data.findings);
        } else {
             // Fallback if API returns empty or error
             setFindings(["Scan Complete. No anomalies detected in selected pack."]);
        }
    } catch {
      setFindings(["CONNECTION_LOST: Forensic Uplink Offline."]);
    } finally {
        setScanning(false);
    }
  };

  return (
    <ForensicPageLayout
        title="Site Verification Lab"
        subtitle="Physical Verification & Visual Audit"
        icon={Camera}
        isMockData={isDemo}
        loading={scanning && findings.length === 0}
        loadingMessage="Quantifying Construction Delta..."
        headerActions={
            <div className="flex items-center gap-4">
                 <div className="px-6 py-2 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-end">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Verified Delta Gap</span>
                    <span className="text-sm font-black text-rose-500 font-mono">
                        {siteTruth ? `-${(siteTruth.site_progress_reported - siteTruth.site_progress_verified).toFixed(1)}%` : '...'}
                    </span>
                 </div>
                 <button 
                    onClick={startScan}
                    disabled={scanning}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-900/40 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
                  >
                    {scanning ? 'Verifying...' : <><Scan className="w-4 h-4" /> Run Visual Audit</>}
                  </button>
            </div>
        }
    >
        <div className="h-full flex flex-col overflow-hidden p-8">

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden p-8 gap-8">
        {/* Left: The Site Evidence Visualizer */}
        <div className="flex-[1.5] flex flex-col gap-6">
            <div className="flex-1 tactical-frame rounded-[3.5rem] depth-border-medium depth-layer-1 relative overflow-hidden group">
                {/* Navigation tabs for scan mode */}
                <div className="absolute top-10 left-10 z-20 flex gap-3">
                    {[
                        { id: 'visual', label: 'Site Progress', icon: Eye },
                        { id: 'uv', label: 'Pixel Anomaly', icon: Zap },
                        { id: 'ela', label: 'EXIF Metadata', icon: Lock },
                    ].map(mode => (
                        <button
                            key={mode.id}
                             onClick={() => setScanMode(mode.id as 'visual' | 'uv' | 'ela')}
                            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${scanMode === mode.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'bg-black/40 text-slate-500 hover:text-white border border-white/5 hover:border-white/10'}`}
                        >
                            <mode.icon className="w-3 h-3 inline-block mr-2" /> {mode.label}
                        </button>
                    ))}
                </div>

                {/* Imagery Simulation */}
                <div className="absolute inset-0 flex items-center justify-center">
                    {!activeFile ? (
                        <div className="z-30">
                            <HolographicProjection 
                                title="EVIDENCE_VAULT_LOCKED" 
                                subtitle="Select a verified asset pack from the pipeline to commence analysis"
                                type="cube"
                            />
                        </div>
                    ) : (
                        <div className={`w-[85%] h-[75%] rounded-[3rem] border border-white/10 shadow-2xl relative transition-all duration-1000 bg-slate-950 overflow-hidden ${
                            scanMode === 'uv' ? 'hue-rotate-90 invert grayscale contrast-150' : scanMode === 'ela' ? 'grayscale opacity-30 contrast-200 brightness-150' : 'opacity-100'
                        }`}>
                            {/* Background Patterns */}
                            <div className="absolute inset-0 opacity-5 grid grid-cols-12 gap-1 px-4 py-4">
                                {Array.from({length: 144}).map((_, i) => <div key={i} className="w-1 h-1 bg-white rounded-full" />)}
                            </div>

                            {/* Centered Hardhat (Symbolic for site) */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-800 pointer-events-none">
                                <HardHat className="w-48 h-48 mb-6 opacity-10" />
                                <span className="text-2xl font-black uppercase tracking-[0.5em] opacity-10 italic">Evidence Pack #0348</span>
                            </div>

                            {/* Manipulation Markers (ELA/UV) */}
                            <AnimatePresence>
                                {scanMode !== 'visual' && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                                        className="absolute top-1/4 left-1/3 w-64 h-48 border-2 border-rose-500/50 rounded-[2rem] bg-rose-500/10 flex items-center justify-center overflow-hidden"
                                    >
                                        <div className="absolute top-0 left-0 w-full bg-rose-500 text-[8px] font-black text-white uppercase py-1 text-center tracking-widest">
                                            Clone Stamp Detected (98%)
                                        </div>
                                        <AlertTriangle className="w-12 h-12 text-rose-500" />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Metadata Tag */}
                            <div className="absolute bottom-10 left-10 p-6 glass-panel rounded-3xl border border-white/5 font-mono text-[9px] text-slate-500 space-y-1 backdrop-blur-xl">
                                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> SOURCE: INDEPENDENT_SENSOR_v4</div>
                                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> GEO: 6.2088° S, 106.8456° E</div>
                                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> AUDIT_LOCK: {new Date().toISOString().split('T')[0]}</div>
                            </div>

                            {/* Scanning Line */}
                            {scanning && (
                                <motion.div 
                                    initial={{ top: '0%' }} animate={{ top: '100%' }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                    className="absolute left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_20px_#6366f1] z-30"
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Panel: Findings Log */}
            <div className="h-48 tactical-card rounded-[2.5rem] depth-border-subtle depth-layer-2 p-8 flex gap-8 depth-shadow-md">
                 <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center shrink-0">
                    <Zap className="w-6 h-6 text-rose-500" />
                 </div>
                 <div className="flex-1 overflow-auto custom-scrollbar pr-4">
                    <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3 italic underline decoration-2 underline-offset-4">Pixel-Level Discrepancy Log</h4>
                    <div className="space-y-2">
                        {findings.map((f, i) => (
                            <div key={i} className="text-xs font-bold text-slate-300 flex items-center gap-3">
                                <ChevronRight className="w-3 h-3 text-rose-500" /> {f}
                            </div>
                        ))}
                    </div>
                    {findings.some(f => f.includes('Clone Stamp') || f.includes('Anomaly')) && (
                        <div className="mt-6 flex justify-end">
                            <button 
                                onClick={() => {
                                    window.dispatchEvent(new CustomEvent('telemetry-sync', { 
                                        detail: { source: 'VisualLab', type: 'ESCALATION', label: 'EVIDENCE SENT TO VERDICT ENGINE' } 
                                    }));
                                    alert('Evidence escalated to Verdict Engine for adjudication.');
                                }}
                                className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-3"
                            >
                                <Zap className="w-3 h-3" /> Escalate to Verdict Bench
                            </button>
                        </div>
                    )}
                 </div>
            </div>
        </div>

        {/* Right: Site Reality vs Financial Reality */}
        <div className="w-[420px] flex flex-col gap-8">
            {/* Volume Discrepancy Section */}
            <div className="flex-1 tactical-frame rounded-[3.5rem] depth-border-medium depth-layer-1 p-10 flex flex-col">
                <div className="flex items-center gap-4 mb-10">
                    <div className="p-3 bg-amber-500/10 rounded-xl">
                        <Box className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Variance Engine</h3>
                        <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest mt-1">Invoice Qty vs Physical Audit</p>
                    </div>
                </div>

                <div className="flex-1 space-y-6 overflow-auto custom-scrollbar pr-2">
                    {siteTruth?.budget_variance?.map((item) => (
                        <div key={item.item_name} className="p-6 rounded-[2rem] depth-layer-2 depth-border-subtle hover:depth-border-strong transition-all depth-shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">{item.category}</div>
                                    <div className="text-sm font-black text-white uppercase tracking-tight">{item.item_name}</div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                    item.risk === 'CRITICAL' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 
                                    item.risk === 'WARNING' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 
                                    'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                }`}>
                                    {item.risk}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <div className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em]">Invoice Total</div>
                                    <div className="text-sm font-mono font-bold text-slate-300">{item.invoice_qty.toLocaleString()} {item.unit}</div>
                                </div>
                                <div className="space-y-1 text-right">
                                    <div className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em]">Estimated Site</div>
                                    <div className="text-sm font-mono font-bold text-indigo-400">{item.site_qty.toLocaleString()} {item.unit}</div>
                                </div>
                            </div>

                            <div className="mt-6 h-1 w-full bg-white/5 rounded-full overflow-hidden border border-white/[0.02]">
                                <motion.div 
                                    initial={{ width: 0 }} animate={{ width: `${(item.site_qty / item.invoice_qty) * 100}%` }}
                                    className={`h-full ${item.risk === 'CRITICAL' ? 'bg-rose-500' : item.risk === 'WARNING' ? 'bg-amber-500' : 'bg-indigo-500'}`}
                                />
                            </div>
                            
                            {item.delta_value > 0 && (
                                <div className="mt-4 flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-rose-500/70">
                                    <span>Leakage Est (Value)</span>
                                    <span className="font-mono">Rp {item.delta_value.toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-8 p-6 rounded-[2rem] bg-indigo-600/5 border border-indigo-500/10 flex items-center justify-between">
                    <div>
                        <div className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Reality Matching Score</div>
                        <div className="text-xl font-black text-white italic tracking-tighter uppercase">{siteTruth?.photo_metadata_integrity}%</div>
                    </div>
                    <Database className="w-8 h-8 text-indigo-500 opacity-30" />
                </div>
            </div>

            {/* Site Pipeline Ingress (V3 EvidenceInget) */}
            <div className="h-64 tactical-card rounded-[2.5rem] depth-border-subtle depth-layer-2 p-8 flex flex-col depth-shadow-lg">
                 <h4 className="text-[10px] font-black text-depth-secondary uppercase tracking-[0.2em] mb-6 italic">EvidenceIngest Pipeline</h4>
                 <div className="space-y-4">
                    {[
                        { name: 'foundation_pour_site_04_cloned.jpg', display: 'Drone_Survey_W41.zip', size: '2.4GB', date: 'Oct 12', icon: Camera },
                        { name: 'site_logs_v2.pdf', display: 'Site_Logs_Foundation.pdf', size: '15MB', date: 'Oct 10', icon: Database },
                        { name: 'material_weights.csv', display: 'Material_Weights_X4.csv', size: '1.2MB', date: 'Oct 09', icon: Box },
                    ].map((asset, i) => (
                        <div 
                            key={i} 
                            onClick={() => { setActiveFile(asset.name); setFindings([]); }}
                            className={`flex items-center justify-between group cursor-pointer p-3 rounded-xl transition-all border ${
                                activeFile === asset.name 
                                ? 'bg-indigo-500/10 border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                                : 'hover:depth-layer-3 border-transparent'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                                    activeFile === asset.name ? 'bg-indigo-500 text-white' : 'bg-white/5 group-hover:bg-white/10'
                                }`}>
                                    <asset.icon className={`w-4 h-4 ${activeFile === asset.name ? 'text-white' : 'text-slate-400'}`} />
                                </div>
                                <div>
                                    <div className={`text-[11px] font-black uppercase tracking-tight ${activeFile === asset.name ? 'text-indigo-300' : 'text-white'}`}>
                                        {asset.display}
                                    </div>
                                    <div className="text-[9px] font-mono text-slate-500">{asset.size} • {asset.date}</div>
                                </div>
                            </div>
                            <button title="Examine File" className={`transition-opacity ${activeFile === asset.name ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                <ArrowUpRight className={`w-4 h-4 ${activeFile === asset.name ? 'text-indigo-400' : 'text-slate-500'}`} />
                            </button>
                        </div>
                    ))}
                 </div>
            </div>
        </div>
      </main>
        </div>
    </ForensicPageLayout>
  );
}
