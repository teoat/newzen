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
  ChevronDown,
  Info, // Added Info icon
  Bell, // Added Bell icon for alerts
  BarChart3,
  Brain,
  Shield,
  BrainCircuit,
  FlaskConical,
  MessageSquare,
  Network,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { useProject } from '../store/useProject';
import SystemHealthIndicator from './SystemHealthIndicator';
import { UserButton, useClerk, useUser } from '@clerk/nextjs';
import AuthService from '@/services/AuthService';
import { useRouter } from 'next/navigation';
import { GlobalRepairDrawer } from './GlobalRepairDrawer';

/**
 * CommandRail - Main navigation rail component
 */
export default function CommandRail() {
  const pathname = usePathname();
  const { activeProjectId, projects } = useProject();
  const activeProject = projects.find(p => p.id === activeProjectId);
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const isManualAuth = AuthService.isAuthenticated();

  const handleLogout = async () => {
    if (isManualAuth) {
      AuthService.logout();
      router.push('/login');
    } else {
      await signOut();
    }
  };

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
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">Mission Control</span>
                <span className="text-slate-700 text-[11px]">/</span>
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

      {/* CENTER: SPACER FOR NOW (Or Breadcrumbs Expansion) */}
      <div className="flex-1" />

      {/* RIGHT: BAYESIAN PULSE */}
      <div className="flex items-center gap-8 flex-1 justify-end">
        <SystemHealthIndicator />
        <div className="flex flex-col items-end">
            <div className={`flex items-center gap-2 mb-1 ${confidence < 70 ? 'chromatic-aberration-risk text-rose-500' : 'text-emerald-500'}`}>
                <Activity size={10} className="animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-widest">Confidence: {confidence}%</span>
            </div>
            <div className="w-32 h-1 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                <div 
                    className={`h-full ${confidence < 70 ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`} 
                    style={{ width: `${confidence}%` }}
                />
            </div>
            {/* TOOLTIP: SYSTEM HEALTH */}
            <div className="absolute top-full mt-2 right-0 bg-slate-900 border border-white/10 px-2 py-1 rounded text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                System Confidence & Health
            </div>
        </div>

        <div className="h-8 w-px bg-white/5" />
        <Link href="/help">
            <button className="relative group text-slate-400 hover:text-white transition-colors">
                <Info size={18} />
                {/* TOOLTIP */}
                <div className="absolute top-full mt-2 right-0 bg-slate-900 border border-white/10 px-2 py-1 rounded text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    User Journey & Docs
                </div>
            </button>
        </Link>

        {/* NOTIFICATIONS (NEW GLOBAL TOOL) */}
        <GlobalRepairDrawer />

        {!isManualAuth ? (
          <UserButton afterSignOutUrl="/login" />
        ) : (
          <div className="relative">
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black text-xs hover:bg-indigo-600/30 transition-colors"
            >
                MA
            </button>
            
            <AnimatePresence>
              {showUserMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-48 bg-slate-900 border border-white/10 rounded-2xl p-2 shadow-2xl z-[110]"
                >
                  <div className="px-4 py-3 border-b border-white/5 mb-2">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Manual Agent</p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all text-xs font-bold"
                  >
                    <LogOut size={14} />
                    TERMINATE SESSION
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </nav>
  );
}
