'use client';

import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Building, Shield, MousePointer2, Activity, RefreshCw, Zap, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { EnhancedEntityGraph } from '../../../components/EntityGraph/EnhancedEntityGraph';
import { ClusterStatisticsPanel } from '../../../components/Forensic/ClusterStatisticsPanel';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner'; 

import ForensicPageLayout from '../../../app/components/ForensicPageLayout';
import { useProject } from '../../../store/useProject';
import { authenticatedFetch, authFetcher } from '../../../lib/api';
import PageFeatureCard from '../../../app/components/PageFeatureCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { GraphData, GraphNode, GraphLink } from '../../../types/graph';
import { ErrorBoundary } from 'react-error-boundary';

// Local Error Fallback for Graph Component
function GraphFallback({ error, resetErrorBoundary }: { error: any; resetErrorBoundary: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 border border-red-500/20 rounded-[2.5rem] p-8 text-center z-50">
      <div className="p-4 bg-red-500/10 rounded-full mb-4">
        <Shield className="w-12 h-12 text-red-500" />
      </div>
      <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Visualizer Malfunction</h3>
      <p className="text-slate-400 text-xs font-mono mb-6 max-w-md">
        The physics simulation encountered a critical topological error: {error.message}
      </p>
      <Button 
        onClick={resetErrorBoundary}
        variant="outline"
        className="border-red-500/30 text-red-400 hover:bg-red-500/10 uppercase text-[11px] font-black tracking-widest"
      >
        <RefreshCw className="w-3 h-3 mr-2" />
        Reset Simulation
      </Button>
    </div>
  );
}

export default function NexusGraphPage() {
  const router = useRouter();
  const { activeProjectId } = useProject();
  const fgRef = useRef<any>(null);

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);
  const [clusteredData, setClusteredData] = useState<any>(null);
  const [highlightNodes, setHighlightNodes] = useState(new Set<GraphNode>());
  const [highlightLinks, setHighlightLinks] = useState(new Set<GraphLink>());
  const [viewMode, setViewMode] = useState<'network' | 'paths' | 'global'>('network');
  const [chaosMode, setChaosMode] = useState(false); // Stress test flag
  
  const [sourceNode, setSourceNode] = useState<string | null>(null);
  const [targetNode, setTargetNode] = useState<string | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery<GraphData>({
    queryKey: ['graph', activeProjectId, viewMode],
    queryFn: () => authFetcher(`/api/v2/graph/network/${activeProjectId}`),
    enabled: !!activeProjectId && viewMode !== 'global'
  });

  const { data: globalNexus } = useQuery<any>({
    queryKey: ['nexus', 'global'],
    queryFn: () => authFetcher(`/api/v1/forensic/nexus/global`),
    enabled: viewMode === 'global'
  });

  const { data: cycles } = useQuery<any[][]>({
    queryKey: ['cycles', activeProjectId],
    queryFn: () => authFetcher(`/api/v2/graph/cycles/${activeProjectId}`),
    enabled: !!activeProjectId
  });

  // Map isRefetching to isValidating for compatibility
  const isValidating = isRefetching;
  const mutate = refetch;

  const graphData = useMemo<GraphData>(() => {
    if (chaosMode) {
        // INJECT MALFORMED DATA FOR STRESS TEST
        throw new Error("Simulated Topology Collapse (Chaos Mode)");
    }
    if (!data?.nodes) return { nodes: [], links: [] };
    return {
      nodes: data.nodes.map((n: GraphNode) => ({
        ...n,
        val: Math.max(10, Math.log((Number(n.total_volume) || 1) + 1) * 5)
      })),
      links: data.links.map((l: GraphLink) => ({
        ...l,
        // D3 requires object references or IDs. Assuming IDs are correct from API.
      }))
    };
  }, [data, chaosMode]);

  const updateHighlight = () => {
    setHighlightNodes(new Set(highlightNodes));
    setHighlightLinks(new Set(highlightLinks));
  };

  const handleNodeHover = (node: any) => {
    highlightNodes.clear();
    highlightLinks.clear();
    if (node) {
      highlightNodes.add(node);
      graphData.links.forEach((link: GraphLink) => {
        const s = link.source as GraphNode;
        const t = link.target as GraphNode;
        if (s.id === node.id || t.id === node.id) {
          highlightLinks.add(link);
          highlightNodes.add(s);
          highlightNodes.add(t);
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

  const [selectionTrail, setSelectionTrail] = useState<GraphNode[]>([]);

  const handleNodeClick = (node: any) => {
    setSelectedNode(node);
    setSelectionTrail(prev => {
        const newTrail = [...prev, node].slice(-5); // Keep last 5 for breadcrumbs
        return newTrail;
    });

    if (viewMode === 'paths') {
      if (!sourceNode) {
        setSourceNode(node.id);
        toast.info("Source Node Selected", { description: "Select a target node to trace path." });
      } else if (!targetNode && node.id !== sourceNode) {
        setTargetNode(node.id);
        toast.success("Path Trace Active");
      } else {
        setSourceNode(node.id);
        setTargetNode(null);
        toast.info("New Path Trace Started");
      }
    }
    
    if (fgRef.current) {
        fgRef.current.centerAt(node.x, node.y, 1000);
        fgRef.current.zoom(2.5, 1000);
    }
  };

  const [integritySeal, setIntegritySeal] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateDossier = async () => {
    if (!selectedNode || !activeProjectId) return;
    setIsGenerating(true);
    setIntegritySeal(null);

    const toastId = toast.loading("Sealing Forensic Dossier...");

    try {
      const res = await authenticatedFetch(`/api/v2/judge/verdict/${selectedNode.id}`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error("Sealing failed");
      const result = await res.json();
      setIntegritySeal(result.integrity_hash);
      
      toast.success("Dossier Generated", { id: toastId, description: "Downloading secure PDF..." });
      
      // Deliberate delay for UX
      setTimeout(() => {
          window.open(`/api/v2/forensic-v2/judge/download-dossier?case_id=${selectedNode.id}`, '_blank');
      }, 500);

    } catch (err) {
      console.error("Dossier generation failed", err);
      toast.error("Generation Failed", { id: toastId, description: "Could not seal dossier. Try again." });
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
                        className={`text-[11px] uppercase font-black tracking-widest px-4 h-8 rounded-xl ${viewMode === 'network' ? 'bg-indigo-600 hover:bg-indigo-500' : 'hover:bg-white/5 text-slate-500'}`}
                    >
                        Network
                    </Button>
                     <Button 
                         variant={viewMode === 'paths' ? 'default' : 'ghost'} 
                         size="sm" 
                         onClick={() => setViewMode('paths')}
                         className={`text-[11px] uppercase font-black tracking-widest px-4 h-8 rounded-xl ${viewMode === 'paths' ? 'bg-indigo-600 hover:bg-indigo-500' : 'hover:bg-white/5 text-slate-500'}`}
                     >
                         Pathfinder
                     </Button>
                     <Button 
                         variant={viewMode === 'global' ? 'default' : 'ghost'} 
                         size="sm" 
                         onClick={() => setViewMode('global')}
                         className={`text-[11px] uppercase font-black tracking-widest px-4 h-8 rounded-xl ${viewMode === 'global' ? 'bg-indigo-600 hover:bg-indigo-500' : 'hover:bg-white/5 text-slate-500'}`}
                     >
                         Global Silk Road
                     </Button>

                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => router.push('/forensic/flow/sankey')}
                        className="text-[11px] uppercase font-black tracking-widest px-4 h-8 text-slate-500 hover:text-white rounded-xl"
                    >
                        Sankey
                    </Button>
                 </div>
                 {process.env.NODE_ENV === 'development' && (
                 <Button
                    variant={chaosMode ? "destructive" : "ghost"}
                    size="sm"
                    onClick={() => setChaosMode(!chaosMode)}
                    className="h-10 px-4 border border-white/5 rounded-2xl text-[11px] uppercase font-black tracking-widest"
                    title="Stress Test: Inject Malformed Topology (Dev Only)"
                 >
                    {chaosMode ? "Chaos Active" : "Stress Test"}
                 </Button>
                 )}
                 <button 
                    onClick={() => mutate()} 
                    disabled={isValidating}
                    className="bg-slate-900 border border-white/10 rounded-2xl px-6 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                    {isValidating ? (
                        <RefreshCw className="w-3 h-3 text-indigo-500 animate-spin" />
                    ) : (
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_#6366f1]" />
                    )}
                    <span className="text-xs font-black uppercase text-indigo-400">
                        {isValidating ? 'Syncing...' : 'Live Sync'}
                    </span>
                 </button>
            </div>
        }
    >
      <div className="flex flex-col gap-8 h-full">
        {/* Operational Analysis Card */}
        <div className="px-10 pt-10">
          <PageFeatureCard 
            phase={3}
            title="Sovereign Nexus Graph"
            description="The system’s 'Relational Neural Network.' It allows analysts to see beyond simple lists into the complex topology of financial influence, identifying clusters invisible in table views."
            features={[
              "2D Force Graph with active glow node classification",
              "Chromatic Aberration alerts for high-risk patterns",
              "Integrated Pathfinder mode for influence tracing",
              "Reactive physics simulation for fluid investigation"
            ]}
            howItWorks="The Nexus Graph projects high-risk relationships onto a force-directed topology. It uses pathfinding algorithms to trace 'Silk Road' patterns—circular or complex debt-layering flows. By visualizing the topological distance between UBOs and shell accounts, it establishes a physical map of siphoning intensity."
          />
        </div>

        <div className="grid grid-cols-12 gap-8 px-10 pb-10 flex-1 min-h-0">
          <div className="col-span-12 lg:col-span-9 relative rounded-[2.5rem] overflow-hidden bg-slate-950 border border-white/5 shadow-2xl group">
          {viewMode === 'global' ? (
              <div className="h-full w-full p-10 overflow-y-auto custom-scrollbar bg-slate-900/20 backdrop-blur-3xl">
                  <div className="flex items-center gap-6 mb-12">
                      <div className="p-4 bg-rose-500/20 rounded-2xl border border-rose-500/40 animate-pulse">
                          <Zap className="w-8 h-8 text-rose-500" />
                      </div>
                      <div>
                          <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Global Silk Road Patterns</h2>
                          <p className="text-[11px] text-rose-400 font-bold uppercase tracking-widest mt-1">Cross-Project Entity Recidivism Identified</p>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {globalNexus?.entities?.map((ent: any, i: number) => (
                          <motion.div 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            transition={{ delay: i * 0.1 }}
                            key={ent.entity} 
                            className="p-8 bg-slate-950 border border-white/5 rounded-[2rem] hover:border-rose-500/30 transition-all group"
                          >
                              <div className="flex justify-between items-start mb-6">
                                  <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black">
                                          {ent.entity[0]}
                                      </div>
                                      <h3 className="font-black text-white uppercase tracking-tight">{ent.entity}</h3>
                                  </div>
                                  <span className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${ent.risk_level === 'CRITICAL' ? 'text-rose-500 border-rose-500/20 bg-rose-500/5' : 'text-amber-500 border-amber-500/20 bg-amber-500/5'}`}>
                                      {ent.risk_level}
                                  </span>
                              </div>
                              <div className="space-y-4">
                                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                                      <span>Projects Impacted</span>
                                      <span className="text-white">{ent.project_count}</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                      {ent.projects.map((pid: string) => (
                                          <span key={pid} className="px-2 py-1 bg-white/5 rounded text-[9px] font-mono text-slate-400 border border-white/5">
                                              {pid.slice(0, 8)}...
                                          </span>
                                      ))}
                                  </div>
                              </div>
                          </motion.div>
                      ))}
                      {(!globalNexus?.entities || globalNexus.entities.length === 0) && (
                          <div className="col-span-2 py-20 text-center opacity-30">
                              <Shield className="w-12 h-12 mx-auto mb-4" />
                              <p className="text-[11px] font-black uppercase tracking-[0.4em]">No Global Nexus Identified</p>
                          </div>
                      )}
                  </div>
              </div>
          ) : (
          <ErrorBoundary FallbackComponent={GraphFallback} onReset={() => setChaosMode(false)}>
          <AnimatePresence>
            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-50 backdrop-blur-sm">
                  <Activity className="w-12 h-12 text-indigo-500 animate-pulse mb-4" />
                  <span className="text-indigo-400 font-mono text-xs uppercase animate-pulse">Reconstructing Topology...</span>
              </motion.div>
            )}
          </AnimatePresence>

          <EnhancedEntityGraph
            projectId={activeProjectId || ''}
            data={graphData}
            onNodeClick={handleNodeClick}
            onClusteredDataUpdate={setClusteredData}
            enableClustering={true}
          />
          </ErrorBoundary>
          )}

          <div className="absolute top-8 left-8 flex flex-col gap-4 pointer-events-none">
            <Card className="p-4 bg-slate-950/80 border-white/5 backdrop-blur shadow-xl pointer-events-auto">
              <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Entities</div>
              <div className="text-2xl font-black text-white">{graphData.nodes.length}</div>
            </Card>

            <AnimatePresence>
                {selectionTrail.length > 0 && (
                    <motion.div 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="flex items-center gap-2 p-3 bg-slate-950/40 border border-white/5 rounded-2xl backdrop-blur-sm pointer-events-auto"
                    >
                        {selectionTrail.map((node, i) => (
                            <React.Fragment key={`${node.id}-${i}`}>
                                <button 
                                    onClick={() => setSelectedNode(node)}
                                    className={`text-[11px] font-black uppercase tracking-widest transition-colors ${selectedNode?.id === node.id ? 'text-indigo-400' : 'text-slate-500 hover:text-white'}`}
                                >
                                    {node.name?.split(' ')[0]}
                                </button>
                                {i < selectionTrail.length - 1 && <span className="text-slate-700 font-bold">/</span>}
                            </React.Fragment>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-3 space-y-6 overflow-y-auto custom-scrollbar pr-2">
          {clusteredData && (
            <ClusterStatisticsPanel data={clusteredData} />
          )}

          {viewMode === 'paths' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-indigo-600/5 border border-indigo-500/20 rounded-[2rem] space-y-4"
              >
                  <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">Pathfinder Logic</h4>
                  <div className="space-y-3">
                      <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                          <span className="text-[8px] font-bold text-slate-500 uppercase">Input Node</span>
                          <div className="text-xs font-black text-white mt-1 truncate">{sourceNode || 'Click a node...'}</div>
                      </div>
                      <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                          <span className="text-[8px] font-bold text-slate-500 uppercase">Target Node</span>
                          <div className="text-xs font-black text-white mt-1 truncate">{targetNode || 'Click a node...'}</div>
                      </div>
                  </div>
                  {(sourceNode && targetNode) && (
                      <Button 
                        onClick={() => { setSourceNode(null); setTargetNode(null); }}
                        variant="ghost" 
                        className="w-full text-[11px] font-black uppercase tracking-widest h-10 border border-white/5"
                      >
                          Reset Path
                      </Button>
                  )}
              </motion.div>
          )}

          <AnimatePresence mode="wait">
            {selectedNode ? (
                <motion.div 
                    key={selectedNode.id}
                    initial={{ x: 50, opacity: 0 }} 
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 50, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="p-6 bg-slate-900 border border-white/5 rounded-[2rem] shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                        <Activity className="w-24 h-24 text-white" />
                    </div>
                    
                    <h3 className="text-lg font-black text-white uppercase mb-4 relative z-10">{selectedNode.name}</h3>
                    
                    <div className="space-y-6 relative z-10">
                    <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 shadow-inner">
                        <div className="flex justify-between mb-2">
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Risk Affinity</span>
                        <span className={`text-sm font-black ${ (selectedNode.risk_score || 0) > 0.7 ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {((selectedNode.risk_score || 0) * 100).toFixed(1)}%
                        </span>
                        </div>
                        <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${ (selectedNode.risk_score || 0) * 100}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className={`h-full ${ (selectedNode.risk_score || 0) > 0.7 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                <Network className="w-4 h-4 text-indigo-500" />
                            </div>
                            <div>
                                <div className="text-[11px] uppercase text-slate-500 font-bold">Connections</div>
                                <div className="text-sm font-black text-white">{(selectedNode as any).degree || 'Unknown'} Nodes</div>
                            </div>
                        </div>
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                <Building className="w-4 h-4 text-indigo-500" />
                            </div>
                            <div>
                                <div className="text-[11px] uppercase text-slate-500 font-bold">Entity Type</div>
                                <div className="text-sm font-black text-white">{(selectedNode as any).type || 'Standard Node'}</div>
                            </div>
                        </div>
                    </div>

                    <Button 
                        onClick={handleGenerateDossier} 
                        disabled={isGenerating} 
                        className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 font-black uppercase text-[11px] tracking-widest rounded-xl shadow-lg shadow-indigo-900/40 active:scale-95 transition-all group"
                    >
                        {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2 group-hover:fill-current" />}
                        {isGenerating ? 'Sealing...' : 'Generate Dossier'}
                    </Button>
                    </div>
                </motion.div>
            ) : (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 0.5 }}
                    className="p-8 border-2 border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center text-center h-64"
                >
                <div className="p-4 bg-slate-800 rounded-full mb-4">
                    <MousePointer2 className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Select an entity node</p>
                <p className="text-[11px] text-slate-600 mt-2">Reveal connection topology and risk affinity.</p>
                </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  </ForensicPageLayout>
);
}
