'use client';

/**
 * TopNav / CommandRail Component
 * Main navigation component with mission switcher and search functionality
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DatabaseZap, 
  GitMerge, 
  ShieldCheck, 
  Lock,
  Search,
  Activity,
  ChevronDown
} from 'lucide-react';
import { useProject } from '../store/useProject';
import SystemHealthIndicator from './SystemHealthIndicator';

/**
 * CommandRail - Main navigation rail component
 */
export default function CommandRail() {
  const pathname = usePathname();
  const { activeProjectId, projects } = useProject();
  const activeProject = projects.find(p => p.id === activeProjectId);

  const MISSIONS = [
    { href: '/ingestion', icon: DatabaseZap, label: 'Ingress', color: 'amber' },
    { href: '/reconciliation', icon: GitMerge, label: 'Analysis', color: 'indigo' },
    { href: '/forensic/theory-board', icon: ShieldCheck, label: 'War Room', color: 'emerald' },
    { href: '/forensic/reasoning', icon: Lock, label: 'Vault', color: 'rose' },
  ];

  const [isSearching, setIsSearching] = useState(false);
  const confidence = 94.2;

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-slate-950/80 backdrop-blur-xl border-b border-white/5 h-16 flex items-center px-8 justify-between">
      {/* LEFT: MISSION LOGO & OMNI-BREADCRUMB */}
      <div className="flex items-center gap-6 flex-1">
        <Link href="/">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:scale-105 transition-transform shrink-0">
            <span className="text-white font-black text-lg italic">Z</span>
          </div>
        </Link>

        <div className="h-6 w-px bg-white/10 mx-2" />

        <div className="flex-1 max-w-md relative group">
          <AnimatePresence mode="wait">
            {!isSearching ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsSearching(true)}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">Mission Control</span>
                <span className="text-slate-700 text-[10px]">/</span>
                <span className="text-xs font-bold text-white uppercase tracking-tight group-hover:text-indigo-400 transition-colors">
                  {activeProject?.name || 'Selection Required'}
                </span>
                <Search size={12} className="text-slate-600 group-hover:text-indigo-400" />
              </motion.div>
            ) : (
              <motion.div 
                initial={{ width: 0, opacity: 0 }} animate={{ width: '100%', opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                className="relative"
              >
                <input 
                  autoFocus
                  onBlur={() => setIsSearching(false)}
                  placeholder="Search Ledger, Photos, or Pinned Artifacts..."
                  className="w-full bg-slate-900/50 border border-indigo-500/30 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none shadow-[0_0_20px_rgba(79,70,229,0.1)]"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* CENTER: MISSION SWITCHER (High-Density Icons) */}
      <div className="flex items-center gap-1 bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 shadow-2xl mx-8">
        {MISSIONS.map((mission) => {
          const isActive = pathname === mission.href;
          return (
            <Link key={mission.href} href={mission.href}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  flex items-center gap-3 px-5 py-2.5 rounded-xl transition-all relative
                  ${isActive ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}
                `}
              >
                {isActive && (
                  <motion.div 
                    layoutId="nav-glow"
                    className={`absolute inset-0 bg-${mission.color}-500/10 border border-${mission.color}-500/30 rounded-xl`}
                  />
                )}
                <mission.icon size={16} className={isActive ? `text-${mission.color}-400` : ''} />
              </motion.div>
            </Link>
          );
        })}
      </div>

      {/* RIGHT: BAYESIAN PULSE */}
      <div className="flex items-center gap-8 flex-1 justify-end">
        <SystemHealthIndicator />
        <div className="flex flex-col items-end">
            <div className={`flex items-center gap-2 mb-1 ${confidence < 70 ? 'chromatic-aberration-risk text-rose-500' : 'text-emerald-500'}`}>
                <Activity size={10} className="animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest">Confidence: {confidence}%</span>
            </div>
            <div className="w-32 h-1 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                    initial={{ width: '0%' }}
                    animate={{ width: `${confidence}%` }}
                    className={`h-full bg-gradient-to-r ${confidence < 70 ? 'from-rose-500 to-amber-500' : 'from-indigo-500 to-emerald-500'} shadow-[0_0_10px_rgba(16,185,129,0.3)]`}
                />
            </div>
        </div>

        <div className="w-9 h-9 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black text-xs">
            JD
        </div>
      </div>
    </nav>
  );
}
