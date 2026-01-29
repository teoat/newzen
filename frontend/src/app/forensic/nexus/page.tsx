'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Network, Search, Zap, User, Building, Landmark, AlertTriangle, Shield } from 'lucide-react';

import { HOLOGRAPHIC_SOURCE } from '@/utils/holographicData';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8200';

import { useProject } from '@/store/useProject';
import { useHubStore } from '@/store/useHubStore';
import ForensicPageLayout from '@/app/components/ForensicPageLayout';

type Node = {
  id: string;
  label: string;
  type: 'person' | 'company' | 'bank' | 'unknown';
  risk: number;
  x: number;
  y: number;
};

type Link = {
  source: string;
  target: string;
  value: number;
  type: string;
};

import React, { useState, useEffect, useCallback } from 'react';

export default function NexusGraphPage() {
  const { activeProjectId } = useProject();
  const hub = useHubStore();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const isMock = nodes.length === 0 && !loading;

  const fetchGraph = useCallback(async () => {
    if (!activeProjectId) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/forensic/nexus/${activeProjectId}`);
      const data = res.ok ? await res.json() : null;

      if (data && data.nodes && data.nodes.length > 0) {
        setNodes(data.nodes);
        setLinks(data.links);
      } else {
        setNodes(HOLOGRAPHIC_SOURCE.nexus.nodes);
        setLinks(HOLOGRAPHIC_SOURCE.nexus.links);
      }
    } catch (err) {
      console.error("Failed to fetch nexus graph:", err);
      setNodes(HOLOGRAPHIC_SOURCE.nexus.nodes);
      setLinks(HOLOGRAPHIC_SOURCE.nexus.links);
    } finally {
      setLoading(false);
    }
  }, [activeProjectId]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'person': return User;
      case 'company': return Building;
      case 'bank': return Landmark;
      default: return AlertTriangle;
    }
  };

  const [isSweeping, setIsSweeping] = useState(false);
  const [sweepProgress, setSweepProgress] = useState(0);

  const runSanctionSweep = () => {
    setIsSweeping(true);
    setSweepProgress(0);
    const interval = setInterval(() => {
        setSweepProgress(prev => {
            if (prev >= 100) {
                clearInterval(interval);
                setTimeout(() => setIsSweeping(false), 1000);
                return 100;
            }
            return prev + 10;
        });
    }, 300);
    
    window.dispatchEvent(new CustomEvent('telemetry-sync', {
        detail: { 
            source: 'NexusExplorer', 
            type: 'SANCTION_SWEEP', 
            status: 'pending',
            label: 'CROSS-CHECKING GLOBAL ENTITIES'
        }
    }));
  };

  return (
    <ForensicPageLayout
        title="Vendor Nexus"
        subtitle="Project Alpha Relationship Topology & Leakage Propagation"
        icon={Network}
        isMockData={isMock}
        headerActions={
            <div className="flex gap-4">
                 <button 
                    onClick={runSanctionSweep}
                    disabled={isSweeping}
                    className={`relative overflow-hidden transition-all border rounded-2xl px-6 py-3 flex items-center gap-3 shadow-xl ${isSweeping ? 'bg-indigo-600/20 border-indigo-500/50 cursor-wait' : 'bg-slate-900 border-white/10 hover:bg-white/5'}`}
                 >
                    {isSweeping ? (
                        <>
                            <div className="absolute inset-0 bg-indigo-600/10" style={{ width: `${sweepProgress}%` }} />
                            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin z-10" />
                            <span className="text-xs font-black uppercase tracking-widest text-indigo-400 z-10">Cross-Checking ({sweepProgress}%)</span>
                        </>
                    ) : (
                        <>
                            <Shield className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Global Sanction Sweep</span>
                        </>
                    )}
                 </button>
                 <button 
                    onClick={fetchGraph}
                    className="bg-slate-900 border border-white/10 rounded-2xl px-6 py-3 flex items-center gap-3 hover:bg-white/5 transition-all shadow-xl"
                 >
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-on-ping" />
                    <span className="text-xs font-black uppercase tracking-widest text-indigo-400">Update Network Logic</span>
                 </button>
            </div>
        }
    >
      {/* Graph Area */}
      <div className="relative w-full h-[650px] tactical-frame depth-layer-0 depth-border-medium rounded-[2.5rem] overflow-hidden group mb-8 depth-shadow-lg m-8 max-w-[calc(100%-4rem)]">
         {/* Grid Background */}
          <div className="absolute inset-0 opacity-[0.03] nexus-grid-bg" />
         
         <AnimatePresence>
            {loading ? (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-50 backdrop-blur-sm"
            >
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6" />
                <span className="text-indigo-400 font-mono text-xs uppercase tracking-[0.5em] animate-pulse">Analyzing Network Propagation...</span>
            </motion.div>
            ) : null}
         </AnimatePresence>

         <div className="absolute inset-0 p-10 cursor-grab active:cursor-grabbing">
            <svg className="w-full h-full"> 
               <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#334155" />
                  </marker>
               </defs>
                {(nodes.length > 0 ? links : HOLOGRAPHIC_SOURCE.nexus.links).map((link, i) => {
                  const source = (nodes.length > 0 ? nodes : HOLOGRAPHIC_SOURCE.nexus.nodes).find(n => n.id === link.source);
                  const target = (nodes.length > 0 ? nodes : HOLOGRAPHIC_SOURCE.nexus.nodes).find(n => n.id === link.target);
                  if (!source || !target) return null;
                  
                  const x1 = source.x;
                  const y1 = source.y;
                  const x2 = target.x;
                  const y2 = target.y;

                  const midX = (x1 + x2) / 2;
                  const midY = (y1 + y2) / 2;

                  return (
                    <g key={i} className="group/link">
                      <motion.line 
                         initial={{ pathLength: 0, opacity: 0 }}
                         animate={{ pathLength: 1, opacity: 0.4 }}
                         x1={x1 + '%'} y1={y1 + '%'} x2={x2 + '%'} y2={y2 + '%'} 
                         stroke={link.type === 'Funneling' ? '#f43f5e' : '#6366f1'} 
                         strokeWidth={link.type === 'Funneling' ? 4 : 2} 
                         strokeDasharray={link.type === 'Funneling' ? "8,4" : "0"}
                         markerEnd="url(#arrowhead)"
                         className="transition-all group-hover/link:opacity-100 group-hover/link:stroke-white cursor-pointer"
                      />
                      {/* Interactive Edge Label */}
                      <foreignObject 
                        x={`${midX}%`} 
                        y={`${midY}%`} 
                        width="80" 
                        height="30" 
                        className="overflow-visible pointer-events-none opacity-0 group-hover/link:opacity-100 transition-opacity"
                        style={{ transform: 'translate(-40px, -15px)' }}
                      >
                        <div className="bg-slate-900/90 border border-white/20 backdrop-blur-md px-2 py-1 rounded-lg text-[8px] font-black text-white text-center shadow-2xl">
                          Rp {(link.value / 1000000).toFixed(1)}M
                        </div>
                      </foreignObject>
                    </g>
                  );
                })}
            </svg>
            
            {/* Nodes Layer */}
            {(nodes.length > 0 ? nodes : HOLOGRAPHIC_SOURCE.nexus.nodes).map((node) => {
               const Icon = getNodeIcon(node.type);
               const isSelected = selectedNode?.id === node.id;
               return (
                 <motion.div
                   key={node.id}
                   initial={{ scale: 0, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   whileHover={{ scale: 1.2, zIndex: 30 }}
                   className={`absolute w-14 h-14 -ml-7 -mt-7 rounded-2xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                      isSelected ? 'ring-4 ring-indigo-500/30 border-white bg-indigo-600 scale-110 shadow-indigo-500/50' :
                      node.risk > 0.8 ? 'bg-rose-500/20 border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.4)] animate-pulse' : 
                      node.id.startsWith('proj_') ? 'bg-indigo-600 border-indigo-400 shadow-indigo-900/50 w-20 h-20 -ml-10 -mt-10 rounded-[2rem]' :
                      'bg-slate-900 border-white/10 shadow-black'
                   }`}
                   style={{ left: `${node.x}%`, top: `${node.y}%` }}
                   onClick={() => {
                     setSelectedNode(node);
                     if (node.type === 'person' || node.type === 'company') {
                        hub.setSelectedEntity(node.id);
                     }
                   }}
                 >
                    <Icon className={`w-6 h-6 ${node.risk > 0.8 ? 'text-rose-400' : 'text-white'}`} />
                    
                    {/* Node Label */}
                    <div className={`absolute top-16 whitespace-nowrap bg-slate-900/90 border border-white/5 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isSelected ? 'text-indigo-400 border-indigo-500/50' : 'text-slate-400 group-hover:text-white transition-colors'}`}>
                      {node.label}
                    </div>

                    {node.risk > 0.8 && (
                        <div className="absolute -top-2 -right-2 bg-rose-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full animate-bounce">
                            RISK
                        </div>
                    )}
                 </motion.div>
               );
            })}
         </div>

         {/* Legend */}
         <div className="absolute bottom-8 left-8 flex flex-col gap-2 tactical-card depth-layer-2 p-4 rounded-2xl depth-border-subtle shadow-lg">
            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <div className="w-3 h-3 bg-indigo-600 rounded-lg" /> Project Root
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <div className="w-3 h-3 bg-rose-500/50 border border-rose-500 rounded-lg" /> High Risk Entity
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <div className="w-3 h-1 bg-rose-500 rounded-full" /> Kickback Funnel
            </div>
         </div>
      </div>

      {/* Details Panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div 
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="fixed top-32 right-8 w-[400px] tactical-card depth-layer-3 p-8 rounded-[2rem] depth-border-strong depth-shadow-lg z-50 backdrop-blur-xl"
          >
             <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                   <div className={`p-4 rounded-2xl ${selectedNode.risk > 0.8 ? 'bg-rose-600 shadow-rose-900/40' : 'bg-indigo-600 shadow-indigo-900/40'}`}>
                      {React.createElement(getNodeIcon(selectedNode.type), { className: 'w-6 h-6 text-white' })}
                   </div>
                   <div>
                      <h3 className="font-black text-white text-xl uppercase tracking-tighter leading-none">{selectedNode.label}</h3>
                      <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] mt-1 font-bold">{selectedNode.type} Intelligence Data</p>
                   </div>
                </div>
                <button 
                  onClick={() => setSelectedNode(null)} 
                  title="Close Intelligence Panel"
                  aria-label="Close Intelligence Panel"
                  className="p-2 hover:bg-white/10 rounded-xl text-slate-500 transition-colors"
                >
                  ✕
                </button>
             </div>
             
             <div className="space-y-6">
                <div className="p-5 depth-layer-1 rounded-[1.5rem] depth-border-subtle">
                   <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Forensic Risk Score</span>
                      <span className={`text-2xl font-black font-mono ${selectedNode.risk > 0.8 ? 'text-rose-500' : 'text-emerald-500'}`}>
                         {(selectedNode.risk * 100).toFixed(0)}%
                      </span>
                   </div>
                   <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${selectedNode.risk * 100}%` }}
                        className={`h-full ${selectedNode.risk > 0.8 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                      />
                   </div>
                </div>
                
                <div>
                   <h4 className="text-[10px] uppercase font-black text-slate-500 mb-4 tracking-widest px-2">Flow Intersections</h4>
                   <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                      {(nodes.length > 0 ? links : HOLOGRAPHIC_SOURCE.nexus.links).filter(l => l.source === selectedNode.id || l.target === selectedNode.id).map((l, i) => (
                        <div key={i} className="flex justify-between items-center p-4 rounded-2xl depth-layer-1 depth-border-subtle hover:depth-layer-2 hover:depth-border-accent transition-all group depth-shadow-sm">
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">
                                {l.source === selectedNode.id ? 'Outbound Flow' : 'Inbound Flow'}
                              </span>
                              <span className="text-xs font-bold text-slate-200 mt-0.5">
                                {l.source === selectedNode.id ? (nodes.length > 0 ? nodes : HOLOGRAPHIC_SOURCE.nexus.nodes).find(n => n.id === l.target)?.label : (nodes.length > 0 ? nodes : HOLOGRAPHIC_SOURCE.nexus.nodes).find(n => n.id === l.source)?.label}
                              </span>
                           </div>
                           <div className="text-right">
                              <div className="text-sm font-black text-white">Rp {(l.value / 1000000).toFixed(1)}M</div>
                              <div className="text-[9px] uppercase font-bold text-slate-600">{l.type}</div>
                           </div>
                        </div>
                      ))}
                      {links.filter(l => l.source === selectedNode.id || l.target === selectedNode.id).length === 0 && (
                          <div className="text-center py-6 text-slate-600 italic text-xs uppercase tracking-widest font-bold">No mapped flows found</div>
                      )}
                   </div>
                </div>

                <div className="flex gap-4">
                    <button className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-900/40 flex items-center justify-center gap-3">
                    <Zap className="w-4 h-4" /> Trace Beneficial Ownership
                    </button>
                    <button 
                      className="p-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/5 transition-all"
                      title="Search Asset Registry"
                      aria-label="Search Asset Registry"
                    >
                        <Search className="w-4 h-4 text-slate-400" />
                    </button>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ForensicPageLayout>
  );
}
