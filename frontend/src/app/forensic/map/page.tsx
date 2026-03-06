'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  Map as MapIcon, 
  Clock, 
  Navigation, 
  AlertTriangle, 
  Target, 
  Zap, 
  Activity,
  CreditCard,
  Fuel,
  ShoppingBag,
  Building2,
  ArrowRight,
  Fingerprint,
  ChevronRight
} from 'lucide-react';
import ForensicPageLayout from '../../components/ForensicPageLayout';
import { useProject } from '../../../store/useProject';
import { authenticatedFetch } from '../../../lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PageFeatureCard from '../../components/PageFeatureCard';

// Dynamically import the map to avoid SSR issues
const ForensicMap = dynamic(() => import('./components/ForensicMap').then(m => m.ForensicMap), { ssr: false });

interface StoryNode {
  id: string;
  type: 'ATM' | 'GAS_STATION' | 'MINI_MART' | 'SITE' | 'OFFICE';
  name: string;
  timestamp: string;
  amount: number;
  lat: number;
  lng: number;
  description: string;
  isAnomaly?: boolean;
}

// Haversine Distance Helper
function getDist(la1: number, lo1: number, la2: number, lo2: number) {
    const R = 6371; // KM
    const dLat = (la2 - la1) * Math.PI / 180;
    const dLon = (lo2 - lo1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(la1 * Math.PI / 180) * Math.cos(la2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

export default function MovementStoryboardPage() {
  const { activeProjectId } = useProject();
  const [viewMode, setViewMode] = useState<'strategic' | 'storyboard'>('storyboard');
  const [nodes, setNodes] = useState<StoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // SIMULATED STORY DATA - In production, this comes from the new columns we added
  useEffect(() => {
    if (!activeProjectId) return;
    setTimeout(() => {
      setNodes([
        { id: '1', type: 'ATM', name: 'ATM LINK - JAKARTA SELATAN', timestamp: '2026-02-04T09:00:00Z', amount: 2500000, lat: -6.2088, lng: 106.8456, description: 'Cash withdrawal - Primary Agent' },
        { id: '2', type: 'GAS_STATION', name: 'SPBU PERTAMINA 31.127', timestamp: '2026-02-04T10:30:00Z', amount: 450000, lat: -6.2297, lng: 106.8091, description: 'Fuel purchase - Operational Vehicle' },
        { id: '3', type: 'MINI_MART', name: 'INDOMARET POINT', timestamp: '2026-02-04T11:15:00Z', amount: 125000, lat: -6.2444, lng: 106.7992, description: 'Subsistence - Site Team' },
        { id: '4', type: 'SITE', name: 'PROJECT SITE - ALPHA', timestamp: '2026-02-04T14:00:00Z', amount: 0, lat: -1.2428, lng: 116.8312, description: 'Target Project Boundary', isAnomaly: true },
      ]);
      setLoading(false);
    }, 1200);
  }, [activeProjectId]);

  const sortedNodes = useMemo(() => [...nodes].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()), [nodes]);

  // Protocol 3: Identify Red-Line Travel Gaps
  const travelLines = useMemo(() => {
    const lines = [];
    for (let i = 0; i < sortedNodes.length - 1; i++) {
        const n1 = sortedNodes[i];
        const n2 = sortedNodes[i+1];
        
        // Calculate velocity
        const dist = getDist(n1.lat, n1.lng, n2.lat, n2.lng);
        const timeDiff = Math.abs(new Date(n2.timestamp).getTime() - new Date(n1.timestamp).getTime()) / (1000 * 3600);
        const speed = timeDiff > 0 ? dist / timeDiff : 0;
        
        lines.push({
            from: [n1.lng, n1.lat],
            to: [n2.lng, n2.lat],
            isImpossible: speed > 800,
            speed: Math.round(speed)
        });
    }
    return lines;
  }, [sortedNodes]);

  return (
    <ForensicPageLayout
      title="Movement Storyboard"
      subtitle="Geospatial Behavior & Path Verification"
      icon={Globe}
      headerActions={
        <div className="flex bg-slate-900 border border-white/10 p-1 rounded-xl">
          <button 
            onClick={() => setViewMode('strategic')}
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'strategic' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Strategic Radar
          </button>
          <button 
            onClick={() => setViewMode('storyboard')}
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'storyboard' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Movement Story
          </button>
        </div>
      }
    >
      <div className="flex h-full overflow-hidden">
        {/* LEFT: THE TIMELINE STORYBOARD */}
        <AnimatePresence>
            {viewMode === 'storyboard' && (
                <motion.aside 
                    initial={{ x: -300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -300, opacity: 0 }}
                    className="w-96 border-r border-white/5 bg-slate-950/50 backdrop-blur-xl flex flex-col"
                >
                    <div className="p-8 border-b border-white/5">
                        <div className="flex items-center gap-3 mb-2">
                            <Clock className="w-4 h-4 text-indigo-400" />
                            <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">Movement Sequence</h2>
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Chronological Path Analysis</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-0">
                        {sortedNodes.map((node, i) => (
                            <div key={node.id} className="relative group cursor-pointer" onClick={() => setSelectedNodeId(node.id)}>
                                {/* Timeline Line */}
                                {i < sortedNodes.length - 1 && (
                                    <div className="absolute left-[19px] top-10 bottom-0 w-px bg-gradient-to-b from-indigo-500/50 to-indigo-500/5" />
                                )}
                                
                                <div className={`flex gap-6 pb-12 transition-all ${selectedNodeId === node.id ? 'translate-x-2' : ''}`}>
                                    <div className={`z-10 w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${selectedNodeId === node.id ? 'bg-indigo-600 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-slate-900 border-white/10 text-slate-500'}`}>
                                        <NodeIcon type={node.type} size={16} />
                                    </div>
                                    
                                    <div className="flex-1 pt-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[10px] font-mono text-indigo-400 font-bold">{new Date(node.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            {node.isAnomaly && (
                                                <span className="text-[8px] font-black text-rose-500 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded uppercase animate-pulse">Impossible</span>
                                            )}
                                        </div>
                                        <h3 className={`text-xs font-black uppercase tracking-tight transition-colors ${selectedNodeId === node.id ? 'text-white' : 'text-slate-400'}`}>{node.name}</h3>
                                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1">IDR {node.amount.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.aside>
            )}
        </AnimatePresence>

        {/* RIGHT: TACTICAL MAP */}
        <main className="flex-1 relative bg-[#020617]">
            {/* HUD OVERLAY */}
            <div className="absolute top-8 left-8 z-20 flex flex-col gap-4 pointer-events-none">
                 <div className="p-6 bg-slate-950/80 backdrop-blur-xl border border-white/5 rounded-[2rem] shadow-2xl pointer-events-auto">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Geospatial Surveillance Active</span>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <div className="text-[9px] font-black text-slate-500 uppercase mb-1">Behavioral Anchors</div>
                            <div className="text-2xl font-black text-white italic">{nodes.length}</div>
                        </div>
                        <div>
                            <div className="text-[9px] font-black text-slate-500 uppercase mb-1">Sector Coverage</div>
                            <div className="text-2xl font-black text-indigo-400 italic">94%</div>
                        </div>
                    </div>
                 </div>
            </div>

            {/* THE MAP COMPONENT */}
            <div className="w-full h-full p-4">
                <div className="w-full h-full rounded-[3.5rem] border border-white/5 overflow-hidden shadow-2xl relative">
                    <ForensicMap 
                        loadingEntities={loading}
                        entities={[]}
                        mapMode="storyboard"
                        mapPosition={{ coordinates: [106.8456, -6.2088], zoom: 3000 }}
                        setMapPosition={() => {}}
                        setSelectedEntity={() => {}}
                        storyNodes={nodes}
                        storyLines={travelLines}
                    />
                </div>
            </div>

            {/* SELECTION HUD */}
            <AnimatePresence>
                {selectedNodeId && (
                    <motion.div 
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-2xl px-8 z-30"
                    >
                        <div className="p-8 bg-slate-900 border border-indigo-500/30 rounded-[2.5rem] shadow-2xl backdrop-blur-3xl flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-indigo-600/20 rounded-2xl border border-indigo-500/30 text-indigo-400">
                                    <NodeIcon type={nodes.find(n => n.id === selectedNodeId)?.type || 'ATM'} size={32} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">{nodes.find(n => n.id === selectedNodeId)?.name}</h2>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{nodes.find(n => n.id === selectedNodeId)?.description}</p>
                                </div>
                            </div>
                            <Button className="h-12 px-8 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-black uppercase text-[11px] tracking-widest">
                                Inspect Telemetry
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
      </div>
    </ForensicPageLayout>
  );
}

function NodeIcon({ type, size }: { type: StoryNode['type'], size: number }) {
    switch (type) {
        case 'ATM': return <CreditCard size={size} />;
        case 'GAS_STATION': return <Fuel size={size} />;
        case 'MINI_MART': return <ShoppingBag size={size} />;
        case 'SITE': return <Target size={size} />;
        case 'OFFICE': return <Building2 size={size} />;
        default: return <Activity size={size} />;
    }
}
