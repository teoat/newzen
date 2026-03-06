'use client';

import React from 'react';
import { ShieldAlert, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log the error to an error reporting service
    console.error('Runtime Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-full mb-6">
        <ShieldAlert className="w-12 h-12 text-red-500" />
      </div>
      
      <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
        SYSTEM INTEGRITY COMPROMISED
      </h2>
      
      <p className="text-slate-400 max-w-md mb-8 font-mono text-sm">
        An unexpected runtime exception has occurred. The forensic operation has been halted to prevent data corruption.
        <br />
        <span className="text-xs text-slate-600 mt-2 block">
          Error Digest: {error.digest || 'UNKNOWN_HASH'}
        </span>
      </p>

      <div className="flex gap-4">
        <Button 
          variant="outline" 
          onClick={() => window.location.href = '/'}
          className="border-white/10 hover:bg-white/5"
        >
          <Home className="w-4 h-4 mr-2" />
          Return to HQ
        </Button>
        
        <Button 
          onClick={reset}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <RefreshCcw className="w-4 h-4 mr-2" />
          Re-initialize System
        </Button>
      </div>
    </div>
  );
}
