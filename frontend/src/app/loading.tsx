import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
      <div className="relative">
        <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin relative z-10" />
      </div>
      
      <div className="mt-8 text-center space-y-2">
        <h3 className="text-white font-bold tracking-widest uppercase text-sm">
          Initializing Forensic Protocols
        </h3>
        <p className="text-slate-500 text-xs font-mono">
          Decrypting secure data streams...
        </p>
      </div>
    </div>
  );
}
