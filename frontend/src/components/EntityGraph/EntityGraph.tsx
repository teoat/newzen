'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { ZoomIn, ZoomOut, Download, Search, Filter, X, Eye, EyeOff, Maximize2 } from 'lucide-react';

export interface EntityNode {
  id: string;
  name: string;
  type: 'Person' | 'Company' | 'Transaction' | 'Location';
  val: number;
  group?: string;
}

export interface EntityEdge {
  source: string;
  target: string;
  relation: 'transfer' | 'ownership' | 'communication' | 'related';
  value?: number;
}

interface EntityGraphProps {
  nodes: EntityNode[];
  edges: EntityEdge[];
  width?: number;
  height?: number;
  onNodeClick?: (node: EntityNode) => void;
  onNodeExpand?: (node: EntityNode) => void;
  searchable?: boolean;
  exportable?: boolean;
}

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

export function EntityGraph({
  nodes,
  edges,
  width = 800,
  height = 600,
  onNodeClick,
  onNodeExpand,
  searchable = true,
  exportable = true,
}: EntityGraphProps) {
  const graphRef = useRef<{ zoomToFit: (duration?: number, padding?: number) => void } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<EntityNode['type'] | 'all'>('all');
  const [visibleNodes, setVisibleNodes] = useState<Set<string>>(new Set(nodes.map((n) => n.id)));
  const [dimensions, setDimensions] = useState({ width, height });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layoutReady, setLayoutReady] = useState(false);
  const [workerGraphData, setWorkerGraphData] = useState<{ nodes: any[], links: any[] } | null>(null);
  const [isDegradedMode, setIsDegradedMode] = useState(nodes.length > 1000);

  // Use Web Worker for layout calculations
  useEffect(() => {
    if (nodes.length === 0 || isDegradedMode) return;

    const worker = new Worker(new URL('../../workers/layout.worker.ts', import.meta.url));
    
    worker.onmessage = (e) => {
      setWorkerGraphData(e.data);
      setLayoutReady(true);
      worker.terminate();
    };

    worker.postMessage({ 
      nodes: nodes.map(n => ({ ...n })), 
      links: edges.map(e => ({ ...e })),
      iterations: nodes.length > 100 ? 100 : 50
    });

    return () => worker.terminate();
  }, [nodes, edges, isDegradedMode]);

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

  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      const matchesSearch = searchTerm
        ? node.name.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      const matchesFilter = filterType === 'all' || node.type === filterType;
      const matchesVisible = visibleNodes.has(node.id);
      return matchesSearch && matchesFilter && matchesVisible;
    });
  }, [nodes, searchTerm, filterType, visibleNodes]);

  const filteredEdges = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    return edges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target));
  }, [edges, filteredNodes]);

  const graphData = useMemo(() => {
    if (workerGraphData) {
      return {
        nodes: workerGraphData.nodes.map(n => ({
          ...n,
          color: nodeColors[n.type as EntityNode['type']] || '#fff',
          label: n.name
        })),
        links: workerGraphData.links.map(l => ({
          ...l,
          color: edgeColors[(l.relation || 'related') as EntityEdge['relation']],
          value: l.value || 1
        }))
      };
    }

    return {
      nodes: filteredNodes.map((node) => ({
        ...node,
        color: nodeColors[node.type],
        label: node.name,
      })),
      links: filteredEdges.map((edge) => ({
        ...edge,
        source: edge.source,
        target: edge.target,
        color: edgeColors[edge.relation],
        value: edge.value || 1,
      })),
    };
  }, [filteredNodes, filteredEdges, workerGraphData]);

  const handleNodeClick = useCallback(
    (node: EntityNode) => {
      onNodeClick?.(node);
      if (onNodeExpand) {
        onNodeExpand(node);
      }
    },
    [onNodeClick, onNodeExpand]
  );

  const handleZoomIn = () => graphRef.current?.zoomToFit(300, 100);
  const handleZoomOut = () => {
    if (graphRef.current) {
      const fg = graphRef.current as unknown as { zoomBy: (factor: number) => void };
      fg.zoomBy(0.5);
    }
  };

  const handleExport = () => {
    const canvas = containerRef.current?.querySelector('canvas');
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `entity-graph-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  const toggleNodeVisibility = (nodeId: string) => {
    setVisibleNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const isFullscreenClass = isFullscreen ? 'fixed inset-0 z-[100] bg-slate-950' : 'w-full h-full min-h-[400px]';

  if (isDegradedMode) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-950 border border-white/5 rounded-2xl p-12 text-center">
        <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 border border-rose-500/20">
          <EyeOff className="text-rose-500" size={32} />
        </div>
        <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Computational Boundary Exceeded</h3>
        <p className="text-slate-400 text-sm max-w-md mb-8">
          The current nexus contains {nodes.length} entities. High-fidelity rendering is disabled to maintain system responsiveness.
        </p>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsDegradedMode(false)}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest border border-white/10 transition-all"
          >
            Force Render
          </button>
          <button 
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-900/40 transition-all"
          >
            Switch to List View
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`${isFullscreenClass} relative bg-slate-900 rounded-xl overflow-hidden`}>
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
          title="Filter by Entity Type"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as EntityNode['type'] | 'all')}
          className="px-3 py-2 bg-slate-800/90 backdrop-blur-sm border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Types</option>
          <option value="Person">Person</option>
          <option value="Company">Company</option>
          <option value="Transaction">Transaction</option>
          <option value="Location">Location</option>
        </select>
      </div>

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

      <div className="absolute bottom-4 left-4 z-10 flex gap-4">
        <div className="flex gap-2 flex-wrap max-w-xs">
          {(Object.keys(nodeColors) as EntityNode['type'][]).map((type) => (
            <div key={type} className="flex items-center gap-1 px-2 py-1 bg-slate-800/90 backdrop-blur-sm rounded text-xs">
              <span 
                className="w-2 h-2 rounded-full bg-[var(--node-color)]" 
                style={{ '--node-color': nodeColors[type] } as React.CSSProperties} 
              />
              <span className="text-slate-300">{type}</span>
            </div>
          ))}
        </div>
      </div>

      <ForceGraph2D
        ref={graphRef as never}
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        nodeLabel="name"
        nodeColor="color"
        linkColor={(link: any) => link.color || '#475569'}
        linkWidth={(link: any) => link.value || 1}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        onNodeClick={handleNodeClick}
        backgroundColor="#0f172a"
        nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const label = node.name;
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px Inter, sans-serif`;
          const textWidth = ctx.measureText(label).width;

          ctx.fillStyle = nodeColors[node.type as EntityNode['type']] || '#fff';
          ctx.beginPath();
          ctx.arc(node.x || 0, node.y || 0, Math.sqrt(node.val) * 3, 0, 2 * Math.PI, false);
          ctx.fill();

          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillText(label, (node.x || 0) - textWidth / 2, (node.y || 0) + Math.sqrt(node.val) * 3 + fontSize + 2);
        }}
        nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x || 0, node.y || 0, Math.sqrt(node.val) * 3, 0, 2 * Math.PI, false);
          ctx.fill();
        }}
      />

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
