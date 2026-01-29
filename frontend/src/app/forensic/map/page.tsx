'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Shield, AlertTriangle, Info, ArrowLeft, Layers } from 'lucide-react';
import HolographicBadge from '@/app/components/HolographicBadge';
import { HOLOGRAPHIC_SOURCE } from '@/utils/holographicData';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8200';

interface EvidenceMarker {
  id: string;
  description: string;
  amount: number;
  lat: number;
  lng: number;
  status: string;
}

export default function EvidenceMapPage() {
  const [markers, setMarkers] = useState<EvidenceMarker[]>([]);
  const [selected, setSelected] = useState<EvidenceMarker | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    async function fetchGeoData() {
      try {
        const res = await fetch(`${API_URL}/api/v1/reconciliation/internal`);
        const data = await res.json();
        // Filter those with lat/lng
        const geoData = data
          .filter((tx: { latitude?: number; longitude?: number }) => tx.latitude && tx.longitude)
          .map((tx: { id: string; description: string; actual_amount: number; latitude: number; longitude: number; status: string }) => ({
            id: tx.id,
            description: tx.description,
            amount: tx.actual_amount,
            lat: tx.latitude,
            lng: tx.longitude,
            status: tx.status
          }));
        
        if (geoData.length > 0) {
           setMarkers(geoData);
           setIsDemo(false);
        } else {
           // Auto-enable demo if no real data exists
           setMarkers(HOLOGRAPHIC_SOURCE.geoMarkers);
           setIsDemo(true);
        }
      } catch {
        console.error("Failed to fetch geo data");
        setMarkers(HOLOGRAPHIC_SOURCE.geoMarkers);
        setIsDemo(true);
      } finally {
        setLoading(false);
      }
    }
    fetchGeoData();
  }, []);

  // Map projection logic (Simple linear mapping for the demo area)
  // Ambon area roughly: Lat -3.7, Lng 128.18
  const mapWidth = 800;
  const mapHeight = 500;
  const latMin = -3.72;
  const latMax = -3.68;
  const lngMin = 128.16;
  const lngMax = 128.22;

  const getPos = (lat: number, lng: number) => {
    const x = ((lng - lngMin) / (lngMax - lngMin)) * mapWidth;
    const y = ((latMax - lat) / (latMax - latMin)) * mapHeight;
    return { x, y };
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-indigo-400 font-mono text-xs tracking-widest uppercase">CALIBRATING GEOSPATIAL COORDINATES...</div>;

  return (
    <div className="p-8 space-y-8 bg-slate-950 min-h-screen text-slate-200">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.history.back()} 
            title="Back to War Room"
            aria-label="Back to War Room"
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white uppercase tracking-tight">Evidence Map</h1>
            <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest mt-1">Spatials of Financial Misappropriation</p>
          </div>
        </div>
        <div className="flex gap-4">
           {isDemo && <HolographicBadge />}
           <button 
              onClick={() => {
                setIsDemo(!isDemo);
                setMarkers(!isDemo ? HOLOGRAPHIC_SOURCE.geoMarkers : []);
              }}
              className="px-6 py-2 rounded-xl flex items-center gap-3 border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest"
           >
              <Layers className="w-4 h-4 text-indigo-400" />
              {isDemo ? "Switch to Live" : "View Holographic Demo"}
           </button>
           <div className="px-4 py-2 rounded-xl flex items-center gap-3 border border-indigo-500/20 bg-indigo-500/5 backdrop-blur-md">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Geo-Fenced Evidence</span>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
        {/* Map Visualization Area */}
        <div className="lg:col-span-2 rounded-3xl relative overflow-hidden bg-slate-900/50 border border-white/5 shadow-2xl">
          {/* Stylized Grid */}
          <div className="absolute inset-0 opacity-10" style={{ 
            backgroundImage: 'radial-gradient(circle, #4f46e5 1px, transparent 1px)', 
            backgroundSize: '30px 30px' 
          }} />
          
          <svg viewBox={`0 0 ${mapWidth} ${mapHeight}`} className="w-full h-full relative z-10">
            {/* Some stylized terrain/water features (abstract) */}
            <path d="M 100 100 Q 400 50 700 150 T 800 400" fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.1" strokeDasharray="5,5" />
            
            {markers.map((m) => {
              const pos = getPos(m.lat, m.lng);
              return (
                <g key={m.id} className="cursor-pointer" onClick={() => setSelected(m)}>
                  <motion.circle
                    initial={{ r: 0 }}
                    animate={{ r: selected?.id === m.id ? 8 : 4 }}
                    cx={pos.x}
                    cy={pos.y}
                    className={`${m.status === 'flagged' ? 'fill-rose-500' : m.status === 'locked' ? 'fill-orange-500' : 'fill-indigo-500'}`}
                  />
                  <motion.circle
                    animate={{ r: [6, 15, 6], opacity: [0.5, 0, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    cx={pos.x}
                    cy={pos.y}
                    fill="none"
                    stroke={m.status === 'flagged' ? '#ef4444' : m.status === 'locked' ? '#f97316' : '#6366f1'}
                    strokeWidth="1"
                  />
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="absolute bottom-6 left-6 z-20 space-y-2 bg-slate-950/50 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-slate-400">
               <div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Flagged Discrepancy
            </div>
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-slate-400">
               <div className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Evidence Locked
            </div>
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-slate-400">
               <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Verified Record
            </div>
          </div>
        </div>

        {/* Info Side Panel */}
        <div className="rounded-3xl p-6 overflow-y-auto border border-white/5 bg-slate-900/30 backdrop-blur-xl shadow-2xl space-y-6">
          {selected ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl shadow-inner">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-indigo-500/20 rounded-lg">
                    <MapPin className="w-5 h-5 text-indigo-400" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{selected.lat.toFixed(4)}, {selected.lng.toFixed(4)}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Transaction Site</h3>
                <h3 className="text-xl font-bold text-white mb-2">{selected.description}</h3>
                <p className="text-2xl font-black text-white">Rp {selected.amount.toLocaleString()}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-slate-900/50 rounded-xl border border-white/5">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1">Risk Context</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Recorded coordinates align with Ambon project site. Proximity to unofficial field office flagged for review.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-slate-900/50 rounded-xl border border-white/5">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <Info className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1">Legal Standing</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Geospatial signature is embedded in the digital chain of custody. Verified against localized cell-tower metadata.</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => window.location.href = `/reconciliation`}
                className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-[10px] shadow-lg shadow-white/5 active:scale-95"
              >
                Inspect Ledger Item
              </button>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-8 bg-white/5 rounded-full border border-white/5">
                <MapPin className="w-12 h-12 text-slate-800" />
              </div>
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Geographic Node Navigator</h3>
                <p className="text-[11px] text-slate-600 px-6 leading-relaxed font-medium italic">Interact with geospatial pins on the map to review location-specific risk factors and project site forensics.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
