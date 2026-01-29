'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInvestigation } from '@/store/useInvestigation';
import { useForensicNotifications } from '@/components/ForensicNotificationProvider';
import { MapPin, Info, ArrowUpRight, PlusCircle, AlertTriangle } from 'lucide-react';

export interface LeakageHotspot {
  id: string;
  location: { lat: number; lng: number; name: string };
  severity: number; // 0-1
  value: number; 
  rootCause: string;
}

interface ForensicGeoMapProps {
  hotspots: LeakageHotspot[];
}

export default function ForensicGeoMap({ hotspots = [] }: ForensicGeoMapProps) {
  // Bounds Calculation for Auto-Scaling
  const lats = hotspots.map(h => h.location.lat);
  const lngs = hotspots.map(h => h.location.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = maxLat - minLat || 0.05;
  const lngSpan = maxLng - minLng || 0.05;

  const [selectedHotspot, setSelectedHotspot] = useState<LeakageHotspot | null>(null);
  const { startInvestigation, activeInvestigation, addAction } = useInvestigation();
  const notifications = useForensicNotifications();

  const handleHotspotClick = (hotspot: LeakageHotspot) => {
    setSelectedHotspot(hotspot);
  };

  const handleInvestigate = (hotspot: LeakageHotspot) => {
    // If no active investigation, start one
    if (!activeInvestigation) {
      startInvestigation(`Leakage Probe: ${hotspot.location.name}`, {
        projectId: hotspot.id,
        hotspotId: hotspot.id,
        leakageValue: hotspot.value
      });
      notifications.info('Investigation Started', `New case opened for ${hotspot.location.name}`);
    } else {
        // Add to current
        addAction({
          action: `Analyzed leakage hotspot at ${hotspot.location.name}`,
          tool: 'ForensicGeoMap',
          result: {
            hotspotId: hotspot.id,
            value: hotspot.value,
            severity: hotspot.severity
          }
        });
        notifications.success('Evidence Added', `Hotspot data added to case #${activeInvestigation.id}`);
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-950/50 rounded-2xl overflow-hidden group">
      {/* Map Background (Stylized Indonesia/Jakarta Outline for Demo) */}
      <svg 
        viewBox="0 0 800 500" 
        className="w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Abstract Landmasses */}
        <path d="M100,200 Q250,150 400,250 T700,300" stroke="none" fill="#1e293b" />
        <path d="M50,150 Q200,50 350,150 T650,200" stroke="none" fill="#334155" opacity="0.5" />
        
        {/* Grid Lines */}
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Hotspots Layer */}
      <div className="absolute inset-0">
        {hotspots.map((hotspot) => {
          // Normalize to % with padding using pre-calculated bounds
          const x = ((hotspot.location.lng - minLng) / lngSpan) * 80 + 10;
          const y = 100 - (((hotspot.location.lat - minLat) / latSpan) * 80 + 10);

          const isCritical = hotspot.severity > 0.8;
          const colorClass = isCritical ? 'bg-rose-500' : 'bg-amber-500';

          return (
            <motion.div
              key={hotspot.id}
              className="absolute cursor-grab active:cursor-grabbing hover:z-50"
              style={{ left: `${x}%`, top: `${y}%` }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.2 }}
              onClick={() => handleHotspotClick(hotspot)}
              title={hotspot.location.name}
            >
              <div
                draggable={true}
                onDragStart={(e: React.DragEvent<HTMLDivElement>) => {
                  e.dataTransfer.setData('application/json', JSON.stringify({
                    type: 'hotspot_evidence',
                    id: hotspot.id,
                    location: hotspot.location.name,
                    value: hotspot.value,
                    context: 'Geospatial Leakage Map'
                  }));
                  notifications.info("EVIDENCE LOCKED", "Drop into dossier to link.");
                }}
              >
              {/* Pulse Ring */}
              <div className={`absolute -inset-4 rounded-full ${colorClass} opacity-20 animate-ping`} />
              
              {/* Dot */}
              <div className={`relative w-4 h-4 rounded-full ${colorClass} border border-white/20 shadow-lg shadow-${isCritical ? 'rose' : 'amber'}-500/50`} />
              
              {/* Tooltip Label (Always visible for Critical) */}
              {isCritical && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 bg-slate-900/90 border border-rose-500/30 rounded-md text-[10px] font-black text-rose-400 uppercase tracking-wider backdrop-blur-sm shadow-xl">
                  {hotspot.location.name}
                </div>
              )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Selected Hotspot Detail Card */}
      <AnimatePresence>
        {selectedHotspot && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute bottom-4 left-4 right-4 bg-slate-900/90 border border-white/10 rounded-xl p-4 backdrop-blur-md shadow-2xl z-20"
          >
            <div className="flex justify-between items-start mb-2">
                <div>
                   <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                       <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                       {selectedHotspot.location.name}
                   </h3>
                   <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                       {selectedHotspot.id} • {selectedHotspot.rootCause}
                   </div>
                </div>
                <button 
                  onClick={() => setSelectedHotspot(null)}
                  className="p-1 hover:bg-white/10 rounded-full text-slate-500 hover:text-white"
                  aria-label="Close details"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </button>
            </div>
            
            <div className="flex items-end justify-between">
                <div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Leakage Value</div>
                    <div className="text-xl font-black text-white">
                        Rp {(selectedHotspot.value / 1000000000).toFixed(2)} B
                    </div>
                </div>
                
                <button
                    onClick={() => handleInvestigate(selectedHotspot)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center gap-2 transition-colors"
                >
                    {activeInvestigation ? (
                        <>
                           <PlusCircle className="w-3.5 h-3.5" />
                           Add to Case
                        </>
                    ) : (
                        <>
                           <AlertTriangle className="w-3.5 h-3.5" />
                           Investigate
                        </>
                    )}
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
