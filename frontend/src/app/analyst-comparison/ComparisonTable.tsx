'use client';

import React from 'react';
import { motion } from 'framer-motion';
import NextDynamic from 'next/dynamic';
import { AlertTriangle, Clock, Globe } from 'lucide-react';
import { LeakageHotspot } from '../../components/ForensicGeoMap';

const PieChart = NextDynamic(() => import('recharts').then(mod => mod.PieChart), { ssr: false });
const Pie = NextDynamic(() => import('recharts').then(mod => mod.Pie), { ssr: false });
const Cell = NextDynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false });
const ResponsiveContainer = NextDynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
import ForensicGeoMap from '../../components/ForensicGeoMap';

interface ComparisonResult {
  row_no: number;
  date: string;
  description: string;
  amount: number;
  app_verdict: string;
  app_reasoning: string[];
  user_marked_as_project: boolean;
  user_comment: string | null;
  match_status: string;
}

interface Summary {
  total_transactions: number;
  agreed: number;
  disagreed: number;
  app_found_more: number;
  user_found_more: number;
  agreement_rate: number;
}

interface ComparisonResponse {
  summary: Summary;
  comparisons: ComparisonResult[];
  discovered_entities: Record<string, number>;
  discovered_patterns: Record<string, number>;
}

interface ComparisonTableProps {
  compareResults: ComparisonResponse;
  hotspots: LeakageHotspot[];
  onReset: () => void;
}

const getPatternStyle = (pattern: string): string => {
  const styles: Record<string, string> = {
    CASH_WITHDRAWAL: 'bg-red-500/30 text-red-200',
    ROUND_MILLIONS: 'bg-amber-500/30 text-amber-200',
    LARGE_ROUND_AMOUNT: 'bg-orange-500/30 text-orange-200',
    FREQUENT_RECIPIENT: 'bg-blue-500/30 text-blue-200',
    SIMILAR_DESCRIPTIONS: 'bg-purple-500/30 text-purple-200',
    INTERNAL_TRANSFER: 'bg-pink-500/30 text-pink-200',
    NAME_VARIATIONS: 'bg-cyan-500/30 text-cyan-200',
    HIGH_VALUE: 'bg-yellow-500/30 text-yellow-200',
  };
  return styles[pattern] || 'bg-slate-500/30 text-slate-200';
};

const getVerdictStyle = (verdict: string): string => {
  const styles: Record<string, string> = {
    project: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    personal: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    suspicious: 'bg-red-500/20 text-red-300 border-red-500/40',
    duplicate: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    unknown: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
  };
  return styles[verdict] || styles.unknown;
};

export function ComparisonTable({ compareResults, hotspots, onReset }: ComparisonTableProps) {
  const isAllClear = compareResults.summary.disagreed === 0 && compareResults.summary.app_found_more === 0;

  return (
    <div className="space-y-8">
      {isAllClear ? (
        <div className="bg-slate-900/50 rounded-3xl p-16 border border-emerald-500/20 flex flex-col items-center justify-center text-center backdrop-blur-sm">
          <div className="p-6 bg-emerald-500/10 rounded-full mb-6 ring-1 ring-emerald-500/30">
            <Clock className="w-16 h-16 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-black text-white mb-3 tracking-tight">All Clear! No Fraud Detected.</h2>
          <p className="text-slate-400 max-w-lg text-lg leading-relaxed">
            Both your manual analysis and Zenith&apos;s AI agree: all <span className="text-white font-mono font-bold">{compareResults.summary.total_transactions}</span> transactions appear legitimate.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 rounded-3xl p-6 border border-white/5 relative overflow-hidden flex flex-col items-center justify-center">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest absolute top-6 left-6">Consensus Engine</h3>
            <div className="w-48 h-48 relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Agreed', value: compareResults.summary.agreed },
                      { name: 'Disagreed', value: compareResults.summary.disagreed }
                    ]}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#f43f5e" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-white">{(compareResults.summary.agreement_rate * 100).toFixed(0)}%</span>
                <span className="text-[11px] uppercase font-bold text-slate-500">Match Rate</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-6 border border-white/5 flex flex-col justify-between relative group">
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-50 transition-opacity">
              <AlertTriangle className="w-12 h-12 text-blue-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Variance Analysis</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>AI Found Extra Findings</span>
                    <span className="text-white font-mono">{compareResults.summary.app_found_more}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${compareResults.summary.disagreed > 0 ? (compareResults.summary.app_found_more / compareResults.summary.disagreed) * 100 : 0}%` }} 
                      className="h-full bg-blue-500 rounded-full" 
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Human Analyst Override</span>
                    <span className="text-white font-mono">{compareResults.summary.user_found_more || 0}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${compareResults.summary.disagreed > 0 ? (1 - (compareResults.summary.app_found_more / compareResults.summary.disagreed)) * 100 : 0}%` }} 
                      className="h-full bg-fuchsia-500 rounded-full" 
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 leading-relaxed">
              Tip: The AI detected <span className="font-bold text-white">{compareResults.summary.app_found_more} transactions</span> that you missed in your manual review.
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-6 border border-white/5 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full" />
            <div className="relative z-10 mb-2 p-3 bg-indigo-500/10 rounded-full ring-1 ring-indigo-500/20">
              <Clock className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="relative z-10 text-5xl font-black text-white mb-1 tracking-tighter">
              {Math.ceil(compareResults.summary.total_transactions / 50)}h
            </div>
            <div className="relative z-10 text-xs font-bold text-indigo-300 uppercase tracking-widest bg-indigo-900/40 px-3 py-1 rounded-full border border-indigo-500/30">
              Manual Effort Saved
            </div>
            <div className="relative z-10 mt-4 text-[11px] font-mono text-slate-500">
              AI Analysis Time: 0.42s
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#020617] rounded-[2.5rem] border border-white/5 overflow-hidden h-[450px] relative">
          <div className="absolute top-6 left-8 z-20">
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-400" />
              Discrepancy Hotspots
            </h3>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Spatial distribution of consensus variance</p>
          </div>
          <ForensicGeoMap hotspots={hotspots} />
        </div>

        <div className="bg-slate-900/40 rounded-[2.5rem] border border-white/5 p-8 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Variance Clusters</h3>
            <div className="space-y-4">
              {hotspots.map(h => (
                <div key={h.id} className="p-4 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                  <div>
                    <p className="text-[11px] font-black text-white uppercase tracking-tight">{h.location.name}</p>
                    <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest mt-1">{h.rootCause}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-mono font-bold text-indigo-400">Rp {(h.value / 1000000).toFixed(0)}M</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button className="w-full py-4 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all">
            Analyze Cluster Dispersion
          </button>
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
        <h2 className="text-xl font-semibold text-white mb-4">Patterns the App Discovered</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(compareResults.discovered_patterns).map(([pattern, count]) => (
            <span key={pattern} className={`px-3 py-1.5 rounded-full text-sm font-medium ${getPatternStyle(pattern)}`}>
              {pattern}: {count}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Forensic Lens: App vs Analyst</h2>
          <div className="flex gap-4 text-sm font-mono opacity-70">
            <span className="flex items-center gap-2 text-indigo-400">
              <div className="w-3 h-3 border border-indigo-400 rounded-full" />
              AI Forensic Verdict
            </span>
            <span className="flex items-center gap-2 text-fuchsia-400">
              <div className="w-3 h-3 border border-fuchsia-400 rounded-full" />
              Your Analysis
            </span>
          </div>
        </div>

        {compareResults.comparisons.slice(0, 50).map((row) => (
          <div key={row.row_no} className="relative group">
            <div className={`absolute left-1/2 top-0 bottom-0 w-px -ml-px z-0 
              ${row.match_status === 'agree' ? 'bg-emerald-500/30' : 'bg-rose-500/50 dashed-line'}`} 
            />
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 p-2">
              <div className={`p-4 rounded-2xl border transition-all hover:bg-slate-800/50 flex flex-col justify-between
                ${row.match_status === 'agree' ? 'bg-slate-900/40 border-slate-700' : 'bg-indigo-900/10 border-indigo-500/30'}
              `}>
                <div className="mb-2 flex justify-between items-start">
                  <span className="text-[11px] uppercase tracking-widest text-indigo-400 font-bold">AI Verdict</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono border ${getVerdictStyle(row.app_verdict)}`}>
                    {row.app_verdict}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-200">{row.description}</p>
                  <p className="text-xs font-mono text-slate-400">IDR {row.amount.toLocaleString('id-ID')}</p>
                </div>
                <div className="mt-3 pt-3 border-t border-white/5">
                  <p className="text-[11px] text-slate-500 mb-1">REASONING:</p>
                  <div className="flex flex-wrap gap-1">
                    {row.app_reasoning.slice(0, 3).map((r, i) => (
                      <span key={i} className="text-[11px] px-1.5 py-0.5 bg-white/5 rounded text-indigo-200">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border transition-all hover:bg-slate-800/50 flex flex-col justify-between
                ${row.match_status === 'agree' ? 'bg-slate-900/40 border-slate-700' : 'bg-fuchsia-900/10 border-fuchsia-500/30'}
              `}>
                <div className="mb-2 flex justify-between items-start">
                  <span className="text-[11px] uppercase tracking-widest text-fuchsia-400 font-bold">Analyst Input</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono
                    ${row.user_marked_as_project ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-700 text-slate-400'}
                  `}>
                    {row.user_marked_as_project ? 'MARKED AS PROJECT' : 'IGNORED'}
                  </span>
                </div>
                <div className="space-y-1 opacity-70">
                  <p className="text-sm font-medium text-slate-200">{row.description}</p>
                  <p className="text-xs font-mono text-slate-400">IDR {row.amount.toLocaleString('id-ID')}</p>
                </div>
                {row.user_comment && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-[11px] text-slate-500 mb-1">COMMENT:</p>
                    <p className="text-xs italic text-fuchsia-200">&quot;{row.user_comment}&quot;</p>
                  </div>
                )}
              </div>
            </div>

            <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-lg
              ${row.match_status === 'agree' 
                ? 'bg-slate-900 border-emerald-500 text-emerald-500' 
                : 'bg-slate-900 border-rose-500 text-rose-500 animate-pulse'}
            `}>
              {row.match_status === 'agree' ? '✓' : '!'}
            </div>
          </div>
        ))}
        
        <div className="flex justify-center pt-8">
          <button onClick={onReset} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg">
            Analyze New Batch
          </button>
        </div>
      </div>
    </div>
  );
}
