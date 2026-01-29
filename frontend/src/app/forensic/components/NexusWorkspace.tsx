'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Building, Landmark, AlertTriangle, Shield, Zap, RefreshCw } from 'lucide-react';
import { HOLOGRAPHIC_SOURCE } from '@/utils/holographicData';
import { useProject } from '@/store/useProject';
import { useHubStore } from '@/store/useHubStore';
import HolographicBadge from '@/app/components/HolographicBadge';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8200';

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
  stake?: number; // Ownership percentage
};

export default function NexusWorkspace() {
  const { activeProjectId } = useProject();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const { setSelectedEntity } = useHubStore();
  const [isSweeping, setIsSweeping] = useState(false);
  const [sweepProgress, setSweepProgress] = useState(0);
  const [isMock, setIsMock] = useState(false);

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
        setIsMock(true);
      }
    } catch (err) {
      console.error("Nexus fetch error:", err);
      setNodes(HOLOGRAPHIC_SOURCE.nexus.nodes);
      setLinks(HOLOGRAPHIC_SOURCE.nexus.links);
      setIsMock(true);
    } finally {
      setLoading(false);
    }
  }, [activeProjectId]);

  useEffect(() => {
    fetchGraph();
  }, [activeProjectId, fetchGraph]);

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'person': return User;
      case 'company': return Building;
      case 'bank': return Landmark;
      default: return AlertTriangle;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          {isMock && <div className="scale-75 origin-left"><HolographicBadge /></div>}
          <button 
            onClick={runSanctionSweep}
            disabled={isSweeping}
            className={`relative overflow-hidden transition-all border rounded-xl px-4 py-2 flex items-center gap-2 shadow-lg ${isSweeping ? 'bg-indigo-600/20 border-indigo-500/50 cursor-wait' : 'bg-slate-900 border-white/10 hover:bg-white/5'}`}
          >
            {isSweeping ? (
              <>
                <div className="absolute inset-0 bg-indigo-600/10" style={{ width: `${sweepProgress}%` }} />
                <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin z-10" />
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 z-10">Checking ({sweepProgress}%)</span>
              </>
            ) : (
              <>
                <Shield className="w-3 h-3 text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Sanction Sweep</span>
              </>
            )}
          </button>
          <button 
            onClick={fetchGraph}
            className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2 hover:bg-white/5 transition-all shadow-lg"
          >
            <RefreshCw className="w-3 h-3 text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Update Logic</span>
          </button>
        </div>
      </div>
      <div className="relative w-full flex-1 border border-white/5 rounded-[2.5rem] bg-slate-950/50 backdrop-blur-3xl overflow-hidden group shadow-[0_0_50px_rgba(0,0,0,0.5)]">
         <div className="absolute inset-0 opacity-[0.03] nexus-grid-bg" />
         
         <AnimatePresence>
            {loading && (
              <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-50 backdrop-blur-sm"
              >
                  <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6" />
                  <span className="text-indigo-400 font-mono text-xs uppercase tracking-[0.5em] animate-pulse">Tracing Capital Flows...</span>
              </motion.div>
            )}
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
                  
                  const midX = (source.x + target.x) / 2;
                  const midY = (source.y + target.y) / 2;

                  return (
                    <g key={i} className="group/link">
                      <motion.line 
                         initial={{ pathLength: 0, opacity: 0 }}
                         animate={{ pathLength: 1, opacity: 0.4 }}
                         x1={source.x + '%'} y1={source.y + '%'} x2={target.x + '%'} y2={target.y + '%'} 
                         stroke={link.type === 'Funneling' ? '#f43f5e' : '#6366f1'} 
                         strokeWidth={link.type === 'Funneling' ? 4 : 2} 
                         strokeDasharray={link.type === 'Funneling' ? "8,4" : "0"}
                         markerEnd="url(#arrowhead)"
                         className="transition-all group-hover/link:opacity-100 group-hover/link:stroke-white cursor-pointer"
                      />
                      <foreignObject x={`${midX}%`} y={`${midY}%`} width="100" height="40" className="overflow-visible pointer-events-none opacity-0 group-hover/link:opacity-100 transition-opacity -translate-x-[50px] -translate-y-[20px]">
                        <div className="bg-slate-900/90 border border-white/20 backdrop-blur-md px-2 py-1 rounded-lg text-center shadow-2xl">
                          <p className="text-[8px] font-black text-white">Rp {(link.value / 1000000).toFixed(1)}M</p>
                          {link.stake && <p className="text-[7px] font-bold text-indigo-400">STAKE: {link.stake}%</p>}
                        </div>
                      </foreignObject>
                    </g>
                  );
                })}
            </svg>
            
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
                     setSelectedEntity(node.id);
                   }}
                 >
                    <Icon className={`w-6 h-6 ${node.risk > 0.8 ? 'text-rose-400' : 'text-white'}`} />
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

         <div className="absolute bottom-8 left-8 flex flex-col gap-2 bg-black/40 backdrop-blur-xl p-4 rounded-2xl border border-white/5">
            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <div className="w-3 h-3 bg-indigo-600 rounded-lg" /> Project Root
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <div className="w-3 h-3 bg-rose-500/50 border border-rose-500 rounded-lg" /> High Risk Entity
            </div>
         </div>
      </div>

      <AnimatePresence>
        {selectedNode && (
          <motion.div 
            initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 400, opacity: 0 }}
            className="fixed top-32 right-12 w-[380px] bg-slate-900/90 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl z-50"
          >
             <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                   <div className={`p-4 rounded-2xl ${selectedNode.risk > 0.8 ? 'bg-rose-600' : 'bg-indigo-600'}`}>
                      {React.createElement(getNodeIcon(selectedNode.type), { className: 'w-6 h-6 text-white' })}
                   </div>
                   <div>
                      <h3 className="font-black text-white text-lg uppercase tracking-tighter leading-none">{selectedNode.label}</h3>
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1 font-bold">{selectedNode.type} Intel</p>
                   </div>
                </div>
                <button 
                   onClick={() => {
                       setSelectedNode(null);
                       setSelectedEntity(null);
                   }} 
                   className="p-2 hover:bg-white/10 rounded-xl text-slate-500"
                >
                   ✕
                </button>
             </div>
             
             <div className="space-y-6">
                <div className="p-5 bg-white/[0.03] rounded-2xl border border-white/5">
                   <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Risk Score</span>
                      <span className={`text-xl font-black font-mono ${selectedNode.risk > 0.8 ? 'text-rose-500' : 'text-emerald-500'}`}>
                         {(selectedNode.risk * 100).toFixed(0)}%
                       </span>
                   </div>
                   <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${selectedNode.risk * 100}%` }} className={`h-full ${selectedNode.risk > 0.8 ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                   </div>
                </div>
                
                <div className="flex gap-4">
                    <button className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                      Deep Trace
                    </button>
                    <button className="p-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/5" aria-label="Search Entity">
                        <Search className="w-4 h-4 text-slate-400" />
                    </button>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
