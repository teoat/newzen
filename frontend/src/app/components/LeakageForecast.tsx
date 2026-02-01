/**
 * OPTIMIZED LeakageForecast Component
 * 
 * PERFORMANCE FIXES:
 * - Replaced framer-motion with CSS animations (reduced bundle by ~30KB)
 * - Added aria-live region for dynamic updates
 * - Added proper loading state with skeleton
 * - Memoized component with React.memo to prevent re-renders
 * - Added proper semantic structure
 */

'use client';

import React, { memo } from 'react';
import { TrendingUp, AlertTriangle } from 'lucide-react';

interface ForecastResult {
  project_name: string;
  contract_value: number;
  realized_spend: number;
  current_leakage: number;
  leakage_rate_percent: number;
  predicted_total_leakage: number;
  risk_status: string;
}

interface LeakageForecastProps {
  data?: ForecastResult;
  isLoading?: boolean;
}

// CSS Animation keyframes (inline for zero-dependency animations)
const fadeInKeyframes = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const LeakageForecast = memo(function LeakageForecast({ 
  data, 
  isLoading = false 
}: LeakageForecastProps) {
  const isHighRisk = data && (data.leakage_rate_percent || 0) > 10;

  if (isLoading) {
    return (
      <div 
        className="p-6 rounded-2xl bg-slate-900/50 border border-white/5 animate-pulse"
        role="status"
        aria-label="Loading forecast data"
      >
        <div className="h-4 bg-slate-700 rounded w-3/4 mb-4" />
        <div className="h-8 bg-slate-700 rounded w-1/2 mb-2" />
        <div className="h-2 bg-slate-700 rounded w-full" />
      </div>
    );
  }

  return (
    <>
      <style>{fadeInKeyframes}</style>
      <div 
        className="space-y-4"
        style={{ animation: 'fadeInUp 0.3s ease-out' }}
        role="region"
        aria-label="Leakage Forecast"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            Forecast Analysis
          </h3>
          {isHighRisk && (
            <span 
              className="flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20"
              role="status"
              aria-live="polite"
            >
              <AlertTriangle className="w-3 h-3" aria-hidden="true" />
              High Risk
            </span>
          )}
        </div>

        <div 
          className="p-4 rounded-xl bg-slate-900/50 border border-white/5"
          aria-live="polite"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp 
              className={`w-4 h-4 ${isHighRisk ? 'text-rose-400' : 'text-emerald-400'}`} 
              aria-hidden="true"
            />
            <span className="text-xs text-slate-500 uppercase tracking-wider">
              Predicted Total
            </span>
          </div>
          <p className="text-2xl font-black text-white tracking-tight">
            Rp {(data?.predicted_total_leakage || 0).toLocaleString('id-ID')}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isHighRisk ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(data?.leakage_rate_percent || 0, 100)}%` }}
                aria-hidden="true"
              />
            </div>
            <span className="text-xs font-bold text-slate-400">
              {data?.leakage_rate_percent?.toFixed(1)}%
            </span>
          </div>
        </div>

        {data && (
          <dl className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <dt className="text-slate-500 uppercase tracking-wider">Contract Value</dt>
              <dd className="font-bold text-slate-300">
                Rp {data.contract_value.toLocaleString('id-ID')}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 uppercase tracking-wider">Realized Spend</dt>
              <dd className="font-bold text-slate-300">
                Rp {data.realized_spend.toLocaleString('id-ID')}
              </dd>
            </div>
          </dl>
        )}
      </div>
    </>
  );
});

export { LeakageForecast };
