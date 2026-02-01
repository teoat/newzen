import React from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Tactical Fallback Component
 * Displayed when a specific forensic tool crashes (Circuit Breaker)
 */
function TacticalFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="p-8 rounded-[2rem] bg-rose-500/5 border border-rose-500/20 flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
      <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-rose-500" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">Logic Collision Detected</h3>
        <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed uppercase tracking-widest font-bold">
          The forensic engine encountered an entropy spike. Visual render suspended for stability.
        </p>
      </div>
      <pre className="text-[10px] text-rose-400 font-mono bg-black/40 p-4 rounded-xl border border-rose-500/10 max-w-md overflow-auto">
        {(error as Error).message}
      </pre>
      <button
        onClick={resetErrorBoundary}
        className="px-8 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-indigo-400 hover:text-white transition-all shadow-xl"
      >
        <RefreshCw className="w-4 h-4" /> Reset Logic Circuit
      </button>
    </div>
  );
}

interface CircuitBreakerProps {
  children: React.ReactNode;
  onReset?: () => void;
}

/**
 * CircuitBreaker Component
 * Protects the UI from cascading failures in data-heavy forensic components
 */
export function CircuitBreaker({ children, onReset }: CircuitBreakerProps) {
  return (
    <ErrorBoundary
      FallbackComponent={TacticalFallback}
      onReset={onReset}
      onError={(error) => {
        console.error('[Circuit Breaker] Logic Collision:', error);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
