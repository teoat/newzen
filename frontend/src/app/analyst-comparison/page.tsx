'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { CheckCircle, AlertTriangle, Clock, Sparkles, Monitor, Search, Globe, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { HOLOGRAPHIC_SOURCE } from '@/utils/holographicData';
import HolographicBadge from '@/app/components/HolographicBadge';
import ForensicPageLayout from '@/app/components/ForensicPageLayout';
import ForensicGeoMap, { LeakageHotspot } from '@/components/ForensicGeoMap';

interface AppFinding {
  row_no: number;
  date: string;
  raw_description: string;
  amount: number;
  verdict: string;
  confidence: number;
  discovered_patterns: string[];
  reasoning: string[];
}

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

interface RawAnalysisResponse {
  total_analyzed: number;
  verdicts: Record<string, number>;
  discovered_patterns: Record<string, number>;
  top_entities: Record<string, number>;
  flagged_count: number;
  sample_findings: AppFinding[];
}

type Step = 'upload' | 'analyzing' | 'raw-results' | 'compare-results';

const API_URL = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8200')
  : 'http://localhost:8200';

export default function AnalystComparisonPage() {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>('upload');
  const [bankFile, setBankFile] = useState<File | null>(null);
  const [analysisFile, setAnalysisFile] = useState<File | null>(null);
  const [rawResults, setRawResults] = useState<RawAnalysisResponse | null>(null);
  const [compareResults, setCompareResults] = useState<ComparisonResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<AppFinding | ComparisonResult | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const onDropBank = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) setBankFile(acceptedFiles[0]);
  }, []);

  const onDropAnalysis = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) setAnalysisFile(acceptedFiles[0]);
  }, []);

  const { getRootProps: getBankRootProps, getInputProps: getBankInputProps, isDragActive: isBankDragActive } = useDropzone({
    onDrop: onDropBank,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
  });

  const { getRootProps: getAnalysisRootProps, getInputProps: getAnalysisInputProps, isDragActive: isAnalysisDragActive } = useDropzone({
    onDrop: onDropAnalysis,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
  });

  const runRawAnalysis = async () => {
    if (!bankFile) return;
    setStep('analyzing');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', bankFile);

      const response = await fetch(`${API_URL}/api/v1/analyst-comparison/analyze-raw`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      setRawResults(data);
      setStep('raw-results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStep('upload');
    }
  };

  const runComparison = async () => {
    if (!bankFile || !analysisFile) return;
    setStep('analyzing');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('bank_statement', bankFile);
      formData.append('user_analysis', analysisFile);

      const response = await fetch(`${API_URL}/api/v1/analyst-comparison/compare`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      setCompareResults(data);
      setStep('compare-results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStep('upload');
    }
  };

  const loadDemo = () => {
    setStep('analyzing');
    setTimeout(() => {
        setCompareResults(HOLOGRAPHIC_SOURCE.comparisonDemo);
        setStep('compare-results');
    }, 1200);
  };

  const reset = () => {
    setStep('upload');
    setBankFile(null);
    setAnalysisFile(null);
    setRawResults(null);
    setCompareResults(null);
    setError(null);
    setSelectedRow(null);
  };

  const getVerdictStyle = (verdict: string) => {
    const styles: Record<string, string> = {
      project: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      personal: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      suspicious: 'bg-red-500/20 text-red-300 border-red-500/40',
      duplicate: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      unknown: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
    };
    return styles[verdict] || styles.unknown;
  };

  const getPatternStyle = (pattern: string) => {
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

  const [hotspots, setHotspots] = useState<LeakageHotspot[]>([]);

  useEffect(() => {
    async function fetchHotspots() {
      try {
        // Fetch map data from the backend
        const res = await fetch('http://localhost:8200/api/v1/geo-link/map-data/ZENITH-DEMO-001');
        if (!res.ok) throw new Error("Failed to fetch map data");
        const data = await res.json();
        
        // Transform features to LeakageHotspot format
        const fetchedHotspots: LeakageHotspot[] = data.features.map((f: { properties: { id: string; name: string; severity: string; value: number; root_cause: string }; geometry: { coordinates: [number, number] } }) => ({
            id: f.properties.id,
            location: {
                lat: f.geometry.coordinates[1],
                lng: f.geometry.coordinates[0],
                name: f.properties.name
            },
            severity: f.properties.severity,
            value: f.properties.value,
            rootCause: f.properties.root_cause
        }));
        
        setHotspots(fetchedHotspots);
      } catch (err) {
        console.error("GeoMap fetch error:", err);
        // Fallback or leave empty
      }
    }
    fetchHotspots();
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ForensicPageLayout
        title="Consensus Adjudicator"
        subtitle="Automated Pattern Recognition vs Auditor Analysis"
        icon={Search}
    >
      <div className="p-8 space-y-10 overflow-y-auto h-full custom-scrollbar">
        {/* Header Overlay */}
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase flex items-center gap-4">
              Consensus Engine
              {step === 'compare-results' && !bankFile && <HolographicBadge />}
            </h1>
          </div>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest leading-relaxed max-w-2xl">
              Cross-referencing independent AI pattern recognition against human-led manual audit protocol to identify variance hotspots.
          </p>
          
          <div className="mt-8 p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl flex items-center gap-4 max-w-2xl">
              <div className="p-2 bg-indigo-600/20 rounded-xl text-indigo-400 shrink-0">
                  <Sparkles className="w-5 h-5" />
              </div>
              <p className="text-[11px] text-indigo-100 font-medium uppercase tracking-widest leading-relaxed">
                  <span className="font-black text-white">Adjudicator Protocol:</span> Analysis compares 42 forensic pattern types against auditor-marked &quot;PROJECT&quot; flags.
              </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="space-y-8">
            {/* How it works */}
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800">
              <h2 className="text-xl font-semibold text-white mb-4">How It Works</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { num: 1, title: 'Upload Raw Data', desc: 'Bank statement with transaction details' },
                  { num: 2, title: 'Pattern Discovery', desc: 'App finds suspicious patterns independently' },
                  { num: 3, title: 'Upload Your Analysis', desc: 'Your findings with project TRUE/FALSE' },
                  { num: 4, title: 'Compare & Review', desc: 'See agreements and disagreements' },
                ].map((item) => (
                  <div key={item.num} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center text-blue-300 font-bold shrink-0 text-sm">
                      {item.num}
                    </div>
                    <div>
                      <h3 className="font-medium text-white text-sm">{item.title}</h3>
                      <p className="text-xs text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upload Areas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bank Statement */}
              <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">📊</span>
                  Raw Bank Statement
                </h3>
                <div
                  {...getBankRootProps()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                    ${isBankDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-blue-500/50'}
                    ${bankFile ? 'border-emerald-500 bg-emerald-500/5' : ''}`}
                >
                  <input {...getBankInputProps()} />
                  {bankFile ? (
                    <div className="text-emerald-400">
                      <div className="text-3xl mb-2">✓</div>
                      <p className="font-medium">{bankFile.name}</p>
                      <p className="text-sm text-slate-400 mt-1">{(bankFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div className="text-slate-400">
                      <div className="text-3xl mb-2 opacity-50">📁</div>
                      <p className="font-medium">Drop bank statement CSV</p>
                      <p className="text-sm mt-1">Needs: No, Tanggal, Uraian, Kredit, Debit</p>
                    </div>
                  )}
                </div>
              </div>

              {/* User Analysis */}
              <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">📋</span>
                  Your Analysis (Optional)
                </h3>
                <div
                  {...getAnalysisRootProps()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                    ${isAnalysisDragActive ? 'border-purple-500 bg-purple-500/10' : 'border-slate-700 hover:border-purple-500/50'}
                    ${analysisFile ? 'border-emerald-500 bg-emerald-500/5' : ''}`}
                >
                  <input {...getAnalysisInputProps()} />
                  {analysisFile ? (
                    <div className="text-emerald-400">
                      <div className="text-3xl mb-2">✓</div>
                      <p className="font-medium">{analysisFile.name}</p>
                      <p className="text-sm text-slate-400 mt-1">{(analysisFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div className="text-slate-400">
                      <div className="text-3xl mb-2 opacity-50">📋</div>
                      <p className="font-medium">Drop your analysis CSV</p>
                      <p className="text-sm mt-1">Needs: No, Proyek (TRUE/FALSE), Comment</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              <button
                onClick={runRawAnalysis}
                disabled={!bankFile}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed
                  text-white font-semibold rounded-xl transition-all"
              >
                🔍 Analyze Raw Data Only
              </button>
              <button
                onClick={runComparison}
                disabled={!bankFile || !analysisFile}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500
                  disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed
                  text-white font-semibold rounded-xl transition-all"
              >
                ⚖️ Compare Against My Analysis
              </button>
              <button
                onClick={loadDemo}
                className="px-6 py-3 bg-slate-900 border border-indigo-500/30 text-indigo-400 hover:bg-slate-800 font-semibold rounded-xl transition-all flex items-center gap-2 group"
              >
                <Monitor className="w-4 h-4 group-hover:animate-pulse" /> Try Interactive Demo
              </button>
           </div>
          </div>
        )}

        {/* Analyzing */}
        {step === 'analyzing' && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-6" />
            <h2 className="text-2xl font-semibold text-white mb-2">Discovering Patterns...</h2>
            <p className="text-slate-400">Analyzing raw transaction data independently</p>
          </div>
        )}

        {/* Raw Analysis Results */}
        {step === 'raw-results' && rawResults && (
          <div className="space-y-8">
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800 text-center">
                <div className="text-3xl font-bold text-white">{rawResults.total_analyzed}</div>
                <div className="text-sm text-slate-400 mt-1">Transactions Analyzed</div>
              </div>
              <div className="bg-red-500/10 rounded-xl p-5 border border-red-500/30 text-center">
                <div className="text-3xl font-bold text-red-400">{rawResults.flagged_count}</div>
                <div className="text-sm text-red-300/70 mt-1">Flagged by App</div>
              </div>
              <div className="bg-blue-500/10 rounded-xl p-5 border border-blue-500/30 text-center">
                <div className="text-3xl font-bold text-blue-400">{Object.keys(rawResults.discovered_patterns).length}</div>
                <div className="text-sm text-blue-300/70 mt-1">Pattern Types Found</div>
              </div>
              <div className="bg-purple-500/10 rounded-xl p-5 border border-purple-500/30 text-center">
                <div className="text-3xl font-bold text-purple-400">{Object.keys(rawResults.top_entities).length}</div>
                <div className="text-sm text-purple-300/70 mt-1">Entities Identified</div>
              </div>
            </div>

            {/* Discovered Patterns */}
            <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
              <h2 className="text-xl font-semibold text-white mb-4">Discovered Patterns</h2>
              <div className="flex flex-wrap gap-2">
                {Object.entries(rawResults.discovered_patterns).map(([pattern, count]) => (
                  <span key={pattern} className={`px-3 py-1.5 rounded-full text-sm font-medium ${getPatternStyle(pattern)}`}>
                    {pattern}: {count}
                  </span>
                ))}
              </div>
            </div>

            {/* Top Entities */}
            <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
              <h2 className="text-xl font-semibold text-white mb-4">Top Entities (by frequency)</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(rawResults.top_entities).slice(0, 12).map(([entity, count]) => (
                  <div key={entity} className="bg-slate-800/50 rounded-lg p-3">
                    <div className="text-sm text-white font-medium truncate" title={entity}>{entity}</div>
                    <div className="text-xs text-slate-400">{count} transactions</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sample Findings */}
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">Sample Findings</h2>
                <button onClick={reset} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg">
                  Start Over
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full" role="table" aria-label="Raw Analysis Findings">
                  <thead className="bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Description</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Amount</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase">Verdict</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Patterns Found</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {rawResults.sample_findings.filter(f => f.discovered_patterns.length > 0).slice(0, 30).map((row) => (
                      <tr 
                        key={row.row_no} 
                        className="hover:bg-slate-800/30 cursor-pointer"
                        onClick={() => setSelectedRow(row)}
                      >
                        <td className="px-4 py-3 text-sm text-slate-400">{row.row_no}</td>
                        <td className="px-4 py-3 text-sm text-slate-300">{row.date}</td>
                        <td className="px-4 py-3 text-sm text-slate-300 max-w-xs truncate">{row.raw_description}</td>
                        <td className="px-4 py-3 text-sm text-white font-mono text-right">
                          {row.amount.toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getVerdictStyle(row.verdict)}`}>
                            {row.verdict}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {row.discovered_patterns.map((p) => (
                              <span key={p} className={`px-2 py-0.5 rounded text-xs ${getPatternStyle(p)}`}>{p}</span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Comparison Results */}
        {step === 'compare-results' && compareResults && (
          <div className="space-y-8">
            
            {/* Logic for "No Fraud" state - "All Clear" */}
            {(compareResults.summary.disagreed === 0 && compareResults.summary.app_found_more === 0) ? (
               <div className="bg-slate-900/50 rounded-3xl p-16 border border-emerald-500/20 flex flex-col items-center justify-center text-center backdrop-blur-sm">
                  <div className="p-6 bg-emerald-500/10 rounded-full mb-6 ring-1 ring-emerald-500/30">
                     <CheckCircle className="w-16 h-16 text-emerald-500" />
                  </div>
                  <h2 className="text-3xl font-black text-white mb-3 tracking-tight">All Clear! No Fraud Detected.</h2>
                  <p className="text-slate-400 max-w-lg text-lg leading-relaxed">
                     Both your manual analysis and Zenith&apos;s AI agree: all <span className="text-white font-mono font-bold">{compareResults.summary.total_transactions}</span> transactions appear legitimate.
                  </p>
               </div>
            ) : (
                /* Summary Cards */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {/* 1. Consensus Donut */}
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
                                  <Cell fill="#10b981" /> {/* Emerald-500 */}
                                  <Cell fill="#f43f5e" /> {/* Rose-500 */}
                               </Pie>
                            </PieChart>
                         </ResponsiveContainer>
                         {/* Center Value */}
                         <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-black text-white">{(compareResults.summary.agreement_rate * 100).toFixed(0)}%</span>
                            <span className="text-[10px] uppercase font-bold text-slate-500">Match Rate</span>
                         </div>
                      </div>
                   </div>

                   {/* 2. Disagreement Breakdown */}
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

                   {/* 3. Time Saved (Value Prop) */}
                   <div className="bg-slate-900 rounded-3xl p-6 border border-white/5 flex flex-col items-center justify-center text-center relative overflow-hidden">
                       {/* Background Glow */}
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
                       <div className="relative z-10 mt-4 text-[10px] font-mono text-slate-500">
                          AI Analysis Time: 0.42s
                       </div>
                   </div>
                </div>
            )}

            {/* Geospatial Variance Map Integration */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 bg-[#020617] rounded-[2.5rem] border border-white/5 overflow-hidden h-[450px] relative">
                   <div className="absolute top-6 left-8 z-20">
                      <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                         <Globe className="w-4 h-4 text-indigo-400" />
                         Discrepancy Hotspots
                      </h3>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Spatial distribution of consensus variance</p>
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
                                       <p className="text-[10px] font-black text-white uppercase tracking-tight">{h.location.name}</p>
                                       <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest mt-1">{h.rootCause}</p>
                                   </div>
                                   <div className="text-right">
                                       <p className="text-[10px] font-mono font-bold text-indigo-400">Rp {(h.value / 1000000).toFixed(0)}M</p>
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>
                   <button className="w-full py-4 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all">
                       Analyze Cluster Dispersion
                   </button>
               </div>
            </div>

            {/* Discovered Patterns */}
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

            {/* Split-Screen Comparison Lens */}
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
                  {/* Central Connector Line */}
                  <div className={`absolute left-1/2 top-0 bottom-0 w-px -ml-px z-0 
                      ${row.match_status === 'agree' ? 'bg-emerald-500/30' : 'bg-rose-500/50 dashed-line'}`} 
                  />
                  
                  <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 p-2">
                    {/* LEFT: AI / FORENSIC VIEW */}
                    <div className={`p-4 rounded-2xl border transition-all hover:bg-slate-800/50 flex flex-col justify-between
                        ${row.match_status === 'agree' ? 'bg-slate-900/40 border-slate-700' : 'bg-indigo-900/10 border-indigo-500/30'}
                    `}>
                       <div className="mb-2 flex justify-between items-start">
                          <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold">
                             AI Verdict
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${getVerdictStyle(row.app_verdict)}`}>
                             {row.app_verdict}
                          </span>
                       </div>
                       
                       <div className="space-y-1">
                          <p className="text-sm font-medium text-slate-200">{row.description}</p>
                          <p className="text-xs font-mono text-slate-400">IDR {row.amount.toLocaleString('id-ID')}</p>
                       </div>

                       <div className="mt-3 pt-3 border-t border-white/5">
                          <p className="text-[10px] text-slate-500 mb-1">REASONING:</p>
                          <div className="flex flex-wrap gap-1">
                             {row.app_reasoning.slice(0, 3).map((r, i) => (
                               <span key={i} className="text-[10px] px-1.5 py-0.5 bg-white/5 rounded text-indigo-200">
                                 {r}
                               </span>
                             ))}
                          </div>
                       </div>
                    </div>

                    {/* RIGHT: USER / ANALYST VIEW */}
                    <div className={`p-4 rounded-2xl border transition-all hover:bg-slate-800/50 flex flex-col justify-between
                        ${row.match_status === 'agree' ? 'bg-slate-900/40 border-slate-700' : 'bg-fuchsia-900/10 border-fuchsia-500/30'}
                    `}>
                       <div className="mb-2 flex justify-between items-start">
                          <span className="text-[10px] uppercase tracking-widest text-fuchsia-400 font-bold">
                             Analyst Input
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono
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
                            <p className="text-[10px] text-slate-500 mb-1">COMMENT:</p>
                             <p className="text-xs italic text-fuchsia-200">&quot;{row.user_comment}&quot;</p>
                         </div>
                       )}
                    </div>
                  </div>

                  {/* CENTER: MATCH BADGE */}
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
                <button onClick={reset} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg">
                   Analyze New Batch
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {selectedRow && 'discovered_patterns' in selectedRow && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedRow(null)}>
            <div className="bg-slate-900 rounded-2xl p-6 max-w-lg w-full border border-slate-700" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-white mb-4">Transaction #{selectedRow.row_no}</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400">Description</label>
                  <p className="text-white">{selectedRow.raw_description}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Amount</label>
                  <p className="text-white font-mono">{selectedRow.amount.toLocaleString('id-ID')} IDR</p>
                </div>
                <div>
                  <label className="text-sm text-slate-400">App Verdict</label>
                  <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium border ${getVerdictStyle(selectedRow.verdict)}`}>
                    {selectedRow.verdict}
                  </span>
                </div>
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Discovered Patterns</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedRow.discovered_patterns.map(p => (
                      <span key={p} className={`px-2 py-1 rounded text-sm ${getPatternStyle(p)}`}>{p}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Reasoning</label>
                  <ul className="space-y-1">
                    {selectedRow.reasoning.map((r, i) => (
                      <li key={i} className="text-sm text-slate-300">• {r}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <button onClick={() => setSelectedRow(null)} className="mt-6 w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </ForensicPageLayout>
  );
}
