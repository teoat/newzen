'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Info, Scan, Crosshair } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SkeletonCard } from '@/components/ui/skeleton';
import { GeoEntity } from '../../../../types/graph';

interface IntelligencePanelProps {
  loadingEntities: boolean;
  selectedEntity: GeoEntity | null;
  setSelectedEntity: (entity: GeoEntity | null) => void;
  handleInspectAssets: (entity: GeoEntity) => void;
}

export const IntelligencePanel: React.FC<IntelligencePanelProps> = ({
  loadingEntities,
  selectedEntity,
  setSelectedEntity,
  handleInspectAssets,
}) => {
  if (loadingEntities) {
    return (
      <div className="col-span-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
        <div className="space-y-6">
          <SkeletonCard count={3} />
          <SkeletonCard variant="metric" />
        </div>
      </div>
    );
  }

  if (!selectedEntity) {
    return (
      <div className="col-span-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
        <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-white/5 rounded-[3rem] opacity-30">
          <div className="p-10 bg-slate-900 rounded-full mb-6 relative">
            <div className="absolute inset-0 border border-white/10 rounded-full animate-ping" />
            <Crosshair className="w-12 h-12 text-slate-700 relative z-10" />
          </div>
          <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Awaiting Coordinate Lock</h4>
          <p className="text-[11px] text-slate-600 mt-4 leading-relaxed italic">Select a geospatial node to reveal site-specific forensic intelligence and asset propagation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="col-span-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
      <motion.div 
        key={selectedEntity.id}
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="tactical-card p-6 bg-slate-900 border-white/10 rounded-[2.5rem] shadow-2xl space-y-6"
      >
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl flex items-center justify-center ${selectedEntity.risk_score > 0.7 ? 'bg-rose-500 shadow-rose-900/40' : 'bg-indigo-600 shadow-indigo-900/40'}`}>
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-black text-white uppercase tracking-tighter leading-none truncate">{selectedEntity.name}</h3>
            <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest mt-1">Entity Profile</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-5 bg-slate-950 rounded-3xl border border-white/5">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Localized Risk</span>
              <span className={`text-xl font-black ${selectedEntity.risk_score > 0.7 ? 'text-rose-500' : 'text-emerald-500'}`}>
                {(selectedEntity.risk_score * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full ${selectedEntity.risk_score > 0.7 ? 'bg-rose-500' : 'bg-emerald-500'} w-[var(--risk-width)]`} 
                style={{ '--risk-width': `${selectedEntity.risk_score * 100}%` } as React.CSSProperties}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 bg-slate-950 border-white/5 rounded-2xl">
              <div className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1">Activity</div>
              <div className="text-sm font-black text-white">{selectedEntity.transaction_count} TXs</div>
            </Card>
            <Card className="p-4 bg-slate-950 border-white/5 rounded-2xl">
              <div className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1">Volume</div>
              <div className="text-sm font-black text-white">Rp {(selectedEntity.total_volume / 1e6).toFixed(1)}M</div>
            </Card>
          </div>

          <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-3 h-3 text-indigo-400" />
              <span className="text-[11px] font-black uppercase tracking-widest text-indigo-400">Geospatial Forensic</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Registered address in {selectedEntity.city || 'Unknown'}. GPS signature verified against 4 satellite passes.
            </p>
          </div>

          <Button 
            onClick={() => handleInspectAssets(selectedEntity)}
            className="w-full h-12 bg-white text-black font-black uppercase tracking-widest text-[11px] rounded-2xl hover:bg-slate-200 transition-all shadow-xl active:scale-95 group"
          >
            <Scan className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" /> Inspect Localized Assets
          </Button>
          
          <Button variant="ghost" onClick={() => setSelectedEntity(null)} className="w-full text-[11px] uppercase font-black text-slate-500 tracking-widest h-10 hover:text-white">
            Clear Selection
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
