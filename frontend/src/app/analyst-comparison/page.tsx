'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Sparkles, Search } from 'lucide-react';
import ForensicPageLayout from '../components/ForensicPageLayout';
import { UploadStep } from './FileUploadZone';
import { AnalysisResults } from './AnalysisResults';
import { ComparisonTable } from './ComparisonTable';

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
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
  : 'http://localhost:8000';

export default function AnalystComparisonPage() {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>('upload');
  const [bankFile, setBankFile] = useState<File | null>(null);
  const [analysisFile, setAnalysisFile] = useState<File | null>(null);
  const [rawResults, setRawResults] = useState<RawAnalysisResponse | null>(null);
  const [compareResults, setCompareResults] = useState<ComparisonResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<AppFinding | ComparisonResult | null>(null);
  const [hotspots, setHotspots] = useState<Array<{
    id: string;
    location: { lat: number; lng: number; name: string };
    severity: number;
    value: number;
    rootCause: string;
  }>>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const onDropBank = useCallback((files: File[]) => {
    if (files.length > 0) setBankFile(files[0]);
  }, []);

  const onDropAnalysis = useCallback((files: File[]) => {
    if (files.length > 0) setAnalysisFile(files[0]);
  }, []);

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

  const reset = () => {
    setStep('upload');
    setBankFile(null);
    setAnalysisFile(null);
    setRawResults(null);
    setCompareResults(null);
    setError(null);
    setSelectedRow(null);
  };

  useEffect(() => {
    async function fetchHotspots() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/v1/geo-link/map-data/ZENITH-DEMO-001`);
        if (!res.ok) throw new Error("Failed to fetch map data");
        const data = await res.json();
        
        const fetchedHotspots = data.features.map((f: { properties: { id: string; name: string; severity: string; value: number; root_cause: string }; geometry: { coordinates: [number, number] } }) => ({
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
      <div className="relative h-full overflow-y-auto custom-scrollbar bg-indigo-950/10 p-10 space-y-10">
        {/* Indigo Gradient Overlay */}
        <div className="fixed inset-0 bg-gradient-to-br from-indigo-900/10 via-transparent to-slate-950 pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase flex items-center gap-4 drop-shadow-lg">
              Consensus Engine
            </h1>
          </div>
          <p className="text-indigo-200/60 font-bold text-sm uppercase tracking-widest leading-relaxed max-w-2xl">
              Cross-referencing independent AI pattern recognition against human-led manual audit protocol to identify variance hotspots.
          </p>
          
          <div className="mt-8 p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl flex items-center gap-4 max-w-2xl backdrop-blur-sm shadow-xl shadow-indigo-900/20">
              <div className="p-2 bg-indigo-600/20 rounded-xl text-indigo-400 shrink-0">
                  <Sparkles className="w-5 h-5" />
              </div>
              <p className="text-[11px] text-indigo-100 font-medium uppercase tracking-widest leading-relaxed">
                  <span className="font-black text-white">Adjudicator Protocol:</span> Analysis compares 42 forensic pattern types against auditor-marked &quot;PROJECT&quot; flags.
              </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 relative z-10">
            <strong>Error:</strong> {error}
          </div>
        )}

        {step === 'upload' && (
          <div className="relative z-10">
            <UploadStep
                bankFile={bankFile}
                analysisFile={analysisFile}
                onDropBank={onDropBank}
                onDropAnalysis={onDropAnalysis}
                onRunRawAnalysis={runRawAnalysis}
                onRunComparison={runComparison}
            />
          </div>
        )}

        {step === 'analyzing' && (
          <div className="flex flex-col items-center justify-center py-20 relative z-10">
            <div className="w-20 h-20 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-6 shadow-2xl shadow-indigo-500/50" />
            <h2 className="text-2xl font-semibold text-white mb-2">Discovering Patterns...</h2>
            <p className="text-indigo-300/60">Analyzing raw transaction data independently</p>
          </div>
        )}

        {step === 'raw-results' && rawResults && (
           <div className="relative z-10">
              <AnalysisResults
                rawResults={rawResults}
                onReset={reset}
                setSelectedRow={setSelectedRow}
              />
           </div>
        )}

        {step === 'compare-results' && compareResults && (
           <div className="relative z-10">
              <ComparisonTable
                compareResults={compareResults}
                hotspots={hotspots}
                onReset={reset}
              />
           </div>
        )}

        {selectedRow && 'discovered_patterns' in selectedRow && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setSelectedRow(null)}>
            <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-8 max-w-lg w-full shadow-2xl shadow-indigo-900/50 relative overflow-hidden" onClick={e => e.stopPropagation()}>
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
              <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tight flex items-center gap-2">
                <Search className="w-5 h-5 text-indigo-400" />
                Transaction #{selectedRow.row_no}
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-1">Description</label>
                  <p className="text-white bg-white/5 p-3 rounded-lg border border-white/5">{selectedRow.raw_description}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-1">Amount</label>
                  <p className="text-white font-mono text-lg">{selectedRow.amount.toLocaleString('id-ID')} IDR</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-1">App Verdict</label>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-black border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 uppercase tracking-widest">
                    {selectedRow.verdict}
                  </span>
                </div>
                <div>
                  <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-2">Discovered Patterns</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedRow.discovered_patterns.map(p => (
                      <span key={p} className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">{p}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-2">Reasoning</label>
                  <ul className="space-y-2">
                    {selectedRow.reasoning.map((r, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="text-indigo-500 mt-1">▶</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <button onClick={() => setSelectedRow(null)} className="mt-8 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold uppercase tracking-widest transition-all">
                Close Dossier
              </button>
            </div>
          </div>
        )}
      </div>
    </ForensicPageLayout>
  );
}
