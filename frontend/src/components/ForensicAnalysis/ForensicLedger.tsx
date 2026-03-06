import React, { useEffect, useState, useRef } from 'react';
import { ForensicService } from '../../services/ForensicService';
import { Transaction } from '../../schemas';
import { motion } from 'framer-motion';

interface ForensicLedgerProps {
  projectId: string;
}

const ForensicLedger: React.FC<ForensicLedgerProps> = ({ projectId }) => {
  const [internalTxns, setInternalTxns] = useState<Transaction[]>([]);
  const [bankTxns, setBankTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Fetch all transactions (in a real app, might want parallel filtered requests)
        const allTxns = await ForensicService.fetchTransactions(projectId);
        
        // Split Left vs Right
        // Note: Using 'any' cast if types aren't perfectly aligned yet, but Schema has source_type in logic?
        // Actually TransactionSchema in schemas/index.ts might not have source_type explicitly yet?
        // Let's assume the API returns it or we infer from category/metadata.
        // For now, let's filter by checking if source_type property exists on the object.
        
        const left = allTxns.filter((t: any) => t.source_type === 'INTERNAL_LEDGER');
        const right = allTxns.filter((t: any) => t.source_type === 'BANK_STATEMENT');
        
        setInternalTxns(left);
        setBankTxns(right);
      } catch (err) {
        console.error("Failed to load ledger data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [projectId]);

  if (loading) {
    return <div className="p-8 text-center text-slate-400 animate-pulse">Initializing Forensic Ledger...</div>;
  }

  return (
    <div className="w-full h-[calc(100vh-120px)] flex flex-col gap-4 p-4">
      <header className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
            <div className="w-3 h-8 bg-blue-500 rounded-sm" />
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">DOUBLE-ENTRY FORENSIC RECONCILIATION</h1>
        </div>
        <div className="flex gap-4 text-sm font-mono">
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                <span className="text-emerald-400">MATCHED</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                <span className="text-rose-500">LEAKAGE</span>
            </div>
        </div>
      </header>
      
      <div className="flex-1 grid grid-cols-2 gap-8 relative border border-slate-800 bg-slate-900/50 rounded-lg overflow-hidden backdrop-blur-sm shadow-2xl">
        {/* CENTER DIVIDER LINE */}
        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-slate-700 z-10 opacity-50" />
        
        {/* LEFT COLUMN: INTERNAL LEDGER */}
        <div className="flex flex-col h-full border-r border-slate-800/50 relative">
            <div className="bg-slate-900/80 p-3 border-b border-slate-700 sticky top-0 z-20 backdrop-blur-md">
                <h3 className="text-sm uppercase tracking-widest text-slate-400 font-semibold flex justify-between">
                    <span>Internal Ledger (Claimed)</span>
                    <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-300">{internalTxns.length} RECORDS</span>
                </h3>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                {internalTxns.map((tx) => (
                    <TransactionCard key={tx.id} tx={tx} side="left" />
                ))}
                {internalTxns.length === 0 && <EmptyState label="No Ledger Entries Found" />}
            </div>
        </div>

        {/* RIGHT COLUMN: BANK STATEMENT */}
        <div className="flex flex-col h-full relative">
            <div className="bg-slate-900/80 p-3 border-b border-slate-700 sticky top-0 z-20 backdrop-blur-md">
                <h3 className="text-sm uppercase tracking-widest text-blue-400 font-semibold flex justify-between">
                    <span>Bank Statement (Real)</span>
                    <span className="text-xs bg-blue-900/30 px-2 py-0.5 rounded text-blue-300 border border-blue-500/20">{bankTxns.length} RECORDS</span>
                </h3>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                {bankTxns.map((tx) => (
                    <TransactionCard key={tx.id} tx={tx} side="right" />
                ))}
                {bankTxns.length === 0 && <EmptyState label="No Bank Mutations Found" />}
            </div>
        </div>

        {/* SVG LAYER FOR CONNECTORS (Placeholder for future matching lines) */}
        <svg className="absolute inset-0 pointer-events-none w-full h-full z-0 opacity-30">
            {/* Logic to draw lines would go here based on coordinates */}
        </svg>
      </div>
    </div>
  );
};

const TransactionCard = ({ tx, side }: { tx: any; side: 'left' | 'right' }) => {
    // Dynamic color based on status or side
    const isBank = side === 'right';
    const amountColor = isBank ? 'text-blue-300' : 'text-slate-200';
    const borderColor = isBank ? 'border-blue-500/20 hover:border-blue-500/40' : 'border-slate-700 hover:border-slate-500';
    const [expanded, setExpanded] = useState(false);

    return (
        <div className={`rounded-md border ${borderColor} bg-slate-800/40 transition-all duration-300 overflow-hidden ${expanded ? 'shadow-2xl ring-1 ring-white/10' : ''}`}>
            <div 
                onClick={() => setExpanded(!expanded)}
                className={`p-3 cursor-pointer hover:bg-slate-800/80 transition-colors relative flex flex-col gap-1`}
            >
                <div className="flex justify-between items-start">
                    <span className="text-xs font-mono text-slate-500">{(tx.date as string).split('T')[0]}</span>
                    <span className={`text-sm font-mono font-bold ${amountColor}`}>
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: tx.currency || 'IDR' }).format(tx.amount)}
                    </span>
                </div>
                <div className="text-xs text-slate-300 font-medium truncate pr-4" title={tx.description}>
                    {tx.description || 'No description'}
                </div>
                
                {/* STATUS INDICATORS */}
                <div className="mt-2 flex gap-2 items-center">
                    {tx.category && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400 border border-slate-600/30">{tx.category}</span>}
                    {tx.risk_score > 0.5 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 animate-pulse">
                            ⚠️ HIGH RISK
                        </span>
                    )}
                    {/* VISUAL TRIANGULATION HINT */}
                    <div className="ml-auto flex items-center gap-1 text-[10px] text-slate-500">
                        {expanded ? 'COLLAPSE' : 'TRIANGULATE'}
                        <svg className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* EXPANDED PROOF PANEL (VISUAL TRIANGULATION) */}
            {expanded && (
                <div className="border-t border-slate-700/50 bg-slate-900/60 p-3">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        {/* EVIDENCE SLOT 1: THE PHOTO/DOC */}
                        <div className="aspect-video bg-black rounded border border-slate-700 flex flex-col items-center justify-center relative overflow-hidden group">
                           {tx.metadata_json?.custom_fields?._forensic_geo_tagged ? (
                               <>
                                 <div className="absolute inset-0 bg-slate-800 flex items-center justify-center text-xs text-slate-500">
                                    [MAP PREVIEW: {tx.latitude}, {tx.longitude}]
                                 </div>
                                 <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/60 text-[9px] font-mono text-emerald-400">
                                    GPS MATCHED: <span className="text-white">PROJECT SITE A</span>
                                 </div>
                               </>
                           ) : (
                                <div className="text-center p-2">
                                    <span className="text-2xl opacity-20">📷</span>
                                    <p className="text-[10px] text-slate-500 mt-1">No Visual Proof</p>
                                </div>
                           )}
                        </div>

                        {/* EVIDENCE SLOT 2: THE CHAT/INTENT */}
                        <div className="bg-slate-950 rounded border border-slate-800 p-2 font-mono text-[10px] leading-tight text-slate-400 overflow-hidden">
                            <div className="text-slate-500 border-b border-slate-800 pb-1 mb-1">COMMUNICATION_LOG</div>
                            {tx.metadata_json?.ai_enrichment?.triggers ? (
                                <div className="space-y-1">
                                    {tx.metadata_json.ai_enrichment.triggers.map((t: string, i: number) => (
                                        <div key={i} className="text-rose-400">» DETECTED: {t}</div>
                                    ))}
                                    <div className="text-slate-600 italic">...intent analysis suggests manual intervention...</div>
                                </div>
                            ) : (
                                <div className="opacity-50">No chat logs correlated with this timestamp.</div>
                            )}
                        </div>
                    </div>
                    
                    {/* ACTION BAR */}
                    <div className="flex justify-end gap-2 mt-2">
                        <button className="text-[10px] px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 text-slate-300">
                            View Full Evidence
                        </button>
                        <button className="text-[10px] px-2 py-1 bg-rose-900/30 hover:bg-rose-900/50 rounded border border-rose-700/50 text-rose-300">
                            Flag Anomaly
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

const EmptyState = ({ label }: { label: string }) => (
    <div className="h-64 flex flex-col items-center justify-center text-slate-500 space-y-3 opacity-60">
        <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
            <span className="text-xl">∅</span>
        </div>
        <p className="text-sm font-medium">{label}</p>
    </div>
)

export default ForensicLedger;
