'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scan, Zap, AlertTriangle, Shield, TrendingUp, Box, HardHat, ArrowUpRight, Database, CheckCircle
} from 'lucide-react';
import { authenticatedFetch } from '../../../lib/api';
import PageFeatureCard from '../../../app/components/PageFeatureCard';

import { useProject } from '../../../store/useProject';
import { useInvestigation } from '../../../store/useInvestigation';
import ForensicPageLayout from '../../../app/components/ForensicPageLayout';
import HolographicProjection from '../../../app/components/HolographicProjection';
import BridgeStructuralDiagram from '../../../app/components/BridgeStructuralDiagram';
import MaterialIntegrityCard from '../../../app/components/MaterialIntegrityCard';
import VerdictModal from '../../../app/components/VerdictModal';

interface SiteTruthData {
  cco_compliance_score: number;
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
  non_perishable_assets?: {
    total_value: number;
    items: Array<{
      id: string;
      item_name: string;
      category: string;
      purchased_qty: number;
      unit: string;
      total_value: number;
      status: string;
    }>;
    count: number;
  };
  source: string;
}

export default function DocumentLabPage() {
  const { activeProjectId } = useProject();
  const { activeInvestigation } = useInvestigation();
  const router = useRouter();
  
  const [recalculating, setRecalculating] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [viewMode, setViewMode] = useState<'variance' | 'assets' | 'structural'>('variance');
  const [siteTruth, setSiteTruth] = useState<SiteTruthData | null>(null);
  const [detailedRab, setDetailedRab] = useState<any>(null);
  const [selectedBridgePart, setSelectedBridgePart] = useState<any>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [showVerdict, setShowVerdict] = useState(false);
  const [verdictLoading, setVerdictLoading] = useState(false);
  const [verdictData, setVerdictData] = useState<any>(null);
  const [assetSearch, setAssetSearch] = useState('');

  const hasCriticalRisk = siteTruth?.discrepancies.some(d => d.risk === 'CRITICAL');

  const fetchSiteTruth = useCallback(async () => {
    if (!activeProjectId) return;
    try {
        const res = await authenticatedFetch(`/api/v2/forensic-v2/rab/site-truth/${activeProjectId}`);
        if (res.ok) {
            setSiteTruth(await res.json());
            setIsDemo(false);
        } else {
            setSiteTruth(null);
            setIsDemo(true);
        }
      } catch {
        setSiteTruth(null);
        setIsDemo(true);
      }
  }, [activeProjectId]);

  const fetchDetailedRab = useCallback(async () => {
    if (!activeProjectId) return;
    try {
      const res = await authenticatedFetch(`/api/v2/forensic-v2/rab/variance/${activeProjectId}`);
      if (res.ok) {
        setDetailedRab(await res.json());
      }
    } catch (e) {
      console.error("Detailed RAB fetch failed:", e);
    }
  }, [activeProjectId]);

  useEffect(() => {
    fetchSiteTruth();
    fetchDetailedRab();
  }, [fetchSiteTruth, fetchDetailedRab]);

  const startRecalculation = async () => {
    setRecalculating(true);
    try {
        await authenticatedFetch(`/api/v2/forensic-v2/rab/recalculate/${activeProjectId}`, { method: 'POST' });
        await Promise.all([fetchSiteTruth(), fetchDetailedRab()]);
    } catch (e) {
        console.error("Recalculation error:", e);
    } finally {
        setRecalculating(false);
    }
  };

  const escalateToVerdict = async () => {
    setEscalating(true);
    // SYNERGY: Pass context to the report engine
    const query = new URLSearchParams({
        source: 'lab_escalation',
        score: siteTruth?.cco_compliance_score.toString() || '0',
        risk_level: siteTruth?.discrepancies.some(d => d.risk === 'CRITICAL') ? 'CRITICAL' : 'NORMAL'
    }).toString();
    
    // Simulate deliberate transition delay for cognitive weight
    await new Promise(r => setTimeout(r, 800));
    router.push(`/forensic/report?${query}`);
  };

  return (
    <>
    <ForensicPageLayout
        title="Asset Verification Lab"
        subtitle="Reality vs. CCO Logic Synchronization"
        icon={Shield}
        isMockData={isDemo}
        loading={recalculating}
        loadingMessage="Quantifying CCO Delta..."
        headerActions={
            <div className="flex items-center gap-4">
                 {isDemo && (
                     <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 animate-pulse">
                         <AlertTriangle className="w-4 h-4 text-amber-500" />
                         <span className="text-[11px] font-black text-amber-500 uppercase tracking-widest">Simulation Protocol</span>
                     </div>
                 )}
                 <div className="px-6 py-2 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-end">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Reality Confidence</span>
                    <span className="text-sm font-black text-indigo-400 font-mono">
                        {siteTruth ? `${siteTruth.cco_compliance_score.toFixed(1)}%` : '...'}
                    </span>
                 </div>
                 <button 
                    onClick={startRecalculation}
                    disabled={recalculating}
                    className={`${
                        hasCriticalRisk ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/40' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/40'
                    } text-white px-8 py-3 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3 relative overflow-hidden group`}
                  >
                    <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    {recalculating ? 'Syncing...' : <><Scan className="w-4 h-4" /> {hasCriticalRisk ? 'Rescan Critical Delta' : 'Recalculate CCO Reality'}</>}
                  </button>
            </div>
        }
    >
        <div className="h-full flex flex-col overflow-hidden p-8 space-y-8 h-full custom-scrollbar">
            {/* Operational Analysis Card */}
            <div className="max-w-6xl w-full">
                <PageFeatureCard 
                    phase={4}
                    title="Asset Verification Lab"
                    description="The synthesis point between Engineering and Accounting. This module cross-references CCO (Contractual Compliance Order) specifications with physical site truth to identify material variance."
                    features={[
                        "Real-time material integrity vs. billed valuation",
                        "Structural integrity risk propagation modeling",
                        "Automated 'Ghost Construction' flag detection",
                        "High-fidelity holographic asset reconstruction"
                    ]}
                    howItWorks="The Lab synchronizes theoretical CCO (Contractual Compliance Order) data with multispectral site reality. It uses material variance calculation and volumetric analysis to identify where physical work deviates from billed amounts, effectively quantifying 'Ghost Construction' in real-time."
                />
            </div>
      <main className="flex-1 flex overflow-hidden p-0 gap-8">
        {/* LEFT PANE: VISUALIZERS (1.5) */}
        <div className="flex-[1.5] flex flex-col gap-6">
            {/* FIXED TOOLBAR AREA */}
            <div className="h-20 flex items-center justify-between px-10 bg-slate-900/50 border border-white/5 rounded-[2rem]">
                <div className="flex gap-3">
                    {[
                        { id: 'variance', label: 'Material Variance', icon: TrendingUp },
                        { id: 'assets', label: 'Non-Perishable Trace', icon: Box },
                        { id: 'structural', label: 'Structural Synthesis', icon: HardHat },
                    ].map(mode => (
                        <button
                            key={mode.id}
                             onClick={() => setViewMode(mode.id as 'variance' | 'assets' | 'structural')}
                            className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
                                viewMode === mode.id 
                                    ? 'bg-indigo-600 text-white shadow-indigo-900/40 translate-y-[-1px]' 
                                    : 'bg-black/20 text-slate-500 hover:text-white border border-white/5 hover:border-white/10'
                            }`}
                        >
                            <mode.icon className="w-3 h-3 inline-block mr-2" /> {mode.label}
                        </button>
                    ))}
                </div>
                {viewMode === 'assets' && (
                    <div className="w-64 relative group">
                        <input 
                            type="text"
                            placeholder="Search Assets..."
                            value={assetSearch}
                            onChange={(e) => setAssetSearch(e.target.value)}
                            className="w-full bg-black/40 border border-white/5 rounded-xl px-10 py-2.5 text-[11px] text-white focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-600 font-mono"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors">
                            <Database className="w-3.5 h-3.5" />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 tactical-frame rounded-[3.5rem] depth-border-medium depth-layer-1 relative overflow-hidden group">
                {/* TOOLBAR REMOVED FROM HERE */}

                {/* CONTENT AREA */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        {viewMode === 'structural' && (
                            <motion.div 
                                key="structural"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                className="w-full h-full p-10 mt-12"
                            >
                                <BridgeStructuralDiagram onSelectPart={setSelectedBridgePart} />
                            </motion.div>
                        )}
                        
                        {viewMode === 'assets' && (
                            <motion.div 
                                key="assets"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="w-full h-full p-12 flex flex-col"
                            >
                                <div className="mt-12 mb-8 flex items-center justify-between">
                                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Asset Trace & Recovery</h3>
                                    <div className="text-right">
                                        <div className="text-[11px] uppercase text-slate-500 font-black tracking-widest">Total Asset Value</div>
                                        <div className="text-2xl font-black text-indigo-400 font-mono">
                                            Rp {siteTruth?.non_perishable_assets?.total_value?.toLocaleString() || '0'}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex-1 overflow-auto custom-scrollbar space-y-4 pr-2">
                                    {(siteTruth?.non_perishable_assets?.items || [])
                                        .filter(item => item.item_name.toLowerCase().includes(assetSearch.toLowerCase()))
                                        .map((asset, i) => (
                                            <motion.div 
                                                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                                key={asset.id} className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 flex items-center justify-between hover:bg-white/[0.04] transition-all group/item"
                                            >
                                                <div className="flex items-center gap-6">
                                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                                                        <Box className="w-6 h-6 text-indigo-500" />
                                                    </div>
                                                    <div>
                                                        <div className="text-[11px] uppercase text-indigo-400 font-black tracking-widest">{asset.category}</div>
                                                        <div className="text-lg font-black text-white uppercase">{asset.item_name}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right flex items-center gap-12">
                                                    <div className="space-y-1">
                                                        <div className="text-[11px] uppercase text-slate-500 font-black tracking-widest">Quantity</div>
                                                        <div className="text-sm font-black text-slate-300 font-mono">{asset.purchased_qty} {asset.unit}</div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="text-[11px] uppercase text-slate-500 font-black tracking-widest">Ledger Value</div>
                                                        <div className="text-sm font-black text-indigo-400 font-mono">Rp {asset.total_value?.toLocaleString() || '0'}</div>
                                                    </div>
                                                    <div className={`px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest ${
                                                        asset.status === 'LOCATED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                    }`}>
                                                        {asset.status}
                                                    </div>
                                                    <button 
                                                        onClick={() => router.push(`/forensic/map?filter=${encodeURIComponent(asset.item_name)}`)}
                                                        className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl border border-indigo-500/20 transition-all text-indigo-400 opacity-0 group-hover/item:opacity-100 translate-x-4 group-hover/item:translate-x-0"
                                                        title="Locate Asset on Site Map"
                                                    >
                                                        <ArrowUpRight className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                </div>
                            </motion.div>
                        )}

                        {viewMode === 'variance' && (
                            <motion.div 
                                key="variance"
                                initial={{ opacity: 0, scale: 1.1 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="w-full h-full flex items-center justify-center p-10 z-30"
                            >
                                <HolographicProjection 
                                    title="RECON_CCO_TRUTH" 
                                    subtitle="Budget-Driven Reality Reconstruction Active"
                                    type="cube"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* SYNERGY NARRATIVE CARD */}
            <div className="h-48 tactical-card rounded-[2.5rem] depth-border-subtle depth-layer-2 p-8 flex gap-8 depth-shadow-md">
                 <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center shrink-0">
                    <Shield className="w-6 h-6 text-indigo-500" />
                 </div>
                 <div className="flex-1 overflow-auto custom-scrollbar pr-4">
                    <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-3 italic underline decoration-2 underline-offset-4">CCO Compliance Narrative</h4>
                    <p className="text-sm font-medium text-slate-300 leading-relaxed">
                        structural leakage gap identified. Non-perishable assets totaling **Rp {siteTruth?.non_perishable_assets?.total_value?.toLocaleString() || '0'}** have been flagged for physical verification.
                    </p>
                    <div className="mt-4 flex justify-end">
                        <button 
                            onClick={escalateToVerdict}
                            disabled={escalating}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50"
                        >
                            {escalating ? 'Initializaing Logic Core...' : <><Zap className="w-3 h-3" /> Initiate Verdict Adjudication</>}
                        </button>
                    </div>
                 </div>
            </div>
        </div>

        {/* RIGHT PANE: DATA (1) */}
        <div className="w-[480px] flex flex-col gap-8">
            {viewMode === 'structural' && detailedRab?.material_forensics ? (
               <div className="flex-1 overflow-auto custom-scrollbar">
                  <MaterialIntegrityCard data={detailedRab.material_forensics} />
               </div>
            ) : (
                <div className="flex-1 tactical-frame rounded-[3.5rem] depth-border-medium depth-layer-1 p-10 flex flex-col">
                    <div className="flex-1 space-y-6 overflow-auto custom-scrollbar pr-2">
                        {(!siteTruth?.discrepancies || siteTruth.discrepancies.length === 0) ? (
                             <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
                                 <CheckCircle className="w-12 h-12 text-emerald-500 mb-4" />
                                 <h4 className="text-sm font-black text-white uppercase tracking-widest">Zero Variance Detected</h4>
                                 <p className="text-[11px] text-slate-400 mt-2 font-mono">Ledger and Site Reality are perfectly aligned.</p>
                             </div>
                        ) : (
                            siteTruth?.discrepancies?.map((item, i) => (
                                <motion.div 
                                    key={item.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="p-6 rounded-[2rem] depth-layer-2 depth-border-subtle hover:depth-border-strong transition-all depth-shadow-sm group cursor-pointer"
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="text-[11px] font-black text-slate-600 uppercase tracking-widest mb-1">{item.category}</div>
                                            <div className="text-sm font-black text-white uppercase tracking-tight">{item.item}</div>
                                        </div>
                                    </div>
                                    <div className="mt-6 h-1 w-full bg-white/5 rounded-full overflow-hidden border border-white/[0.02]">
                                        <motion.div 
                                            initial={{ width: 0 }} animate={{ width: `${Math.min(100, (item.site_qty / (item.invoice_qty || 1)) * 100)}%` }}
                                            transition={{ duration: 1, ease: 'easeOut' }}
                                            className={`h-full ${item.risk === 'CRITICAL' ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]' : 'bg-indigo-500'}`}
                                        />
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            )}

            <div className="h-64 tactical-card rounded-[2.5rem] depth-border-subtle depth-layer-2 p-8 flex flex-col depth-shadow-lg">
                 <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 italic">Reality Data Source</h4>
                 <div className="bg-indigo-500/5 border border-indigo-500/10 p-6 rounded-[2rem] flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/10 rounded-xl">
                            <Database className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div>
                            <div className="text-xs font-black text-white uppercase tracking-tight">Active Truth Filter</div>
                            <div className="text-[11px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">{siteTruth?.source || 'LOADING...'}</div>
                        </div>
                    </div>
                 </div>
            </div>
        </div>
      </main>
        </div>
    </ForensicPageLayout>
    
    <VerdictModal 
        isOpen={showVerdict}
        onClose={() => setShowVerdict(false)}
        loading={verdictLoading}
        data={verdictData}
    />
    </>
  );
}
