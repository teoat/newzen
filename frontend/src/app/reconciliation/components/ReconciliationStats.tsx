/**
 * ReconciliationStats - Component for displaying reconciliation statistics
 */

import React from 'react';
import { ArrowRightLeft, ShieldCheck, Settings2 } from 'lucide-react';

interface TopMetricProps {
  label: string;
  val: number;
  danger?: boolean;
  ariaLabel?: string;
}

export function TopMetric({ label, val, danger = false, ariaLabel }: TopMetricProps) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-xs font-black text-depth-secondary uppercase tracking-wider">
        {label}
      </span>
      <div 
        className={`text-2xl font-black italic ${
          danger ? 'text-rose-500' : 'text-emerald-500'
        }`}
        aria-label={ariaLabel || `${label}: ${val}`}
      >
        {val.toLocaleString()}
      </div>
    </div>
  );
}

interface ReconciliationStatsProps {
  matches: any[];
  bankRecords: any[];
  matchedBankIds: Set<string>;
  onAutoConfirm: () => void;
  onOpenSettings: () => void;
  isLoading?: boolean;
}

export function ReconciliationStats({
  matches,
  bankRecords,
  matchedBankIds,
  onAutoConfirm,
  onOpenSettings,
  isLoading = false
}: ReconciliationStatsProps) {
  const directMatchesCount = React.useMemo(
    () => matches.filter(m => m.match_type === 'direct').length,
    [matches]
  );
  
  const aggregatedMatchesCount = React.useMemo(
    () => matches.filter(m => m.match_type === 'aggregate').length,
    [matches]
  );
  
  const discrepanciesCount = React.useMemo(
    () => bankRecords.length - matchedBankIds.size,
    [bankRecords, matchedBankIds]
  );
  
  const autoConfirmableCount = React.useMemo(
    () => matches.filter(m => m.ai_reasoning?.includes('AUTO_OK')).length,
    [matches]
  );

  return (
    <header 
      className="h-16 border-b depth-border-subtle depth-layer-1 backdrop-blur-xl flex items-center justify-between px-10 shrink-0 z-50" 
      role="banner"
      aria-label="Reconciliation statistics and controls"
    >
      <div className="flex items-center gap-8">
        <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20" aria-hidden="true">
          <ArrowRightLeft className="w-6 h-6 text-indigo-500" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none" id="reconciliation-title">
            FORENSIC_CONSENSUS_HUB
          </h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1 italic" aria-live="polite">
            Handshake Integrity: <span className="text-emerald-500" aria-label="System status optimal">OPTIMAL</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-10">
        <div 
          className="flex gap-8" 
          role="group" 
          aria-label="Reconciliation metrics"
        >
          <TopMetric 
            label="Direct Matches" 
            val={directMatchesCount}
            ariaLabel={`Direct matches: ${directMatchesCount}`}
          />
          <TopMetric 
            label="Aggregated" 
            val={aggregatedMatchesCount}
            ariaLabel={`Aggregated matches: ${aggregatedMatchesCount}`}
          />
          <TopMetric 
            label="Discrepancies" 
            val={discrepanciesCount}
            danger
            ariaLabel={`Discrepancies: ${discrepanciesCount}`}
          />
        </div>
        
        <div className="w-px h-10 bg-white/5" aria-hidden="true" />

        {/* Auto-Confirm Button */}
        {autoConfirmableCount > 0 && (
          <button
            onClick={onAutoConfirm}
            disabled={isLoading}
            className="flex items-center gap-3 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2.5 rounded-xl border border-emerald-500/20 transition-all group depth-elevate depth-shadow-sm hover:depth-shadow-glow focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            aria-label={`Auto-confirm ${autoConfirmableCount} matches`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform duration-300" aria-hidden="true" />
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400 italic">
              Auto-Confirm ({autoConfirmableCount})
            </span>
          </button>
        )}

        <button 
          onClick={onOpenSettings}
          className="flex items-center gap-3 depth-layer-2 hover:depth-layer-3 px-6 py-2.5 rounded-xl depth-border-subtle transition-all group depth-elevate focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          aria-label="Open engine configuration settings"
        >
          <Settings2 className="w-4 h-4 text-depth-secondary group-hover:rotate-90 transition-transform duration-500" aria-hidden="true" />
          <span className="text-xs font-black uppercase tracking-widest text-depth-primary italic">Engine Config</span>
        </button>
      </div>
    </header>
  );
}