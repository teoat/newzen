'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const trendData = [
  { name: 'Month 1', current: 200, predicted: 220 },
  { name: 'Month 2', current: 450, predicted: 480 },
  { name: 'Month 3', current: 800, predicted: 950 },
  { name: 'Month 4', current: 1200, predicted: 1800 },
  { name: 'Month 5', current: null, predicted: 2400 },
  { name: 'Month 6', current: null, predicted: 2800 },
];

export const TrajectoryChart: React.FC = () => {
  return (
    <div className="lg:col-span-2 tactical-card p-8 bg-slate-900/50 border border-white/5 rounded-[2.5rem] shadow-2xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Leakage Trajectory</h3>
          <p className="text-[11px] text-slate-500 font-mono uppercase tracking-[0.2em] mt-1">Realized vs. Simulated Regression</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-[11px] font-black text-slate-400 uppercase">Realized</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-[11px] font-black text-slate-400 uppercase">Predicted</span>
          </div>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
            <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#ffffff10', borderRadius: '12px' }}
              itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
            />
            <Area type="monotone" dataKey="current" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorReal)" />
            <Area type="monotone" dataKey="predicted" stroke="#f43f5e" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorPred)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
