'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Coins, Landmark, ArrowRight, Shield, AlertTriangle, Download } from 'lucide-react';
import HolographicProjection from '@/app/components/HolographicProjection';
import { HOLOGRAPHIC_SOURCE } from '@/utils/holographicData';
import { useProject } from '@/store/useProject';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8200';

interface FlowLink {
  source: string;
  target: string;
  value: number;
}

export default function FlowWorkspace() {
  const { activeProjectId } = useProject();
  const [links, setLinks] = useState<FlowLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeProjectId) return;
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/v1/forensic/family-tree?project_id=${activeProjectId}`);
        if (res.ok) {
           const data = await res.json();
           setLinks(data && data.length > 0 ? data : HOLOGRAPHIC_SOURCE.terminFlow);
        } else {
            setLinks(HOLOGRAPHIC_SOURCE.terminFlow);
        }
      } catch (err) {
        setLinks(HOLOGRAPHIC_SOURCE.terminFlow);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [activeProjectId]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-8 pt-8 flex justify-end">
          <button 
              onClick={() => window.location.href = `${API_URL}/api/v1/forensic/export/excel?project_id=${activeProjectId}`}
              className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 border border-emerald-500/20 px-6 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95 shadow-lg"
          >
              <Download className="w-4 h-4" /> Export Audit (.xlsx)
          </button>
      </div>

      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {links.length === 0 ? (
           <div className="col-span-full h-96">
            <HolographicProjection 
                title="ZERO_FLOW_DETECTED"
                subtitle="No transactional velocity vectors found for this project scope"
                type="network"
            />
           </div>
        ) : (
          links.map((link, i) => (
            <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-slate-900/40 border border-white/5 p-6 rounded-[2rem] hover:bg-slate-900/60 transition-all group"
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="p-3 bg-indigo-600/10 rounded-xl">
                    <Landmark className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">High Velocity</span>
                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    </div>
                </div>
                
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Source</p>
                    <p className="text-xs font-bold text-white truncate">{link.source}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-indigo-500 transition-colors" />
                    <div className="flex-1 text-right">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Destination</p>
                    <p className="text-xs font-bold text-white truncate">{link.target}</p>
                    </div>
                </div>
                
                <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantum Transferred</span>
                    <span className="text-lg font-black text-indigo-400">Rp {(link.value / 1000000).toFixed(1)}M</span>
                </div>
            </motion.div>
          ))
        )}
      </div>
      </div>
    </div>
  );
}
