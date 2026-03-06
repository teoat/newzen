/**
 * Forensic OS Sidebar - Lifecycle Driven UI
 */

'use client';

import React, { memo, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Search, 
  GitMerge, 
  FileText, 
  Settings,
  Menu,
  X,
  DatabaseZap,
  Network,
  ShieldCheck,
  Globe,
  Lock,
  MessageSquare,
  FlaskConical,
  Activity,
  Fingerprint,
  Info,
  ChevronDown,
  Layers
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  description?: string;
  badge?: string;
}

// STAGE 1: ACQUISITION (Pillar I: Cleaning the Lens)
const stage1 = [
  { 
    href: '/ingestion', 
    label: 'Data Ingress Lab', 
    icon: DatabaseZap,
    description: 'Universal Interpreter'
  },
  { 
    href: '/forensic/evidence', 
    label: 'Evidence Locker', 
    icon: ShieldCheck,
    description: 'Visual Truth Bridge'
  },
  { 
    href: '/forensic/communications', 
    label: 'Comm Sweep', 
    icon: MessageSquare,
    description: 'Mens Rea Discovery'
  },
];

// STAGE 2: ANALYSIS (Pillar II: Truth Reconciliation)
const stage2 = [
  { 
    href: '/reconciliation', 
    label: 'Swarm Reconciliation', 
    icon: GitMerge,
    description: 'The Engine Room'
  },
  {
    href: '/forensic/ledger',
    label: 'Forensic Ledger',
    icon: FileText,
    description: 'Verified Truth'
  },
];

// STAGE 3: DISCOVERY (Pillar III & V: Intelligence)
const stage3 = [
  {
    href: '/forensic/canvas',
    label: 'Intelligence Canvas',
    icon: Layers,
    description: 'Unified Forensic View'
  },
  {
    href: '/forensic/nexus',
    label: 'Silk Road Nexus',
    icon: Network,
    description: 'Louvain Clustering'
  },
  {
    href: '/forensic/map',
    label: 'Movement Storyboard',
    icon: Globe,
    description: 'Impossible Travel'
  },
  {
    href: '/forensic/simulation',
    label: 'Scenario Sandbox',
    icon: FlaskConical,
    description: 'Logic Stress Test'
  }
];

// STAGE 4: SEALING (Pillar IV: The Verdict)
const stage4 = [
  { 
    href: '/forensic/report', 
    label: 'Sovereign Vault', 
    icon: Lock,
    description: 'Dossier Sealing'
  },
  { 
    href: '/forensic/reports', 
    label: 'Report Scheduler', 
    icon: Activity,
    description: 'Automated Delivery'
  },
  { 
    href: '/admin', 
    label: 'Governance Node', 
    icon: Fingerprint,
    description: 'Audit & Access'
  },
];


const ForensicSidebar = memo(function ForensicSidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleMobile = useCallback(() => {
    setIsMobileOpen(prev => !prev);
  }, []);

  const isActive = useCallback((href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }, [pathname]);

  return (
    <>
      <button
        onClick={toggleMobile}
        className="lg:hidden fixed top-20 left-4 z-[100] p-2 bg-slate-900 border border-white/10 rounded-lg shadow-lg"
      >
        {isMobileOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
      </button>

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-[90]
          w-72 bg-slate-950 border-r border-white/5
          transform transition-transform duration-300 ease-in-out
          lg:transform-none
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full pt-20 lg:pt-0">
          <nav className="flex-1 px-6 py-10 space-y-8 overflow-y-auto custom-scrollbar">
            
            {/* DASHBOARD */}
            <Link
              href="/"
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${isActive('/') ? 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:bg-white/5'}`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-black uppercase tracking-widest text-[11px]">Mission Hub</span>
            </Link>

            <StageSection title="Stage 1: Acquisition" items={stage1} isActive={isActive} info="Pillar I: LLM-Based Shape Analysis & Mapping" />
            <StageSection title="Stage 2: Analysis" items={stage2} isActive={isActive} info="Pillar II: Bank-to-Ledger Truth Reconciliation" />
            <StageSection title="Stage 3: Discovery" items={stage3} isActive={isActive} info="Pillar III: Graph Clustering & Behavior Map" />
            <StageSection title="Stage 4: Sealing" items={stage4} isActive={isActive} info="Pillar IV: Statutory Mapping & Final Verdict" />

             {/* SETTINGS */}
            <div className="pt-6 border-t border-white/5">
                <Link
                  href="/settings"
                  className="flex items-center gap-4 px-4 py-3 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span className="font-bold text-[10px] uppercase tracking-widest">System Params</span>
                </Link>
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
});

function StageSection({ title, items, isActive, info }: any) {
    const [showInfo, setShowInfo] = useState(false);
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between px-4">
                <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">{title}</h3>
                <button onClick={() => setShowInfo(!showInfo)} title="Toggle info" className="text-slate-700 hover:text-indigo-500 transition-colors">
                    <Info size={10} />
                </button>
            </div>
            
            <AnimatePresence>
                {showInfo && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 overflow-hidden"
                    >
                        <p className="text-[8px] font-bold text-indigo-400/70 uppercase leading-relaxed mb-2 tracking-widest">
                            {info}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-1">
                {items.map((item: any) => {
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`group flex items-center gap-4 px-4 py-3 rounded-2xl transition-all border ${active ? 'bg-indigo-600/10 border-indigo-500/20 text-indigo-400' : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <item.icon className={`w-4 h-4 ${active ? 'text-indigo-400' : 'text-slate-500 group-hover:text-indigo-300'}`} />
                            <div className="flex flex-col">
                                <span className="font-black uppercase tracking-widest text-[10px]">{item.label}</span>
                                <span className="text-[8px] font-bold text-slate-600 uppercase group-hover:text-slate-400 transition-colors">{item.description}</span>
                            </div>
                            {active && (
                                <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

export default ForensicSidebar;
