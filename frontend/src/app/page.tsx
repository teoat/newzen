/**
 * Mission Control Hub - Primary Analyst Entry Point
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  Activity, 
  Search, 
  ShieldAlert,
  Layers,
  Lock,
  Zap,
  Settings,
  DatabaseZap,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useProject } from '../store/useProject';
import { forensicBus } from '../lib/ForensicEventBus';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { authenticatedFetch } from '../lib/api';
import PageFeatureCard from './components/PageFeatureCard';
import UpdateProjectModal from './components/UpdateProjectModal';

// Interfaces
interface GlobalStats {
  risk_index: number;
  total_leakage_identified: number;
  active_investigations: number;
  pending_alerts: number;
  hotspots: { lat: number; lng: number; intensity: number }[];
}

export default function MissionControlHub() {
  const { activeProjectId, activeProject, fetchProjects, budgetForecast } = useProject();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const { toast } = useToast();
  const [nexusAlert, setNexusAlert] = useState<any>(null);

  const renderProphetForecast = () => {
    if (!budgetForecast || budgetForecast.status === 'error') return null;

    const isCritical = budgetForecast.status === 'CRITICAL';
    const isWarning = budgetForecast.status === 'WARNING';

    if (!isCritical && !isWarning) return null;

    return (
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mb-8 p-4 rounded-lg border ${
          isCritical ? 'bg-red-500/10 border-red-500/50' : 'bg-amber-500/10 border-amber-500/50'
        } backdrop-blur-xl flex items-center gap-4`}
      >
        <div className={`p-2 rounded-full ${isCritical ? 'bg-red-500' : 'bg-amber-500'}`}>
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className={`text-sm font-black uppercase tracking-widest ${isCritical ? 'text-red-400' : 'text-amber-400'}`}>
            The Prophet: Predictive Budget Risk
          </h3>
          <p className="text-xs text-slate-300">
            Project budget exhaustion predicted in <span className="font-bold text-white">{budgetForecast.estimated_exhaustion_days} days</span> ({Math.round(budgetForecast.spending_ratio * 100)}% spent).
          </p>
        </div>
        <Link href="/forensic">
          <Button variant="outline" size="sm" className="text-[10px] h-8 border-white/10 hover:bg-white/5">
            Optimize Allocation
          </Button>
        </Link>
      </motion.div>
    );
  };

  // Load real-time data only on client
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!activeProjectId) return;
      
      try {
        const res = await authenticatedFetch(`/api/v1/forensic/${activeProjectId}/dashboard-stats`);
        if (res.ok) {
          const networkStats = await res.json();
          setStats(networkStats);
        }
      } catch (error) {
         console.warn("Stats fetch failed");
      }
    };

    fetchInitialData();

    if (activeProjectId) {
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `ws://${window.location.hostname}:8200/ws`;
        const ws = new WebSocket(`${wsUrl}/${activeProjectId}?token=${localStorage.getItem('zenith_access_token')}`);
        
        ws.onopen = () => setIsConnected(true);
        ws.onclose = () => setIsConnected(false);
        ws.onerror = () => setIsConnected(false);
        
        ws.onmessage = (event) => {
          try {
            const realtimePayload = JSON.parse(event.data);
            if (realtimePayload.stats) setStats(realtimePayload.stats);
            if (realtimePayload.type === 'AGENT_ACTIVITY') {
               toast(`Agent Activity: ${realtimePayload.status}`, 'success');
            }
          } catch (e) {}
        };

        return () => ws.close();
    }
  }, [activeProjectId, toast]);

  useEffect(() => {
    async function checkNexus() {
        try {
            const res = await authenticatedFetch(`/api/v1/forensic/nexus/global`);
            if (res.ok) {
                const data = await res.json();
                if (data.total_nexus_found > 0) setNexusAlert(data);
            }
        } catch (e) { console.warn("Nexus scan unreachable"); }
    }
    checkNexus();
  }, []);

  const MISSIONS = [
    {
      id: 'ingestion',
      title: 'Data Ingress Mission',
      subtitle: 'Manual CSV/Ledger Triage',
      desc: 'Neutralize raw data gaps through neural column mapping and sequence verification.',
      icon: DatabaseZap,
      href: '/ingestion',
      color: 'amber',
      status: 'Ready for Ingress',
      colors: {
          border: 'group-hover:border-amber-500/30',
          iconBg: 'bg-amber-500/10',
          iconBorder: 'border-amber-500/20',
          iconShadow: 'shadow-amber-900/20',
          iconText: 'text-amber-400',
          statusText: 'text-amber-400',
          statusBg: 'bg-amber-500/5',
          statusBorder: 'border-amber-500/10',
          pulse: 'bg-amber-500',
          arrow: 'text-amber-500',
          glow: 'group-hover:from-amber-500/20'
      }
    },
    {
      id: 'reconciliation',
      title: 'Dialectic Analysis',
      subtitle: 'Agentic Consensus Engine',
      desc: 'Execute parallel swarm debate to uncover hidden UBO masking and circular flows.',
      icon: Layers,
      href: '/reconciliation',
      color: 'indigo',
      status: 'Core Synchronized',
      subAction: { label: 'View Circular Flows', href: '/forensic/flow/sankey' },
      colors: {
          border: 'group-hover:border-indigo-500/30',
          iconBg: 'bg-indigo-500/10',
          iconBorder: 'border-indigo-500/20',
          iconShadow: 'shadow-indigo-900/20',
          iconText: 'text-indigo-400',
          statusText: 'text-indigo-400',
          statusBg: 'bg-indigo-500/5',
          statusBorder: 'border-indigo-500/10',
          pulse: 'bg-indigo-500',
          arrow: 'text-indigo-500',
          glow: 'group-hover:from-indigo-500/20'
      }
    },
    {
      id: 'vault',
      title: 'The Sovereign Vault',
      subtitle: 'Final Verdict & Sealing',
      desc: 'Generate cryptographic proof, seal the investigation, and export the legal dossier.',
      icon: Lock,
      href: '/forensic/report',
      color: 'rose',
      status: 'Ready for Sealing',
      colors: {
          border: 'group-hover:border-rose-500/30',
          iconBg: 'bg-rose-500/10',
          iconBorder: 'border-rose-500/20',
          iconShadow: 'shadow-rose-900/20',
          iconText: 'text-rose-400',
          statusText: 'text-rose-400',
          statusBg: 'bg-rose-500/5',
          statusBorder: 'border-rose-500/10',
          pulse: 'bg-rose-500',
          arrow: 'text-rose-500',
          glow: 'group-hover:from-rose-500/20'
      }
    }
  ];

  return (
    <>
      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .slide-down-enter {
          animation: slideDown 0.5s ease-out forwards;
        }
      `}</style>
      <main className="min-h-screen bg-slate-950 p-10 flex flex-col items-center">
        {/* GLOBAL NEXUS ALERT RIBBON */}
        {nexusAlert && (
            <div className="max-w-6xl w-full mb-12 glass-holographic border-rose-500/30 p-6 rounded-[2rem] flex items-center justify-between relative overflow-hidden group cursor-pointer slide-down-enter">
                <div className="flex items-center gap-6 relative z-20">
                    <div className="p-4 bg-rose-500/20 rounded-2xl border border-rose-500/40 animate-pulse">
                        <ShieldAlert className="w-8 h-8 text-rose-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tighter">Silk Road Pattern Detected</h2>
                        <p className="text-[11px] text-rose-400 font-bold uppercase tracking-widest mt-1">
                            {nexusAlert.total_nexus_found} entities identified operating across project boundaries.
                        </p>
                    </div>
                </div>
                <Link href="/forensic/nexus" className="relative z-30">
                    <Button variant="outline" className="border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white transition-all rounded-xl">
                        Inspect Global Nexus
                    </Button>
                </Link>
            </div>
        )}

        {/* Hub Header */}
        <header className="max-w-6xl w-full flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase truncate">
              Mission Control <span className="text-indigo-500">Hub</span>
            </h1>
            <p className="text-slate-500 font-mono text-[11px] md:text-xs uppercase tracking-[0.4em] truncate mt-2">
              Sovereign Forensic OS v2.0 // Node: Primary
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
             <Button 
                onClick={() => forensicBus.emit('TOGGLE_SEARCH')}
                variant="outline" 
                className="h-12 px-6 rounded-2xl bg-white/5 border-white/10 text-slate-400 hover:text-white transition-all font-black text-[11px] uppercase tracking-widest flex items-center gap-3 group"
             >
                <Search className="w-4 h-4" />
                <span>Search Protocol</span>
             </Button>

             <div className={`h-12 px-6 rounded-2xl border flex items-center gap-4 transition-all ${isConnected ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
                <div className={`w-2 h-2 rounded-full animate-pulse ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <span className={`text-[11px] font-black uppercase tracking-widest ${isConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isConnected ? 'Neural Stable' : 'Link Offline'}
                </span>
             </div>

             <Button
                onClick={() => setShowUpdateModal(true)}
                variant="outline"
                className="h-12 w-12 p-0 rounded-2xl bg-white/5 border-white/10 text-slate-400 hover:text-white transition-all flex items-center justify-center"
             >
                <Settings className="w-5 h-5" />
             </Button>
          </div>
        </header>

        <UpdateProjectModal
            isOpen={showUpdateModal}
            onClose={() => setShowUpdateModal(false)}
            project={activeProject}
            onSuccess={() => {
                fetchProjects();
                toast("Operation details updated successfully", "success");
            }}
            />

            {renderProphetForecast()}

            {/* MISSION SELECTION GRID */}
            <section className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 relative z-10">          {MISSIONS.map((mission, idx) => (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative group h-full"
            >
              {/* Outer Glow */}
              <div className={`absolute -inset-1 bg-gradient-to-r from-transparent to-transparent ${mission.colors.glow} rounded-[2.5rem] blur-xl transition-all duration-500`} />
              
              <Link href={mission.href} className="relative block h-full z-10">
                <div className={`h-full bg-slate-900/40 backdrop-blur-2xl border border-white/5 ${mission.colors.border} rounded-[2.5rem] p-8 flex flex-col transition-all duration-500 hover:-translate-y-2 hover:bg-slate-900/60 shadow-2xl pointer-events-auto`}>
                  
                  {/* Icon & Status */}
                  <div className="flex justify-between items-start mb-10">
                    <div className={`p-4 ${mission.colors.iconBg} rounded-2xl border ${mission.colors.iconBorder} shadow-lg ${mission.colors.iconShadow}`}>
                      <mission.icon className={`w-6 h-6 ${mission.colors.iconText}`} />
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Status</span>
                      <span className={`text-[10px] font-mono ${mission.colors.statusText} font-bold ${mission.colors.statusBg} px-2 py-0.5 rounded border ${mission.colors.statusBorder}`}>
                        {mission.status}
                      </span>
                    </div>
                  </div>

                  {/* Text Content */}
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2 italic">
                      {mission.title}
                    </h3>
                    <h4 className="text-[11px] font-black text-indigo-400/60 uppercase tracking-[0.2em] mb-4">
                      {mission.subtitle}
                    </h4>
                    <p className="text-slate-400 text-xs leading-relaxed font-medium">
                      {mission.desc}
                    </p>
                  </div>

                  {/* Footer Action */}
                  <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className={`w-1.5 h-1.5 rounded-full ${mission.colors.pulse} animate-pulse`} />
                       <span className="text-[10px] font-black text-white uppercase tracking-widest">Execute Protocol</span>
                    </div>
                    <ArrowRight className={`w-5 h-5 ${mission.colors.arrow} group-hover:translate-x-2 transition-transform duration-300`} />
                  </div>
                </div>
              </Link>
              
              {/* Optional Sub-Action Link */}
              {mission.subAction && (
                <Link 
                  href={mission.subAction.href}
                  className="absolute bottom-6 left-8 text-[9px] font-black text-slate-500 hover:text-indigo-400 uppercase tracking-widest transition-colors z-20 pointer-events-auto"
                >
                  {mission.subAction.label}
                </Link>
              )}
            </motion.div>
          ))}
        </section>

        {/* Pillar Methodology Footer */}
        <PageFeatureCard 
            phase={0}
            title="Sovereign Forensic OS"
            description="The command-and-control center of the Zenith platform. This serves as the primary 'Cognitive Entry Point' for a forensic analyst to orchestrate global investigations."
            features={[
              "Multi-dimensional status monitoring via 'Neural Link' pulses",
              "Tactical triage for Data Ingress and Dialectic Analysis",
              "Global system health telemetry and real-time awareness",
              "Unified search protocol for cross-project entity lookup"
            ]}
            howItWorks="The Hub utilizes a bi-directional neural link (WebSocket) to maintain a persistent state of project health."
        />
      </main>
    </>
  );
}
