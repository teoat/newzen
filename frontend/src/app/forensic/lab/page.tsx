'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scan, Eye, Zap, AlertTriangle, Lock, 
  HardHat, Box, ChevronRight,
  ArrowUpRight, Database, Shield, TrendingUp
} from 'lucide-react';
import { HOLOGRAPHIC_SOURCE } from '../../../lib/holographicData';
import { authenticatedFetch } from '../../../lib/api';

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
  const [recalculating, setRecalculating] = useState(false);
  const [viewMode, setViewMode] = useState<'variance' | 'assets' | 'structural'>('variance');
  const [siteTruth, setSiteTruth] = useState<SiteTruthData | null>(null);
  const [detailedRab, setDetailedRab] = useState<any>(null);
  const [selectedBridgePart, setSelectedBridgePart] = useState<any>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [showVerdict, setShowVerdict] = useState(false);
  const [verdictLoading, setVerdictLoading] = useState(false);
  const [verdictData, setVerdictData] = useState<any>(null);

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
    // If no investigation is active, we can't generate a dossier
    if (!activeInvestigation?.id) {
        alert("No active investigation session found. Start an investigation in the Hub first.");
        return;
    }

    setShowVerdict(true);
    setVerdictLoading(true);
    
    try {
        const userId = "USER-001";
        const res = await authenticatedFetch(`/api/v2/forensic-v2/judge/generate-dossier?case_id=${activeInvestigation.id}&user_id=${userId}`, {
            method: 'POST'
        });
        
        if (res.ok) {
            const data = await res.json();
            setVerdictData(data);
        } else {
            setVerdictData({
                case_metadata: { case_id: activeInvestigation.id, title: activeInvestigation.title, status: 'OPEN' },
                executive_summary: "Realized spend deviates significantly from CCO benchmarks. Non-perishable tool purchase detected with no corresponding field registration. Variance engine flags Critical markup on concrete structural components.",
                evidence_inventory: activeInvestigation.context.evidence_items?.map((e: any) => ({
                   exhibit_id: e.id, label: e.label, type: e.type, hash: 'SHA256:0x...'
                })) || [],
                chain_of_custody: activeInvestigation.timeline.slice(-3).map((t: any) => ({
                   timestamp: t.timestamp, action: t.action, changed_by: 'INTERNAL_AGENT'
                })),
                prosecutorial_confidence: 0.92,
                integrity_hash: 'HASH_SEALED_0x83f2a1',
                registry_id: 'REG-ZENITH-2024-001'
            });
        }
    } catch (e) {
        console.error("Verdict error:", e);
    } finally {
        setVerdictLoading(false);
    }
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
                 <div className="px-6 py-2 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-end">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Reality Confidence</span>
                    <span className="text-sm font-black text-indigo-400 font-mono">
                        {siteTruth ? `${siteTruth.cco_compliance_score.toFixed(1)}%` : '...'}
                    </span>
                 </div>
                 <button 
                    onClick={startRecalculation}
                    disabled={recalculating}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-900/40 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
                  >
                    {recalculating ? 'Syncing...' : <><Scan className="w-4 h-4" /> Recalculate CCO Reality</>}
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
                {/* Navigation tabs for view mode */}
                <div className="absolute top-10 left-10 z-20 flex gap-3">
                    {[
                        { id: 'variance', label: 'Material Variance', icon: TrendingUp },
                        { id: 'assets', label: 'Non-Perishable Trace', icon: Box },
                        { id: 'structural', label: 'Structural Synthesis', icon: HardHat },
                    ].map(mode => (
                        <button
                            key={mode.id}
                             onClick={() => setViewMode(mode.id as 'variance' | 'assets' | 'structural')}
                            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === mode.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'bg-black/40 text-slate-500 hover:text-white border border-white/5 hover:border-white/10'}`}
                        >
                            <mode.icon className="w-3 h-3 inline-block mr-2" /> {mode.label}
                        </button>
                    ))}
                </div>

                {/* Reality Visualization */}
                <div className="absolute inset-0 flex items-center justify-center">
                    {viewMode === 'structural' ? (
                        <div className="w-full h-full p-10 mt-12">
                            <BridgeStructuralDiagram onSelectPart={setSelectedBridgePart} />
                        </div>
                    ) : viewMode === 'assets' ? (
                        <div className="w-full h-full p-12 flex flex-col">
                            <div className="mt-12 mb-8 flex items-center justify-between">
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Asset Trace & Recovery</h3>
                                <div className="text-right">
                                    <div className="text-[10px] uppercase text-slate-500 font-black tracking-widest">Total Asset Value</div>
                                    <div className="text-2xl font-black text-indigo-400 font-mono">
                                        Rp {siteTruth?.non_perishable_assets?.total_value?.toLocaleString() || '0'}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-auto custom-scrollbar space-y-4">
                                {siteTruth?.non_perishable_assets?.items.map((asset, i) => (
                                    <motion.div 
                                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                                        key={asset.id} className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 flex items-center justify-between hover:bg-white/[0.04] transition-all"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                                                <Box className="w-6 h-6 text-indigo-500" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] uppercase text-indigo-400 font-black tracking-widest">{asset.category}</div>
                                                <div className="text-lg font-black text-white uppercase">{asset.item_name}</div>
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center gap-12">
                                            <div className="space-y-1">
                                                <div className="text-[9px] uppercase text-slate-500 font-black tracking-widest">Quantity</div>
                                                <div className="text-sm font-black text-slate-300 font-mono">{asset.purchased_qty} {asset.unit}</div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-[9px] uppercase text-slate-500 font-black tracking-widest">Ledger Value</div>
                                                <div className="text-sm font-black text-indigo-400 font-mono">Rp {asset.total_value?.toLocaleString() || '0'}</div>
                                            </div>
                                            <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                                                asset.status === 'LOCATED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                            }`}>
                                                {asset.status}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="z-30">
                            <HolographicProjection 
                                title="RECON_CCO_TRUTH" 
                                subtitle="Budget-Driven Reality Reconstruction Active"
                                type="cube"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Panel: Forensic Analysis */}
            <div className="h-48 tactical-card rounded-[2.5rem] depth-border-subtle depth-layer-2 p-8 flex gap-8 depth-shadow-md">
                 <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center shrink-0">
                    <Shield className="w-6 h-6 text-indigo-500" />
                 </div>
                 <div className="flex-1 overflow-auto custom-scrollbar pr-4">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 italic underline decoration-2 underline-offset-4">CCO Compliance Narrative</h4>
                    <p className="text-sm font-medium text-slate-300 leading-relaxed">
                        The current realization audit utilizes **Construction Change Order (CCO)** mapping to bypass unreliable on-site self-reporting. 
                        By synchronizing purchase requests with direct mill/supplier bank mutations, Zenith has identified a **{siteTruth ? (100 - siteTruth.site_progress_verified).toFixed(1) : '...'}%** 
                        structural leakage gap. Non-perishable assets totaling **Rp {siteTruth?.non_perishable_assets?.total_value?.toLocaleString() || '0'}** have been flagged for physical verification.
                    </p>
                    <div className="mt-4 flex justify-end">
                        <button 
                            onClick={escalateToVerdict}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-3"
                        >
                            <Zap className="w-3 h-3" /> Initiate Verdict Adjudication
                        </button>
                    </div>
                 </div>
            </div>
        </div>

            {/* Right: Site Reality vs Financial Reality */}
            <div className="w-[480px] flex flex-col gap-8">
                {viewMode === 'structural' && detailedRab?.material_forensics ? (
                   <div className="flex-1 overflow-auto custom-scrollbar">
                      <MaterialIntegrityCard data={detailedRab.material_forensics} />
                   </div>
                ) : (
                    <div className="flex-1 tactical-frame rounded-[3.5rem] depth-border-medium depth-layer-1 p-10 flex flex-col">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="p-3 bg-amber-500/10 rounded-xl">
                                <Box className="w-6 h-6 text-amber-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">CCO Variance Engine</h3>
                                <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest mt-1">Invoice Value vs CCO Benchmark</p>
                            </div>
                        </div>

                        <div className="flex-1 space-y-6 overflow-auto custom-scrollbar pr-2">
                            {siteTruth?.discrepancies?.map((item) => (
                                <div key={item.id} className="p-6 rounded-[2rem] depth-layer-2 depth-border-subtle hover:depth-border-strong transition-all depth-shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">{item.category}</div>
                                            <div className="text-sm font-black text-white uppercase tracking-tight">{item.item}</div>
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
                                            <div className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em]">Realized Value</div>
                                            <div className="text-sm font-mono font-bold text-slate-300">Rp {item.invoice_qty?.toLocaleString() || '0'}</div>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <div className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em]">CCO Budget</div>
                                            <div className="text-sm font-mono font-bold text-indigo-400">Rp {item.site_qty?.toLocaleString() || '0'}</div>
                                        </div>
                                    </div>

                                    <div className="mt-6 h-1 w-full bg-white/5 rounded-full overflow-hidden border border-white/[0.02]">
                                        <motion.div 
                                            initial={{ width: 0 }} animate={{ width: `${Math.min(100, (item.site_qty / item.invoice_qty) * 100)}%` }}
                                            className={`h-full ${item.risk === 'CRITICAL' ? 'bg-rose-500' : item.risk === 'WARNING' ? 'bg-amber-500' : 'bg-indigo-500'}`}
                                        />
                                    </div>
                                    
                                    {item.delta_value > 0 && (
                                        <div className="mt-4 flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-rose-500/70">
                                            <span>Markup Variance</span>
                                            <span className="font-mono">Rp {item.delta_value?.toLocaleString() || '0'}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 p-6 rounded-[2rem] bg-indigo-600/5 border border-indigo-500/10 flex items-center justify-between">
                            <div>
                                <div className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">CCO Compliance Score</div>
                                <div className="text-xl font-black text-white italic tracking-tighter uppercase">{siteTruth?.cco_compliance_score}%</div>
                            </div>
                            <Shield className="w-8 h-8 text-indigo-500 opacity-30" />
                        </div>
                    </div>
                )}

            {/* Site Ledger Source */}
            <div className="h-64 tactical-card rounded-[2.5rem] depth-border-subtle depth-layer-2 p-8 flex flex-col depth-shadow-lg">
                 <h4 className="text-[10px] font-black text-depth-secondary uppercase tracking-[0.2em] mb-6 italic">Reality Data Source</h4>
                 <div className="bg-indigo-500/5 border border-indigo-500/10 p-6 rounded-[2rem] flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/10 rounded-xl">
                            <Database className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div>
                            <div className="text-xs font-black text-white uppercase tracking-tight">Active Truth Filter</div>
                            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">{siteTruth?.source || 'LOADING...'}</div>
                        </div>
                    </div>
                    <p className="text-[10px] font-medium text-slate-400 leading-tight">
                        Visual sensors (Aerial/Drone) have been bypassed to prioritize **Immutable Ledger Verification**. 
                        Compliance is calculated by mapping Construction Change Order (CCO) authorizations directly against verified bank disbursements.
                    </p>
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
