'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Lazy load tab components for optimal performance
const AnalyticsTab = dynamic(() => import('@/app/forensic/hub/tabs/AnalyticsTab'), {
  loading: () => <TabLoading label="Analytics" />
});

const FlowTab = dynamic(() => import('@/app/forensic/hub/tabs/FlowTab'), {
  loading: () => <TabLoading label="Flow Analysis" />
});

const LabTab = dynamic(() => import('@/app/forensic/hub/tabs/LabTab'), {
  loading: () => <TabLoading label="Forensic Lab" />
});

const NexusTab = dynamic(() => import('@/app/forensic/hub/tabs/NexusTab'), {
  loading: () => <TabLoading label="Nexus Graph" />
});

const SatelliteTab = dynamic(() => import('@/app/forensic/hub/tabs/SatelliteTab'), {
  loading: () => <TabLoading label="Satellite Verification" />
});

import { useHubStore, HubTab } from '@/store/useHubStore';
import { Columns, ChevronDown } from 'lucide-react';

function TabLoading({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-full min-h-[50vh]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Loading {label}...</p>
      </div>
    </div>
  );
}

interface TabContentProps {
  activeTab: HubTab;
}

export function TabContent({ activeTab }: TabContentProps) {
  const { comparisonMode, secondaryTab, setSecondaryTab } = useHubStore();

  const renderTab = (tab: HubTab | null) => {
    switch (tab) {
      case 'analytics': return <AnalyticsTab />;
      case 'flow': return <FlowTab />;
      case 'lab': return <LabTab />;
      case 'nexus': return <NexusTab />;
      case 'satellite': return <SatelliteTab />;
      default: return null;
    }
  };

  const TABS: {id: HubTab, label: string}[] = [
    { id: 'analytics', label: 'Analytics' },
    { id: 'flow', label: 'Flow' },
    { id: 'lab', label: 'Lab' },
    { id: 'nexus', label: 'Nexus' },
    { id: 'satellite', label: 'Satellite' },
  ];

  if (comparisonMode) {
    return (
      <div className="flex h-full gap-1 p-1 bg-slate-950/50">
        {/* Left Pane (Primary) */}
        <div className="flex-1 border border-white/5 rounded-2xl overflow-hidden flex flex-col bg-[#020617]">
           <div className="h-8 bg-slate-900/50 border-b border-white/5 flex items-center px-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Primary View</span>
           </div>
           <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
              <Suspense fallback={<TabLoading label={activeTab} />}>
                {renderTab(activeTab)}
              </Suspense>
           </div>
        </div>

        {/* Right Pane (Secondary) */}
        <div className="flex-1 border border-white/5 rounded-2xl overflow-hidden flex flex-col bg-[#020617]">
          <div className="h-10 bg-slate-900/50 border-b border-white/5 flex items-center justify-between px-4">
             <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
                <Columns className="w-3 h-3" />
                Comparison
             </span>
             
             {/* Secondary Tab Selector */}
             <div className="relative group">
                <button className="flex items-center gap-2 text-xs font-bold text-white bg-white/5 hover:bg-white/10 px-3 py-1 rounded-lg transition-colors">
                   <span>{TABS.find(t => t.id === secondaryTab)?.label || 'Select View'}</span>
                   <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                
                <div className="absolute right-0 top-full mt-2 w-40 bg-slate-900 border border-white/10 rounded-xl shadow-xl overflow-hidden hidden group-hover:block z-50">
                   {TABS.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setSecondaryTab(t.id)}
                        className={`w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider hover:bg-white/5 transition-colors ${secondaryTab === t.id ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400'}`}
                      >
                         {t.label}
                      </button>
                   ))}
                </div>
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
             <Suspense fallback={<TabLoading label={secondaryTab || 'Secondary'} />}>
                {secondaryTab ? renderTab(secondaryTab) : (
                  <div className="flex items-center justify-center h-full text-slate-500 text-xs uppercase font-black tracking-widest">
                     Select a view to compare
                  </div>
                )}
             </Suspense>
          </div>
        </div>
      </div>
    );
  }

  // Single View
  return (
    <Suspense fallback={<TabLoading label={activeTab} />}>
      <div className="h-full overflow-y-auto">
        {renderTab(activeTab)}
      </div>
    </Suspense>
  );
}
