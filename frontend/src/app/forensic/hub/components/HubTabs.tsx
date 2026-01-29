'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, GitBranch, Microscope, Network, Satellite,
  Maximize2, Minimize2, Info, Columns
} from 'lucide-react';
import { useHubStore, HubTab } from '@/store/useHubStore';

const TABS = [
  { id: 'analytics' as const, label: 'Analytics', icon: TrendingUp, color: 'indigo' },
  { id: 'flow' as const, label: 'Flow', icon: GitBranch, color: 'blue' },
  { id: 'lab' as const, label: 'Lab', icon: Microscope, color: 'purple' },
  { id: 'nexus' as const, label: 'Nexus', icon: Network, color: 'emerald' },
  { id: 'satellite' as const, label: 'Satellite', icon: Satellite, color: 'amber' },
];

const colorMap = {
  indigo: 'border-indigo-500 bg-indigo-500/10 text-indigo-400',
  blue: 'border-blue-500 bg-blue-500/10 text-blue-400',
  purple: 'border-purple-500 bg-purple-500/10 text-purple-400',
  emerald: 'border-emerald-500 bg-emerald-500/10 text-emerald-400',
  amber: 'border-amber-500 bg-amber-500/10 text-amber-400',
};

export function HubTabs() {
  const { 
    activeTab, setActiveTab, 
    focusMode, toggleFocusMode,
    comparisonMode, toggleComparisonMode,
    secondaryTab, setSecondaryTab,
    tabHistory 
  } = useHubStore();

  return (
    <div className="border-b border-white/10 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-20">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Tab Navigation */}
        <div className="flex items-center gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider
                  transition-all duration-200 flex items-center gap-2
                  ${isActive 
                    ? `border ${colorMap[tab.color as keyof typeof colorMap]}` 
                    : 'border border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                
                {/* Keyboard Hint */}
                <span className="ml-1 text-[8px] opacity-30 group-hover:opacity-100 transition-opacity">
                  ⌘{TABS.indexOf(tab) + 1}
                </span>
                
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 border rounded-xl"
                    style={{
                      borderColor: `var(--${tab.color}-500)`,
                    }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Focus Mode Toggle */}
          <button
            onClick={toggleFocusMode}
            className={`
              px-3 py-2 rounded-lg font-bold text-xs uppercase tracking-wider
              transition-all duration-200 flex items-center gap-2
              ${focusMode 
                ? 'bg-purple-500/20 border border-purple-500/50 text-purple-400' 
                : 'border border-white/10 text-slate-400 hover:text-white hover:border-white/20'
              }
            `}
            title={focusMode ? 'Exit Focus Mode' : 'Enter Focus Mode'}
          >
            {focusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span>{focusMode ? 'Exit Focus' : 'Focus'}</span>
          </button>

          {/* Comparison Mode Toggle */}
          <button
            onClick={toggleComparisonMode}
            className={`
              px-3 py-2 rounded-lg font-bold text-xs uppercase tracking-wider
              transition-all duration-200 flex items-center gap-2
              ${comparisonMode 
                ? 'bg-blue-500/20 border border-blue-500/50 text-blue-400' 
                : 'border border-white/10 text-slate-400 hover:text-white hover:border-white/20'
              }
            `}
            title={comparisonMode ? 'Single View' : 'Split View'}
          >
            <Columns className="w-4 h-4" />
            <span>{comparisonMode ? 'Single' : 'Split'}</span>
          </button>

          {/* Secondary Tab Selector (Visible only in Comparison Mode) */}
          {comparisonMode && (
            <div className="relative group">
              <button className="px-3 py-2 rounded-lg border border-white/10 text-slate-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-white/5">
                 <span className="text-[9px] text-slate-500">Right:</span>
                 {TABS.find(t => t.id === secondaryTab)?.label || 'Select'}
              </button>
              
              <div className="absolute top-full right-0 mt-2 w-48 bg-slate-900 border border-white/10 rounded-xl shadow-xl overflow-hidden hidden group-hover:block p-1 z-50">
                 {TABS.map(tab => (
                   <button
                     key={tab.id}
                     onClick={() => setSecondaryTab(tab.id)}
                     className={`
                       w-full text-left px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2
                       ${secondaryTab === tab.id ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}
                     `}
                   >
                      <tab.icon className="w-3 h-3" />
                      {tab.label}
                   </button>
                 ))}
              </div>
            </div>
          )}

          {/* Tab History Dropdown */}
          <div className="relative group">
            <button
              className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all"
              title="Recent Tabs"
            >
              <TrendingUp className="w-4 h-4 opacity-70" />
            </button>
            <div className="absolute top-full right-0 mt-2 w-48 bg-slate-900 border border-white/10 rounded-xl shadow-xl overflow-hidden hidden group-hover:block p-1 z-50">
              <div className="px-3 py-2 border-b border-white/5 bg-white/5">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Recently Viewed</span>
              </div>
              {tabHistory.map((tabId) => {
                const tabData = TABS.find(t => t.id === tabId);
                if (!tabData) return null;
                const Icon = tabData.icon;
                return (
                  <button
                    key={tabId}
                    onClick={() => setActiveTab(tabId)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <Icon className="w-3 h-3" />
                    {tabData.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Info Button */}
          <button
            className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all"
            title="Hub Information"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
