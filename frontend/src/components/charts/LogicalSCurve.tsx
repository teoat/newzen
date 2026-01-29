'use client';

import React from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart
} from 'recharts';

type DataPoint = {
  date: string;
  planned: number;
  actual: number;
  phase: string;
  anomaly?: string; // If present, show red dot
};

// Mock Data (will replace with props later)
const MOCK_DATA: DataPoint[] = [
  { date: 'Jan', planned: 0, actual: 0, phase: 'Prep' },
  { date: 'Feb', planned: 200, actual: 180, phase: 'Foundation' },
  { date: 'Mar', planned: 500, actual: 450, phase: 'Foundation' },
  { date: 'Apr', planned: 900, actual: 950, phase: 'Structure', anomaly: 'Roofing Material in Structure Phase' }, 
  { date: 'May', planned: 1400, actual: 1380, phase: 'Structure' },
  { date: 'Jun', planned: 2000, actual: 1900, phase: 'Finishing' },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: DataPoint; value?: number }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length && payload[0]?.payload) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/90 border border-slate-700 p-4 rounded-xl shadow-2xl backdrop-blur-md">
        <p className="font-bold text-slate-200 mb-2">{label} - {data.phase}</p>
        <div className="space-y-1 text-xs">
          <p className="text-emerald-400">Planned: Rp {data.planned}M</p>
          <p className="text-indigo-400">Actual: Rp {data.actual}M</p>
          {data.anomaly && (
             <div className="mt-2 pt-2 border-t border-slate-700">
                <p className="text-rose-400 font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  ANOMALY DETECTED
                </p>
                <p className="text-slate-400 italic">{data.anomaly}</p>
             </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: DataPoint;
}

const CustomDot = (props: CustomDotProps) => {
  const { cx, cy, payload } = props;
  if (payload?.anomaly && cx !== undefined && cy !== undefined) {
    return (
      <svg x={cx - 6} y={cy - 6} width={12} height={12} fill="red" viewBox="0 0 24 24" className="animate-pulse drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]">
        <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
      </svg>
    );
  }
  return null; 
  // <circle cx={cx} cy={cy} r={4} stroke="none" fill="#6366f1" opacity={0} />;
};

export default function LogicalSCurve({ data = MOCK_DATA }: { data?: DataPoint[] }) {
  return (
    <div className="w-full h-[400px] bg-slate-950/50 rounded-3xl border border-white/5 p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-50" />
      
      <div className="flex justify-between items-end mb-6">
        <div>
          <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-500">
             Logical S-Curve
          </h3>
          <p className="text-xs text-slate-500 font-mono">PLANNED vs ACTUAL with PHASE VALIDATION</p>
        </div>
        <div className="flex gap-4 text-[10px] font-mono uppercase text-slate-500">
           <span className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-full" /> Budget</span>
           <span className="flex items-center gap-1"><div className="w-2 h-2 bg-indigo-500 rounded-full" /> Actual</span>
           <span className="flex items-center gap-1"><div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" /> Anomaly</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="85%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#475569" 
            tick={{fontSize: 10}} 
            axisLine={false} 
            tickLine={false}
          />
          <YAxis 
            stroke="#475569" 
            tick={{fontSize: 10}} 
            axisLine={false} 
            tickLine={false}
            tickFormatter={(value) => `${value}M`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.2 }} />
          
          {/* Planned Curve (Reference) */}
          <Area 
            type="monotone" 
            dataKey="planned" 
            stroke="#10b981" 
            strokeWidth={2}
            strokeDasharray="4 4"
            fillOpacity={1} 
            fill="url(#colorPlanned)" 
          />
          
          {/* Actual Curve (Real) */}
          <Area 
            type="monotone" 
            dataKey="actual" 
            stroke="#6366f1" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorActual)"
            dot={<CustomDot />}
          />
          
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
