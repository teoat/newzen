'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, ShieldAlert } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ForensicErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught Forensic Error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-12 bg-slate-950/50 backdrop-blur-3xl rounded-[3rem] border border-rose-500/20 shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-rose-500/5 blur-3xl" />
          
          <div className="relative z-10 flex flex-col items-center text-center max-w-md">
            <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mb-8 border border-rose-500/30">
                <AlertOctagon className="w-10 h-10 text-rose-500 animate-pulse" />
            </div>
            
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-4">
                Packet Loss Detected // System Breach
            </h2>
            
            <p className="text-xs text-slate-500 font-mono uppercase tracking-widest leading-relaxed mb-8">
                The forensic render pipeline has encountered a critical parity error. This event has been logged for internal audit.
            </p>

            <div className="w-full p-4 bg-black/40 rounded-2xl border border-white/5 mb-8 text-left">
                <div className="text-[8px] font-black text-rose-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <ShieldAlert className="w-3 h-3" /> Error Registry
                </div>
                <p className="text-[10px] font-mono text-rose-500/80 break-all leading-tight">
                    {this.state.error?.message || "AUTHENTICATION_OR_STATE_FAILURE"}
                </p>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="px-8 py-4 bg-white text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-200 transition-all flex items-center gap-3 shadow-xl shadow-white/5 active:scale-95"
            >
              <RefreshCw className="w-4 h-4" /> Re-link Telemetry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
