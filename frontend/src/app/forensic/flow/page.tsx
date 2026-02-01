'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Landmark, ArrowRight, Shield, AlertTriangle, Download, RefreshCw, Activity, Terminal } from 'lucide-react';
import { useProject } from '../../../store/useProject';
import { useInvestigation } from '../../../store/useInvestigation';
import { authenticatedFetch, authFetcher } from '../../../lib/api';
import ForensicPageLayout from '../../../app/components/ForensicPageLayout';
import { Button } from '../../../ui/button';
import { Card } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import PremiumNeuralFlow from '../../../components/ForensicAnalysis/PremiumNeuralFlow';
import ProphetBurnCounter from '../../../components/ForensicAnalysis/ProphetBurnCounter';

export default function ForensicFlowPage() {
  const { activeProjectId } = useProject();
  const { activeInvestigation } = useInvestigation();
  const [minAmount, setMinAmount] = useState(0);

  const { data: flowData, isLoading, mutate } = useSWR(
    activeProjectId ? `/api/v2/flow/trace/${activeProjectId}?min_amount=${minAmount}` : null,
    authFetcher
  );

  const { data: prophetData } = useSWR(
    activeProjectId ? `/api/v2/prophet/forecast-budget/${activeProjectId}` : null,
    authFetcher
  );

  const isMock = !flowData && !isLoading;

  const stats = useMemo(() => {
    if (!flowData) return { totalVolume: 0, nodeCount: 0, alertCount: 0 };
    return {
      totalVolume: flowData.metrics?.total_volume || 0,
      nodeCount: flowData.nodes?.length || 0,
      alertCount: flowData.circular_patterns?.length || 0
    };
  }, [flowData]);

  return (
    <ForensicPageLayout
        title="Financial Flow Intelligence"
        subtitle="Capital Reconstruction // Transaction Lineage // Pattern Analysis"
        icon={Coins}
        isMockData={isMock}
        headerActions={
            <div className="flex gap-4">
                 <button 
                    onClick={() => mutate()}
                    className="bg-slate-900 hover:bg-white/5 text-indigo-400 border border-white/10 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 active:scale-95 shadow-xl"
                 >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Sync Ledger
                 </button>
                  <button 
                    onClick={async () => {
                        if (!activeInvestigation?.id) {
                            alert("Start an investigation in the Hub first to link this dossier.");
                            return;
                        }
                        const { API_ROUTES } = await import('../../../services/apiRoutes');
                        const userId = "USER-001";
                        const res = await authenticatedFetch(API_ROUTES.V2.JUDGE.DOSSIER(activeInvestigation.id, userId));
                        if (res.ok) {
                            const blob = await res.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `Zenith_Flow_Dossier_${activeProjectId}.pdf`;
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                        }
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 active:scale-95 shadow-2xl shadow-indigo-900/40"
                  >
                    <Download className="w-5 h-5" /> Export Dossier
                  </button>
            </div>
        }
    >
        <div className="p-8 space-y-8 overflow-y-auto h-full custom-scrollbar">
            {/* Stats Overview */}
            <div className="grid grid-cols-4 gap-6">
                <Card className="p-6 bg-slate-900/50 border-white/5 rounded-3xl backdrop-blur-xl">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Monitored Vol.</div>
                    <div className="text-3xl font-black text-white">Rp {(stats.totalVolume / 1e9).toFixed(2)}B</div>
                </Card>
                <Card className="p-6 bg-slate-900/50 border-white/5 rounded-3xl backdrop-blur-xl">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Entity Nodes</div>
                    <div className="text-3xl font-black text-indigo-400">{stats.nodeCount}</div>
                </Card>
                <Card className="p-6 bg-slate-900/50 border-white/5 rounded-3xl backdrop-blur-xl">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Circular Flow Alerts</div>
                    <div className="text-3xl font-black text-rose-500">{stats.alertCount}</div>
                </Card>
                <Card className="p-6 bg-slate-900/50 border-white/5 rounded-3xl backdrop-blur-xl">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Analysis Status</div>
                    <div className="text-3xl font-black text-emerald-500">LIVE</div>
                </Card>
            </div>

            {/* Main Flow Visualizer Placeholder */}
            <Card className="h-[600px] bg-slate-950 border-white/5 rounded-[40px] relative overflow-hidden flex items-center justify-center">
                 <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent"></div>
                 </div>
                 
                 {isLoading ? (
                    <div className="flex flex-col items-center gap-4">
                        <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin" />
                        <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Reconstructing Ledger...</div>
                    </div>
                 ) : (
                    <div className="w-full h-full">
                        <PremiumNeuralFlow 
                            nodes={flowData?.nodes?.map((n: any) => ({
                                id: n.id,
                                label: n.label || n.id,
                                type: n.type || 'company',
                                risk: n.risk || 0,
                                value: n.value || 10
                            })) || []}
                            links={flowData?.flows?.map((f: any) => ({
                                source: f.source,
                                target: f.target,
                                value: f.value,
                                isSuspicious: f.is_suspicious
                            })) || []}
                        />
                    </div>
                 )}
            </Card>

            {/* Alerts Table */}
                <ProphetBurnCounter 
                    initialDays={(prophetData?.months_remaining || 0) * 30.44}
                    burnRate={prophetData?.monthly_burn_rate / 30.44 || 0}
                    totalBudget={prophetData?.budget_total || 0}
                    remainingBudget={prophetData?.remaining || 0}
                />
                
                <Card className="bg-slate-900/30 border-white/5 rounded-[32px] overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-rose-500" />
                        <h3 className="text-xs font-black text-white uppercase tracking-widest">High-Risk Flow Anomalies</h3>
                    </div>
                    <Badge variant="destructive">{stats.alertCount} CRITICAL</Badge>
                </div>
                <div className="p-4">
                   {flowData?.circular_patterns?.length > 0 ? (
                       <div className="space-y-2">
                           {flowData.circular_patterns.map((pattern: any, idx: number) => (
                               <div key={idx} className="p-4 bg-white/5 rounded-2xl flex justify-between items-center group hover:bg-white/10 transition-all cursor-pointer">
                                   <div className="flex items-center gap-4">
                                       <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-500">
                                           <RefreshCw className="w-5 h-5" />
                                       </div>
                                       <div>
                                           <div className="text-white font-bold text-sm">Circular Fund Injection detected</div>
                                           <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Path: {pattern.nodes.join(' → ')}</div>
                                       </div>
                                   </div>
                                   <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-all uppercase text-[8px] font-black tracking-widest">Detail Case</Button>
                               </div>
                           ))}
                       </div>
                   ) : (
                       <div className="text-center py-12 text-slate-600 font-bold uppercase tracking-widest text-[10px]">No circular anomalies detected in current batch</div>
                   )}
                </div>
             </Card>
        </div>
    </ForensicPageLayout>
  );
}
