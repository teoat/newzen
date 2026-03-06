/**
 * ReconciliationGrid - Component for displaying the two-column reconciliation grid
 */

import React from 'react';
import { authenticatedFetch } from '@/lib/api';
import { useProject } from '@/store/useProject';

function HeuristicBalanceRow({ projectId }: { projectId: string }) {
    const [data, setData] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);
    
    React.useEffect(() => {
        if(!projectId) return;
        authenticatedFetch(`/api/v1/forensic-tools/${projectId}/reconstruction/heuristic-balance`)
            .then(res => res.json())
            .then(d => {
                setData(d);
                setLoading(false);
            })
            .catch(e => {
                console.error(e);
                setLoading(false);
            })
    }, [projectId]);

    if (loading) return <div className="mt-2 pt-2 border-t border-dashed border-white/10 text-[10px] text-slate-500 font-mono animate-pulse">Calculating Projection...</div>;
    
    return (
        <div className="mt-2 pt-2 border-t border-dashed border-white/10 text-[10px] text-slate-500 font-mono flex justify-between">
            <span className={data?.confidence > 0.8 ? "text-emerald-500" : "text-amber-500"}>
                Projected Balance ({Math.round(data?.confidence * 100)}% Conf.):
            </span>
            <span className="text-slate-400">
                {(data?.projected_balance || 0).toLocaleString()} IDR
            </span>
        </div>
    );
}

interface ReconciliationGridProps {
  bankRecords: any[];
  expenseRecords: any[];
  unmatchedBankRecords: any[];
  unmatchedInternalRecords: any[];
  matches: any[];
  onConfirmMatch: (matchId: string) => void;
  isLoading?: boolean;
}

export function ReconciliationGrid({
  bankRecords,
  expenseRecords,
  unmatchedBankRecords,
    unmatchedInternalRecords,
    matches,
    onConfirmMatch,
    isLoading = false

}: ReconciliationGridProps) {
  const { activeProjectId } = useProject();
  const [showHeuristic, setShowHeuristic] = React.useState(false);

  return (
    <main 
      className="flex-1 flex overflow-hidden relative"
      role="main"
      aria-label="Transaction reconciliation workspace"
    >
      {/* Background Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
        aria-hidden="true"
      />

      <div className="flex-1 flex relative z-10">
        {/* Bank Transactions Column */}
        <section 
          className="w-1/2 border-r depth-border-subtle depth-layer-1 overflow-y-auto"
          role="region"
          aria-labelledby="bank-column-title"
        >
          <div className="p-6 bg-gradient-to-b from-emerald-500/5 to-transparent">
            <div className="flex items-center justify-between mb-6">
                <h2 
                    id="bank-column-title"
                    className="text-sm font-black text-emerald-400 uppercase tracking-[0.15em]"
                >
                    Bank Statements ({unmatchedBankRecords.length})
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowHeuristic(!showHeuristic)}
                        className={`
                            px-2 py-1 rounded text-[10px] font-mono border transition-all
                            ${showHeuristic 
                                ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' 
                                : 'bg-slate-800/50 border-white/10 text-slate-500 hover:text-indigo-300'
                            }
                        `}
                    >
                        {showHeuristic ? 'HEURISTIC MODE: ON' : 'ENABLE RECONSTRUCTION'}
                    </button>
                    <div className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400">
                        TRUTH SOURCE
                    </div>
                </div>
            </div>
            <div className="space-y-3">
              {unmatchedBankRecords.slice(0, 50).map((record, index) => (
                <div
                  key={record.id}
                  className="depth-layer-2 p-4 rounded-2xl depth-border-subtle border hover:border-indigo-500/30 transition-all"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      // Handle selection
                    }
                  }}
                  aria-label={`Bank transaction: ${record.description}, amount: ${record.amount}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-xs text-depth-primary font-medium mb-1">
                        {record.description}
                      </p>
                      <p className="text-lg font-black text-emerald-500">
                        {record.amount.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-xs text-depth-secondary ml-4">
                      {new Date(record.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                  {showHeuristic && activeProjectId && (
                    <HeuristicBalanceRow projectId={activeProjectId} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Internal Transactions Column */}
        <section 
          className="w-1/2 depth-layer-1 overflow-y-auto"
          role="region"
          aria-labelledby="internal-column-title"
        >
          <div className="p-6 bg-gradient-to-b from-amber-500/5 to-transparent">
            <div className="flex items-center justify-between mb-6">
                <h2 
                    id="internal-column-title"
                    className="text-sm font-black text-amber-400 uppercase tracking-[0.15em]"
                >
                    Internal Ledger ({unmatchedInternalRecords.length})
                </h2>
                <div className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] font-mono text-amber-400">
                    SUBJECTIVE
                </div>
            </div>
            <div className="space-y-3">
              {unmatchedInternalRecords.slice(0, 50).map((record, index) => (
                <div
                  key={record.id}
                  className="depth-layer-2 p-4 rounded-2xl depth-border-subtle border hover:border-indigo-500/30 transition-all"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      // Handle selection
                    }
                  }}
                  aria-label={`Internal transaction: ${record.description}, amount: ${record.amount}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-xs text-depth-primary font-medium mb-1">
                        {record.description}
                      </p>
                      <p className="text-lg font-black text-amber-500">
                        {record.actual_amount?.toLocaleString() || record.amount?.toLocaleString()}
                      </p>
                      {record.category_code && (
                        <span className="inline-block text-[8px] px-2 py-1 bg-slate-800 text-slate-300 rounded-lg uppercase tracking-wider mt-2">
                          {record.category_code}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-depth-secondary ml-4">
                      {new Date(record.transaction_date || record.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div 
          className="absolute inset-0 bg-slate-900/80 flex items-center justify-center z-50"
          role="status"
          aria-live="polite"
        >
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-white font-medium">Processing reconciliation...</p>
          </div>
        </div>
      )}
    </main>
  );
}