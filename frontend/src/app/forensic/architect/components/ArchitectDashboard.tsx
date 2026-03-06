'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  AlertTriangle, 
  TrendingUp, 
  Package,
  Target,
  MapPin,
  Activity,
  BarChart3,
  Shield,
  Eye,
  Download,
  Play,
  Clock,
  ChevronRight
} from 'lucide-react';
import ForensicPageLayout from '../../../components/ForensicPageLayout';
import PageFeatureCard from '../../../components/PageFeatureCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { authenticatedFetch } from '@/lib/api';
import { logger } from '@/lib/logger';
import { API_ROUTES } from '@/services/apiRoutes';

interface FraudAnalysis {
  score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  evidence: Array<any>;
  [key: string]: any;
}

interface RiskSummary {
  overall_risk_score: number;
  overall_risk_level: 'low' | 'medium' | 'high' | 'critical';
  fraud_types: {
    ghost_construction: FraudAnalysis;
    material_substitution: FraudAnalysis;
    volume_inflation: FraudAnalysis;
    structural_integrity: FraudAnalysis;
    asset_diversion: FraudAnalysis;
  };
  high_risk_areas: number;
  critical_issues: Array<{
    type: string;
    score: number;
    evidence_count: number;
  }>;
  last_analyzed: string;
}

interface ArchitectDashboardProps {
  projectId: string;
}

export default function ArchitectDashboard({ projectId }: ArchitectDashboardProps) {
  const [riskSummary, setRiskSummary] = useState<RiskSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);

  const fraudTypes = [
    {
      id: 'ghost_construction',
      title: 'Ghost Construction',
      description: 'Billing for work not physically performed',
      icon: Building2,
      color: 'bg-rose-500'
    },
    {
      id: 'material_substitution',
      title: 'Material Substitution',
      description: 'Using cheaper materials than billed',
      icon: Package,
      color: 'bg-amber-500'
    },
    {
      id: 'volume_inflation',
      title: 'Volume Inflation',
      description: 'Billing for more work than performed',
      icon: TrendingUp,
      color: 'bg-orange-500'
    },
    {
      id: 'structural_integrity',
      title: 'Structural Issues',
      description: 'Compliance and safety violations',
      icon: Shield,
      color: 'bg-red-500'
    },
    {
      id: 'asset_diversion',
      title: 'Asset Diversion',
      description: 'Misappropriation of project assets',
      icon: Target,
      color: 'bg-purple-500'
    }
  ];

  const fetchRiskSummary = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(API_ROUTES.V3.RISK_SUMMARY(projectId));
      if (response.ok) {
        const data = await response.json();
        setRiskSummary(data);
      } else {
        throw new Error('Failed to fetch risk summary');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const runComprehensiveAnalysis = async () => {
    try {
      const response = await authenticatedFetch(API_ROUTES.V3.COMPREHENSIVE_ANALYSIS(projectId), {
        method: 'POST'
      });
      if (response.ok) {
        const result = await response.json();
        // Show success message
        logger.info('Analysis started:', { result });
        // Refresh data after delay
        setTimeout(fetchRiskSummary, 8000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start analysis');
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchRiskSummary();
    }
  }, [projectId, fetchRiskSummary]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 flex items-center justify-center">
        <div className="text-white flex items-center gap-3">
          <Activity className="w-6 h-6 animate-pulse" />
          Loading architectural analysis...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 flex items-center justify-center">
        <div className="text-red-400 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
          Error loading architectural analysis: {error}
        </div>
      </div>
    );
  }

  if (!riskSummary) {
    return null;
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-rose-600';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-amber-500';
      case 'low': return 'bg-emerald-500';
      default: return 'bg-slate-500';
    }
  };

  const getScoreColor = (score: number) => {
    if (score > 0.8) return 'text-rose-400';
    if (score > 0.6) return 'text-orange-400';
    if (score > 0.3) return 'text-amber-400';
    return 'text-emerald-400';
  };

  return (
    <ForensicPageLayout
      title="Sovereign Architect"
      subtitle="Spatial Fraud Detection & Structural Admissibility"
      icon={Building2}
    >
      <div className="p-8 space-y-8 overflow-y-auto h-full custom-scrollbar">
        {/* Operational Analysis Card */}
        <div className="max-w-6xl w-full">
            <PageFeatureCard 
                phase={9}
                title="Sovereign Architect"
                description="The spatial audit engine of Zenith. Cross-references engineering specifications with multispectral site data to identify phantom progress and material substitution."
                features={[
                    "Automated 'Ghost Construction' detection",
                    "Volumetric inflation analysis vs. CCO specs",
                    "Structural integrity risk propagation",
                    "Admissible physical-to-financial verification"
                ]}
                howItWorks="Architect fuses engineering specifications with spatial data. It detects structural fraud by identifying 'Phantom Components'—billing items that exist in the ledger but have no physical counterpart in the multispectral site scan or engineering telemetry."
            />
        </div>

        <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Architect Analysis
            </h1>
            <p className="text-slate-400">
              Spatial/Structural Fraud Detection System
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={fetchRiskSummary}>
              <Activity className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={runComprehensiveAnalysis}>
              <Play className="w-4 h-4 mr-2" />
              Run Analysis
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Overall Risk Score */}
        <Card className="bg-slate-900/50 border-white/5">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-indigo-500" />
              Overall Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-6">
              <div className="text-center relative">
                <div className="absolute inset-0 bg-indigo-500/20 blur-[40px] rounded-full" />
                <div className={`text-7xl font-black relative z-10 italic tracking-tighter ${getScoreColor(riskSummary.overall_risk_score)}`}>
                  {Math.round(riskSummary.overall_risk_score * 100)}%
                </div>
                <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest mt-2 relative z-10">Structural Risk Index</div>
              </div>
              <div className="flex-1 ml-16 bg-white/[0.02] border border-white/5 rounded-[2rem] p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-3 h-3 rounded-full animate-pulse ${getRiskColor(riskSummary.overall_risk_level)}`} />
                  <span className="text-xl font-black text-white uppercase tracking-tight">
                    {riskSummary.overall_risk_level} Risk Adjudication
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-8">
                  <div className="space-y-1">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest block">High Risk Areas</span>
                    <span className="text-lg font-black text-white">{riskSummary.high_risk_areas} Sectors</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest block">Critical Issues</span>
                    <span className="text-lg font-black text-rose-500">{riskSummary.critical_issues.length} Identified</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest block">Last Analysis Pulse</span>
                    <span className="text-lg font-black text-slate-300">
                      {new Date(riskSummary.last_analyzed).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fraud Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fraudTypes.map((fraudType) => {
            const analysis = riskSummary.fraud_types[fraudType.id as keyof typeof riskSummary.fraud_types];
            const Icon = fraudType.icon;
            
            return (
              <motion.div
                key={fraudType.id}
                whileHover={{ scale: 1.02, y: -5 }}
                className="tactical-card p-8 rounded-[2.5rem] depth-border-medium depth-layer-1 border border-white/5 hover:depth-border-strong transition-all cursor-pointer group shadow-2xl"
                onClick={() => setSelectedAnalysis(fraudType.id)}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className={`p-4 rounded-2xl ${fraudType.color} shadow-lg shadow-black/40 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className={`w-4 h-4 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] ${getRiskColor(analysis.risk_level)}`} />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2 italic group-hover:text-indigo-400 transition-colors">{fraudType.title}</h3>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest leading-relaxed mb-6">{fraudType.description}</p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <span className={`text-3xl font-black italic ${getScoreColor(analysis.score)}`}>
                      {Math.round(analysis.score * 100)}%
                    </span>
                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Risk Factor</span>
                  </div>
                  <div className="text-[11px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                    <Eye className="w-3 h-3" /> {analysis.evidence.length} Evidence
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Critical Issues */}
        {riskSummary.critical_issues.length > 0 && (
          <Card className="bg-slate-900/50 border-rose-500/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-rose-500" />
                Critical Issues Requiring Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {riskSummary.critical_issues.map((issue, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">{issue.type}</h4>
                        <p className="text-slate-400 text-sm">{issue.evidence_count} evidence items found</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getScoreColor(issue.score)}`}>
                        {Math.round(issue.score * 100)}%
                      </div>
                      <div className="text-xs text-slate-400">Risk Score</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analysis Detail Modal */}
        {selectedAnalysis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-8"
            onClick={() => setSelectedAnalysis(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-900 border border-white/10 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white">
                    {fraudTypes.find(f => f.id === selectedAnalysis)?.title} Analysis
                  </h3>
                  <Button variant="ghost" onClick={() => setSelectedAnalysis(null)}>
                    ×
                  </Button>
                </div>
              </div>
              <div className="p-8 overflow-y-auto max-h-[60vh]">
                {/* Analysis details would go here */}
                <p className="text-slate-400">Detailed analysis view to be implemented...</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
    </ForensicPageLayout>
  );
}