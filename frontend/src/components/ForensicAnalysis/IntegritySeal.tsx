import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Fingerprint, FileText } from 'lucide-react';

interface IntegritySealProps {
  hash: string;
  timestamp: string;
  verdictId: string;
}

const IntegritySeal: React.FC<IntegritySealProps> = ({ hash, timestamp, verdictId }) => {
  return (
    <div className="relative w-64 h-64 flex items-center justify-center group">
      {/* Outer Rotating Ring */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 border-2 border-dashed border-indigo-500/20 rounded-full"
      />
      
      {/* Inner Pulsing Ring */}
      <motion.div 
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute inset-4 border border-indigo-500/10 rounded-full bg-indigo-500/5 backdrop-blur-sm"
      />

      <div className="relative z-10 flex flex-col items-center text-center">
        <motion.div
           initial={{ scale: 0 }}
           animate={{ scale: 1 }}
           transition={{ type: "spring", damping: 12 }}
        >
            <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.5)] mb-4">
                <ShieldCheck className="w-8 h-8 text-white" />
            </div>
        </motion.div>

        <div className="space-y-1">
            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Integrity Seal</h4>
            <div className="text-[8px] font-mono text-indigo-400/70 truncate w-32 mx-auto">
                SHA-256_{hash.substring(0, 12)}...
            </div>
        </div>

        <div className="mt-4 flex flex-col items-center gap-1">
            <div className="px-2 py-0.5 bg-white/5 rounded-md border border-white/5 flex items-center gap-1">
                <Lock className="w-2 h-2 text-slate-500" />
                <span className="text-[7px] font-mono text-slate-400">NON-REPUDIABLE</span>
            </div>
            <div className="text-[6px] text-slate-500 font-bold uppercase tracking-widest">{timestamp}</div>
            <div className="text-[7px] text-slate-600 font-black uppercase tracking-tighter mt-1">{verdictId}</div>
        </div>
      </div>

      {/* Decorative Corners */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-indigo-500/30 rounded-tl-lg" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-indigo-500/30 rounded-tr-lg" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-indigo-500/30 rounded-bl-lg" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-indigo-500/30 rounded-br-lg" />
    </div>
  );
};

export default IntegritySeal;
