'use client';

import React from 'react';
import { CheckCircle } from 'lucide-react';

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

interface RawAnalysisResponse {
  total_analyzed: number;
  verdicts: Record<string, number>;
  discovered_patterns: Record<string, number>;
  top_entities: Record<string, number>;
  flagged_count: number;
  sample_findings: AppFinding[];
}

interface AnalysisResultsProps {
  rawResults: RawAnalysisResponse;
  onReset: () => void;
  setSelectedRow: (row: AppFinding | null) => void;
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

export function AnalysisResults({ rawResults, onReset, setSelectedRow }: AnalysisResultsProps) {
  return (
    <div className="space-y-8">
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

      <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">Sample Findings</h2>
          <button onClick={onReset} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg">
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
  );
}
