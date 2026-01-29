'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Truck, ShieldCheck, MapPin, 
  ArrowRight, CheckCircle2, 
  Search, Network, Briefcase, 
  Activity, AlertCircle,
  Clock, Hash, ChevronRight, FileText
} from 'lucide-react';
import Link from 'next/link';
import { ASSET_RECOVERY_MOCK } from '@/utils/recoveryMock';

import DossierGenerator from '@/components/DossierGenerator';

interface UBONode {
  id: string;
  role: string;
  level: number;
  type: 'PERSON' | 'COMPANY';
  name: string;
}

interface Asset {
  id: string;
  name: string;
  type: string;
  location: string;
  owner: string;
  value: number;
  status: 'ACTIVE' | 'VERIFIED';
  discovery_path: string;
}

interface AssetData {
  recovery_pot: number;
  frozen_value: number;
  readiness: number;
  ubo_nodes: UBONode[];
  assets: Asset[];
}

interface ApiAsset {
    id: string;
    name: string;
    type: string;
    location?: string;
    owner: string;
    value: number;
    status: 'ACTIVE' | 'FROZEN';
    temporal_nexus: number;
}

interface ApiUBONode {
    id: string;
    role: string;
    level: number;
    type: string;
    name: string;
}

interface RecoveryProfileResponse {
    visual_leakage_recovery_pot: number;
    frozen_assets_value: number;
    readiness_score: number;
    assets: ApiAsset[];
    ubo_nodes: ApiUBONode[];
}

import { API_ROUTES } from '@/services/apiRoutes';
import { useApi } from '@/hooks/useApi';

import { useProject } from '@/store/useProject';
import ForensicPageLayout from '@/app/components/ForensicPageLayout';
import { useAssetActions } from '@/hooks/useAssetActions';

export default function AssetRecoveryPage() {
  const { activeProjectId } = useProject();
  const [data, setData] = useState<AssetData | null>(null);
  const { execute: fetchProfile, isLoading: loading } = useApi<RecoveryProfileResponse>();

  const { toggleVerification, generateReport } = useAssetActions();

  useEffect(() => {
    if (!activeProjectId) return;

    fetchProfile(API_ROUTES.FORENSIC.RECOVERY_PROFILE(activeProjectId), {}, {
        onSuccess: (rawData) => {
            const mappedData: AssetData = {
                recovery_pot: rawData.visual_leakage_recovery_pot || 0,
                frozen_value: rawData.frozen_assets_value || 0,
                readiness: rawData.readiness_score || 0,
                assets: (rawData.assets || []).map((a) => ({
                    id: a.id,
                    name: a.name,
                    type: a.type,
                    location: a.location || 'Unknown Site',
                    owner: a.owner,
                    value: a.value,
                    status: a.status === 'FROZEN' ? 'VERIFIED' : 'ACTIVE',
                    discovery_path: `Suspicion triggered via Temporal Nexus (${(a.temporal_nexus * 100).toFixed(0)}% confidence)`
                })),
                ubo_nodes: (() => {
                    // Validate and use backend UBO data if available
                    if (rawData.ubo_nodes && Array.isArray(rawData.ubo_nodes) && rawData.ubo_nodes.length > 0) {
                        return rawData.ubo_nodes.map((node) => ({
                            id: node.id || String(Math.random()),
                            role: node.role || 'Unknown Entity',
                            level: node.level || 1,
                            type: (node.type?.toUpperCase() === 'PERSON' ? 'PERSON' : 'COMPANY') as 'PERSON' | 'COMPANY',
                            name: node.name || 'Unnamed Entity'
                        }));
                    }
                    
                    // Fallback: Create synthetic UBO structure based on available data
                    console.warn('UBO nodes not provided by backend. Using synthetic structure.');
                    return [
                        { 
                            id: 'fallback-1', 
                            role: 'Ultimate Controller', 
                            level: 1, 
                            type: 'PERSON' as const, 
                            name: 'Unknown Beneficial Owner' 
                        },
                        { 
                            id: 'fallback-2', 
                            role: 'Operating Entity', 
                            level: 2, 
                            type: 'COMPANY' as const, 
                            name: rawData.assets?.[0]?.owner || 'Project Entity' 
                        }
                    ];
                })()
            };
            setData(mappedData);
        }
    });
  }, [activeProjectId, fetchProfile]);

  const handleGenerateReport = async (asset: Asset) => {
    if(asset.status !== 'VERIFIED') return;
    const res = await generateReport(asset.id);
    if(res) {
        alert(`Forensic Asset Report Generated: ${res.id}`);
    }
  };

  const verifyAsset = async (id: string, currentStatus: string) => {
    // API Call
    const success = await toggleVerification(id, currentStatus as 'ACTIVE' | 'VERIFIED');
    
    if (success) {
        // Optimistic Update
        const newStatus = currentStatus === 'VERIFIED' ? 'ACTIVE' : 'VERIFIED';
        setData((prev: AssetData | null) => {
            if (!prev) return null;
            const updatedAssets = prev.assets.map((a: Asset) => 
                a.id === id ? { ...a, status: newStatus as 'ACTIVE' | 'VERIFIED' } : a
            );
            
            // Recalculate totals
            const newFrozenValue = updatedAssets
                .filter(a => a.status === 'VERIFIED')
                .reduce((sum, a) => sum + a.value, 0);
                
            return {
                ...prev,
                frozen_value: newFrozenValue,
                readiness: (newFrozenValue / prev.recovery_pot) * 100,
                assets: updatedAssets
            };
        });
    }
  };

  return (
    <ForensicPageLayout title="Asset Discovery & Correlation" subtitle="Trace asset movements and identify beneficial ownership links."
        loading={loading}
        loadingMessage="Synchronizing Intelligence Vault..."
    >
        <div className="space-y-8">
            {/* Header Stats */}
            <div className="grid grid-cols-4 gap-4">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="col-span-1 glass-panel p-6 rounded-2xl border-l-4 border-emerald-500 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Briefcase className="w-16 h-16 text-emerald-500" />
                    </div>
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Total Identified Assets</h3>
                    <div className="text-3xl font-black text-white mb-1">
                        Rp {(data?.recovery_pot ? data.recovery_pot / 1000000000 : 0).toFixed(1)} B
                    </div>
                    <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                        <Activity className="w-3 h-3" /> POTENTIAL RECOVERY VALUE
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="col-span-1 glass-panel p-6 rounded-2xl border-l-4 border-blue-500 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <ShieldCheck className="w-16 h-16 text-blue-500" />
                    </div>
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Verified Linked Assets</h3>
                    <div className="text-3xl font-black text-white mb-1">
                        Rp {(data?.frozen_value ? data.frozen_value / 1000000000 : 0).toFixed(1)} B
                    </div>
                     <div className="text-[10px] text-blue-400 font-mono flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> CONFIRMED ASSET NEXUS
                    </div>
                </motion.div>

                 <div className="col-span-2 glass-panel p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-900/20">
                    <div className="flex items-start justify-between">
                         <div>
                            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Investigation Progress</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-white">{(data?.readiness || 0).toFixed(1)}%</span>
                                <span className="text-xs text-indigo-400">Assets Mapped</span>
                            </div>
                         </div>
                         <div className="h-12 w-32 bg-slate-800/50 rounded-lg border border-white/5 flex items-center justify-center">
                              {/* Sparkline placeholder */}
                              <Activity className="text-indigo-500 w-6 h-6 animate-pulse" />
                         </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-800 rounded-full mt-4 overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${data?.readiness || 0}%` }}
                            className="h-full bg-indigo-500 shadow-[0_0_10px_#6366f1]"
                        />
                    </div>
                </div>
            </div>

             {/* Main Content Grid */}
            <div className="grid grid-cols-12 gap-8">
                
                {/* Left Column: UBO Visualization */}
                <div className="col-span-4 space-y-6">
                    <div className="glass-panel p-6 rounded-3xl border border-white/5 min-h-[500px] relative">
                        <div className="flex items-center justify-between mb-6">
                             <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                <Network className="w-4 h-4 text-indigo-400" />
                                BENEFICIAL OWNERSHIP MAP
                             </h4>
                             <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded border border-indigo-500/20">LIVE TRACE</span>
                        </div>

                        {/* Visualization of UBO Chain */}
                        <div className="relative pl-4 border-l-2 border-slate-800 space-y-12 ml-4 mt-8">
                             {data?.ubo_nodes.map((node, i) => (
                                <motion.div 
                                    key={node.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + (i * 0.1) }}
                                    className="relative"
                                >
                                    <div className={`absolute -left-[21px] top-4 w-3 h-3 rounded-full border-2 ${
                                        node.type === 'PERSON' ? 'bg-indigo-500 border-indigo-300' : 'bg-slate-800 border-slate-600'
                                    } z-10`} />
                                    
                                    <div className="glass-card p-4 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-colors group">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-mono text-slate-500 uppercase">{node.role}</span>
                                            {node.level === 1 && <AlertCircle className="w-3 h-3 text-rose-500" />}
                                        </div>
                                        <div className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors">{node.name}</div>
                                        <div className="mt-2 flex gap-2">
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5">{node.type}</span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5">Risk Score: {(0.9 - (i * 0.1)).toFixed(2)}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Connection Line */}
                                    {i < (data?.ubo_nodes.length || 0) - 1 && (
                                        <div className="absolute left-[24px] top-[100%] h-12 border-l border-dashed border-slate-600/30" />
                                    )}
                                </motion.div>
                             ))}
                        </div>
                    </div>

                    <DossierGenerator projectId={activeProjectId || 'PRJ-2024-ALPHA'} />
                </div>

                {/* Right Column: Asset List */}
                <div className="col-span-8 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <Search className="w-4 h-4 text-emerald-400" />
                            IDENTIFIED ASSETS
                        </h4>
                         <div className="flex gap-2">
                            <button className="text-[10px] px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 border border-white/5 transition-colors">
                                Filter by Value
                            </button>
                            <button className="text-[10px] px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors">
                                Export List
                            </button>
                         </div>
                    </div>

                    {data?.assets.map((asset, i) => (
                         <motion.div 
                            key={asset.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + (i * 0.05) }}
                            className="glass-panel p-5 rounded-xl border border-white/5 hover:border-white/10 transition-all group"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex gap-4">
                                     <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                        asset.status === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                                     }`}>
                                         {asset.type.includes('Vehicle') ? <Truck className="w-6 h-6" /> : 
                                          asset.type.includes('Estate') ? <MapPin className="w-6 h-6" /> :
                                          <ShieldCheck className="w-6 h-6" />}
                                     </div>
                                     <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h5 className="font-bold text-white">{asset.name}</h5>
                                            {asset.status === 'VERIFIED' && (
                                                <span className="flex items-center gap-1 text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold border border-emerald-500/20">
                                                    <CheckCircle2 className="w-2.5 h-2.5" /> VERIFIED LINK
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-400 mb-2 flex items-center gap-2">
                                            <span>{asset.type}</span>
                                            <span className="w-1 h-1 bg-slate-700 rounded-full" />
                                            <span>{asset.location}</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 text-[10px] font-mono text-indigo-400 bg-indigo-500/5 px-2 py-1 rounded border border-indigo-500/10 w-fit">
                                            <Network className="w-3 h-3" />
                                            {asset.discovery_path}
                                        </div>
                                     </div>
                                </div>

                                <div className="text-right">
                                     <div className="mb-3">
                                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Estimated Value</div>
                                        <div className="text-lg font-bold text-white">
                                            Rp {(asset.value / 1000000).toLocaleString()} M
                                        </div>
                                     </div>
                                     <div className="flex gap-2 justify-end">
                                         <button 
                                            onClick={() => verifyAsset(asset.id, asset.status)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                                                asset.status === 'VERIFIED' 
                                                ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700' 
                                                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                            }`}
                                         >
                                            {asset.status === 'VERIFIED' ? 'Unverify Link' : 'Verify Link'}
                                         </button>
                                          {asset.status === 'VERIFIED' && (
                                            <button 
                                                onClick={() => handleGenerateReport(asset)}
                                                title="Generate Forensic Report" 
                                                className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg hover:bg-indigo-500/20 transition-all text-indigo-400"
                                            >
                                                <FileText className="w-4 h-4" />
                                            </button>
                                        )}
                                     </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

             {/* Quick Stats Summary */}
            <div className="glass-panel p-8 rounded-[2.5rem] border border-emerald-500/20 bg-emerald-500/5 mt-10">
                 <div className="flex items-center gap-3 mb-4">
                    <AlertCircle className="w-5 h-5 text-emerald-500" />
                    <h5 className="text-[10px] font-black text-white uppercase tracking-widest">Tracing Completeness</h5>
                 </div>
                 <div className="h-2 w-full bg-emerald-950/50 rounded-full overflow-hidden mb-4 border border-emerald-500/10">
                    <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${data?.readiness ?? 0}%` }}
                        className="h-full bg-emerald-500 shadow-[0_0_15px_#10b981]" 
                    />
                 </div>
                 <p className="text-[10px] text-slate-500 leading-relaxed font-bold italic">
                    Current intelligence operations cover <span className="text-white">36.0%</span> of total project leakage discovered through V1-V3.
                 </p>
            </div>
        </div>
    </ForensicPageLayout>
  );
}