'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Filter, Search, Download, AlertTriangle, AlertCircle, Info, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { API_URL } from "../../../lib/constants";
import { useProject } from "../../../store/useProject";
import ForensicPageLayout from '../../components/ForensicPageLayout';

interface AlertItem {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  timestamp: string;
  type: string;
  action?: { label: string; route?: string };
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

export default function AlertsHistory() {
  const { activeProjectId } = useProject();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (!activeProjectId) return;
    
    const fetchAlerts = async () => {
      try {
        const response = await fetch(`${API_URL}/api/v1/ai/alerts/history?project_id=${activeProjectId}`);
        const data = await response.json();
        setAlerts(data.alerts || []);
      } catch (error) {
        console.error('Failed to fetch alert history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [activeProjectId]);

  useEffect(() => {
    let filtered = alerts;

    if (search) {
      filtered = filtered.filter(alert => 
        alert.message.toLowerCase().includes(search.toLowerCase()) ||
        alert.type.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter(alert => alert.severity === severityFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(alert => {
        if (statusFilter === 'resolved') return alert.resolved;
        if (statusFilter === 'active') return !alert.resolved;
        return true;
      });
    }

    setFilteredAlerts(filtered);
  }, [alerts, search, severityFilter, statusFilter]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      case 'HIGH': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'MEDIUM': return <AlertCircle className="w-5 h-5 text-indigo-500" />;
      default: return <Info className="w-5 h-5 text-slate-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-rose-500/5 border-rose-500/10 hover:border-rose-500/30';
      case 'HIGH': return 'bg-amber-500/5 border-amber-500/10 hover:border-amber-500/30';
      case 'MEDIUM': return 'bg-indigo-500/5 border-indigo-500/10 hover:border-indigo-500/30';
      default: return 'bg-slate-500/5 border-slate-500/10 hover:border-slate-500/30';
    }
  };

  const exportAlerts = () => {
    const csv = [
      ['ID', 'Severity', 'Type', 'Message', 'Timestamp', 'Status', 'Resolved At', 'Resolved By'].join(','),
      ...filteredAlerts.map(alert => [
        alert.id,
        alert.severity,
        alert.type,
        `"${alert.message.replace(/"/g, '""')}"`,
        alert.timestamp,
        alert.resolved ? 'Resolved' : 'Active',
        alert.resolvedAt || '',
        alert.resolvedBy || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alerts-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ForensicPageLayout
        title="Alert Archives"
        subtitle="Forensic Event Logs & Anomaly Records"
        icon={AlertCircle}
        headerActions={
            <div className="flex gap-3">
                 <button
                    onClick={exportAlerts}
                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-xl hover:bg-indigo-600 hover:text-white transition-all text-[11px] font-black uppercase tracking-widest"
                >
                    <Download className="w-4 h-4" />
                    Export CSV
                </button>
            </div>
        }
    >
        <div className="flex flex-col h-full bg-slate-950 p-10 gap-8">
            {/* Filter Bar */}
            <div className="h-20 shrink-0 bg-slate-900/50 border border-white/5 rounded-[1.5rem] flex items-center px-8 gap-6 backdrop-blur-md">
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="SEARCH EVENT LOGS..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-black/20 border border-white/5 rounded-xl text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/30 transition-all uppercase tracking-wide"
                    />
                </div>
                
                <div className="h-8 w-px bg-white/10" />

                <div className="flex items-center gap-4">
                    <select
                        aria-label="Filter by Severity"
                        title="Filter by Severity"
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value)}
                        className="px-6 py-3 bg-black/20 border border-white/5 rounded-xl text-xs font-black text-slate-300 focus:outline-none focus:border-indigo-500/30 uppercase tracking-widest cursor-pointer hover:bg-white/5 transition-colors appearance-none"
                    >
                        <option value="all">Any Severity</option>
                        <option value="CRITICAL">Critical</option>
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                    </select>

                    <select
                        aria-label="Filter by Status"
                        title="Filter by Status"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-6 py-3 bg-black/20 border border-white/5 rounded-xl text-xs font-black text-slate-300 focus:outline-none focus:border-indigo-500/30 uppercase tracking-widest cursor-pointer hover:bg-white/5 transition-colors appearance-none"
                    >
                        <option value="all">Any Status</option>
                        <option value="active">Active</option>
                        <option value="resolved">Resolved</option>
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-900/30 border border-white/5 rounded-[2.5rem] p-8">
                 {loading ? (
                    <div className="h-full flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-6" />
                        <p className="text-xs font-black uppercase tracking-widest text-slate-500">Retrieving Logs...</p>
                    </div>
                 ) : filteredAlerts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-30">
                        <Info className="w-16 h-16 text-slate-500 mb-6" />
                        <p className="text-sm font-black uppercase tracking-widest text-slate-400">No events match criteria</p>
                    </div>
                 ) : (
                    <div className="space-y-4">
                         {filteredAlerts.map((alert, index) => (
                            <motion.div
                                key={alert.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`p-6 rounded-2xl border transition-all ${getSeverityColor(alert.severity)} ${alert.resolved ? 'opacity-60 saturate-50' : ''}`}
                            >
                                <div className="flex items-start gap-6">
                                    <div className={`p-4 rounded-xl bg-black/20 shadow-inner shrink-0`}>
                                        {getSeverityIcon(alert.severity)}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-4 mb-2">
                                             <div className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-black/20 ${
                                                alert.severity === 'CRITICAL' ? 'text-rose-400' :
                                                alert.severity === 'HIGH' ? 'text-amber-400' :
                                                alert.severity === 'MEDIUM' ? 'text-indigo-400' : 'text-slate-400'
                                             }`}>
                                                {alert.severity}
                                             </div>
                                             <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                                <div className="w-1 h-1 bg-slate-600 rounded-full" />
                                                {alert.type}
                                             </div>
                                             <div className="text-[10px] font-mono text-slate-600 flex items-center gap-2 ml-auto">
                                                <Clock className="w-3 h-3" />
                                                {alert.timestamp}
                                             </div>
                                        </div>
                                        
                                        <p className="text-sm font-bold text-white mb-3">{alert.message}</p>
                                        
                                        {alert.resolved && (
                                            <div className="flex items-center gap-2 text-xs text-emerald-500 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-lg w-fit">
                                                <CheckCircle className="w-3 h-3" />
                                                RESOLVED BY {alert.resolvedBy?.toUpperCase()}
                                            </div>
                                        )}
                                    </div>

                                    {alert.action && !alert.resolved && (
                                        <div className="shrink-0 self-center">
                                            <Link href={alert.action.route || '#'} className="px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                                {alert.action.label}
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                         ))}
                    </div>
                 )}
            </div>
        </div>
    </ForensicPageLayout>
  );
}