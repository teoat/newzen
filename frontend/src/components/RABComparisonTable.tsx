'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowUpRight, TrendingUp } from 'lucide-react';
import { BudgetVariance } from '@/types/domain';

interface RABComparisonTableProps {
  items: BudgetVariance[];
}

const RABComparisonTable: React.FC<RABComparisonTableProps> = ({ items }) => {
  if (!items || items.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900/40 rounded-3xl border border-white/5">
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No Budget Variance Data Available</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-slate-900/40 rounded-3xl border border-white/5 shadow-2xl">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-black text-white uppercase tracking-tighter">Budget vs. Reality Analysis</h3>
        </div>
        <div className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-2">
          <AlertTriangle className="w-3 h-3" />
          Markup Detected
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5">
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Item Description</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">RAB Unit</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actual Unit</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Volume Δ</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Markup %</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <motion.tr 
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="border-b border-white/5 hover:bg-white/5 transition-colors group"
              >
                <td className="px-6 py-4">
                  <p className="text-xs font-bold text-white mb-0.5">{item.item_name}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{item.category}</p>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-xs font-mono text-slate-400">Rp {item.unit_price_rab.toLocaleString()}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-xs font-mono text-white font-bold">Rp {item.avg_unit_price_actual.toLocaleString()}</span>
                </td>
                <td className="px-6 py-4 text-right font-mono text-xs">
                  <span className={item.volume_discrepancy > 0 ? "text-rose-400" : "text-emerald-400"}>
                    {item.volume_discrepancy > 0 ? '+' : ''}{item.volume_discrepancy.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                   <div className="flex items-center justify-end gap-2">
                      <span className={`text-xs font-black ${item.markup_percentage > 10 ? 'text-rose-500' : 'text-slate-400'}`}>
                        {item.markup_percentage.toFixed(1)}%
                      </span>
                      {item.markup_percentage > 10 && (
                        <ArrowUpRight className="w-3 h-3 text-rose-500" />
                      )}
                   </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(RABComparisonTable);
