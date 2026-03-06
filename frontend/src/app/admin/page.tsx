'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Users, 
  Activity, 
  Lock, 
  Terminal, 
  UserPlus, 
  Key,
  Database,
  Cpu,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Fingerprint
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import ForensicPageLayout from '../components/ForensicPageLayout';
import { authenticatedFetch } from '@/lib/api';

interface SystemLog {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details: string;
  status: 'SUCCESS' | 'WARNING' | 'CRITICAL';
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    active_sessions: 4,
    total_agents: 12,
    sync_confidence: 94.2,
    storage_load: 68
  });

  useEffect(() => {
    // Mock simulation of system logs
    setTimeout(() => {
      setLogs([
        { id: '1', timestamp: new Date().toISOString(), action: 'CREDENTIAL_ROTATION', user: 'admin', details: 'Manual key rotation initiated for node primary.', status: 'SUCCESS' },
        { id: '2', timestamp: new Date().toISOString(), action: 'RECON_DEBATE_INIT', user: 'system', details: 'Parallel swarm debate triggered for project PRJ-902.', status: 'SUCCESS' },
        { id: '3', timestamp: new Date().toISOString(), action: 'UNAUTHORIZED_ACCESS', user: '0x92f', details: 'Attempted ingress from unverified IP: 192.168.1.10', status: 'CRITICAL' },
        { id: '4', timestamp: new Date().toISOString(), action: 'SCHEMA_REPAIR', user: 'system', details: 'Auto-synchronization of user_project_access table.', status: 'WARNING' },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <ForensicPageLayout
        title="Admin Governance Node"
        subtitle="Sovereign Control & Session Auditing"
        icon={Shield}
    >
      <div className="p-10 space-y-10 h-full overflow-y-auto custom-scrollbar">
        {/* TOP METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <AdminStatCard icon={Users} label="Active Agents" value={stats.total_agents.toString()} sub="2 new this week" color="indigo" />
          <AdminStatCard icon={Activity} label="Live Sessions" value={stats.active_sessions.toString()} sub="Verified neural links" color="emerald" />
          <AdminStatCard icon={Cpu} label="Sync Confidence" value={`${stats.sync_confidence}%`} sub="Across project boundaries" color="amber" />
          <AdminStatCard icon={Database} label="Storage Load" value={`${stats.storage_load}%`} sub="Encrypted vault volume" color="rose" />
        </div>

        <div className="grid grid-cols-12 gap-8">
            {/* SYSTEM LOGS */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <Terminal className="w-5 h-5 text-indigo-400" />
                        <h2 className="text-sm font-black text-white uppercase tracking-widest italic">Reality Sync Logs</h2>
                    </div>
                    <Button variant="ghost" size="sm" className="text-[10px] uppercase font-black tracking-widest text-slate-500 hover:text-white">
                        Clear Audit Trail
                    </Button>
                </div>

                <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead>
                                <tr className="bg-white/[0.02]">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">Event Node</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">Agent</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">Intelligence Details</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id} className="group hover:bg-white/[0.01] transition-colors">
                                        <td className="px-6 py-4 border-b border-white/5">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-mono text-indigo-400 font-bold">{log.action}</span>
                                                <span className="text-[9px] text-slate-600 font-mono mt-1">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border-b border-white/5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-md bg-indigo-500/10 flex items-center justify-center">
                                                    <Fingerprint size={12} className="text-indigo-500" />
                                                </div>
                                                <span className="text-xs font-bold text-slate-300">@{log.user}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border-b border-white/5 text-xs text-slate-500 leading-relaxed max-w-xs truncate group-hover:text-slate-300 transition-colors">
                                            {log.details}
                                        </td>
                                        <td className="px-6 py-4 border-b border-white/5 text-right">
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${
                                                log.status === 'SUCCESS' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' :
                                                log.status === 'WARNING' ? 'text-amber-500 border-amber-500/20 bg-amber-500/5' :
                                                'text-rose-500 border-rose-500/20 bg-rose-500/5'
                                            }`}>
                                                {log.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {loading && (
                        <div className="p-20 flex flex-col items-center justify-center gap-4">
                            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Synchronizing Registry...</p>
                        </div>
                    )}
                </div>
            </div>

            {/* SIDE ACTIONS */}
            <div className="col-span-12 lg:col-span-4 space-y-8">
                {/* ACCOUNT MANAGEMENT */}
                <div className="p-8 bg-indigo-600/5 border border-indigo-500/20 rounded-[2.5rem] space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
                            <UserPlus className="w-5 h-5 text-indigo-400" />
                        </div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Agent Enrollment</h3>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">Manual induction of forensic agents into the Zenith ecosystem. Credentials are automatically air-gapped.</p>
                    <Button className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-[11px] tracking-[0.2em] rounded-xl shadow-lg shadow-indigo-900/40">
                        Induct New Agent
                    </Button>
                </div>

                {/* SYSTEM SECURITY */}
                <div className="p-8 bg-rose-600/5 border border-rose-500/20 rounded-[2.5rem] space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-rose-500/20 rounded-2xl border border-rose-500/30">
                            <Lock className="w-5 h-5 text-rose-400" />
                        </div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Node Lockdown</h3>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">Immediate termination of all active sessions and neural links. Requires Level 5 Adjudication.</p>
                    <Button variant="outline" className="w-full h-12 border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white font-black uppercase text-[11px] tracking-[0.2em] rounded-xl">
                        Terminate Hub Primary
                    </Button>
                </div>
            </div>
        </div>
      </div>
    </ForensicPageLayout>
  );
}

function AdminStatCard({ icon: Icon, label, value, sub, color }: any) {
  const colors = {
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  };

  return (
    <Card className={`p-8 rounded-[2.5rem] border ${colors[color as keyof typeof colors]} flex flex-col justify-between group hover:scale-[1.02] transition-all`}>
      <div className="flex justify-between items-start mb-6">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 group-hover:border-white/30 transition-colors">
            <Icon size={20} />
          </div>
          <Activity size={12} className="opacity-30" />
      </div>
      <div>
        <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 mb-1">{label}</div>
        <div className="text-3xl font-black text-white italic tracking-tighter mb-1">{value}</div>
        <div className="text-[9px] font-bold uppercase text-slate-500">{sub}</div>
      </div>
    </Card>
  );
}
