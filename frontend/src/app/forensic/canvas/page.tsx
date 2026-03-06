'use client';

import React, { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  Network, 
  Layers, 
  Target, 
  Activity,
  Maximize2,
  Zap,
  Shield,
  MousePointer2,
  RefreshCw,
  X
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';

import ForensicPageLayout from '../../../app/components/ForensicPageLayout';
import { useProject } from '../../../store/useProject';
import { authFetcher, authenticatedFetch } from '../../../lib/api';
import { EnhancedEntityGraph } from '../../../components/EntityGraph/EnhancedEntityGraph';
import { GraphData, GraphNode, GeoEntity } from '../../../types/graph';
import { MapPosition } from '../map/components/constants';
import { useHubFocus } from '../../../store/useHubFocus';

// Dynamically import the map to avoid SSR issues
const ForensicMap = dynamic(() => import('../map/components/ForensicMap').then(m => m.ForensicMap), { ssr: false });

export default function IntelligenceCanvasPage() {
    const { activeProjectId } = useProject();
    const { focusMode, toggleFocusMode } = useHubFocus();
    const [selectedNode, setSelectedNode] = useState<any>(null);
    const [mapPosition, setMapPosition] = useState<MapPosition>({ coordinates: [106.8456, -6.2088], zoom: 1000 });
    const [showCommPanel, setShowCommPanel] = useState(false);
    const [commMessages, setCommMessages] = useState<any[]>([]);
    const [commLoading, setCommLoading] = useState(false);

    const { data: graphData, isLoading: graphLoading } = useQuery<GraphData>({
        queryKey: ['graph', activeProjectId],
        queryFn: () => authFetcher(`/api/v2/graph/network/${activeProjectId}`),
        enabled: !!activeProjectId
    });

    const { data: geoData, isLoading: geoLoading } = useQuery<GeoEntity[]>({
        queryKey: ['geo', activeProjectId],
        queryFn: () => authFetcher(`/api/v2/geo/nodes/${activeProjectId}`),
        enabled: !!activeProjectId
    });

    // Fetch communications when entity is selected
    useEffect(() => {
        if (selectedNode && activeProjectId) {
            const fetchComms = async () => {
                setCommLoading(true);
                setShowCommPanel(true);
                try {
                    // Semantic link: Search for entity name in communications
                    const res = await authenticatedFetch(`/api/comm-forensics/${activeProjectId}/messages?search=${encodeURIComponent(selectedNode.name || selectedNode.id)}&limit=10`);
                    if (res.ok) {
                        const data = await res.json();
                        setCommMessages(data.messages);
                    }
                } catch (e) {
                    console.error("Failed to fetch comms", e);
                } finally {
                    setCommLoading(false);
                }
            };
            fetchComms();
        }
    }, [selectedNode, activeProjectId]);

    // Keyboard Hotkeys
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'c' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
                toggleFocusMode();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleFocusMode]);

    const handleNodeClick = (node: any) => {
        console.log("Node clicked on Canvas:", node);
        setSelectedNode(node);
        // Bi-directional Sync: Graph -> Map
        if (node.lat && node.lng) {
            setMapPosition({ coordinates: [node.lng, node.lat], zoom: 3000 });
        } else {
            const geoMatch = geoData?.find(e => e.id === node.id || e.name === node.name);
            if (geoMatch) {
                setMapPosition({ coordinates: [geoMatch.lng, geoMatch.lat], zoom: 3000 });
            }
        }
    };

    const handleMapEntitySelect = (entity: GeoEntity | null) => {
        if (!entity) return;
        setSelectedNode(entity);
        // Bi-directional Sync: Map -> Graph (Requires identifying node in graph data)
        // Note: The graph component handles internal centering if we pass selection state, 
        // but here we just update selectedNode which can be used for HUD.
    };

    return (
        <ForensicPageLayout
            title="Intelligence Canvas"
            subtitle="Cross-Dimensional Entity Tracking Protocol"
            icon={Layers}
            isFocusMode={focusMode}
        >
            <div className={`flex flex-col lg:flex-row h-full gap-8 p-8 overflow-hidden transition-all duration-700 ${focusMode ? 'bg-black' : 'bg-slate-950'}`}>
                {/* LEFT: RELATIONSHIP NEXUS (GRAPH) */}
                <div className={`flex-1 min-h-[400px] lg:min-h-0 glass-tactical rounded-[3rem] border border-white/5 relative overflow-hidden group transition-all duration-700 ${focusMode ? 'scale-[1.02] border-indigo-500/20 shadow-[0_0_50px_rgba(99,102,241,0.1)]' : ''}`}>
                    <div className={`absolute top-8 left-8 z-20 flex items-center gap-4 pointer-events-none transition-opacity duration-500 ${focusMode ? 'opacity-20' : 'opacity-100'}`}>
                        <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
                            <Network className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-white uppercase tracking-widest italic">Nexus Linkage</h2>
                            <p className="text-[8px] text-indigo-400 font-bold uppercase tracking-[0.2em]">Topological Influence</p>
                        </div>
                    </div>

                    <div className="h-full w-full">
                        <EnhancedEntityGraph
                            projectId={activeProjectId || ''}
                            data={graphData || { nodes: [], links: [] }}
                            onNodeClick={handleNodeClick}
                            enableClustering={true}
                        />
                    </div>
                    
                    <AnimatePresence>
                        {graphLoading && (
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm z-30 flex items-center justify-center"
                            >
                                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* RIGHT: GEOSPATIAL REALITY (MAP) */}
                <div className={`flex-1 min-h-[400px] lg:min-h-0 glass-tactical rounded-[3rem] border border-white/5 relative overflow-hidden group transition-all duration-700 ${focusMode ? 'scale-[1.02] border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.1)]' : ''}`}>
                    <div className={`absolute top-8 left-8 z-20 flex items-center gap-4 pointer-events-none transition-opacity duration-500 ${focusMode ? 'opacity-20' : 'opacity-100'}`}>
                        <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
                            <Target className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-white uppercase tracking-widest italic">Reality Anchor</h2>
                            <p className="text-[8px] text-emerald-400 font-bold uppercase tracking-[0.2em]">Physical Verification</p>
                        </div>
                    </div>

                    <div className="h-full w-full">
                        <ForensicMap
                            loadingEntities={geoLoading}
                            entities={geoData || []}
                            mapMode="markers"
                            mapPosition={mapPosition}
                            setMapPosition={setMapPosition}
                            setSelectedEntity={handleMapEntitySelect}
                        />
                    </div>
                </div>

                {/* MENS REA DISCOVERY PANEL (RIGHT SIDEBAR) */}
                <AnimatePresence>
                    {showCommPanel && (
                        <motion.aside 
                            initial={{ x: 400, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 400, opacity: 0 }}
                            className="w-96 glass-tactical border-l border-white/10 flex flex-col backdrop-blur-3xl overflow-hidden"
                        >
                            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-indigo-500/5">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-600/20 rounded-xl border border-indigo-500/30">
                                        <Layers className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Mens Rea discovery</h3>
                                        <p className="text-[8px] text-indigo-400 font-bold uppercase tracking-[0.2em]">Intent Identification</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowCommPanel(false)} className="text-slate-500 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Locked on entity</span>
                                    <div className="text-sm font-black text-white mt-1 uppercase italic tracking-tighter">{selectedNode?.name || selectedNode?.id}</div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Hot Snippets (Intercepted)</h4>
                                    
                                    {commLoading ? (
                                        <div className="py-20 text-center">
                                            <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin mx-auto mb-4" />
                                            <span className="text-[9px] font-mono text-indigo-400 uppercase animate-pulse">Scanning comm channels...</span>
                                        </div>
                                    ) : commMessages.length === 0 ? (
                                        <div className="py-20 text-center opacity-30">
                                            <Shield className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                                            <p className="text-[9px] font-black uppercase tracking-widest">No Direct Intent Found</p>
                                        </div>
                                    ) : (
                                        commMessages.map((msg, i) => (
                                            <motion.div 
                                                key={msg.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                className="p-4 bg-slate-900 border border-white/5 rounded-2xl space-y-3 group hover:border-indigo-500/30 transition-all"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[8px] font-black text-indigo-400 uppercase bg-indigo-500/10 px-2 py-0.5 rounded-full">{msg.sender}</span>
                                                    <span className="text-[8px] font-mono text-slate-600">{new Date(msg.message_timestamp).toLocaleTimeString()}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-300 leading-relaxed italic group-hover:text-white transition-colors">
                                                    &quot;{msg.message_text}&quot;
                                                </p>
                                                <div className="flex gap-2">
                                                    <span className="text-[7px] font-black text-rose-500 uppercase tracking-tighter bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">High Sentiment</span>
                                                    <span className="text-[7px] font-black text-indigo-400 uppercase tracking-tighter bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 italic">Coordination</span>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </div>
                            
                            <div className="p-6 border-t border-white/5 bg-slate-950">
                                <Button className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-[10px] tracking-widest rounded-xl">
                                    Flag for Legal Evidence
                                </Button>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>
            </div>

            {/* SYNC STATUS BAR */}
            <div className="fixed bottom-12 left-1/2 -translate-x-1/2 w-full max-w-4xl px-8 z-40 pointer-events-none">
                <motion.div 
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className={`p-4 backdrop-blur-3xl border rounded-2xl flex items-center justify-between shadow-2xl pointer-events-auto transition-all duration-700 ${focusMode ? 'bg-indigo-950/40 border-indigo-500/30 scale-105' : 'bg-slate-900/90 border-white/10'}`}
                >
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full animate-pulse ${focusMode ? 'bg-indigo-400' : 'bg-indigo-500'}`} />
                            <span className={`text-[10px] font-black uppercase tracking-widest ${focusMode ? 'text-indigo-300' : 'text-white'}`}>
                                {focusMode ? 'Clear Sight Active' : 'Nexus-Reality Sync: Active'}
                            </span>
                        </div>
                        <div className="w-px h-4 bg-white/10" />
                        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                            {selectedNode ? `Locked on: ${selectedNode.name || selectedNode.id}` : 'Scanning for cross-dimensional matches...'}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-2 py-1 rounded bg-black/40 border border-white/5 text-[8px] text-slate-500 font-mono">
                            Press <span className="text-indigo-400 mx-1">C</span> to toggle focus
                        </div>
                        {selectedNode && (
                            <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] ${selectedNode?.risk_score > 0.7 ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' : 'bg-slate-800 text-slate-400'}`}>
                                Risk: {((selectedNode.risk_score || 0) * 100).toFixed(1)}%
                            </div>
                        )}
                        <button 
                            onClick={toggleFocusMode}
                            className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"
                        >
                            <Maximize2 size={16} />
                        </button>
                    </div>
                </motion.div>
            </div>
        </ForensicPageLayout>
    );
}
