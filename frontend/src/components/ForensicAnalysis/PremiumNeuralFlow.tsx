import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, AlertTriangle, ArrowRight, Activity } from 'lucide-react';

interface Node {
  id: string;
  label: string;
  type: 'project' | 'company' | 'person' | 'bank';
  risk: number;
  value: number;
}

interface Link {
  source: string;
  target: string;
  value: number;
  isSuspicious: boolean;
}

interface PremiumNeuralFlowProps {
  nodes: Node[];
  links: Link[];
  title?: string;
}

const PremiumNeuralFlow: React.FC<PremiumNeuralFlowProps> = ({ nodes, links, title = "Neural Capital Reconstruction" }) => {
  // Simple circular layout logic for visualization
  const positionedNodes = useMemo(() => {
    const radius = 300;
    const center = { x: 500, y: 400 };
    return nodes.map((node, i) => {
      if (node.type === 'project') return { ...node, x: center.x, y: center.y };
      const angle = (i / (nodes.length - 1)) * 2 * Math.PI;
      return {
        ...node,
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle)
      };
    });
  }, [nodes]);

  return (
    <div className="bg-slate-950 border border-white/5 rounded-[48px] p-12 shadow-2xl relative overflow-hidden group min-h-[800px]">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#4f46e510_0%,transparent_50%)]"></div>
      <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none"></div>

      <div className="relative z-10 flex justify-between items-start mb-12">
        <div>
          <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">{title}</h3>
          <p className="text-indigo-400 text-[10px] font-mono tracking-[0.5em] uppercase mt-2">Active Graph: {nodes.length} entities // {links.length} relationships</p>
        </div>
        <div className="flex gap-4">
            <div className="px-5 py-2.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3">
                <Activity className="w-4 h-4 text-rose-500 animate-pulse" />
                <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Anomaly Flux Detected</span>
            </div>
        </div>
      </div>

      <div className="relative w-full h-[600px]">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 800">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="25" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" opacity="0.5" />
            </marker>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Lines/Connections */}
          {links.map((link, idx) => {
            const source = positionedNodes.find(n => n.id === link.source);
            const target = positionedNodes.find(n => n.id === link.target);
            if (!source || !target) return null;

            return (
              <g key={`link-${idx}`}>
                <motion.path
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: link.isSuspicious ? 1 : 0.2 }}
                  transition={{ duration: 2, delay: idx * 0.1 }}
                  d={`M ${source.x} ${source.y} L ${target.x} ${target.y}`}
                  stroke={link.isSuspicious ? "#f43f5e" : "#6366f1"}
                  strokeWidth={link.isSuspicious ? 3 : 1}
                  fill="transparent"
                  markerEnd="url(#arrowhead)"
                  className={link.isSuspicious ? "drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]" : ""}
                />
                {link.isSuspicious && (
                   <motion.circle
                     r="4"
                     fill="#f43f5e"
                     filter="url(#glow)"
                   >
                     <animateMotion 
                        path={`M ${source.x} ${source.y} L ${target.x} ${target.y}`} 
                        dur="1.5s" 
                        repeatCount="indefinite" 
                     />
                   </motion.circle>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {positionedNodes.map((node, idx) => (
            <motion.g
              key={node.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 12, delay: idx * 0.05 }}
              whileHover={{ scale: 1.1 }}
              className="cursor-pointer"
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={node.type === 'project' ? 24 : 16}
                className={`${
                    node.risk > 0.7 ? "fill-rose-500/20 stroke-rose-500" : 
                    node.type === 'project' ? "fill-indigo-500/20 stroke-indigo-500" :
                    "fill-slate-900 stroke-white/20"
                } stroke-2`}
                filter={node.risk > 0.7 ? "url(#glow)" : ""}
              />
              <foreignObject
                x={node.x - 60}
                y={node.y + 25}
                width="120"
                height="40"
              >
                <div className="text-center">
                  <div className="text-[10px] font-black text-white uppercase truncate px-1">{node.label}</div>
                  <div className={`text-[8px] font-mono font-bold ${node.risk > 0.7 ? "text-rose-500" : "text-slate-500"}`}>
                    RISK_{node.risk.toFixed(2)}
                  </div>
                </div>
              </foreignObject>
              
              {node.type === 'project' && (
                <text
                  x={node.x}
                  y={node.y + 4}
                  textAnchor="middle"
                  className="fill-indigo-400 font-black text-[12px]"
                >
                  ROOT
                </text>
              )}
            </motion.g>
          ))}
        </svg>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
          <div className="flex items-center gap-3 mb-4">
              <Zap className="w-5 h-5 text-indigo-400" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest italic">Velocity Pattern</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-medium uppercase tracking-wide">
            Detecting high-frequency capital oscillation between cluster A and B. Potential UBO masking detected.
          </p>
        </div>
        
        <div className="p-6 rounded-3xl bg-rose-500/5 border border-rose-500/10">
          <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest italic">Critical Sinkhole</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-medium uppercase tracking-wide">
            Entity &quot;PT. Delta Global&quot; identified as a one-way financial sink. 82% of influx never exits.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-between group">
            <div className="space-y-1">
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">PageRank Centrality</span>
                <div className="text-xl font-black text-white italic">0.94 Alpha</div>
            </div>
            <ArrowRight className="w-6 h-6 text-indigo-500 group-hover:translate-x-2 transition-transform" />
        </div>
      </div>
    </div>
  );
};

export default PremiumNeuralFlow;
