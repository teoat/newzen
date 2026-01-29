'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, X, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { API_URL } from '@/utils/constants';

interface AIExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string;
}

interface AIRationale {
  primary: string;
  alternative: string | null;
  confidence: number;
  keywords: string[];
  inner_monologue: string;
}

export default function AIExplainerModal({
  isOpen,
  onClose,
  transactionId,
}: AIExplainerModalProps) {
  const [rationale, setRationale] = useState<AIRationale | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRationale = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_URL}/forensic/mcp/rationale/${transactionId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch AI rationale');
      }

      const data = await response.json();
      setRationale(data.rationale);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [transactionId]);

  React.useEffect(() => {
    if (isOpen && transactionId) {
      void fetchRationale();
    }
  }, [isOpen, transactionId, fetchRationale]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-3xl shadow-2xl max-w-2xl w-full"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border-b border-white/5 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-600 rounded-xl">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">
                      AI Forensic Analysis
                    </h2>
                    <p className="text-xs text-indigo-300 mt-0.5 font-mono">
                      Transaction ID: {transactionId.substring(0, 12)}...
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  title="Close"
                  className="p-2 hover:bg-white/5 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {isLoading && (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    <p className="text-sm text-slate-400 animate-pulse">
                      Analyzing transaction patterns...
                    </p>
                  </div>
                )}

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-red-300">
                        Analysis Failed
                      </p>
                      <p className="text-xs text-red-400/80 mt-1">{error}</p>
                    </div>
                  </div>
                )}

                {rationale && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* Confidence Score */}
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                          Confidence Score
                        </span>
                        <span className="text-lg font-black text-white">
                          {rationale.confidence}%
                        </span>
                      </div>
                      <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${rationale.confidence}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className={`h-full ${
                            rationale.confidence >= 80
                              ? 'bg-emerald-500'
                              : rationale.confidence >= 60
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Primary Classification */}
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-black text-indigo-300 uppercase tracking-widest">
                          Primary Classification
                        </span>
                      </div>
                      <p className="text-white font-bold">
                        {rationale.primary}
                      </p>
                    </div>

                    {/* Alternative Hypothesis */}
                    {rationale.alternative && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                        <span className="text-xs font-black text-amber-300 uppercase tracking-widest block mb-2">
                          Alternative Hypothesis
                        </span>
                        <p className="text-white font-bold">
                          {rationale.alternative}
                        </p>
                      </div>
                    )}

                    {/* Keywords */}
                    {rationale.keywords.length > 0 && (
                      <div>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">
                          Detected Patterns
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {rationale.keywords.map((keyword, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 bg-slate-800 border border-white/10 rounded-lg text-xs font-mono text-slate-300"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Inner Monologue */}
                    <div className="bg-slate-800/30 border border-white/5 rounded-xl p-4">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">
                        AI Reasoning Log
                      </span>
                      <p className="text-sm text-slate-300 font-mono leading-relaxed">
                        {rationale.inner_monologue}
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-slate-950/50 border-t border-white/5 p-4 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-white font-bold text-sm transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
