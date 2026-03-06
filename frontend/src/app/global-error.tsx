'use client';

import React from 'react';
import { ShieldAlert, RefreshCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="bg-slate-950 text-white">
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-full mb-6">
            <ShieldAlert className="w-16 h-16 text-red-500" />
          </div>
          
          <h1 className="text-4xl font-black text-white mb-4 tracking-tighter">
            CRITICAL SYSTEM FAILURE
          </h1>
          
          <p className="text-slate-400 max-w-lg mb-8 font-mono">
            A catastrophic error has occurred at the application root level. 
            Immediate manual reset required.
          </p>

          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg flex items-center transition-all"
          >
            <RefreshCcw className="w-5 h-5 mr-2" />
            Hard Reset Application
          </button>
        </div>
      </body>
    </html>
  );
}
