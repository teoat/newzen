'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Terminal, 
  Search, 
  ShieldAlert, 
  LayoutDashboard,
  Layers,
  HardHat,
  Gavel,
  Truck,
  Database,
  Zap,
  LifeBuoy
} from 'lucide-react';
import { useProject } from '@/store/useProject';
import { useInvestigation } from '@/store/useInvestigation';
import { RecommendationEngine } from '@/lib/RecommendationEngine';
import { forensicBus } from '@/lib/ForensicEventBus';

export default function ForensicSidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const activeInvestigation = useInvestigation(state => state.activeInvestigation);
  const { activeProjectId, projects, setActiveProject, fetchProjects } = useProject();
  const [recentEvents, setRecentEvents] = useState<Array<{ type: string; payload: unknown }>>([]);

  const isFirstRender = React.useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      setTimeout(() => setMounted(true), 0);
      isFirstRender.current = false;
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    
    // Subscribe to all events to track recent activity
    const eventTypes = [
      'TRANSACTION_FLAGGED', 'VENDOR_SUSPICIOUS', 'PROJECT_STALLED',
      'OFFSHORE_TRANSFER', 'SANCTION_HIT', 'SATELLITE_DISCREPANCY', 'ASSET_DISCOVERED'
    ] as const;

    const unsubscribes = eventTypes.map(type => 
      forensicBus.subscribe(type, (event) => {
        setRecentEvents(prev => [
          { type: event.type, payload: event.payload },
          ...prev.slice(0, 4) // Keep last 5 events
        ]);
      })
    );

    return () => {
      unsubscribes.forEach(unsubscribe => forensicBus.unsubscribe(unsubscribe));
    };
  }, [fetchProjects]);

  if (pathname === '/login') return null;
  if (!mounted) return null;

  const navGroups = [
    {
      phase: 'Audit Command',
      items: [
        { icon: LayoutDashboard, label: 'Command Center', href: '/', id: '00' },
      ]
    },
    {
      phase: 'PHASE I: DATA INGESTION',
      items: [
        { icon: Database, label: 'Evidence Ingestion', href: '/ingestion', id: '01' },
        { icon: LayoutDashboard, label: 'Multiplex Hub', href: '/forensic/hub', id: '02-hub' },
      ]
    },
    {
      phase: 'PHASE II: FLOW ANALYTICS',
      items: [
        { icon: ShieldAlert, label: 'Reconciliation', href: '/reconciliation', id: '02' },
        { icon: Layers, label: 'Site Forensic Lab', href: '/forensic/lab', id: '04' },
      ]
    },
    {
      phase: 'PHASE III: EVIDENCE ADJUDICATION',
      items: [
        { icon: Gavel, label: 'Workbench', href: '/investigate', id: '07' },
        { icon: Search, label: 'Consensus Adjudicator', href: '/analyst-comparison', id: '08' },
        { icon: Terminal, label: 'Simulation Lab', href: '/simulation', id: '03' },
      ]
    },
    {
      phase: 'PHASE IV: CASE COMPILATION',
      items: [
        { icon: Truck, label: 'Linkage Cabinet', href: '/forensic/assets', id: '10' },
        { icon: ShieldAlert, label: 'Compliance Office', href: '/legal/screening', id: '12' },
      ]
    },
    {
        phase: 'System & Support',
        items: [
            { icon: LifeBuoy, label: 'Help & Docs', href: '/docs', id: '99' },
        ]
    }
  ];

  // Get smart recommendations when investigation is active
  const recommendations = activeInvestigation 
    ? RecommendationEngine.getRecommendations(activeInvestigation)
    : [];

  const FALLBACK_PROGRESS = { acquisition: 0, forensic: 0, verdict: 0, enforcement: 0 };
  const phaseToKey: Record<number, keyof typeof FALLBACK_PROGRESS> = {
    1: 'acquisition',
    2: 'forensic',
    3: 'verdict',
    4: 'enforcement'
  };

  return (
    <aside className="w-64 bg-slate-950 border-r border-white/5 h-screen flex flex-col p-6 sticky top-0 font-sans overflow-y-auto no-scrollbar">
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-900/40 text-white">
            <HardHat className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
                <span className="font-black text-xl tracking-tighter text-white italic leading-none">ZENITH</span>
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] -mt-0.5">Auditor</span>
            </div>
        </div>

        {/* Project Selector */}
        <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Project Command</label>
            <div className="relative group">
                <select 
                    value={activeProjectId || ''} 
                    onChange={(e) => setActiveProject(e.target.value)}
                    title="Select Active Project"
                    aria-label="Select Active Project"
                    className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white appearance-none cursor-pointer focus:border-indigo-500/50 outline-none transition-all hover:bg-slate-800"
                >
                    {projects.length === 0 && <option value="">Loading Projects...</option>}
                    {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-white transition-colors">
                    <Layers className="w-3 h-3" />
                </div>
            </div>
        </div>
      </div>

      {/* Smart Recommendations Section */}
      {recommendations.length > 0 && (
        <div className="mb-6 p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
              Suggested Next
            </span>
          </div>
          <div className="space-y-2">
            {recommendations.slice(0, 2).map((rec, i) => (
              <Link
                key={i}
                href={rec.toolPath}
                className="block p-3 bg-slate-900/50 hover:bg-slate-900 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-all group"
              >
                <p className="text-xs font-bold text-white mb-1">{rec.toolName}</p>
                <p className="text-[10px] text-slate-500 leading-relaxed">{rec.reason}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex flex-col gap-8 flex-1">
        {navGroups.map((group, gIdx) => (
          <div key={group.phase} className="space-y-4">
            <div className="flex items-center justify-between px-4">
                <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    {gIdx < 5 && <div className="w-1.5 h-1.5 bg-slate-800 rounded-full" />}
                    {group.phase}
                </h3>
                {gIdx > 0 && gIdx < 5 && (
                    <span className="text-[9px] font-mono text-indigo-500/80 font-bold">
                        {(activeInvestigation?.phaseProgress || FALLBACK_PROGRESS)[phaseToKey[gIdx] as keyof typeof FALLBACK_PROGRESS]}%
                    </span>
                )}
            </div>
            {gIdx > 0 && gIdx < 5 && (
                <div className="px-4 -mt-2">
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(activeInvestigation?.phaseProgress || FALLBACK_PROGRESS)[phaseToKey[gIdx] as keyof typeof FALLBACK_PROGRESS]}%` }}
                            className={`h-full bg-${gIdx === 1 ? 'indigo' : gIdx === 2 ? 'emerald' : gIdx === 3 ? 'amber' : 'rose'}-500 transition-all duration-1000`}
                        />
                    </div>
                </div>
            )}
            <div className="flex flex-col gap-1">
                {group.items.map((item) => {
                const isActive = pathname === item.href;
                const shouldHighlight = RecommendationEngine.shouldHighlightTool(item.href, recentEvents);
                
                return (
                    <Link
                    key={item.id}
                    href={item.href}
                    className={`
                        group flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold
                        ${isActive 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30' 
                        : shouldHighlight
                            ? 'bg-rose-600/20 text-rose-300 border border-rose-500/30 animate-pulse'
                            : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                        }
                    `}
                    >
                    <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : shouldHighlight ? 'text-rose-400' : 'text-slate-500 group-hover:text-white'}`} />
                    <span className="truncate">{item.label}</span>
                    {shouldHighlight && (
                        <div className="ml-auto w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_8px_#f43f5e]" />
                    )}
                    </Link>
                );
                })}
            </div>
          </div>
        ))}
      </nav>

      {/* Status Footer */}
      <div className="mt-6 pt-6 border-t border-white/5">
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-900/50 rounded-xl">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-white uppercase tracking-wider">System Online</p>
            <p className="text-[9px] text-slate-600 font-mono truncate">v3.8.2-NEXUS</p>
          </div>
        </div>

        {activeInvestigation && (
          <div className="mt-3 px-4 py-2 bg-indigo-600/10 border border-indigo-500/20 rounded-lg">
            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">
              Investigation Active
            </p>
            <p className="text-[10px] text-slate-400 font-bold truncate">
              {activeInvestigation.title}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}