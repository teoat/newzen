'use client';

import React from 'react';
import { Layers, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useInvestigation } from '../../../store/useInvestigation';

interface EvidenceItem {
  id: string;
  type: 'entity' | 'transaction' | 'hotspot' | 'milestone' | 'document';
  label: string;
  description?: string;
  sourceTool: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  verdict?: 'ADMITTED' | 'REJECTED' | 'PENDING';
}

interface EvidenceCardProps {
  item: EvidenceItem;
  investigationId: string;
  onRefreshNarrative: () => void;
}

export function EvidenceCard({ item, investigationId, onRefreshNarrative }: EvidenceCardProps) {
  const updateEvidenceStatus = useInvestigation.getState().updateEvidenceStatus;

  return (
    <div className={`p-6 border rounded-2xl flex items-start gap-4 transition-all ${
      item.verdict === 'ADMITTED' ? 'bg-emerald-500/5 border-emerald-500/20' : 
      item.verdict === 'REJECTED' ? 'bg-rose-500/5 border-rose-500/20' : 
      'depth-layer-1 depth-border-subtle hover:depth-layer-2'
    }`}>
      <div className={`p-3 rounded-xl border ${
        item.verdict === 'ADMITTED' ? 'bg-emerald-500/10 border-emerald-500/20' :
        item.verdict === 'REJECTED' ? 'bg-rose-500/10 border-rose-500/20' :
        'depth-layer-3 depth-border-subtle'
      }`}>
        <Layers className={`w-5 h-5 ${
          item.verdict === 'ADMITTED' ? 'text-emerald-400' :
          item.verdict === 'REJECTED' ? 'text-rose-400' :
          'text-indigo-400'
        }`} />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-tight">{item.label}</h3>
            {item.verdict && (
              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${
                item.verdict === 'ADMITTED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
              }`}>
                {item.verdict}
              </span>
            )}
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 bg-black/20 px-2 py-1 rounded">
            {item.type}
          </span>
        </div>
        <div className="flex items-center gap-4 mt-1 mb-3">
          <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Source: {item.sourceTool}</p>
          <p className="text-[11px] font-mono text-slate-700">{item.id}</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={onRefreshNarrative}
            className="px-3 py-1.5 bg-indigo-600/20 text-indigo-400 rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-indigo-600 hover:text-white transition-all"
          >
            <RefreshCw className="w-3 h-3" /> Refresh AI Synthesis
          </button>
          <button 
            onClick={() => updateEvidenceStatus(investigationId, item.id, 'ADMITTED')}
            className={`px-3 py-1.5 rounded text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
              item.verdict === 'ADMITTED' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-emerald-600/20 hover:text-emerald-400'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" /> Adjudicate: Admit
          </button>
          <button 
            onClick={() => updateEvidenceStatus(investigationId, item.id, 'REJECTED')}
            className={`px-3 py-1.5 rounded text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
              item.verdict === 'REJECTED' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-rose-600/20 hover:text-rose-400'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" /> Reject
          </button>
        </div>
      </div>
    </div>
  );
}
