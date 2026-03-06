'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BrainCircuit, 
  Users, 
  Activity, 
  CheckCircle, 
  AlertTriangle,
  Zap,
  Eye,
  TrendingUp,
  Cpu,
  Shield,
  RefreshCw,
  Play,
  Settings
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { authenticatedFetch } from '@/lib/api';
import { useProject } from '@/store/useProject';

interface SwarmAgent {
  id: string;
  role: string;
  expertise_areas: string[];
  confidence_threshold: number;
  processing_capacity: number;
  current_tasks_count: number;
  reputation_score: number;
  last_heartbeat: string;
  status: 'active' | 'inactive';
}

interface CollectiveInsight {
  insight_id: string;
  insight_type: string;
  consensus_level: string;
  participating_agents: string[];
  confidence_score: number;
  risk_assessment: number;
  generated_at: string;
  reasoning: string;
  evidence_chain: string[];
}

interface SwarmDashboardProps {
  projectId?: string;
}

export default function SwarmDashboard({ projectId }: SwarmDashboardProps) {
  const { activeProjectId } = useProject();
  const [swarmStatus, setSwarmStatus] = useState<any>(null);
  const [recentInsights, setRecentInsights] = useState<CollectiveInsight[]>([]);
  const [selectedInsight, setSelectedInsight] = useState<CollectiveInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [queryType, setQueryType] = useState('fraud_pattern_analysis');

  const fetchSwarmStatus = async () => {
    try {
      const response = await authenticatedFetch('/api/v3/swarm-status');
      if (response.ok) {
        const data = await response.json();
        setSwarmStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch swarm status:', error);
    }
  };

  const fetchRecentInsights = async () => {
    try {
      const response = await authenticatedFetch('/api/v3/insights/recent?limit=10');
      if (response.ok) {
        const data = await response.json();
        setRecentInsights(data.insights || []);
      }
    } catch (error) {
      console.error('Failed to fetch recent insights:', error);
    }
  };

  const initiateCollectiveReasoning = async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const response = await authenticatedFetch('/api/v3/collective-reasoning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investigation_context: {
            project_id: projectId,
            timestamp: new Date().toISOString(),
            analysis_scope: 'full_fraud_detection'
          },
          query_type: queryType,
          max_agents: 5
        })
      });

      if (response.ok) {
        const insight = await response.json();
        setSelectedInsight(insight);
        // Refresh insights
        await fetchRecentInsights();
      }
    } catch (error) {
      console.error('Failed to initiate collective reasoning:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConsensusColor = (level: string) => {
    switch (level) {
      case 'unanimous': return 'text-emerald-400';
      case 'supermajority': return 'text-green-400';
      case 'majority': return 'text-blue-400';
      case 'none': return 'text-slate-400';
      case 'conflicted': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'coordinator': return <Cpu className="w-4 h-4" />;
      case 'analyst': return <TrendingUp className="w-4 h-4" />;
      case 'investigator': return <Eye className="w-4 h-4" />;
      case 'validator': return <Shield className="w-4 h-4" />;
      case 'synthesizer': return <BrainCircuit className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'coordinator': return 'text-purple-400';
      case 'analyst': return 'text-blue-400';
      case 'investigator': return 'text-emerald-400';
      case 'validator': return 'text-amber-400';
      case 'synthesizer': return 'text-indigo-400';
      default: return 'text-slate-400';
    }
  };

  useEffect(() => {
    fetchSwarmStatus();
    fetchRecentInsights();
  }, [projectId]);

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Swarm Intelligence
            </h1>
            <p className="text-slate-400">
              Autonomous Multi-Agent Collective Reasoning
            </p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={queryType}
              onChange={(e) => setQueryType(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="fraud_pattern_analysis">Fraud Pattern Analysis</option>
              <option value="risk_assessment">Risk Assessment</option>
              <option value="evidence_synthesis">Evidence Synthesis</option>
              <option value="complex_investigation">Complex Investigation</option>
            </select>
            <Button
              onClick={initiateCollectiveReasoning}
              disabled={loading || !projectId}
              className="bg-indigo-600 hover:bg-indigo-500"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {loading ? 'Analyzing...' : 'Start Swarm Analysis'}
            </Button>
            <Button variant="outline" onClick={fetchSwarmStatus}>
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Swarm Status Overview */}
        {swarmStatus && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-slate-900/50 border-white/5 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <Users className="w-5 h-5 text-indigo-500" />
                  Active Swarm Agents ({swarmStatus.swarm_size})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {swarmStatus.agents?.map((agent: SwarmAgent) => (
                    <div
                      key={agent.id}
                      className="p-4 bg-slate-800/50 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-all"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${agent.status === 'active' ? 'bg-emerald-500/20' : 'bg-slate-700'}`}>
                          {getRoleIcon(agent.role)}
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-xs font-medium capitalize ${getRoleColor(agent.role)}`}>
                            {agent.role.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-slate-400">
                            {agent.id.split('_')[1]?.substring(0, 8)}...
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-slate-400">
                          Capacity: {agent.processing_capacity}
                        </div>
                        <div className={`text-xs font-medium ${
                          agent.status === 'active' ? 'text-emerald-400' : 'text-slate-500'
                        }`}>
                          {agent.status}
                        </div>
                      </div>
                      <div className="space-y-1 mt-3">
                        <div className="text-xs text-slate-400">
                          Current Tasks: <span className="text-white font-medium">{agent.current_tasks_count}</span>
                        </div>
                        <div className="text-xs text-slate-400">
                          Reputation: <span className="text-yellow-400 font-medium">{agent.reputation_score.toFixed(2)}</span>
                        </div>
                        <div className="text-xs text-slate-400">
                          Expertise: {agent.expertise_areas.slice(0, 2).join(', ')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-white/5">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <Activity className="w-5 h-5 text-indigo-500" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">System Status</span>
                  <span className="text-sm font-medium text-emerald-400">Optimal</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Active Reasoning</span>
                  <span className="text-sm font-medium text-blue-400">3 Sessions</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Avg Confidence</span>
                  <span className="text-sm font-medium text-indigo-400">0.78</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Consensus Rate</span>
                  <span className="text-sm font-medium text-green-400">94%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Collective Insights */}
        <Card className="bg-slate-900/50 border-white/5">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-3">
              <BrainCircuit className="w-5 h-5 text-indigo-500" />
              Recent Collective Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <AnimatePresence>
                {recentInsights.map((insight, index) => (
                  <motion.div
                    key={insight.insight_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-slate-800/50 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer"
                    onClick={() => setSelectedInsight(insight)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getConsensusColor(insight.consensus_level)}`} />
                        <div>
                          <h4 className="text-sm font-semibold text-white capitalize">
                            {insight.insight_type.replace('_', ' ')}
                          </h4>
                          <p className="text-xs text-slate-400">
                            {new Date(insight.generated_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-slate-400">
                        {insight.participating_agents.length} agents
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-slate-400">Consensus:</span>
                        <span className={`text-xs font-medium ${getConsensusColor(insight.consensus_level)}`}>
                          {insight.consensus_level.toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-400">
                          (Confidence: {(insight.confidence_score * 100).toFixed(0)}%)
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-slate-400">Risk Assessment:</span>
                        <div className={`text-xs font-medium ${
                          insight.risk_assessment > 0.7 ? 'text-red-400' :
                          insight.risk_assessment > 0.4 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {insight.risk_assessment > 0.7 ? 'HIGH' :
                           insight.risk_assessment > 0.4 ? 'MEDIUM' : 'LOW'}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                      {insight.reasoning}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {recentInsights.length === 0 && (
                <div className="text-center py-12">
                  <BrainCircuit className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Collective Insights</h3>
                  <p className="text-slate-400">
                    {projectId ? 'Start a swarm analysis to generate collective insights' : 'Select a project to begin'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Selected Insight Detail Modal */}
        <AnimatePresence>
          {selectedInsight && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-8"
              onClick={() => setSelectedInsight(null)}
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
                      Collective Insight Details
                    </h3>
                    <Button variant="ghost" onClick={() => setSelectedInsight(null)}>
                      ×
                    </Button>
                  </div>
                </div>
                <div className="p-8 overflow-y-auto max-h-[60vh]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-2">Insight Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Insight ID:</span>
                            <span className="text-white font-mono">{selectedInsight.insight_id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Type:</span>
                            <span className="text-white capitalize">{selectedInsight.insight_type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Generated:</span>
                            <span className="text-white">{new Date(selectedInsight.generated_at).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-2">Consensus Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Level:</span>
                            <span className={`text-xs font-medium ${getConsensusColor(selectedInsight.consensus_level)}`}>
                              {selectedInsight.consensus_level.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Confidence:</span>
                            <span className="text-white">{(selectedInsight.confidence_score * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Participating Agents:</span>
                            <span className="text-white">{selectedInsight.participating_agents.length}</span>
                          </div>
                        </div>
                    </div>
                    </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">Reasoning</h4>
                      <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/50 p-4 rounded-lg">
                        {selectedInsight.reasoning}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">Risk Assessment</h4>
                      <div className="bg-slate-800/50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-slate-400">Risk Level:</span>
                          <span className={`text-lg font-bold ${
                            selectedInsight.risk_assessment > 0.7 ? 'text-red-400' :
                            selectedInsight.risk_assessment > 0.4 ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            {selectedInsight.risk_assessment > 0.7 ? 'HIGH' :
                             selectedInsight.risk_assessment > 0.4 ? 'MEDIUM' : 'LOW'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              selectedInsight.risk_assessment > 0.7 ? 'bg-red-500 w-4/5' :
                              selectedInsight.risk_assessment > 0.4 ? 'bg-amber-500 w-3/5' : 'bg-emerald-500 w-2/5'
                            }`}
                          />
                        </div>
                      </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}