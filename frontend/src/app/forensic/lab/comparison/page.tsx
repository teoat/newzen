'use client';
export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileSearch, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  FileText, 
  Activity,
  ArrowRight,
  ShieldCheck,
  Zap,
  ChevronDown,
  Building2,
  Database
} from 'lucide-react';
import { ComparisonService, FullComparisonResponse } from '../../../../services/ComparisonService';
import { useProject } from '../../../../store/useProject';
import ForensicPageLayout from '../../../../app/components/ForensicPageLayout';

export default function AnalystComparisonPage() {
  const { activeProjectId } = useProject();
  const [bankFile, setBankFile] = useState<File | null>(null);
  const [userFile, setUserFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<FullComparisonResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunAnalysis = async () => {
    if (!activeProjectId || !bankFile || !userFile) return;
    
    setLoading(true);
    setError(null);
    try {
      const result = await ComparisonService.compare(activeProjectId, bankFile, userFile);
      setAnalysisResult(result);
    } catch (err) {
      console.error(err);
      setError('Analysis failed. Ensure CSV formats correspond to Zenith forensic schemas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ForensicPageLayout
      title="Discrepancy Bench"
      subtitle="Analyst Audit vs. Intelligence Discovery"
      icon={FileSearch}
    >
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {!analysisResult ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Panel */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="tactical-frame p-10 rounded-[3rem] bg-slate-900/40 border-white/5 space-y-8"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-indigo-500/10 rounded-2xl">
                  <Upload className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Data Ingress</h3>
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Cross-matching human and machine findings</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Bank Statement */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Raw Bank Statement (CSV)</label>
                  <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-white/5 rounded-[2rem] hover:border-indigo-500/30 hover:bg-white/5 transition-all cursor-pointer group">
                    <input type="file" className="hidden" accept=".csv" onChange={e => setBankFile(e.target.files?.[0] || null)} />
                    <div className="flex flex-col items-center gap-2">
                      <Database className={`w-8 h-8 ${bankFile ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-400'}`} />
                      <span className="text-xs font-bold text-slate-400">{bankFile ? bankFile.name : 'Select Raw Statement'}</span>
                    </div>
                  </label>
                </div>

                {/* User Analysis */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Human Audit Findings (CSV)</label>
                  <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-white/5 rounded-[2rem] hover:border-indigo-500/30 hover:bg-white/5 transition-all cursor-pointer group">
                    <input type="file" className="hidden" accept=".csv" onChange={e => setUserFile(e.target.files?.[0] || null)} />
                    <div className="flex flex-col items-center gap-2">
                       <FileText className={`w-8 h-8 ${userFile ? 'text-emerald-400' : 'text-slate-600 group-hover:text-slate-400'}`} />
                       <span className="text-xs font-bold text-slate-400">{userFile ? userFile.name : 'Select User Analysis'}</span>
                    </div>
                  </label>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500 text-xs font-bold">
                  <AlertCircle className="w-4 h-4" /> {error}
                </div>
              )}

              <button
                onClick={handleRunAnalysis}
                disabled={loading || !bankFile || !userFile}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl text-white font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-900/40 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><Zap className="w-4 h-4" /> Initiate Comparison</>
                )}
              </button>
            </motion.div>

            {/* Protocol Panel */}
            <div className="space-y-6">
               <div className="tactical-frame p-8 rounded-[2.5rem] bg-indigo-500/5 border-indigo-500/10">
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3" /> Comparison Protocol
                  </h4>
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-xs font-black text-indigo-500 border border-white/5">01</div>
                      <div className="flex-1">
                        <p className="text-white text-xs font-bold mb-1">Pattern Identification</p>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Zenith extracts high-velocity transfers, round-amount anomalies, and recidivist entity hits from the raw bank statement.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-xs font-black text-indigo-500 border border-white/5">02</div>
                      <div className="flex-1">
                        <p className="text-white text-xs font-bold mb-1">Agreement Mapping</p>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Your manually marked &quot;Proyek&quot; or &quot;Personal&quot; flags are compared with Zenith&apos;s verdict for every transaction row.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-xs font-black text-indigo-500 border border-white/5">03</div>
                      <div className="flex-1">
                        <p className="text-white text-xs font-bold mb-1">Blind Spot Discovery</p>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Disagreements identify potential leakages you may have missed or legitimate flows Zenith over-flagged.</p>
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8 pb-20">
            {/* Results Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <div className="tactical-card p-6 rounded-[2rem] border-white/5 bg-slate-900/40">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Agreement Rate</p>
                  <p className="text-3xl font-black text-white italic tracking-tighter">{(analysisResult.summary.agreement_rate * 100).toFixed(1)}%</p>
                  <div className="mt-4 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${analysisResult.summary.agreement_rate * 100}%` }}
                      className="h-full bg-indigo-600"
                    />
                  </div>
               </div>
               <div className="tactical-card p-6 rounded-[2rem] border-white/5 bg-slate-900/40">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Human Findings</p>
                  <p className="text-3xl font-black text-emerald-400 italic tracking-tighter">{analysisResult.summary.total_transactions - analysisResult.summary.app_found_more}</p>
                  <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-widest">Matched rows detected</p>
               </div>
               <div className="tactical-card p-6 rounded-[2rem] border-white/5 bg-slate-900/40 border-rose-500/20">
                  <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">Blind Spots Identified</p>
                  <p className="text-3xl font-black text-rose-500 italic tracking-tighter">{analysisResult.summary.disagreed}</p>
                  <p className="text-[10px] text-rose-400/50 mt-2 font-bold uppercase tracking-widest">Critical Discrepancies</p>
               </div>
               <div className="tactical-card p-6 rounded-[2rem] border-white/5 bg-slate-900/40">
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Discovered Entities</p>
                  <p className="text-3xl font-black text-indigo-400 italic tracking-tighter">{Object.keys(analysisResult.discovered_entities).length}</p>
                  <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-widest">Unique transaction nodes</p>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               {/* Discovered Patterns */}
               <div className="lg:col-span-1 space-y-6">
                  <div className="tactical-frame p-8 rounded-[2.5rem] bg-indigo-500/5 border-indigo-500/10">
                     <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6">Discovered Intelligence Patterns</h4>
                     <div className="space-y-3">
                        {Object.entries(analysisResult.discovered_patterns).map(([pattern, count]) => (
                          <div key={pattern} className="flex items-center justify-between p-4 rounded-xl bg-slate-950/50 border border-white/5">
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{pattern.replace(/_/g, ' ')}</span>
                             <span className="text-xs font-black text-white">{count}x</span>
                          </div>
                        ))}
                     </div>
                  </div>

                  <div className="tactical-frame p-8 rounded-[2.5rem] bg-slate-900/40 border-white/5">
                     <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Top Entities Found</h4>
                     <div className="space-y-4">
                        {Object.entries(analysisResult.discovered_entities).slice(0, 8).map(([name, count]) => (
                          <div key={name} className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <Building2 className="w-3 h-3 text-indigo-500" />
                                <span className="text-xs font-bold text-slate-200 truncate max-w-[150px]">{name}</span>
                             </div>
                             <span className="text-[10px] font-mono text-slate-600">{count} tx</span>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>

               {/* Comparison Table */}
               <div className="lg:col-span-2 tactical-frame rounded-[3rem] border-white/5 bg-slate-900/20 overflow-hidden flex flex-col">
                  <div className="p-8 border-b border-white/5 bg-slate-900/40 flex items-center justify-between">
                     <h4 className="text-[10px] font-black text-white uppercase tracking-widest">The Disagreement Ledger</h4>
                     <div className="flex gap-2">
                        <span className="px-2 py-1 rounded bg-rose-500/10 text-rose-500 text-[9px] font-black uppercase tracking-widest">Blind Spots Only</span>
                     </div>
                  </div>
                  <div className="flex-1 overflow-auto custom-scrollbar max-h-[600px]">
                     <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/5">
                            <th className="px-8 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Row / Date</th>
                            <th className="px-8 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Transaction Intelligence</th>
                            <th className="px-8 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Human vs AI</th>
                            <th className="px-8 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Reasoning</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analysisResult.comparisons.map((item, i) => (
                            <tr key={i} className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors group ${item.match_status === 'disagree' ? 'bg-rose-500/5' : ''}`}>
                               <td className="px-8 py-6">
                                  <div className="text-[10px] font-black text-slate-500 uppercase mb-1">#{item.row_no}</div>
                                  <div className="text-xs font-bold text-white">{item.date}</div>
                               </td>
                               <td className="px-8 py-6">
                                  <div className="text-xs font-bold text-slate-200 mb-1 max-w-[250px] truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all">{item.description}</div>
                                  <div className="text-xs font-mono font-black text-indigo-400">Rp {item.amount.toLocaleString()}</div>
                               </td>
                               <td className="px-8 py-6">
                                  <div className="space-y-2">
                                     <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${item.user_marked_as_project ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Human: {item.user_marked_as_project ? 'Project' : 'Personal'}</span>
                                     </div>
                                     <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${item.app_verdict === 'project' ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">AI: {item.app_verdict}</span>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-8 py-6 max-w-[300px]">
                                  <div className="space-y-1">
                                    {item.app_reasoning.map((reason, ri) => (
                                      <div key={ri} className="text-[10px] font-medium text-slate-400 leading-snug flex items-start gap-2">
                                        <ArrowRight className="w-2.5 h-2.5 mt-0.5 text-indigo-500 shrink-0" />
                                        {reason}
                                      </div>
                                    ))}
                                  </div>
                               </td>
                            </tr>
                          ))}
                        </tbody>
                     </table>
                  </div>
                  <div className="p-6 bg-slate-900/40 border-t border-white/5 flex justify-end">
                      <button 
                        onClick={() => setAnalysisResult(null)}
                        className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 hover:text-indigo-300 transition-colors"
                      >
                         Analyze New Batch <ArrowRight className="w-3 h-3" />
                      </button>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>
    </ForensicPageLayout>
  );
}
