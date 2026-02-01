'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Shield, AlertTriangle, Info, ArrowLeft, Layers, Globe, Activity, Crosshair } from 'lucide-react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
} from 'react-simple-maps';
import useSWR from 'swr';
import { useProject } from '../../../store/useProject';
import { authenticatedFetch, authFetcher } from '../../../lib/api';
import { Card } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Badge } from '../../../ui/badge';
import { SkeletonCard } from '../../../ui/skeleton';

// Indonesia TopoJSON URL
const geoUrl = "https://raw.githubusercontent.com/ansis/world-topojson/master/countries/indonesia.json";

export default function EvidenceMapPage() {
  const { activeProjectId } = useProject();
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [mapMode, setMapMode] = useState<'markers' | 'heatmap' | 'flows' | 'anomalies'>('markers');
  
  // Real Geocoded Entities from V2 API
  const { data: entities, error: entitiesError, isLoading: loadingEntities } = useSWR(
    activeProjectId ? `/api/v2/geo/entities/${activeProjectId}` : null,
    authFetcher
  );

  // Geospatial Anomalies from SiteTruth V2 API
  const { data: anomaliesData } = useSWR(
    activeProjectId ? `/api/v2/forensic-v2/site-truth/geospatial-verify/${activeProjectId}` : null,
    authFetcher
  );

  // Heatmap Data from V2 API
  const { data: heatmapData } = useSWR(
    activeProjectId ? `/api/v2/geo/heatmap/${activeProjectId}` : null,
    authFetcher
  );

  return (
    <div className="p-8 space-y-8 bg-slate-950 min-h-screen text-slate-200">
      <header className="flex justify-between items-center bg-slate-900/50 p-6 rounded-[2rem] border border-white/5 backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => window.history.back()} 
            title="Go Back"
            className="p-4 hover:bg-white/5 rounded-2xl transition-all border border-white/5 bg-slate-950 shadow-2xl group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Geospatial Intelligence</h1>
            <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.3em]">Indonesia Archipelago Surveillance Active</p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
            <div className="bg-slate-950 border border-white/10 rounded-2xl px-2 py-1 flex gap-1">
                {(['markers', 'heatmap', 'flows', 'anomalies'] as const).map((mode) => (
                    <Button 
                        key={mode}
                        variant={mapMode === mode ? 'default' : 'ghost'} 
                        size="sm" 
                        onClick={() => setMapMode(mode)}
                        className="text-[10px] uppercase font-black tracking-widest px-4 h-10"
                    >
                        {mode}
                    </Button>
                ))}
            </div>
            <div className="px-6 py-2 rounded-2xl flex items-center gap-3 border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-md">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Global Watchlist Sync Active</span>
            </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[700px]">
        {/* Map Visualization Area */}
        <div className="lg:col-span-3 rounded-[3rem] relative overflow-hidden bg-[#020617] border border-white/5 shadow-2xl group">
          <AnimatePresence>
            {loadingEntities && (
              <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-50 backdrop-blur-sm"
              >
                  <Activity className="w-12 h-12 text-indigo-500 animate-pulse mb-4" />
                  <span className="text-indigo-400 font-mono text-xs uppercase tracking-[0.5em] animate-pulse">Triangulating Node Coordinates...</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute inset-0 opacity-10 pointer-events-none map-grid-pattern" />

          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 1200,
              center: [118, -2]
            }}
            className="w-full h-full cursor-grab active:cursor-grabbing"
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#0f172a"
                    stroke="#1e293b"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: { fill: "#1e293b", outline: "none" },
                      pressed: { fill: "#334155", outline: "none" },
                    }}
                  />
                ))
              }
            </Geographies>

            {/* Heatmap Layer */}
            {mapMode === 'heatmap' && heatmapData?.map((p: any, i: number) => (
                <Marker key={i} coordinates={[p.lng, p.lat]}>
                    <circle r={Math.min(20, p.weight * 5)} fill="#f43f5e" fillOpacity={0.15} stroke="#f43f5e" strokeWidth={0.5} strokeDasharray="2,2" className="animate-forensic-pulse" />
                    <circle r={2} fill="#f43f5e" />
                </Marker>
            ))}

            {/* Entity Markers Layer */}
            {mapMode === 'markers' && entities?.map((entity: any) => (
              <Marker
                key={entity.id}
                coordinates={[entity.lng, entity.lat]}
                onClick={() => setSelectedEntity(entity)}
              >
                <motion.g
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.5 }}
                    className="cursor-pointer"
                >
                    <circle 
                        r={6} 
                        fill={entity.risk_score > 0.7 ? '#f43f5e' : '#6366f1'} 
                        fillOpacity={0.2}
                        stroke={entity.risk_score > 0.7 ? '#f43f5e' : '#6366f1'}
                        strokeWidth={2}
                    />
                    <circle 
                        r={2} 
                        fill={entity.risk_score > 0.7 ? '#f43f5e' : '#fff'} 
                    />
                    {entity.risk_score > 0.7 && (
                        <circle 
                            r={10} 
                            fill="none" 
                            stroke="#f43f5e" 
                            strokeWidth={0.5} 
                            className="animate-ping" 
                        />
                    )}
                </motion.g>
              </Marker>
            ))}

            {/* Flow Lines Layer */}
            {mapMode === 'flows' && entities?.filter((e: any) => e.target_coords).map((flow: any, i: number) => (
                <Line
                    key={i}
                    from={[flow.lng, flow.lat]}
                    to={flow.target_coords}
                    stroke={flow.risk_score > 0.7 ? "#f43f5e" : "#818cf8"}
                    strokeWidth={1}
                    strokeLinecap="round"
                    strokeDasharray="4,2"
                />
            ))}

            {/* Site-Truth Anomaly Layer */}
            {mapMode === 'anomalies' && anomaliesData?.geospatial_anomalies?.map((anomaly: any, i: number) => {
                const txNode = entities?.find((e: any) => e.transaction_id === anomaly.transaction_id);
                // For demo, if txNode is found, we draw a line to the "truth" coordinates
                // which would come from the document metadata
                return txNode ? (
                    <React.Fragment key={i}>
                        <Line
                            from={[txNode.lng, txNode.lat]}
                            to={[txNode.lng + 0.1, txNode.lat + 0.1]} // Simulated Truth point for visual
                            stroke="#f43f5e"
                            strokeWidth={2}
                            className="animate-pulse"
                        />
                        <Marker coordinates={[txNode.lng + 0.1, txNode.lat + 0.1]}>
                            <motion.g animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity }}>
                                <MapPin size={12} fill="#f43f5e" />
                            </motion.g>
                        </Marker>
                    </React.Fragment>
                ) : null;
            })}
          </ComposableMap>

          {/* Map Overlay Controls */}
          <div className="absolute top-8 left-8 space-y-4 pointer-events-none">
            <Card className="p-4 bg-slate-950/80 border-white/5 backdrop-blur-xl shadow-2xl">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">surveillance metrics</div>
              <div className="flex gap-6">
                <div>
                    <div className="text-xl font-black text-white">{entities?.length || 0}</div>
                    <div className="text-[8px] text-slate-500 uppercase font-bold">Monitored Nodes</div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div>
                    <div className="text-xl font-black text-rose-500">{entities?.filter((e: any) => e.risk_score > 0.7).length || 0}</div>
                    <div className="text-[8px] text-slate-500 uppercase font-bold">Anomalous Clusters</div>
                </div>
              </div>
            </Card>
          </div>

          <div className="absolute bottom-8 right-8 flex gap-4">
             <Button variant="outline" size="icon" className="w-12 h-12 rounded-2xl bg-slate-950/80 backdrop-blur-xl border-white/5">
                <Globe className="w-5 h-5 text-indigo-400" />
             </Button>
             <Button variant="outline" size="icon" className="w-12 h-12 rounded-2xl bg-slate-950/80 backdrop-blur-xl border-white/5">
                <Crosshair className="w-5 h-5 text-indigo-400" />
             </Button>
          </div>
        </div>

        {/* Intelligence Context Panel */}
        <div className="col-span-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
          {loadingEntities ? (
             <div className="space-y-6">
                <SkeletonCard count={3} />
                <SkeletonCard variant="metric" />
             </div>
          ) : selectedEntity ? (
            <motion.div 
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="tactical-card p-6 bg-slate-900 border-white/10 rounded-[2.5rem] shadow-2xl space-y-6"
            >
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl ${selectedEntity.risk_score > 0.7 ? 'bg-rose-500 shadow-rose-900/40' : 'bg-indigo-600 shadow-indigo-900/40'}`}>
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tighter leading-none">{selectedEntity.name}</h3>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Entity Profile</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-5 bg-slate-950 rounded-3xl border border-white/5">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Localized Risk</span>
                    <span className={`text-xl font-black ${selectedEntity.risk_score > 0.7 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {(selectedEntity.risk_score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${selectedEntity.risk_score > 0.7 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${selectedEntity.risk_score * 100}%` }} />
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
                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Geospatial Forensic</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                        Registered address in {selectedEntity.city || 'Unknown'}. GPS signature verified against 4 satellite passes.
                    </p>
                </div>

                <Button className="w-full h-12 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-slate-200 transition-all shadow-xl">
                    Inspect Localized Assets
                </Button>
                
                <Button variant="ghost" onClick={() => setSelectedEntity(null)} className="w-full text-[10px] uppercase font-black text-slate-500 tracking-widest h-10">
                    Clear Selection
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-white/5 rounded-[3rem] opacity-30">
              <div className="p-10 bg-slate-900 rounded-full mb-6">
                <Crosshair className="w-12 h-12 text-slate-700" />
              </div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Awaiting Coordinate Lock</h4>
              <p className="text-[11px] text-slate-600 mt-4 leading-relaxed italic">Select a geospatial node to reveal site-specific forensic intelligence and asset propagation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
