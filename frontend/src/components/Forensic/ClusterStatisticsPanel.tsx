import React from 'react';
import { motion } from 'framer-motion';
import { 
  Layers, 
  Target, 
  Activity, 
  AlertTriangle,
  Users,
  Box
} from 'lucide-react';

interface ClusterStatisticsPanelProps {
  data: any; // ClusteredNetworkData
}

const StatItem = ({ icon: Icon, label, value, colorClass }: { 
  icon: any, 
  label: string, 
  value: string | number,
  colorClass: string 
}) => (
  <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 space-y-2">
    <div className="flex items-center gap-2">
      <Icon className={`w-3.5 h-3.5 ${colorClass}`} />
      <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
    <div className="text-xl font-black text-white">{value}</div>
  </div>
);

const ClusterRings = ({ modularity }: { modularity: number }) => {
  // Modularity is 0.0 to 1.0. 
  // Higher modularity = Tighter rings = Review "Strong Community".
  // Lower = Loose rings = "Random/Weak".
  
  const ringColor = modularity > 0.4 ? "border-emerald-500/30" : "border-indigo-500/30";
  const glowColor = modularity > 0.4 ? "shadow-[0_0_30px_rgba(16,185,129,0.2)]" : "shadow-[0_0_30px_rgba(99,102,241,0.2)]";

  return (
    <div className="relative w-full h-48 flex items-center justify-center overflow-hidden rounded-[2rem] bg-slate-900/60 border border-white/5 mb-6">
      <div className="absolute inset-0 bg-grid-slate-800/[0.1] bg-[length:20px_20px]" />
      
      {/* Center Core */}
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className={`relative z-10 w-16 h-16 rounded-full bg-slate-900 border-2 ${ringColor.replace('/30', '')} flex items-center justify-center ${glowColor}`}
      >
        <Target className={`w-6 h-6 ${modularity > 0.4 ? 'text-emerald-400' : 'text-indigo-400'}`} />
        <div className="absolute -bottom-8 text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">
          Modularity: {modularity.toFixed(2)}
        </div>
      </motion.div>

      {/* Ring 1 */}
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.6, 0.3] 
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute w-32 h-32 rounded-full border-2 ${ringColor}`}
      />

      {/* Ring 2 */}
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.4, 0.1] 
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className={`absolute w-48 h-48 rounded-full border-2 ${ringColor}`}
      />

      {/* Ring 3 */}
      <motion.div
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.05, 0.2, 0.05] 
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className={`absolute w-64 h-64 rounded-full border ${ringColor}`}
      />
    </div>
  );
};

export const ClusterStatisticsPanel: React.FC<ClusterStatisticsPanelProps> = ({ data }) => {
  if (!data || !data.clustering_stats) return null;

  const stats = data.clustering_stats;
  const bubbles = data.bubbles || [];
  
  const highRiskClusters = bubbles.filter((b: any) => b.risk_level === 'high').length;
  const largestCluster = Math.max(...bubbles.map((b: any) => b.size), 0);
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-indigo-600/20 rounded-lg">
          <Layers className="w-4 h-4 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-xs font-black text-white uppercase tracking-widest">Cluster Topology Stats</h3>
          <p className="text-[11px] font-bold text-slate-500 uppercase">Automated Pattern Grouping</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* NEW: Rings Visualization */}
        <div className="col-span-2">
            <ClusterRings modularity={stats.modularity_score || 0} />
        </div>

        <StatItem 
          icon={Box} 
          label="Total Clusters" 
          value={stats.total_bubbles || bubbles.length} 
          colorClass="text-indigo-400" 
        />
        <StatItem 
          icon={Target} 
          label="Density Avg" 
          value={`${((stats.average_density || 0) * 100).toFixed(1)}%`} 
          colorClass="text-emerald-400" 
        />
        <StatItem 
          icon={AlertTriangle} 
          label="High Risk" 
          value={highRiskClusters} 
          colorClass="text-rose-400" 
        />
        <StatItem 
          icon={Users} 
          label="Largest" 
          value={largestCluster} 
          colorClass="text-amber-400" 
        />
      </div>

      {/* Risk Distribution */}
      <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 space-y-4">
        <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Activity className="w-3 h-3 text-indigo-400" /> Cluster Risk Distribution
        </div>
        
        <div className="space-y-3">
          {['high', 'medium', 'low'].map((level) => {
            const count = bubbles.filter((b: any) => b.risk_level === level).length;
            const percentage = bubbles.length > 0 ? (count / bubbles.length) * 100 : 0;
            const color = level === 'high' ? 'bg-rose-500' : level === 'medium' ? 'bg-amber-500' : 'bg-emerald-500';
            
            return (
              <div key={level} className="space-y-1">
                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                  <span className="text-slate-400">{level} Risk</span>
                  <span className="text-white">{count} Clusters</span>
                </div>
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    className={`h-full ${color}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
