'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Receipt, Briefcase, FileText, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '@/utils/constants';

interface TransactionResult {
  id: string;
  description: string;
  sender: string;
  receiver: string;
  actual_amount: number;
}

interface CaseResult {
  id: string;
  title: string;
  status: string;
  priority: string;
}

interface ExhibitResult {
  id: string;
  filename: string;
  type: string;
  description: string;
}

interface SearchResult {
  transactions: TransactionResult[];
  cases: CaseResult[];
  exhibits: ExhibitResult[];
}

interface SearchPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  activeProjectId: string;
}

export const SearchPalette: React.FC<SearchPaletteProps> = ({ isOpen, onClose, activeProjectId }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        // Toggle logic handled by parent
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${API_URL}/api/v1/forensic/${activeProjectId}/search?q=${encodeURIComponent(query)}`
        );
        const data = await response.json();
        setResults(data.results);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, activeProjectId]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-2xl bg-slate-900/90 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input Header */}
            <div className="flex items-center gap-3 p-4 border-b border-slate-700/50">
              <Search className="h-5 w-5 text-cyan-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search transactions, cases, evidence... (Cmd+K)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-slate-100 placeholder:text-slate-500 text-lg"
              />
              {isLoading ? (
                <Loader2 className="h-5 w-5 text-cyan-500 animate-spin" />
              ) : (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-700 bg-slate-800 text-[10px] text-slate-400 font-mono">
                  ESC
                </div>
              )}
            </div>

            {/* Results Area */}
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {query.length < 2 ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                  <Search className="h-12 w-12 mb-4 opacity-20" />
                  <p>Type at least 2 characters to search the intelligence bank</p>
                </div>
              ) : results ? (
                <div className="space-y-4 p-2">
                  {/* Transactions Section */}
                  {results.transactions.length > 0 && (
                    <section>
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2 flex items-center gap-2">
                        <Receipt className="h-3 w-3" />
                        Transactions
                      </h3>
                      <div className="space-y-1">
                        {results.transactions.map((tx) => (
                          <button
                            key={tx.id}
                            className="w-full text-left p-3 rounded-xl hover:bg-slate-800/50 transition-colors group flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                                <Receipt className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-slate-200">{tx.description}</div>
                                <div className="text-xs text-slate-500">
                                  {tx.sender} → {tx.receiver} • IDR {tx.actual_amount?.toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Cases Section */}
                  {results.cases.length > 0 && (
                    <section>
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2 flex items-center gap-2">
                        <Briefcase className="h-3 w-3" />
                        Cases
                      </h3>
                      <div className="space-y-1">
                        {results.cases.map((c) => (
                          <button
                            key={c.id}
                            className="w-full text-left p-3 rounded-xl hover:bg-slate-800/50 transition-colors group flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                                <Briefcase className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-slate-200">{c.title}</div>
                                <div className="text-xs text-slate-500">{c.status} • {c.priority} Priority</div>
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Exhibits Section */}
                  {results.exhibits.length > 0 && (
                    <section>
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2 flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        Evidence
                      </h3>
                      <div className="space-y-1">
                        {results.exhibits.map((ex) => (
                          <button
                            key={ex.id}
                            className="w-full text-left p-3 rounded-xl hover:bg-slate-800/50 transition-colors group flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                                <FileText className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-slate-200">{ex.filename}</div>
                                <div className="text-xs text-slate-500">{ex.type} • {ex.description}</div>
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-purple-400 transition-colors" />
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  {results.transactions.length === 0 && results.cases.length === 0 && results.exhibits.length === 0 && (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                      <p>No results found for &quot;{query}&quot;</p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-900/50 border-t border-slate-700/30 flex items-center justify-between text-[10px] text-slate-500 font-medium">
              <div className="flex gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 rounded bg-slate-800 border border-slate-700">↑↓</kbd> to navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 rounded bg-slate-800 border border-slate-700">ENTER</kbd> to select
                </span>
              </div>
              <div className="text-cyan-500/50 select-none">ZENITH INTELLIGENCE COMMAND</div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
