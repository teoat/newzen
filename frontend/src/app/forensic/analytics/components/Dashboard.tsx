'use client';

import { motion } from 'framer-motion';
import { Briefcase, Activity, TrendingDown, AlertCircle, BarChart3, Zap, Download } from 'lucide-react';
import dynamic from 'next/dynamic';

const AreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });

import RABComparisonTable from '@/components/RABComparisonTable';
import { ProjectData, SCurveData } from './data';
import { HOLOGRAPHIC_SOURCE } from '@/lib/holographicData';
import { authenticatedFetch } from '@/lib/api';
import { BudgetVariance } from '@/types/domain';
import { useInvestigation } from '@/store/useInvestigation';

interface SCurveDisplayProps {
  data: Array<{ date: string; pv: number; ac: number }>;
}

function SCurveDisplay({ data }: SCurveDisplayProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorAc" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.3} />
        <XAxis
          dataKey="date"
          stroke="#334155"
          tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }}
          tickFormatter={(t: string) => new Date(t).toLocaleDateString([], { month: 'short' })}
        />
        <YAxis
          stroke="#334155"
          tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }}
          tickFormatter={(v: number) => `Rp ${(v / 1000000000).toFixed(0)}B`}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '16px' }}
          itemStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}
          formatter={(value: any) => [`Rp ${Number(value || 0).toLocaleString()}`, 'Value']}
        />
        <Area type="monotone" dataKey="pv" stroke="#475569" strokeWidth={2} fillOpacity={1} fill="url(#colorPv)" strokeDasharray="5 5" />
        <Area type="monotone" dataKey="ac" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorAc)" />
      </AreaChart>
    </ResponsiveContainer>
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 rounded-2xl border relative overflow-hidden ${highlight ? 'bg-rose-500/10 border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.1)]' : 'bg-slate-900/50 border-white/5'} flex flex-col justify-between h-32 group`}
    >
      {highlight && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full -translate-y-1/2 translate-x-1/2 animate-pulse" />
      )}
      <div className="flex justify-between items-start relative z-10">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</span>
        <Icon className={`w-5 h-5 ${color} ${highlight ? 'animate-bounce' : ''}`} />
      </div>
      <div className={`text-2xl font-black font-mono relative z-10 ${color}`}>{value}</div>
    </motion.div>
  );
}

interface ProjectDashboardProps {
  projectData: ProjectData;
  sCurveData: SCurveData;
  projectId: string;
}

export function ProjectDashboard({ projectData, sCurveData, projectId }: ProjectDashboardProps) {
  const { activeInvestigation } = useInvestigation();
  const displayProject = projectData || HOLOGRAPHIC_SOURCE.projectDashboard;
  const displayCurve = sCurveData?.curve_data || HOLOGRAPHIC_SOURCE.sCurve;

  const handleExportDossier = async () => {
    if (!activeInvestigation?.id) {
      alert('Start an investigation in the Hub first to link this dossier.');
      return;
    }
    const userId = 'USER-001';
    const res = await authenticatedFetch(`/api/v2/forensic-v2/judge/download-dossier?case_id=${activeInvestigation.id}&user_id=${userId}`);
    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Zenith_Court_Dossier_${projectId}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="p-8 space-y-8 overflow-y-auto h-full custom-scrollbar">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard label="Contract Value" value={`Rp ${(displayProject.financials.contract_value / 1000000000).toFixed(1)} B`} icon={Briefcase} color="text-slate-200" />
        <StatsCard label="Funds Released" value={`Rp ${(displayProject.financials.total_released / 1000000000).toFixed(1)} B`} icon={Activity} color="text-indigo-400" />
        <StatsCard label="Actual Spent" value={`Rp ${(displayProject.financials.total_spent_onsite / 1000000000).toFixed(1)} B`} icon={TrendingDown} color="text-emerald-400" />
        <StatsCard label="Unaccounted / Leakage" value={`Rp ${(displayProject.leakage.total_leakage / 1000000000).toFixed(2)} B`} icon={AlertCircle} color="text-rose-500" highlight />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-panel p-8 rounded-[2.5rem] min-h-[450px] border border-white/5 shadow-2xl">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-lg font-black text-white flex items-center gap-3 uppercase tracking-tight">
              <BarChart3 className="w-5 h-5 text-indigo-500" /> S-Curve Replay Engine
            </h2>
            <div className="flex gap-6 text-[11px] font-black uppercase tracking-widest">
              <span className="flex items-center gap-2 text-rose-400"><div className="w-2 h-2 rounded-full bg-rose-500" /> Actual Cost (AC)</span>
              <span className="flex items-center gap-2 text-slate-500"><div className="w-2 h-2 rounded-full bg-slate-500" /> Planned Value (PV)</span>
            </div>
          </div>
          <div className="h-[320px] w-full">
            <SCurveDisplay data={displayCurve} />
          </div>
        </div>

        <div className="glass-panel p-8 rounded-[2.5rem] flex flex-col justify-between border border-white/5 shadow-2xl bg-gradient-to-br from-indigo-950/20 to-slate-900/50">
          <div className="space-y-8">
            <h2 className="text-lg font-black text-white flex items-center gap-3 uppercase tracking-tight">
              <Zap className="w-5 h-5 text-indigo-400" /> Auditor Insights
            </h2>
            <div className="space-y-4">
              <div className="p-5 bg-rose-500/5 border border-rose-500/20 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <AlertCircle className="w-12 h-12 text-rose-500" />
                </div>
                <h3 className="text-[11px] font-black text-rose-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" /> Leakage Signature
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Detected <b>Rp {displayProject.leakage.markup_leakage.toLocaleString()}</b> in potential price markups.
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleExportDossier}
            className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[11px] hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-900/40 active:scale-95 flex items-center justify-center gap-3"
          >
            <Download className="w-4 h-4" /> Export High-Fidelity Dossier
          </button>
        </div>
      </div>

      {displayProject?.budget_variance && (
        <RABComparisonTable items={displayProject.budget_variance as BudgetVariance[]} />
      )}
    </div>
  );
}
