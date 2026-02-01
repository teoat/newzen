'use client';

import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface VerdictButtonsProps {
  onVerify: (status: 'VERIFIED' | 'EXCLUDED' | 'PENDING') => void;
  isVerifying?: boolean;
}

export function VerdictButtons({ onVerify, isVerifying = false }: VerdictButtonsProps) {
  return (
    <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <button 
        onClick={() => onVerify('VERIFIED')} 
        disabled={isVerifying}
        className="p-2 h-8 w-8 flex items-center justify-center hover:bg-emerald-500/20 text-emerald-500 rounded-lg transition-all disabled:opacity-50" 
        title="Mark as Verified"
        aria-label="Verify Transaction"
      >
        <CheckCircle className="w-4 h-4" />
      </button>
      <button 
        onClick={() => onVerify('EXCLUDED')} 
        disabled={isVerifying}
        className="p-2 h-8 w-8 flex items-center justify-center hover:bg-rose-500/20 text-rose-500 rounded-lg transition-all disabled:opacity-50" 
        title="Mark as Excluded"
        aria-label="Exclude Transaction"
      >
        <XCircle className="w-4 h-4" />
      </button>
    </div>
  );
}
