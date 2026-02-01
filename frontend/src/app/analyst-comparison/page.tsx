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
        const res = await fetch('http://localhost:8200/api/v1/geo-link/map-data/ZENITH-DEMO-001');
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
      <div className="p-8 space-y-10 overflow-y-auto h-full custom-scrollbar">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase flex items-center gap-4">
              Consensus Engine
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

        {step === 'upload' && (
          <UploadStep
            bankFile={bankFile}
            analysisFile={analysisFile}
            onDropBank={onDropBank}
            onDropAnalysis={onDropAnalysis}
            onRunRawAnalysis={runRawAnalysis}
            onRunComparison={runComparison}
          />
        )}

        {step === 'analyzing' && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-6" />
            <h2 className="text-2xl font-semibold text-white mb-2">Discovering Patterns...</h2>
            <p className="text-slate-400">Analyzing raw transaction data independently</p>
          </div>
        )}

        {step === 'raw-results' && rawResults && (
          <AnalysisResults
            rawResults={rawResults}
            onReset={reset}
            setSelectedRow={setSelectedRow}
          />
        )}

        {step === 'compare-results' && compareResults && (
          <ComparisonTable
            compareResults={compareResults}
            hotspots={hotspots}
            onReset={reset}
          />
        )}

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
                  <span className="ml-2 px-3 py-1 rounded-full text-sm font-medium border bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                    {selectedRow.verdict}
                  </span>
                </div>
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Discovered Patterns</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedRow.discovered_patterns.map(p => (
                      <span key={p} className="px-2 py-1 rounded text-sm bg-slate-500/30 text-slate-200">{p}</span>
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
