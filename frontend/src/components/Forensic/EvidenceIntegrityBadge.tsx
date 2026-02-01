'use client';

import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Fingerprint } from 'lucide-react';
import { motion } from 'framer-motion';

interface HashVerificationProps {
  localHash: string;
  registryHash: string;
  filename: string;
}

export function EvidenceIntegrityBadge({ localHash, registryHash, filename }: HashVerificationProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isVerified = localHash === registryHash;

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider transition-all ${
        isVerified 
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
          : 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse'
      }`}>
        {isVerified ? <ShieldCheck size={10} /> : <ShieldAlert size={10} />}
        <span>{isVerified ? 'VERIFIED' : 'TAMPER_DETECTED'}</span>
      </div>

      {isHovered && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-full left-0 mb-2 w-64 bg-slate-900 border border-white/10 rounded-xl p-4 shadow-2xl z-[100] backdrop-blur-xl"
        >
          <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
            <Fingerprint size={14} className="text-indigo-400" />
            <span className="text-[9px] font-black uppercase text-slate-400">Forensic Signature</span>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-[8px] text-slate-500 uppercase font-bold mb-1">Local Registry</p>
              <code className="text-[10px] font-mono text-white bg-black/40 px-1.5 py-0.5 rounded block truncate">
                {localHash}
              </code>
            </div>
            
            <div>
              <p className="text-[8px] text-slate-500 uppercase font-bold mb-1">Evidence Chain (Registry)</p>
              <code className={`text-[10px] font-mono px-1.5 py-0.5 rounded block truncate ${isVerified ? 'text-emerald-400' : 'text-rose-400 bg-rose-500/10'}`}>
                {registryHash}
              </code>
            </div>

            {!isVerified && (
              <div className="bg-rose-500/20 border border-rose-500/30 p-2 rounded-lg mt-2">
                <p className="text-[9px] text-rose-200 font-bold leading-tight">
                  WARNING: Document content has been modified after initial ingestion. Legal chain-of-custody broken.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
