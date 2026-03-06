'use client';

import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Activity, 
  AlertTriangle, 
  CheckCircle,
  Database,
  Shield,
  Zap,
  BarChart3,
  FileText,
  Users,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Download,
  Play,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { useInvestigation } from '@/store/useInvestigation';
import { useDashboardData } from '@/hooks/useDashboardData';
import { SystemHealthWidget } from '@/components/SystemHealthWidget';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface DashboardMetrics {
  totalInvestigations: number;
  activeInvestigations: number;
  completedInvestigations: number;
  totalLeakageIdentified: number;
  riskScore: number;
  dataSources: number;
  alertsCount: number;
  systemUptime: number;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
  badge?: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
}

function MetricCard({ title, value, change, icon: Icon, color, trend = 'neutral' }: MetricCardProps) {
  const trendColors = {
    up: 'text-emerald-400',
    down: 'text-rose-400',
    neutral: 'text-slate-400'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 hover:border-indigo-500/20 transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-sm font-medium ${trendColors[trend]}`}>
            {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {change.value}%
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-black text-white tracking-tight">{value}</p>
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{title}</p>
      </div>
    </motion.div>
  );
}

function QuickActionCard({ action }: { action: QuickAction }) {
  return (
    <Link href={action.href}>
      <motion.div
        whileHover={{ scale: 1.02, y: -5, filter: 'brightness(1.1)' }}
        className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 hover:border-indigo-500/40 transition-all cursor-pointer group shadow-lg hover:shadow-indigo-900/20"
      >
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl ${action.color}`}>
            <action.icon className="w-6 h-6 text-white" />
          </div>
          {action.badge && (
            <span className="px-2 py-1 bg-rose-500/20 text-rose-400 text-xs font-bold rounded-full">
              {action.badge}
            </span>
          )}
        </div>
        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-indigo-400 transition-colors">
          {action.title}
        </h3>
        <p className="text-sm text-slate-400">{action.description}</p>
      </motion.div>
    </Link>
  );
}

export default function DashboardOverview() {
  const { activeInvestigation } = useInvestigation();
  const { 
    metrics, 
    recentActivity, 
    systemHealth, 
    analyticsOverview, 
    quickStats, 
    loading, 
    error, 
    refresh 
  } = useDashboardData();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 flex items-center justify-center">
        <div className="text-white">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 flex items-center justify-center">
        <div className="text-red-400">Error loading dashboard: {error}</div>
      </div>
    );
  }

  const quickActions: QuickAction[] = [
    {
      id: 'new-investigation',
      title: 'Start Investigation',
      description: 'Initiate a new forensic analysis',
      icon: Play,
      href: '/forensic/hub',
      color: 'bg-indigo-500',
      badge: 'Active'
    },
    {
      id: 'data-sources',
      title: 'Data Sources',
      description: 'Manage data connections',
      icon: Database,
      href: '/forensic/satellite',
      color: 'bg-emerald-500'
    },
    {
      id: 'risk-analysis',
      title: 'Risk Analysis',
      description: 'View risk heatmaps and patterns',
      icon: Shield,
      href: '/forensic/analytics',
      color: 'bg-amber-500'
    },
    {
      id: 'reports',
      title: 'Generate Reports',
      description: 'Export investigation findings',
      icon: FileText,
      href: '/forensic/report',
      color: 'bg-purple-500'
    }
  ];



  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-10">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Zenith Dashboard
            </h1>
            <div className="flex items-center gap-4">
              <p className="text-slate-400">
                Forensic Accounting AI System Overview
              </p>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'} `} />
                <span className="text-xs text-slate-500">
                  {loading ? 'Loading...' : metrics ? `Last updated: ${new Date(metrics.last_updated).toLocaleTimeString()}` : 'Offline'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={refresh}>
              <Activity className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <MetricCard
              title="Active Investigations"
              value={metrics.active_investigations}
              change={{ value: 12, type: 'increase' }}
              icon={Activity}
              color="bg-indigo-500"
              trend="up"
            />
            <MetricCard
              title="Leakage Identified"
              value={formatCurrency(metrics.total_leakage_identified)}
              change={{ value: 8, type: 'increase' }}
              icon={TrendingUp}
              color="bg-rose-500"
              trend="up"
            />
            <MetricCard
              title="Risk Score"
              value={metrics.risk_score.toFixed(1)}
              change={{ value: 5, type: 'decrease' }}
              icon={Shield}
              color="bg-amber-500"
              trend="down"
            />
            <MetricCard
              title="System Uptime"
              value={`${metrics.system_uptime}%`}
              icon={CheckCircle}
              color="bg-emerald-500"
              trend="neutral"
            />
          </div>
        )}

        {/* Quick Actions & System Health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <QuickActionCard key={action.id} action={action} />
              ))}
            </div>
          </div>

          {/* System Health */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white mb-4">System Health</h2>
            <SystemHealthWidget />
            
            {/* Additional System Status */}
            <Card className="bg-slate-900/50 border-white/5">
              <CardHeader>
                <CardTitle className="text-white text-lg">Service Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">API Gateway</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-xs text-emerald-400">Operational</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Database</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-xs text-emerald-400">Connected</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">AI Processing</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    <span className="text-xs text-amber-400">High Load</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activity & Analytics Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <Card className="bg-slate-900/50 border-white/5">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity?.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.severity === 'high' ? 'bg-rose-500' :
                      activity.severity === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm text-white">{activity.message}</p>
                      <p className="text-xs text-slate-500 mt-1">{new Date(activity.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                )) || (
                  <p className="text-sm text-slate-400">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Analytics Preview */}
          <Card className="bg-slate-900/50 border-white/5">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Analytics Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsOverview ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                        <p className="text-2xl font-bold text-indigo-400">{analyticsOverview.data_quality_score}%</p>
                        <p className="text-xs text-slate-400">Data Quality</p>
                      </div>
                      <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                        <p className="text-2xl font-bold text-emerald-400">{analyticsOverview.entities_analyzed.toLocaleString()}</p>
                        <p className="text-xs text-slate-400">Entities Analyzed</p>
                      </div>
                    </div>
                    <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                      <p className="text-2xl font-bold text-amber-400">{analyticsOverview.suspicious_patterns}</p>
                      <p className="text-xs text-slate-400">Suspicious Patterns Detected</p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-400">Analytics data unavailable</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}