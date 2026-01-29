'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Ghost, Link2Off, Activity, GitCommit } from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';

export interface TimelineEvent {
  id: string;
  date: string;
  description: string;
  amount: number;
  balance: number;
  is_inferred?: boolean; // The ghost row
  has_gap_before?: boolean; // The broken chain
  gap_amount?: number;
  risk_score?: number; // 0 to 1
}

export interface ChartDataPoint {
  date: number;
  balance: number;
  fullDate: string;
}

export interface TimelineProps {
  events?: TimelineEvent[];
  onEventClick?: (event: TimelineEvent) => void;
  onGapClick?: (gapAmount: number, eventId: string) => void;
  showRiskIndicators?: boolean;
  maxHeight?: string;
}

// Mock Data - To be replaced by props
const MOCK_EVENTS: TimelineEvent[] = [
  { id: '1', date: '2024-01-10', description: 'Termin 1 Release', amount: 500000000, balance: 500000000, risk_score: 0.1 },
  { id: '2', date: '2024-01-12', description: 'Material Purchase (Cement)', amount: -50000000, balance: 450000000, risk_score: 0.2 },
  { id: '3', date: '2024-01-15', description: '[FORENSIC] Inferred Gap', amount: -20000000, balance: 430000000, is_inferred: true, has_gap_before: true, gap_amount: 20000000, risk_score: 0.9 },
  { id: '4', date: '2024-01-16', description: 'Labor Payment', amount: -30000000, balance: 400000000, risk_score: 0.1 },
  { id: '5', date: '2024-01-20', description: 'Vendor Disbursement', amount: -150000000, balance: 250000000, risk_score: 0.6 },
  { id: '6', date: '2024-01-25', description: 'Unknown Withdrawal', amount: -50000000, balance: 200000000, risk_score: 0.8 },
];

export default function ForensicTimeline({ 
  events = MOCK_EVENTS, 
  onEventClick,
  onGapClick,
  showRiskIndicators = true,
  maxHeight = 'auto'
}: TimelineProps) {
  // Transform data for chart with proper typing
  const chartData: ChartDataPoint[] = events.map(e => ({
    date: new Date(e.date).getDate(), // Simple day for now
    balance: e.balance,
    fullDate: e.date
  }));

  return (
    <div 
      className="w-full bg-slate-950 rounded-3xl border border-white/5 p-8 relative overflow-hidden flex flex-col gap-8 transition-all custom-scrollbar overflow-y-auto"
      style={{ maxHeight: maxHeight === 'auto' ? undefined : maxHeight }}
    >
       {/* Header Section with Integrated Chart (Visualization + Function) */}
       <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1 space-y-2 z-10">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                 <GitCommit className="w-5 h-5 text-indigo-400" />
              </div>
              Forensic Reconstruction
            </h3>
            <p className="text-xs text-slate-500 font-mono leading-relaxed max-w-sm">
              Visualizing the <span className="text-indigo-400">Cash Flow Velocity</span> and detecting <span className="text-rose-400">Broken Chains</span> (Logic Gaps).
            </p>
          </div>

          <div className="w-full md:w-2/3 h-32 relative">
             <div className="absolute inset-0 bg-indigo-500/5 rounded-xl border border-white/5 backdrop-blur-sm overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={2} fill="url(#colorBal)" />
                      <Tooltip 
                         contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                         itemStyle={{ color: '#818cf8' }}
                           formatter={(val?: number | string) => `Rp ${(Number(val || 0) / 1000000).toFixed(0)}M`}
                         labelStyle={{ display: 'none' }}
                      />
                   </AreaChart>
                </ResponsiveContainer>
             </div>
             <div className="absolute top-2 right-2 text-[9px] font-mono text-indigo-400/50 uppercase tracking-widest">
                Balance Tread
             </div>
          </div>
       </div>

       {/* Timeline Body */}
       <div className="relative border-l border-slate-800 ml-5 pl-8 space-y-1">
          {events.map((event, index) => (
            <React.Fragment key={event.id}>
              
              {/* Gap Detector Widget (Logic Combination) */}
              {event.has_gap_before && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="relative my-4 -ml-[45px] flex items-center gap-4 group cursor-pointer hover:scale-[1.02] transition-transform"
                  onClick={() => onGapClick?.(event.gap_amount || 0, event.id)}
                >
                   <div className="w-7 h-7 rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center z-10 shadow-[0_0_15px_rgba(244,63,94,0.4)]">
                      <Link2Off className="w-3.5 h-3.5 text-rose-500" />
                   </div>
                   <div className="flex-1 bg-gradient-to-r from-rose-950/40 to-transparent border-l-2 border-rose-500/50 p-3 rounded-r-xl">
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] font-mono text-rose-400 font-bold uppercase tracking-widest flex items-center gap-2">
                            <Activity className="w-3 h-3" /> Logic Gap Detected
                         </span>
                         <span className="font-mono text-rose-500 font-bold text-xs">
                            Missing Delta: Rp {event.gap_amount?.toLocaleString()}
                         </span>
                      </div>
                   </div>
                </motion.div>
              )}

              {/* Transaction Node */}
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`group relative py-2 ${event.is_inferred ? 'opacity-90' : 'opacity-100'}`}
              >
                {/* Connector Dot */}
                <div className={`absolute -left-[39px] top-5 w-3 h-3 rounded-full border-2 z-10 transition-all duration-500 group-hover:scale-125
                    ${event.risk_score && event.risk_score > 0.7 
                        ? 'bg-rose-950 border-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' 
                        : event.is_inferred 
                            ? 'bg-amber-950 border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                            : 'bg-slate-950 border-indigo-500/50 group-hover:border-indigo-400'}
                `} />

                {/* Card */}
                <div 
                   onClick={() => onEventClick?.(event)}
                   className={`
                   cursor-pointer active:scale-95 select-none
                   flex justify-between items-center p-4 rounded-xl border backdrop-blur-sm transition-all duration-300
                   ${event.is_inferred 
                      ? 'bg-amber-500/5 border-amber-500/20 border-dashed hover:bg-amber-500/10' 
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-600 hover:bg-slate-800/40'}
                   ${event.risk_score && event.risk_score > 0.7 ? 'border-rose-500/30 bg-rose-500/5' : ''}
                `}>
                   
                   {/* Left: Info */}
                   <div>
                      <div className="flex items-center gap-3 mb-1">
                         <span className="text-xs font-mono text-slate-500">{event.date}</span>
                         {event.is_inferred && (
                             <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-tighter text-amber-500 border border-amber-500/30 px-1.5 rounded">
                                <Ghost className="w-2 h-2" /> Inferred
                             </span>
                         )}
                         {showRiskIndicators && event.risk_score && event.risk_score > 0.7 && (
                             <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-tighter text-rose-500 border border-rose-500/30 px-1.5 rounded">
                                <AlertTriangle className="w-2 h-2" /> High Risk
                             </span>
                         )}
                      </div>
                      <div className={`font-medium ${event.is_inferred ? 'text-amber-100' : 'text-slate-200'}`}>
                         {event.description}
                      </div>
                   </div>

                   {/* Right: Numbers */}
                   <div className="text-right">
                      <div className={`font-mono font-bold ${event.amount > 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                         {event.amount > 0 ? '+' : ''}Rp {Math.abs(event.amount).toLocaleString()}
                      </div>
                       <div className="text-[10px] text-slate-600 font-mono mt-0.5">
                          Bal: {event.balance.toLocaleString()}
                       </div>
                   </div>

                </div>
              </motion.div>
            </React.Fragment>
          ))}
       </div>
    </div>
  );
}
