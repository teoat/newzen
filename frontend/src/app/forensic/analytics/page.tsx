'use client';

import React, { useState, useEffect } from 'react';

import { 
  TrendingDown, AlertCircle, 
  Download, BarChart3, Zap,
  Briefcase, Activity, Target
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

import RABComparisonTable from '@/components/RABComparisonTable';




import { HOLOGRAPHIC_SOURCE } from '@/utils/holographicData';


const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8200';

interface ProjectData {
  project: {
    name: string;
    code: string;
    status: string;
  };
  financials: {
    contract_value: number;
    total_released: number;
    total_spent_onsite: number;
  };
  leakage: {
    total_leakage: number;
    markup_leakage: number;
  };
  budget_variance?: Array<{
    id?: string;
    rab_unit_price?: number;
    actual_unit_price?: number;
    rab_quantity?: number;
    actual_quantity?: number;
    item_name?: string;
    category?: string;
    unit_price_rab?: number;
    avg_unit_price_actual?: number;
    markup_percentage?: number;
    volume_discrepancy?: number;
    item?: string;
    budgeted?: number;
    actual?: number;
    variance?: number;
  }>;
}

interface SCurveData {
  curve_data?: Array<{
    date: string;
    pv: number;
    ac: number;
  }>;
}

import { useProject } from '@/store/useProject';
import { BudgetVariance } from '@/types/domain';
import ForensicPageLayout from '@/app/components/ForensicPageLayout';

export default function ProjectAuditPage() {
  const { activeProjectId } = useProject();
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [sCurveData, setSCurveData] = useState<SCurveData | null>(null);
  const [loading, setLoading] = useState(true);

  const isMock = !projectData;

  useEffect(() => {
    if (!activeProjectId) return;

    async function fetchData() {
        setLoading(true);
        try {
            const [dashRes, curveRes] = await Promise.all([
                fetch(`${API_URL}/api/v1/project/${activeProjectId}/dashboard`),
                fetch(`${API_URL}/api/v1/project/${activeProjectId}/s-curve`)
            ]);
            
            if (dashRes.ok && curveRes.ok) {
                setProjectData(await dashRes.json());
                setSCurveData(await curveRes.json());
            } else {
                setProjectData(null);
                setSCurveData(null);
            }
        } catch (e) {
            console.error(e);
            setProjectData(null);
        } finally {
            setLoading(false);
        }
    }
    fetchData();
  }, [activeProjectId]);

  const displayProject = projectData || HOLOGRAPHIC_SOURCE.projectDashboard;
  const displayCurve = sCurveData?.curve_data || HOLOGRAPHIC_SOURCE.sCurve;

  return (
    <ForensicPageLayout
        title={displayProject.project.name}
        subtitle={`Code: ${displayProject.project.code} // Status: ${displayProject.project.status}`}
        icon={Briefcase}
        isMockData={isMock}
        loading={loading}
        loadingMessage="Recalculating Variance Engine..."
        headerActions={
            <div className="flex gap-8">
                 <div className="text-right">
                     <div className="text-[10px] uppercase text-slate-500 font-black tracking-widest">Confidence Score</div>
                     <div className="text-2xl font-black text-rose-500">42%</div>
                 </div>
                 <div className="w-px h-10 bg-white/10" />
                 <div className="text-right">
                    <div className="text-[10px] uppercase text-slate-500 font-black tracking-widest">Est. Leakage</div>
                    <div className="text-2xl font-black text-rose-500">Rp {(displayProject.leakage.total_leakage / 1000000000).toFixed(2)} B</div>
                 </div>
            </div>
        }
    >
        <div className="p-8 space-y-8 overflow-y-auto h-full custom-scrollbar">
        
        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatsCard label="Contract Value" value={`Rp ${(displayProject.financials.contract_value / 1000000000).toFixed(1)} B`} icon={Target} color="text-slate-200" />
            <StatsCard label="Funds Released" value={`Rp ${(displayProject.financials.total_released / 1000000000).toFixed(1)} B`} icon={Activity} color="text-indigo-400" />
            <StatsCard label="Actual Spent" value={`Rp ${(displayProject.financials.total_spent_onsite / 1000000000).toFixed(1)} B`} icon={TrendingDown} color="text-emerald-400" />
            <StatsCard label="Unaccounted / Leakage" value={`Rp ${(displayProject.leakage.total_leakage / 1000000000).toFixed(2)} B`} icon={AlertCircle} color="text-rose-500" highlight />
        </div>

        {/* S-Curve Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 glass-panel p-8 rounded-[2.5rem] min-h-[450px] border border-white/5 shadow-2xl">
                 <div className="flex justify-between items-center mb-10">
                     <h2 className="text-lg font-black text-white flex items-center gap-3 uppercase tracking-tight">
                         <BarChart3 className="w-5 h-5 text-indigo-500" /> S-Curve Replay Engine
                     </h2>
                     <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest">
                         <span className="flex items-center gap-2 text-rose-400"><div className="w-2 h-2 rounded-full bg-rose-500" /> Actual Cost (AC)</span>
                         <span className="flex items-center gap-2 text-slate-500"><div className="w-2 h-2 rounded-full bg-slate-500" /> Planned Value (PV)</span>
                     </div>
                 </div>
                 
                 <div className="h-[320px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={displayCurve}>
                             <defs>
                                <linearGradient id="colorAc" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                             </defs>
                             <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.3} />
                             <XAxis 
                                dataKey="date" 
                                stroke="#334155"
                                tick={{fontSize: 9, fill: '#64748b', fontWeight: 'bold'}} 
                                tickFormatter={(t) => new Date(t).toLocaleDateString([], {month: 'short'})} 
                             />
                             <YAxis 
                                stroke="#334155"
                                tick={{fontSize: 9, fill: '#64748b', fontWeight: 'bold'}} 
                                tickFormatter={(v) => `Rp ${(v/1000000000).toFixed(0)}B`} 
                             />
                             <Tooltip 
                                contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
                                itemStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}
                                labelStyle={{ color: '#6366f1', fontSize: '9px', fontWeight: '900', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                                formatter={(value?: number) => [`Rp ${value?.toLocaleString() || 0}`, 'Value']}
                             />
                             <Area type="monotone" dataKey="pv" stroke="#475569" strokeWidth={2} fillOpacity={1} fill="url(#colorPv)" strokeDasharray="5 5" cursor="pointer" activeDot={{ r: 6, strokeWidth: 0 }} />
                             <Area type="monotone" dataKey="ac" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorAc)" cursor="pointer" activeDot={{ r: 8, strokeWidth: 2, stroke: '#fff' }} />
                         </AreaChart>
                     </ResponsiveContainer>
                 </div>
            </div>

            {/* AI Insight Panel */}
            <div className="glass-panel p-8 rounded-[2.5rem] flex flex-col justify-between border border-white/5 shadow-2xl bg-gradient-to-br from-indigo-950/20 to-slate-900/50">
                 <div className="space-y-8">
                    <h2 className="text-lg font-black text-white flex items-center gap-3 uppercase tracking-tight">
                        <Zap className="w-5 h-5 text-indigo-400" /> Auditor Insights
                    </h2>
                    
                    <div className="space-y-4">
                        <div className="p-5 bg-rose-500/5 border border-rose-500/20 rounded-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity">
                                <AlertCircle className="w-12 h-12 text-rose-500" />
                            </div>
                            <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" /> Leakage Signature
                            </h3>
                            <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                Detected <b>Rp {displayProject.leakage.markup_leakage.toLocaleString()}</b> in potential price markups. 
                                Concrete unit prices are <b>52% above</b> RAB baseline.
                            </p>
                        </div>
                        
                        <div className="p-5 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl group">
                            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Volume Anomaly</h3>
                            <p className="text-xs text-slate-400 leading-relaxed font-medium transition-colors group-hover:text-slate-200">
                                <b>Steel Rebar (D-16)</b> shows a volume discrepancy of 45吨. Physical verification required to confirm site existence.
                            </p>
                        </div>
                    </div>
                 </div>
                 
                 <button 
                  onClick={async () => {
                    console.log(`🚀 Initiating High-Fidelity Dossier Compilation for Project: ${activeProjectId}`);
                   const res = await fetch(`${API_URL}/api/v1/forensic/export/court-dossier?project_id=${activeProjectId}`);
                    if (res.ok) {
                      const blob = await res.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `Zenith_Court_Dossier_${activeProjectId}_${new Date().toISOString().split('T')[0]}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      console.log("✅ Dossier exported successfully.");
                    } else {
                      console.error("❌ Failed to generate court dossier:", await res.text());
                    }
                  }}
                  className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-900/40 active:scale-95 flex items-center justify-center gap-3"
                 >
                     <Download className="w-4 h-4" /> Export High-Fidelity Dossier
                 </button>
            </div>
        </div>

        {/* RAB Comparison Section */}
        {displayProject?.budget_variance && (
            <RABComparisonTable items={displayProject.budget_variance as BudgetVariance[]} />
        )}
        </div>
    </ForensicPageLayout>
  );
}

interface StatsCardProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  highlight?: boolean;
}

function StatsCard({ label, value, icon: Icon, color, highlight = false }: StatsCardProps) {
    return (
        <div className={`p-6 rounded-2xl border ${highlight ? 'bg-rose-500/10 border-rose-500/20' : 'bg-slate-900/50 border-white/5'} flex flex-col justify-between h-32`}>
            <div className="flex justify-between items-start">
               <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</span>
               <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className={`text-2xl font-black font-mono ${color}`}>{value}</div>
        </div>
    )
}
