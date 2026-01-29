'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { API_URL } from '@/utils/constants';
import { useProject } from '@/store/useProject';

interface OptimizationResult {
  strategy: string;
  status: string;
  matches_found?: number;
  bursts_found?: number;
  loops_found?: number;
  deviation?: number;
  message?: string;
}

const STRATEGIES = [
  {
    id: 'waterfall',
    name: 'Waterfall Match Thinning',
    description: 'Multi-pass exact and approximate matching',
    icon: TrendingUp,
  },
  {
    id: 'fuzzy',
    name: 'Fuzzy Vector Search',
    description: 'Semantic similarity matching using embeddings',
    icon: Zap,
  },
  {
    id: 'structuring',
    name: 'Temporal Velocity Profiling',
    description: 'Detect smurfing and burst patterns',
    icon: AlertTriangle,
  },
  {
    id: 'striping',
    name: 'Tax/Fee Striping',
    description: 'Match transactions with overhead adjustments',
    icon: CheckCircle2,
  },
];

export default function ReconciliationOptimizer() {
  const { activeProjectId } = useProject();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [results, setResults] = useState<OptimizationResult[]>([]);
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([
    'waterfall',
    'fuzzy',
  ]);

  const runOptimization = async () => {
    if (!activeProjectId) return;

    setIsOptimizing(true);
    setResults([]);

    try {
      const response = await fetch(
        `${API_URL}/forensic/mcp/optimize-reconciliation`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: activeProjectId,
            strategies: selectedStrategies,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Optimization failed');
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Optimization error:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const toggleStrategy = (id: string) => {
    setSelectedStrategies((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  return (
    <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-400" />
            AI-Powered Reconciliation
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Select strategies to auto-match transactions
          </p>
        </div>
        <button
          onClick={runOptimization}
          disabled={isOptimizing || selectedStrategies.length === 0}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl text-white font-black text-sm uppercase tracking-wider transition-colors flex items-center gap-2"
        >
          {isOptimizing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Optimizing...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Run Optimization
            </>
          )}
        </button>
      </div>

      {/* Strategy Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {STRATEGIES.map((strategy) => {
          const isSelected = selectedStrategies.includes(strategy.id);
          const Icon = strategy.icon;

          return (
            <button
              key={strategy.id}
              onClick={() => toggleStrategy(strategy.id)}
              className={`p-4 rounded-xl border transition-all text-left ${
                isSelected
                  ? 'bg-indigo-500/10 border-indigo-500/30 ring-2 ring-indigo-500/20'
                  : 'bg-slate-800/30 border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    isSelected
                      ? 'bg-indigo-600'
                      : 'bg-slate-700'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isSelected ? 'text-white' : 'text-slate-400'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <p
                    className={`text-sm font-bold ${
                      isSelected ? 'text-white' : 'text-slate-300'
                    }`}
                  >
                    {strategy.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {strategy.description}
                  </p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-500'
                      : 'border-slate-600'
                  }`}
                >
                  {isSelected && (
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Optimization Results
          </h4>
          {results.map((result, i) => (
            <div
              key={i}
              className="bg-slate-800/50 border border-white/5 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">
                    {result.strategy}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Status: {result.status}
                  </p>
                </div>
                {result.matches_found !== undefined && (
                  <div className="text-right">
                    <p className="text-2xl font-black text-emerald-400">
                      {result.matches_found}
                    </p>
                    <p className="text-xs text-slate-500">matches</p>
                  </div>
                )}
                {result.bursts_found !== undefined && (
                  <div className="text-right">
                    <p className="text-2xl font-black text-amber-400">
                      {result.bursts_found}
                    </p>
                    <p className="text-xs text-slate-500">bursts detected</p>
                  </div>
                )}
                {result.loops_found !== undefined && (
                  <div className="text-right">
                    <p className="text-2xl font-black text-rose-400">
                      {result.loops_found}
                    </p>
                    <p className="text-xs text-slate-500">circular flows</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {!activeProjectId && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
          <p className="text-sm text-amber-300">
            Please select a project to run optimization
          </p>
        </div>
      )}
    </div>
  );
}
