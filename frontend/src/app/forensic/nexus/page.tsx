'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Search, Zap, User, Building, Landmark, AlertTriangle, Shield, Globe, MousePointer2, Activity } from 'lucide-react';
import NextDynamic from 'next/dynamic';
const ForceGraph2D = NextDynamic(() => import('react-force-graph-2d'), { ssr: false });
import useSWR from 'swr';

import ForensicPageLayout from '../../../app/components/ForensicPageLayout';
import { useProject } from '../../../store/useProject';
import { authenticatedFetch, authFetcher } from '../../../lib/api';
import { Card } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Badge } from '../../../ui/badge';
import { SkeletonCard } from '../../../ui/skeleton';

export default function NexusGraphPage() {
  const { activeProjectId } = useProject();
  const fgRef = useRef<any>(null);
  
  // States for advanced features
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [hoverNode, setHoverNode] = useState<any>(null);
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [viewMode, setViewMode] = useState<'network' | 'communities' | 'paths'>('network');
  
  // Pathfinding state
  const [sourceNode, setSourceNode] = useState<string | null>(null);
  const [targetNode, setTargetNode] = useState<string | null>(null);

  // Fetch real network data from V2 API
  const { data, error, isLoading, mutate } = useSWR(
    activeProjectId ? `/api/v2/graph/network/${activeProjectId}` : null,
    authFetcher
  );

  // Cycle Detection Fetch
  const { data: cycles } = useSWR(
    activeProjectId ? `/api/v2/graph/cycles/${activeProjectId}` : null,
    authFetcher
  );

  const graphData = useMemo(() => {
    if (!data?.nodes) return { nodes: [], links: [] };
    // Map backend data to ForceGraph format
    return {
      nodes: data.nodes.map((n: any) => ({
        ...n,
        id: n.id,
        name: n.label,
        val: Math.max(10, Math.log((n.total_volume || 1) + 1) * 5)
      })),
      links: data.links.map((l: any) => ({
        ...l,
        source: l.source,
        target: l.target,
        value: l.value
      }))
    };
  }, [data]);

  const updateHighlight = () => {
    setHighlightNodes(highlightNodes);
    setHighlightLinks(highlightLinks);
  };

  const handleNodeHover = (node: any) => {
    highlightNodes.clear();
    highlightLinks.clear();
    if (node) {
      highlightNodes.add(node);
      graphData.links.forEach((link: any) => {
        if (link.source.id === node.id || link.target.id === node.id) {
          highlightLinks.add(link);
          highlightNodes.add(link.source);
          highlightNodes.add(link.target);
        }
      });
    }
    setHoverNode(node || null);
    updateHighlight();
  };

  const handleLinkHover = (link: any) => {
    highlightNodes.clear();
    highlightLinks.clear();

    if (link) {
      highlightLinks.add(link);
      highlightNodes.add(link.source);
      highlightNodes.add(link.target);
    }

    updateHighlight();
  };

  const handleNodeClick = (node: any) => {
    if (viewMode === 'paths') {
      if (!sourceNode) {
        setSourceNode(node.id);
      } else if (!targetNode && node.id !== sourceNode) {
        setTargetNode(node.id);
      } else {
        setSourceNode(node.id);
        setTargetNode(null);
      }
    } else {
      setSelectedNode(node);
    }
    
    // Center at node
    fgRef.current.centerAt(node.x, node.y, 1000);
    fgRef.current.zoom(2.5, 1000);
  };

  const [integritySeal, setIntegritySeal] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateDossier = async () => {
    if (!selectedNode || !activeProjectId) return;
    setIsGenerating(true);
    setIntegritySeal(null);

    try {
      // Step 1: Seal the verdict and generate metadata
      const res = await authenticatedFetch(`/api/v2/judge/verdict/${selectedNode.id}`, {
        method: 'POST'
      });
      
      if (!res.ok) throw new Error("Sealing failed");
      const result = await res.json();
      setIntegritySeal(result.integrity_hash);

      // Step 2: Trigger PDF Download
      const downloadUrl = `/api/v2/forensic-v2/judge/download-dossier?case_id=${selectedNode.id}&user_id=analyst_primary`;
      window.open(downloadUrl, '_blank');
      
    } catch (err) {
      console.error("Dossier generation failed", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <ForensicPageLayout
        title="Sovereign Nexus"
        subtitle="Holographic Entity Relationship Protocol"
        icon={Network}
        headerActions={
            <div className="flex gap-4">
                 <div className="bg-slate-900 border border-white/10 rounded-2xl px-2 py-1 flex gap-1">
                    <Button 
                      variant={viewMode === 'network' ? 'default' : 'ghost'} 
                      size="sm" 
                      onClick={() => setViewMode('network')}
                      className="text-[10px] uppercase font-black tracking-widest px-4"
                    >
                      Network
                    </Button>
                    <Button 
                      variant={viewMode === 'paths' ? 'default' : 'ghost'} 
                      size="sm" 
                      onClick={() => setViewMode('paths')}
                      className="text-[10px] uppercase font-black tracking-widest px-4"
                    >
                      Pathfinder
                    </Button>
                 </div>
                 <button 
                    onClick={() => mutate()}
                    className="bg-slate-900 border border-white/10 rounded-2xl px-6 py-3 flex items-center gap-3 hover:bg-white/5 transition-all shadow-xl"
                 >
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-indigo-400">Sync Graph State</span>
                 </button>
            </div>
        }
    >
      <div className="grid grid-cols-12 gap-8 h-[calc(100vh-200px)]">
        {/* Graph Display */}
        <div className="col-span-12 lg:col-span-9 relative tactical-frame rounded-[2.5rem] overflow-hidden bg-slate-950 border border-white/5 shadow-2xl">
          <AnimatePresence>
            {isLoading && (
              <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-50 backdrop-blur-sm"
              >
                  <Activity className="w-12 h-12 text-indigo-500 animate-pulse mb-4" />
                  <span className="text-indigo-400 font-mono text-xs uppercase tracking-[0.5em] animate-pulse">Reconstructing Topology...</span>
              </motion.div>
            )}
          </AnimatePresence>

          <ForceGraph2D
            ref={fgRef}
            graphData={graphData}
            nodeLabel="name"
            nodeRelSize={6}
            nodeColor={node => {
              if (sourceNode === node.id) return '#10b981';
              if (targetNode === node.id) return '#f43f5e';
              if (highlightNodes.has(node)) return node === hoverNode ? '#fff' : '#818cf8';
                const graphNode = node as { risk?: number };
                return graphNode.risk && graphNode.risk > 0.7 ? '#f43f5e' : '#334155';
            }}
            linkColor={link => highlightLinks.has(link) ? '#818cf8' : '#1e293b'}
            linkWidth={link => highlightLinks.has(link) ? 3 : 1}
            linkDirectionalParticles={4}
            linkDirectionalParticleWidth={link => highlightLinks.has(link) ? 4 : 0}
            nodeCanvasObject={(node: any, ctx, globalScale) => {
              const label = node.name;
              const fontSize = 12/globalScale;
              ctx.font = `${fontSize}px Inter`;
              const textWidth = ctx.measureText(label).width;
              const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2) as [number, number];

              // Draw Node
              ctx.beginPath();
              ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);
              ctx.fillStyle = node.risk > 0.7 ? '#f43f5e' : (highlightNodes.has(node) ? '#818cf8' : '#334155');
              ctx.fill();

              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = '#94a3b8';
              if (globalScale > 1.5) {
                ctx.fillText(label, node.x, node.y + 10);
              }
            }}
            onNodeHover={handleNodeHover}
            onLinkHover={handleLinkHover}
            onNodeClick={handleNodeClick}
            backgroundColor="#020617"
          />

          {/* Quick Metrics Overlay */}
          <div className="absolute top-8 left-8 flex gap-4 pointer-events-none">
            <Card className="p-4 bg-slate-900/80 border-white/5 backdrop-blur-md">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Entities</div>
              <div className="text-2xl font-black text-white">{graphData.nodes.length}</div>
            </Card>
            <Card className="p-4 bg-slate-900/80 border-white/5 backdrop-blur-md">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Risk Connections</div>
              <div className="text-2xl font-black text-rose-500">{graphData.links.filter((l: any) => l.risk_score > 0.7).length}</div>
            </Card>
          </div>

          {/* Pathfinder Legend */}
          {viewMode === 'paths' && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-white/10 p-4 rounded-2xl flex items-center gap-6 backdrop-blur-lg"
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                  {sourceNode ? 'Source Selected' : 'Select Source'}
                </span>
              </div>
              <div className="w-1 h-3 bg-white/10 rounded-full" />
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">
                  {targetNode ? 'Target Selected' : 'Select Target'}
                </span>
              </div>
              {sourceNode && targetNode && (
                <Button variant="outline" className="h-8 text-[10px] font-black" onClick={() => { setSourceNode(null); setTargetNode(null); }}>Reset</Button>
              )}
            </motion.div>
          )}
        </div>

        {/* Sidebar Intelligence */}
        <div className="col-span-12 lg:col-span-3 space-y-6 overflow-y-auto">
          {selectedNode ? (
            <AnimatePresence mode="wait">
              <motion.div 
                key={selectedNode.id}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="tactical-card p-6 bg-slate-900 border-white/5 rounded-3xl"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className={`p-3 rounded-xl ${selectedNode.risk > 0.7 ? 'bg-rose-500/20 text-rose-500' : 'bg-indigo-500/20 text-indigo-500'}`}>
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tighter">{selectedNode.name}</h3>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{selectedNode.type}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-slate-950 rounded-2xl border border-white/5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Risk Affinity</span>
                      <span className={`text-sm font-black ${selectedNode.risk > 0.7 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {(selectedNode.risk * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${selectedNode.risk > 0.7 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${selectedNode.risk * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-950 rounded-2xl border border-white/5">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Volume</div>
                      <div className="text-sm font-black text-white">Rp {(selectedNode.total_volume / 1e6).toFixed(1)}M</div>
                    </div>
                    <div className="p-4 bg-slate-950 rounded-2xl border border-white/5">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Centrality</div>
                      <div className="text-sm font-black text-white">{(selectedNode.centrality * 10).toFixed(2)}</div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleGenerateDossier}
                    disabled={isGenerating}
                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl"
                  >
                    {isGenerating ? 'Sealing & Sealing...' : 'Generate Intelligence Dossier'}
                  </Button>

                  {integritySeal && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                            <Shield className="w-3 h-3 text-emerald-400" />
                            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Integrity Seal Active</span>
                        </div>
                        <p className="text-[8px] font-mono text-slate-400 break-all">{integritySeal}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="tactical-card p-8 border-dashed border-white/10 flex flex-col items-center justify-center text-center opacity-50">
              <MousePointer2 className="w-8 h-8 text-slate-600 mb-4" />
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Select an entity to reveal relationship intelligence</p>
            </div>
          )}

          {/* Global Pattern Detection */}
          <div className="tactical-card p-6 bg-slate-900 border-white/5 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Circular Flow Alerts</h4>
              <Shield className="w-4 h-4 text-emerald-500" />
            </div>
            
            {isLoading ? (
              <SkeletonCard variant="alert" count={2} />
            ) : cycles && cycles.length > 0 ? (
              <div className="space-y-3">
                {cycles.slice(0, 3).map((cycle: any, i: number) => (
                  <div key={i} className="p-3 bg-slate-950 rounded-xl border border-rose-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3 text-rose-500" />
                      <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Cycle: {cycle.length} steps</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 text-[8px] px-2 font-black text-rose-400 hover:text-rose-300">Highlight</Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-950 rounded-2xl border border-white/5 border-dashed">
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">No circular patterns detected in current view</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </ForensicPageLayout>
  );
}
