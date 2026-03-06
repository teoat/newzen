'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MapHeaderProps {
  mapMode: 'markers' | 'heatmap' | 'flows' | 'anomalies';
  setMapMode: (mode: 'markers' | 'heatmap' | 'flows' | 'anomalies') => void;
}

export const MapHeader: React.FC<MapHeaderProps> = ({ mapMode, setMapMode }) => {
  return (
    <header className="flex justify-between items-center bg-slate-900/50 p-6 rounded-[2rem] border border-white/5 backdrop-blur-xl">
      <div className="flex items-center gap-6">
        <Link href="/">
          <button 
            title="Return to Hub"
            className="p-4 hover:bg-white/5 rounded-2xl transition-all border border-white/5 bg-slate-950 shadow-2xl group active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Geospatial Intelligence</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <p className="text-slate-500 font-mono text-[11px] uppercase tracking-[0.3em]">Indonesia Archipelago Surveillance Active</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="bg-slate-950 border border-white/10 rounded-2xl p-1 flex gap-1">
          {(['markers', 'heatmap', 'flows', 'anomalies'] as const).map((mode) => (
            <Button 
              key={mode}
              variant={mapMode === mode ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setMapMode(mode)}
              className={`text-[11px] uppercase font-black tracking-widest px-4 h-9 rounded-xl ${mapMode === mode ? 'bg-indigo-600 hover:bg-indigo-500' : 'hover:bg-white/5 text-slate-500'}`}
            >
              {mode}
            </Button>
          ))}
        </div>
        <div className="px-6 py-2 rounded-2xl flex items-center gap-3 border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-md relative overflow-hidden">
          <div className="absolute inset-0 bg-emerald-500/10 animate-pulse" />
          <Shield className="w-4 h-4 text-emerald-400 relative z-10" />
          <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest relative z-10">Global Watchlist Sync Active</span>
        </div>
      </div>
    </header>
  );
};
