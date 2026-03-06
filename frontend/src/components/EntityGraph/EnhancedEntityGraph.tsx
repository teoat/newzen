'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { 
  ZoomIn, 
  ZoomOut, 
  Download, 
  Search, 
  Filter, 
  X, 
  Eye, 
  EyeOff, 
  Maximize2,
  Layers,
  MapPin,
  AlertTriangle
} from 'lucide-react';

// Dynamic import for ForceGraph2D to prevent SSR hydration mismatches and reduce bundle size
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-full bg-slate-900">
      <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
      <span className="text-xs font-black uppercase text-indigo-400 tracking-widest animate-pulse">
        Initializing Physics Engine...
      </span>
    </div>
  )
});

// Enhanced types for clustering
interface EntityNode {
  id: string;
  name: string;
  type: 'Person' | 'Company' | 'Transaction' | 'Location';
  val: number;
  group?: string;
  lat?: number;
  lng?: number;
  city?: string;
  region?: string;
  country?: string;
}

interface EntityEdge {
  source: string;
  target: string;
  relation: 'transfer' | 'ownership' | 'communication' | 'related';
  value?: number;
}

interface FocusBubble {
  id: string;
  level: 'city' | 'regional' | 'national';
  position?: {
    lat?: number;
    lng?: number;
  };
  size: number;
  density: number;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high';
  size_category: 'small' | 'medium' | 'large' | 'xlarge';
  transaction_count: number;
  total_amount: number;
  entity_types: string[];
  has_geographic_data: boolean;
  expandable: boolean;
  expanded: boolean;
}

interface ClusteredNetworkData {
  bubbles: FocusBubble[];
  expanded_data: Record<string, any>;
  network_stats: Record<string, any>;
  clustering_stats: Record<string, any>;
  lod_data: Record<string, any>;
  metadata: Record<string, any>;
}

interface EnhancedEntityGraphProps {
  projectId: string;
  width?: number;
  height?: number;
  data?: {
    nodes: any[];
    links: any[];
  };
  onNodeClick?: (node: EntityNode) => void;
  onBubbleClick?: (bubble: FocusBubble) => void;
  onClusteredDataUpdate?: (data: ClusteredNetworkData) => void;
  searchable?: boolean;
  exportable?: boolean;
  enableClustering?: boolean;
  initialZoomLevel?: number;
}

// Color schemes for bubbles and entities
const bubbleColors: Record<string, Record<string, string>> = {
  city: {
    low: '#10b981',    // green
    medium: '#f59e0b', // amber  
    high: '#ef4444'    // red
  },
  regional: {
    low: '#3b82f6',    // blue
    medium: '#8b5cf6', // violet
    high: '#ec4899'    // pink
  },
  national: {
    low: '#06b6d4',    // cyan
    medium: '#6366f1', // indigo
    high: '#dc2626'    // red
  }
};

const nodeColors: Record<EntityNode['type'], string> = {
  Person: '#ef4444',
  Company: '#3b82f6',
  Transaction: '#22c55e',
  Location: '#f59e0b',
};

const edgeColors: Record<EntityEdge['relation'], string> = {
  transfer: '#22c55e',
  ownership: '#3b82f6',
  communication: '#8b5cf6',
  related: '#94a3b8',
};

export function EnhancedEntityGraph({
  projectId,
  width = 800,
  height = 600,
  data,
  onNodeClick,
  onBubbleClick,
  onClusteredDataUpdate,
  searchable = true,
  exportable = true,
  enableClustering = true,
  initialZoomLevel = 1.0
}: EnhancedEntityGraphProps) {
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<EntityNode['type'] | 'all' | 'cluster_bubbles'>('all');
  const [dimensions, setDimensions] = useState({ width, height });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDegradedMode, setIsDegradedMode] = useState(false);
  
  // Clustering state
  const [zoomLevel, setZoomLevel] = useState(initialZoomLevel);
  const [clusteredData, setClusteredData] = useState<ClusteredNetworkData | null>(null);
  const [isLoadingClusters, setIsLoadingClusters] = useState(false);
  const [expandedBubbles, setExpandedBubbles] = useState<Set<string>>(new Set());
  const [selectedBubble, setSelectedBubble] = useState<FocusBubble | null>(null);
  
  // Traditional graph state
  const [nodes, setNodes] = useState<EntityNode[]>([]);
  const [edges, setEdges] = useState<EntityEdge[]>([]);

  // Update parent when clusteredData changes
  useEffect(() => {
    if (clusteredData && onClusteredDataUpdate) {
      onClusteredDataUpdate(clusteredData);
    }
  }, [clusteredData, onClusteredDataUpdate]);

  // Update internal state when data prop changes
  useEffect(() => {
    if (data) {
      // Cast input data to expected types if necessary, or just store
      // Assuming incoming data matches EntityNode/EntityEdge roughly or is compatible
      setNodes(data.nodes as EntityNode[]);
      setEdges(data.links as EntityEdge[]);
    }
  }, [data]);

  // Initialize clustering worker
  useEffect(() => {
    if (enableClustering && typeof Worker !== 'undefined') {
      workerRef.current = new Worker(new URL('../../workers/clustering.worker.ts', import.meta.url));
      
      workerRef.current.onmessage = (event) => {
        const { type, data, error } = event.data;
        
        if (type === 'CLUSTER_SUCCESS' && data) {
          setClusteredData({
            bubbles: data.bubbles,
            expanded_data: {},
            network_stats: data.stats,
            clustering_stats: data.stats,
            lod_data: {},
            metadata: {
              clustering_enabled: true,
              timestamp: new Date().toISOString()
            }
          });
          setIsLoadingClusters(false);
        } else if (type === 'CLUSTER_ERROR') {
          console.error('Clustering error:', error);
          setIsLoadingClusters(false);
        }
      };
      
      return () => {
        if (workerRef.current) {
          workerRef.current.terminate();
        }
      };
    }
  }, [enableClustering]);

  // Fetch clustered network data
  useEffect(() => {
    if (!enableClustering || !projectId) return;
    
    const fetchClusteredData = async () => {
      setIsLoadingClusters(true);
      
      try {
        const response = await fetch(
          `/api/v4/projects/${projectId}/clusters?zoom_level=${zoomLevel}&include_expanded=true`
        );
        
        if (response.ok) {
          const data = await response.json();
          setClusteredData(data);
          setIsDegradedMode(data.metadata?.fallback_mode || false);
        } else {
          throw new Error('Failed to fetch clustered data');
        }
      } catch (error) {
        console.error('Error fetching clustered data:', error);
        setIsDegradedMode(true);
      } finally {
        setIsLoadingClusters(false);
      }
    };
    
    fetchClusteredData();
  }, [projectId, zoomLevel, enableClustering]);

  // Handle zoom changes for LOD clustering
  const handleZoomChange = useCallback((zoomFactor: number) => {
    const newZoomLevel = Math.max(0, Math.min(1, zoomFactor));
    setZoomLevel(newZoomLevel);
  }, []);

  // Expand a bubble to show individual entities
  const expandBubble = useCallback(async (bubbleId: string) => {
    if (!projectId) return;
    
    try {
      const response = await fetch(`/api/v4/projects/${projectId}/clusters/${bubbleId}/expand`);
      
      if (response.ok) {
        const expandedData = await response.json();
        
        // Update expanded bubbles state
        setExpandedBubbles(prev => new Set(prev).add(bubbleId));
        
        // Update clustered data with expanded information
        setClusteredData(prev => prev ? {
          ...prev,
          expanded_data: {
            ...prev.expanded_data,
            [bubbleId]: expandedData
          }
        } : null);
        
        // Call onBubbleClick if provided
        if (onBubbleClick && clusteredData) {
          const bubble = clusteredData.bubbles.find(b => b.id === bubbleId);
          if (bubble) {
            onBubbleClick(bubble);
          }
        }
      }
    } catch (error) {
      console.error('Error expanding bubble:', error);
    }
  }, [projectId, onBubbleClick, clusteredData]);

  // Create graph data from clustered or traditional view
  const graphData = useMemo(() => {
    if (enableClustering && clusteredData) {
      // Create bubbles as nodes
      const bubbleNodes = clusteredData.bubbles.map(bubble => ({
        id: bubble.id,
        name: `Cluster ${bubble.id.split('_')[1]} (${bubble.size} entities)`,
        type: 'Cluster' as EntityNode['type'],
        val: Math.sqrt(bubble.size) * 10,
        group: bubble.level,
        bubble: bubble,
        color: bubbleColors[bubble.level][bubble.risk_level],
        lat: bubble.position?.lat,
        lng: bubble.position?.lng
      }));
      
      // Add expanded entities if any
      const expandedEntities: EntityNode[] = [];
      const expandedEdges: EntityEdge[] = [];
      
      Object.entries(clusteredData.expanded_data).forEach(([bubbleId, data]: [string, any]) => {
        if (expandedBubbles.has(bubbleId) && data.entities) {
          data.entities.forEach((entity: any) => {
            expandedEntities.push({
              id: entity.id,
              name: entity.name,
              type: entity.type || 'Company',
              val: 5,
              group: 'expanded',
              lat: entity.position?.lat,
              lng: entity.position?.lng
            });
          });
          
          data.transactions.forEach((txn: any) => {
            expandedEdges.push({
              source: txn.source,
              target: txn.target,
              relation: 'transfer' as const,
              value: txn.amount
            });
          });
        }
      });
      
      return {
        nodes: [...bubbleNodes, ...expandedEntities],
        links: expandedEdges
      };
    }
    
    // Traditional view
    return {
      nodes: nodes.map(node => ({
        ...node,
        color: nodeColors[node.type],
        label: node.name,
      })),
      links: edges.map(edge => ({
        ...edge,
        color: edgeColors[edge.relation],
        value: edge.value || 1,
      })),
    };
  }, [enableClustering, clusteredData, nodes, edges, expandedBubbles]);

  // Filter graph data
  const filteredGraphData = useMemo(() => {
    if (!searchTerm && filterType === 'all') {
      return graphData;
    }
    
    const filteredNodes = graphData.nodes.filter((node: any) => {
      const matchesSearch = searchTerm
        ? node.name.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      
      const matchesFilter = filterType === 'all' || 
        (filterType === 'cluster_bubbles' && node.type === 'Cluster') ||
        node.type === filterType;
      
      return matchesSearch && matchesFilter;
    });
    
    const nodeIds = new Set(filteredNodes.map((node: any) => node.id));
    const filteredLinks = graphData.links.filter((link: any) => 
      nodeIds.has(link.source) && nodeIds.has(link.target)
    );
    
    return {
      nodes: filteredNodes,
      links: filteredLinks
    };
  }, [graphData, searchTerm, filterType]);

  // Handle node/bubble clicks
  const handleNodeClick = useCallback((node: any) => {
    if (node.bubble) {
      // Handle bubble click
      setSelectedBubble(node.bubble);
      if (node.bubble.expandable) {
        expandBubble(node.bubble.id);
      }
    } else {
      // Handle regular node click
      onNodeClick?.(node);
    }
  }, [onNodeClick, expandBubble]);

  // Control functions
  const handleZoomIn = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(300, 100);
      handleZoomChange(zoomLevel + 0.1);
    }
  };

  const handleZoomOut = () => {
    if (graphRef.current) {
      const fg = graphRef.current as any;
      fg.zoomBy(0.5);
      handleZoomChange(zoomLevel - 0.1);
    }
  };

  const handleExport = () => {
    const canvas = containerRef.current?.querySelector('canvas');
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `enhanced-entity-graph-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  // Responsive dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [isFullscreen]);

  const isFullscreenClass = isFullscreen ? 'fixed inset-0 z-[100] bg-slate-950' : 'w-full h-full min-h-[400px]';

  // Show degraded mode for large datasets
  if (isDegradedMode && !enableClustering) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-950 border border-white/5 rounded-2xl p-12 text-center">
        <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 border border-rose-500/20">
          <EyeOff className="text-rose-500" size={32} />
        </div>
        <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Computational Boundary Exceeded</h3>
        <p className="text-slate-400 text-sm max-w-md mb-8">
          The current nexus contains too many entities for high-fidelity rendering. Enable clustering mode for optimal performance.
        </p>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsDegradedMode(false)}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest border border-white/10 transition-all"
          >
            Force Render
          </button>
          <button 
            onClick={() => {
              setIsDegradedMode(false);
              // Enable clustering would happen here
            }}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-900/40 transition-all"
          >
            Enable Clustering
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`${isFullscreenClass} relative bg-slate-900 rounded-xl overflow-hidden`}>
      {/* Control Panel */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
        {searchable && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search entities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-800/90 backdrop-blur-sm border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 w-48"
            />
          </div>
        )}
        
        <select
          title="Filter by Type"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="px-3 py-2 bg-slate-800/90 backdrop-blur-sm border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Types</option>
          {enableClustering && (
            <option value="cluster_bubbles">Cluster Bubbles</option>
          )}
          <option value="Person">Person</option>
          <option value="Company">Company</option>
          <option value="Transaction">Transaction</option>
          <option value="Location">Location</option>
        </select>
        
        {enableClustering && (
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/90 backdrop-blur-sm border border-white/10 rounded-lg">
            <Layers className="w-4 h-4 text-indigo-400" size={16} />
            <span className="text-xs text-white">Clustering</span>
            <span className="text-xs text-slate-400">
              {clusteredData?.metadata?.clustering_enabled ? 'ON' : 'OFF'}
            </span>
          </div>
        )}
      </div>

      {/* Zoom and Export Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-slate-800/90 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-slate-700 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4 text-white" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-slate-800/90 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-slate-700 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4 text-white" />
        </button>
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 bg-slate-800/90 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-slate-700 transition-colors"
          title="Toggle Fullscreen"
        >
          <Maximize2 className="w-4 h-4 text-white" />
        </button>
        {exportable && (
          <button
            onClick={handleExport}
            className="p-2 bg-slate-800/90 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-slate-700 transition-colors"
            title="Export as PNG"
          >
            <Download className="w-4 h-4 text-white" />
          </button>
        )}
      </div>

      {/* Legend and Stats */}
      <div className="absolute bottom-4 left-4 z-10 flex gap-4">
        <div className="flex gap-2 flex-wrap max-w-xs">
          {enableClustering && clusteredData ? (
            // Bubble legend for clustering mode
            Object.entries(bubbleColors).map(([level, colors]) => (
              <div key={level} className="flex flex-col gap-1">
                <div className="flex items-center gap-1 px-2 py-1 bg-slate-800/90 backdrop-blur-sm rounded text-xs">
                  <MapPin className="w-3 h-3 text-slate-400" size={12} />
                  <span className="text-slate-300 capitalize">{level}</span>
                </div>
                <div className="flex gap-1">
                  {Object.entries(colors).map(([risk, color]) => (
                    <div key={risk} className="flex items-center gap-1 px-2 py-1 bg-slate-800/90 backdrop-blur-sm rounded text-xs">
                      <span 
                        className="w-2 h-2 rounded-full bg-[var(--bubble-color)]" 
                        style={{ '--bubble-color': color } as React.CSSProperties} 
                      />
                      <span className="text-slate-300">{risk}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            // Entity type legend for traditional mode
            (Object.keys(nodeColors) as EntityNode['type'][]).map((type) => (
              <div key={type} className="flex items-center gap-1 px-2 py-1 bg-slate-800/90 backdrop-blur-sm rounded text-xs">
                <span 
                  className="w-2 h-2 rounded-full bg-[var(--node-color)]" 
                  style={{ '--node-color': nodeColors[type] } as React.CSSProperties} 
                />
                <span className="text-slate-300">{type}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Stats Display */}
      <div className="absolute bottom-4 right-4 z-10">
        {clusteredData && (
          <div className="px-3 py-2 bg-slate-800/90 backdrop-blur-sm border border-white/10 rounded-lg text-xs">
            <div className="text-slate-300">
              {clusteredData.clustering_stats.total_bubbles || 0} bubbles • 
              {clusteredData.clustering_stats.total_entities || 0} entities •
              Zoom: {(zoomLevel * 100).toFixed(0)}%
            </div>
          </div>
        )}
      </div>

      {/* Loading Indicator */}
      {isLoadingClusters && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-white text-sm font-medium">Clustering Network...</div>
            <div className="text-slate-400 text-xs mt-1">Optimizing for {nodes.length} entities</div>
          </div>
        </div>
      )}

      {/* Force Graph */}
      <ForceGraph2D
        ref={graphRef}
        graphData={filteredGraphData}
        width={dimensions.width}
        height={dimensions.height}
        nodeLabel="name"
        nodeColor={(node: any) => node.color || '#475569'}
        linkColor={(link: any) => link.color || '#475569'}
        linkWidth={(link: any) => link.value || 1}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        onNodeClick={handleNodeClick}
        backgroundColor="#0f172a"
        enableNodeDrag={!enableClustering}
        enableZoomInteraction={true}
        onZoom={(transform) => handleZoomChange(transform.k)}
        nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const label = node.name;
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px Inter, sans-serif`;
          const textWidth = ctx.measureText(label).width;

          // Velocity Pulse Effect (Smurfing Sensor)
          if (node.velocity_risk === 'HIGH' || node.risk_score > 0.8) {
            const t = Date.now() / 1000;
            const pulse = (Math.sin(t * 10) + 1) / 2; // High frequency
            ctx.beginPath();
            const radius = node.bubble ? Math.sqrt(node.bubble.size) * 5 : Math.sqrt(node.val) * 3;
            ctx.arc(node.x || 0, node.y || 0, radius + (pulse * 5), 0, 2 * Math.PI, false);
            ctx.strokeStyle = `rgba(244, 63, 94, ${0.5 * (1 - pulse)})`; // Magenta-ish pulse
            ctx.lineWidth = 2 / globalScale;
            ctx.stroke();
          }

          // Different rendering for bubbles vs entities
          if (node.bubble) {
            // Render bubble
            const bubble = node.bubble as FocusBubble;
            const radius = Math.sqrt(bubble.size) * 5;
            
            ctx.fillStyle = node.color || bubbleColors[bubble.level][bubble.risk_level];
            ctx.beginPath();
            ctx.arc(node.x || 0, node.y || 0, radius, 0, 2 * Math.PI, false);
            ctx.fill();
            
            // Risk indicator
            if (bubble.risk_level === 'high') {
              ctx.strokeStyle = '#ef4444';
              ctx.lineWidth = 2;
              ctx.stroke();
            }
            
            // Label
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillText(label, (node.x || 0) - textWidth / 2, (node.y || 0) + radius + fontSize + 2);
          } else {
            // Render regular entity
            ctx.fillStyle = nodeColors[node.type as EntityNode['type']] || '#fff';
            ctx.beginPath();
            ctx.arc(node.x || 0, node.y || 0, Math.sqrt(node.val) * 3, 0, 2 * Math.PI, false);
            ctx.fill();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillText(label, (node.x || 0) - textWidth / 2, (node.y || 0) + Math.sqrt(node.val) * 3 + fontSize + 2);
          }
        }}
        nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
          ctx.fillStyle = color;
          if (node.bubble) {
            const bubble = node.bubble as FocusBubble;
            const radius = Math.sqrt(bubble.size) * 5;
            ctx.beginPath();
            ctx.arc(node.x || 0, node.y || 0, radius, 0, 2 * Math.PI, false);
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(node.x || 0, node.y || 0, Math.sqrt(node.val) * 3, 0, 2 * Math.PI, false);
            ctx.fill();
          }
        }}
      />

      {/* Fullscreen Exit Button */}
      {isFullscreen && (
        <button
          onClick={() => setIsFullscreen(false)}
          title="Exit Fullscreen"
          className="absolute top-4 right-16 p-2 bg-slate-800/90 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-slate-700 transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      )}
    </div>
  );
}