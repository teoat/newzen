'use client';

import React from 'react';
import Link from 'next/link';
import { Briefcase, Calendar, DollarSign, MapPin } from 'lucide-react';

interface ProjectCardProps {
  id: string;
  name: string;
  contractor_name: string;
  contract_value: number;
  start_date: string;
  end_date?: string;
  location?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'SUSPENDED' | 'CANCELLED';
  riskScore?: number;
}

export function ProjectCard({
  id,
  name,
  contractor_name,
  contract_value,
  start_date,
  end_date,
  location,
  status,
  riskScore,
}: ProjectCardProps) {
  const statusColors = {
    ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    COMPLETED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    SUSPENDED: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    CANCELLED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  return (
    <Link
      href={`/cases/${id}`}
      className="block bg-slate-900/50 border border-white/5 hover:border-indigo-500/30 rounded-2xl p-6 transition-all group hover:bg-slate-800/50"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-xl">
            <Briefcase className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-bold text-white group-hover:text-indigo-300 transition-colors">{name}</h3>
            <p className="text-xs text-slate-500">{contractor_name}</p>
          </div>
        </div>
        <span className={`text-[10px] font-black tracking-widest uppercase px-2 py-1 rounded-full border ${statusColors[status]}`}>
          {status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-slate-400">
          <DollarSign className="w-3.5 h-3.5" />
          <span className="text-sm font-mono text-white">
            {contract_value.toLocaleString('id-ID')}
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <Calendar className="w-3.5 h-3.5" />
          <span className="text-xs">
            {new Date(start_date).toLocaleDateString()}
          </span>
        </div>
      </div>

      {location && (
        <div className="flex items-center gap-2 text-slate-500">
          <MapPin className="w-3.5 h-3.5" />
          <span className="text-xs truncate">{location}</span>
        </div>
      )}

      {riskScore !== undefined && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Risk Score</span>
            <span className={`text-sm font-black ${riskScore > 70 ? 'text-rose-500' : riskScore > 40 ? 'text-amber-500' : 'text-emerald-500'}`}>
              {riskScore}%
            </span>
          </div>
          <div className="w-full h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
            <div 
              className={`h-full rounded-full ${riskScore > 70 ? 'bg-rose-500' : riskScore > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${riskScore}%` }}
            />
          </div>
        </div>
      )}
    </Link>
  );
}
