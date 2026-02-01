'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Filter, Search, Download, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import Link from 'next/link';
import { API_URL } from "../../../lib/constants";
import { useProject } from "../../../store/useProject";

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

    // Apply search filter
    if (search) {
      filtered = filtered.filter(alert => 
        alert.message.toLowerCase().includes(search.toLowerCase()) ||
        alert.type.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply severity filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter(alert => alert.severity === severityFilter);
    }

    // Apply status filter
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
      case 'CRITICAL': return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case 'HIGH': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'MEDIUM': return <AlertCircle className="w-4 h-4 text-indigo-500" />;
      default: return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-rose-500/10 border-rose-500/30 text-rose-300';
      case 'HIGH': return 'bg-amber-500/10 border-amber-500/30 text-amber-300';
      case 'MEDIUM': return 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300';
      default: return 'bg-slate-500/10 border-slate-500/30 text-slate-300';
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading alert history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="border-b border-white/5 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-bold text-white">Alert History</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={exportAlerts}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search alerts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50"
              />
            </div>
            
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500/50"
            >
              <option value="all">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500/50"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-12">
            <Info className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-2">No alerts found</p>
            <p className="text-slate-500 text-sm">
              {alerts.length === 0 ? 'No alerts in history' : 'Try adjusting your filters'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-6 rounded-xl border ${getSeverityColor(alert.severity)} ${
                  alert.resolved ? 'opacity-75' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {getSeverityIcon(alert.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-black uppercase tracking-wider">
                          {alert.severity}
                        </span>
                        <span className="text-xs text-slate-500">
                          {alert.type}
                        </span>
                        <span className="text-xs text-slate-500">
                          {alert.timestamp}
                        </span>
                        {alert.resolved && (
                          <span className="text-xs text-emerald-400 font-medium">
                            ✓ Resolved
                          </span>
                        )}
                      </div>
                      <p className="text-white mb-2">{alert.message}</p>
                      
                      {alert.resolved && (
                        <div className="text-xs text-slate-500">
                          Resolved by {alert.resolvedBy} at {alert.resolvedAt}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {alert.action && !alert.resolved && (
                      <Link
                        href={alert.action.route || '#'}
                        className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 transition-colors"
                      >
                        {alert.action.label}
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}