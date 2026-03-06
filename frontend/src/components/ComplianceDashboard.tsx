'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Hash,
  Activity,
  TrendingUp,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { authenticatedFetch } from '@/lib/api';
import { useProject } from '@/store/useProject';

interface ComplianceMetric {
  total_narratives: number;
  compliance_levels: Record<string, number>;
  state_distribution: Record<string, number>;
  sealed_percentage: number;
  system_health: string;
  last_updated: string;
}

interface Narrative {
  id: string;
  content: string;
  state: string;
  compliance_level: string;
  timestamp: string;
  hash: string;
  evidence_count: number;
  verification_count: number;
}

export default function ComplianceDashboard() {
  const { activeProjectId } = useProject();
  const [metrics, setMetrics] = useState<ComplianceMetric | null>(null);
  const [narratives, setNarratives] = useState<Narrative[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComplianceMetrics = async () => {
    try {
      const response = await authenticatedFetch('/api/v3/metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchNarrativeHistory = React.useCallback(async () => {
    try {
      const response = await authenticatedFetch(
        `/api/v3/narratives/history${activeProjectId ? `?project_id=${activeProjectId}` : ''}`
      );
      if (response.ok) {
        const data = await response.json();
        setNarratives(data.narratives || []);
      }
    } catch (err) {
      console.error('Failed to fetch narrative history:', err);
    }
  }, [activeProjectId]);

  const generateComplianceReport = async () => {
    if (!activeProjectId) return;

    try {
      const response = await authenticatedFetch(`/api/v3/report/${activeProjectId}`);
      if (response.ok) {
        const report = await response.json();
        // Trigger download
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compliance_report_${activeProjectId}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Failed to generate compliance report:', err);
    }
  };

  useEffect(() => {
    fetchComplianceMetrics();
    if (activeProjectId) {
      fetchNarrativeHistory();
    }
  }, [activeProjectId, fetchNarrativeHistory]);

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-emerald-400';
      case 'good': return 'text-green-400';
      case 'fair': return 'text-amber-400';
      case 'poor': return 'text-rose-400';
      default: return 'text-slate-400';
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'sealed': return 'bg-emerald-500';
      case 'approved': return 'bg-blue-500';
      case 'pending_review': return 'bg-amber-500';
      case 'draft': return 'bg-slate-500';
      case 'rejected': return 'bg-rose-500';
      default: return 'bg-gray-500';
    }
  };

  const getComplianceColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-rose-400';
      case 'enhanced': return 'text-green-400';
      case 'standard': return 'text-blue-400';
      case 'basic': return 'text-amber-400';
      case 'none': return 'text-gray-400';
      default: return 'text-slate-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 flex items-center justify-center">
        <div className="text-white flex items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin" />
          Loading compliance data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 flex items-center justify-center">
        <div className="text-red-400 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
          Error loading compliance data: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Compliance Dashboard
            </h1>
            <p className="text-slate-400">
              Hash-linked AI narratives with state validation
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={fetchComplianceMetrics}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={generateComplianceReport} disabled={!activeProjectId}>
              <Download className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* System Health Overview */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-slate-900/50 border-white/5">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <Shield className="w-5 h-5 text-indigo-500" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getHealthColor(metrics.system_health)}`}>
                    {metrics.system_health.toUpperCase()}
                  </div>
                  <div className="text-sm text-slate-400 mt-1">
                    {metrics.sealed_percentage}% Sealed
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-white/5">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <FileText className="w-5 h-5 text-amber-500" />
                  Total Narratives
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">
                    {metrics.total_narratives}
                  </div>
                  <div className="text-sm text-slate-400 mt-1">
                    All states
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-white/5">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  Critical Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-400">
                    {metrics.compliance_levels.critical || 0}
                  </div>
                  <div className="text-sm text-slate-400 mt-1">
                    Sealed narratives
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-white/5">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                  Pending Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-400">
                    {metrics.state_distribution.pending_review || 0}
                  </div>
                  <div className="text-sm text-slate-400 mt-1">
                    Awaiting verification
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Compliance Distribution */}
        {metrics && (
          <Card className="bg-slate-900/50 border-white/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                Compliance Level Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(metrics.compliance_levels).map(([level, count]) => (
                  <div key={level} className="text-center">
                    <div className={`text-2xl font-bold ${getComplianceColor(level)}`}>
                      {count}
                    </div>
                    <div className="text-xs text-slate-400 capitalize mt-1">
                      {level.replace('_', ' ')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Narratives */}
        <Card className="bg-slate-900/50 border-white/5">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-3">
              <Clock className="w-5 h-5 text-purple-500" />
              Recent Narratives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {narratives.map((narrative, index) => (
                <motion.div
                  key={narrative.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-slate-800/50 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getStateColor(narrative.state)}`} />
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          Narrative #{narrative.id.split('_')[1] || index}
                        </h3>
                        <p className="text-xs text-slate-400">
                          {new Date(narrative.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Hash className="w-3 h-3" />
                      {narrative.hash.substring(0, 16)}...
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-300 leading-relaxed mb-3 line-clamp-2">
                    {narrative.content}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {narrative.verification_count} verifications
                      </span>
                      {narrative.evidence_count > 0 && (
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {narrative.evidence_count} evidence
                        </span>
                      )}
                    </div>
                    <div className={`font-medium ${getComplianceColor(narrative.compliance_level)}`}>
                      {narrative.compliance_level.toUpperCase()}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {narratives.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No narratives found</p>
                  <p className="text-slate-500 text-sm mt-2">
                    {activeProjectId ? 'Create your first narrative to get started' : 'Select a project to view narratives'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}