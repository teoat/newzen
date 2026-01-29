'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Activity, 
  Search, 
  ArrowRight,
  Layers,
  ChevronRight,
  Database,
  Lock,
  LayoutDashboard,
  Zap,
  BrainCircuit,
  Users,
  ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ForensicPageLayout from './components/ForensicPageLayout';
import ProjectGate from './components/ProjectGate';
import { RiskHeatmap } from './components/RiskHeatmap';
import { LeakageForecast } from './components/LeakageForecast';
import { useProject } from '@/store/useProject';
import { useInvestigation } from '@/store/useInvestigation';
import { API_URL } from '@/utils/constants';
import { forensicBus } from '@/lib/ForensicEventBus';

// Existing interfaces...
interface GlobalStats {
  risk_index: number;
  total_leakage_identified: number;
  active_investigations: number;
  pending_alerts: number;
  hotspots: { lat: number; lng: number; intensity: number }[];
}

interface AlertItem {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  message: string;
  timestamp: string;
  type: string;
  action?: { label: string; route?: string };
}

interface ForecastResult {
  project_name: string;
  contract_value: number;
  realized_spend: number;
  current_leakage: number;
  leakage_rate_percent: number;
  predicted_total_leakage: number;
  risk_status: string;
}

export default function WarRoomDashboard() {
  const { activeProjectId } = useProject();
  const { startInvestigation } = useInvestigation();
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Polling for real-time updates
  useEffect(() => {
    if (!activeProjectId) return;

    const fetchDashboardData = async () => {
      try {
        // Parallel data fetching for performance
        const [statsRes, alertsRes, forecastRes] = await Promise.all([
           // Fetch real project stats
           fetch(`${API_URL}/api/v1/forensic/${activeProjectId}/dashboard-stats`).then(r => r.json()),
           // Fetch real AI alerts
           fetch(`${API_URL}/api/v1/ai/alerts?project_id=${activeProjectId}`).then(r => r.json()),
           // Fetch leakage forecast
           fetch(`${API_URL}/api/v1/forensic/${activeProjectId}/forecast`).then(r => r.json())
        ]);

        const statsData = statsRes as Record<string, unknown>;
        setStats({
          risk_index: (statsData.risk_index as number) || 0,
          total_leakage_identified: (statsData.total_leakage_identified as number) || 0,
          active_investigations: (statsData.active_investigations as number) || 0,
          pending_alerts: (statsData.pending_alerts as number) || 0,
          hotspots: (statsData.hotspots as GlobalStats['hotspots']) || []
        });

        setForecast(forecastRes as ForecastResult);

        setAlerts((alertsRes.alerts || []).map((a: Record<string, unknown>) => ({
            id: (a.id as string) || 'ALT-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
            severity: ((a.severity as string) || 'MEDIUM').toUpperCase() as 'CRITICAL' | 'HIGH' | 'MEDIUM', 
            type: (a.type as string) || 'ANOMALY',
            message: a.message as string,
            timestamp: (a.timestamp as string) || new Date().toLocaleTimeString(),
            action: a.action as { label: string; route?: string }
        })).slice(0, 10)); // Top 10 alerts

      } catch (err) {
        console.error("Dashboard Sync Failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [activeProjectId]);

  const handleStartInvestigation = (alert: AlertItem) => {
    startInvestigation(`Investigation: ${alert.type} - ${alert.id}`, {
      projectId: activeProjectId || 'UNKNOWN',
      suspects: [],
      transactionIds: []
    });
    
    forensicBus.publish('INVESTIGATION_STARTED', {
      investigationId: alert.id,
      title: alert.message,
      context: { type: alert.type }
    });

    router.push('/investigate');
  };

  const FORENSIC_TOOLS = [
    { 
      label: 'Flow Analytics', 
      desc: 'Reconcile ledgers & trace flow',
      icon: ShieldAlert, 
      href: '/reconciliation',
      color: 'indigo'
    },
    { 
      label: 'Nexus Graph', 
      desc: 'Map entity relationships',
      icon: Layers, 
      href: '/forensic/nexus',
      color: 'emerald'
    },
    { 
      label: 'Asset Recovery', 
      desc: 'Trace & freeze assets',
      icon: Lock, 
      href: '/forensic/assets',
      color: 'rose'
    },
    { 
      label: 'Evidence Ingestion', 
      desc: 'Upload new financial records',
      icon: Database, 
      href: '/ingestion',
      color: 'amber'
    },
  ];

  return (
    <ProjectGate>
      <ForensicPageLayout
        title="Audit Command Center"
        subtitle="Real-time Financial Integrity Monitoring System"
        icon={LayoutDashboard}
        loading={loading}
        loadingMessage="Initializing Command Center..."
      >
        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar h-full">
          
          {/* Top KPI Matrix - Now Clickable */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Risk Index */}
              <Link href="/investigate?filter=high_risk">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="tactical-card p-6 rounded-3xl group overflow-hidden cursor-pointer h-full border border-transparent hover:border-rose-500/30 transition-all"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Activity className="w-16 h-16 text-rose-500" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-depth-secondary uppercase tracking-widest mb-2">Portfolio Risk Index</p>
                        <div className="flex items-baseline gap-3">
                            <span className="text-4xl font-black text-white tracking-tighter">{stats?.risk_index}</span>
                            <span className="text-xs font-bold text-rose-500 bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/20">CRITICAL</span>
                        </div>
                        <div className="w-full h-1 bg-slate-800 rounded-full mt-4 overflow-hidden">
                            <motion.div 
                                className="h-full bg-rose-500 w-[78%] shadow-[0_0_10px_#f43f5e]" 
                                animate={{ width: `${stats?.risk_index}%` }}
                            />
                        </div>
                    </div>
                </motion.div>
              </Link>

              {/* Total Leakage */}
              <Link href="/reconciliation">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="tactical-card p-6 rounded-3xl group overflow-hidden cursor-pointer h-full border border-transparent hover:border-amber-500/30 transition-all"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="w-16 h-16 text-amber-500" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-depth-secondary uppercase tracking-widest mb-2">Identified Leakage</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-white tracking-tighter">Rp</span>
                            <span className="text-4xl font-black text-white tracking-tighter">{(stats?.total_leakage_identified || 0) / 1000000000}</span>
                            <span className="text-xl font-bold text-depth-secondary">B</span>
                        </div>
                        <p className="text-[10px] text-depth-tertiary mt-2 font-mono">
                            <span className="text-emerald-400">↑ 12%</span> vs last month
                        </p>
                    </div>
                </motion.div>
              </Link>

              {/* Active Investigations */}
              <Link href="/investigate">
                  <motion.div 
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="tactical-card p-6 rounded-3xl group overflow-hidden cursor-pointer h-full border border-transparent hover:border-indigo-500/30 transition-all"
                  >
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                          <Search className="w-16 h-16 text-indigo-500" />
                      </div>
                      <div className="relative z-10">
                          <p className="text-[10px] font-black text-depth-secondary uppercase tracking-widest mb-2">Active Cases</p>
                          <div className="flex items-baseline gap-3">
                              <span className="text-4xl font-black text-white tracking-tighter">{stats?.active_investigations}</span>
                              <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20">IN PROGRESS</span>
                          </div>
                      </div>
                  </motion.div>
              </Link>

              {/* Geo Hotspots */}
              <Link href="/forensic/nexus">
                  <motion.div 
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="tactical-card p-6 rounded-3xl group overflow-hidden cursor-pointer h-full border border-transparent hover:border-emerald-500/30 transition-all"
                  >
                      <div className="absolute inset-0 opacity-20">
                          <div className="w-full h-full bg-[url('/grid.svg')] bg-cover" />
                          {stats?.hotspots?.map((h, i) => (
                              <div key={i} className="absolute w-2 h-2 bg-rose-500 rounded-full animate-ping" 
                                  style={{ top: `${30 + (i*20)}%`, left: `${40 + (i*15)}%` }} />
                          ))}
                      </div>
                      <div className="relative z-10 h-full flex flex-col justify-between pointer-events-none">
                          <p className="text-[10px] font-black text-depth-secondary uppercase tracking-widest">Threat Map</p>
                          <div>
                              <span className="text-2xl font-black text-white tracking-tighter">{stats?.hotspots?.length || 0}</span>
                              <span className="text-xs font-bold text-depth-tertiary ml-2">HOTSPOTS DETECTED</span>
                          </div>
                      </div>
                  </motion.div>
              </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[500px]">
              {/* Frenly AI Insights Panel */}
              <div className="lg:col-span-2 space-y-8">
                  <div className="tactical-frame p-8 rounded-[3rem] flex flex-col relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />
                      
                      <div className="flex items-center justify-between mb-8 relative z-10">
                          <div className="flex items-center gap-3">
                              <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 shadow-lg shadow-indigo-900/20">
                                  <BrainCircuit className="w-6 h-6 text-indigo-400" />
                              </div>
                              <div>
                                  <h3 className="text-lg font-black text-white uppercase tracking-tight">Frenly AI Insights</h3>
                                  <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">Real-time Intelligence Feed</p>
                              </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-[10px] font-mono text-emerald-500">LIVE</span>
                          </div>
                      </div>

                      <div className="max-h-[400px] space-y-4 overflow-y-auto custom-scrollbar pr-2 relative z-10">
                          {alerts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 py-20">
                              <BrainCircuit className="w-12 h-12 mb-4 opacity-20" />
                              <p className="text-xs font-bold uppercase tracking-widest">No Active Threats Detected</p>
                            </div>
                          ) : (
                            alerts.map((alert, i) => (
                                <motion.div 
                                    key={alert.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="p-5 rounded-2xl bg-slate-800/50 border border-white/5 hover:bg-slate-800 hover:border-indigo-500/30 transition-all group flex items-start justify-between gap-4 backdrop-blur-sm"
                                >
                                    <div className="flex gap-4">
                                        <div className={`mt-1 w-1.5 h-12 rounded-full shrink-0 ${
                                            alert.severity === 'CRITICAL' ? 'bg-rose-500 shadow-[0_0_12px_#f43f5e]' : 
                                            alert.severity === 'HIGH' ? 'bg-amber-500 shadow-[0_0_12px_#f59e0b]' : 'bg-indigo-500 shadow-[0_0_12px_#6366f1]'
                                        }`} />
                                        <div>
                                            <div className="flex items-center gap-3 mb-1.5">
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                                    alert.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' : 
                                                    alert.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-300' : 'bg-indigo-500/20 text-indigo-300'
                                                }`}>
                                                    {alert.severity}
                                                </span>
                                                <span className="text-[10px] font-mono text-slate-400">{alert.timestamp}</span>
                                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider hidden sm:inline-block">ID: {alert.id}</span>
                                            </div>
                                            <p className="text-sm font-bold text-slate-100 leading-relaxed max-w-xl">{alert.message}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 shrink-0">
                                      {alert.action && (
                                         <button 
                                            onClick={() => router.push(alert.action?.route || '#')}
                                            className="opacity-0 group-hover:opacity-100 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                                         >
                                             resolve <ArrowRight className="w-3 h-3" />
                                         </button>
                                      )}
                                      <button 
                                          onClick={() => handleStartInvestigation(alert)}
                                          className="opacity-0 group-hover:opacity-100 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                                      >
                                          Investigate
                                      </button>
                                    </div>
                                </motion.div>
                            ))
                          )}
                      </div>
                  </div>

                  <div className="tactical-frame p-8 rounded-[3rem]">
                      <RiskHeatmap 
                        data={[
                            { category: 'Material Cement', variance: 120000000, risk: 0.85 },
                            { category: 'Steel Rebar', variance: 45000000, risk: 0.3 },
                            { category: 'Site Labor', variance: 85000000, risk: 0.65 },
                            { category: 'Heavy Equipment', variance: 12000000, risk: 0.1 },
                            { category: 'Fuel/Ops', variance: 35000000, risk: 0.45 },
                            { category: 'Sub-Contract B', variance: 210000000, risk: 0.95 },
                        ]} 
                      />
                  </div>
              </div>

              {/* Quick Access Grid */}
              <div className="space-y-8">
                  <div className="tactical-frame p-8 rounded-[3rem]">
                      <LeakageForecast data={forecast} />
                  </div>

                  <div className="tactical-frame p-8 rounded-[3rem]">
                      <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                          <Users className="w-4 h-4 text-emerald-500" /> Active Investigators
                      </h3>
                      <div className="flex -space-x-2">
                          {[
                              { name: 'Admin', color: 'bg-indigo-500' },
                              { name: 'Investigator B', color: 'bg-emerald-500' },
                              { name: 'Analyst C', color: 'bg-amber-500' }
                          ].map(user => (
                              <div key={user.name} className={`w-10 h-10 rounded-full ${user.color} border-2 border-slate-950 flex items-center justify-center text-[10px] font-black text-white`} title={user.name}>
                                  {user.name[0]}
                              </div>
                          ))}
                          <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-[10px] font-black text-slate-500">
                              +2
                          </div>
                      </div>
                  </div>

                  <div className="tactical-frame p-8 rounded-[3rem] flex flex-col">
                      <h3 className="text-lg font-black text-white uppercase tracking-tight mb-8 flex items-center gap-3">
                          <Zap className="w-5 h-5 text-amber-400" /> Operational Tools
                      </h3>
                      
                      <div className="grid grid-cols-1 gap-4 flex-1">
                          {FORENSIC_TOOLS.map((tool, i) => (
                              <Link key={i} href={tool.href}>
                                  <motion.div 
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      className={`h-full p-4 rounded-2xl bg-slate-900/40 border border-white/5 hover:bg-slate-800 hover:border-${tool.color}-500/30 transition-all flex items-center gap-4 group cursor-pointer`}
                                  >
                                      <div className={`w-12 h-12 rounded-xl bg-${tool.color}-500/10 flex items-center justify-center group-hover:bg-${tool.color}-500/20 transition-colors shadow-lg shadow-${tool.color}-900/10`}>
                                          <tool.icon className={`w-6 h-6 text-${tool.color}-500`} />
                                      </div>
                                      <div className="flex-1">
                                          <h4 className="text-sm font-bold text-slate-200 mb-0.5 group-hover:text-white transition-colors">{tool.label}</h4>
                                          <p className="text-[10px] text-slate-500 font-medium group-hover:text-slate-400">{tool.desc}</p>
                                      </div>
                                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                                    </motion.div>
                              </Link>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
        </div>
      </ForensicPageLayout>
    </ProjectGate>
  );
}