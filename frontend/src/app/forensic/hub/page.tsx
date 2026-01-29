'use client';

import React, { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers } from 'lucide-react';

import ForensicPageLayout from '@/app/components/ForensicPageLayout';
import { useProject } from '@/store/useProject';
import { HubTab, useHubStore } from '@/store/useHubStore';
import { HubTabs } from './components/HubTabs';
import { CrossToolInsights } from './components/CrossToolInsights';
import { TabContent } from './components/TabContent';
import HolographicProjection from '@/app/components/HolographicProjection';

const ForensicHubContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeProjectId } = useProject();
  const { activeTab, setActiveTab, focusMode, comparisonMode, secondaryTab } = useHubStore();

  // Sync URL with active tab
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && tabParam !== activeTab) {
      const validTabs = ['analytics', 'flow', 'lab', 'nexus', 'satellite'];
      if (validTabs.includes(tabParam)) {
        setActiveTab(tabParam as HubTab);
      }
    }
  }, [searchParams, activeTab, setActiveTab]);

  // Update URL when tab changes
  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (currentTab !== activeTab) {
      router.push(`/forensic/hub?tab=${activeTab}`, { scroll: false });
    }
  }, [activeTab, router, searchParams]);

  // Keyboard Shortcuts (Cmd+1-5)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd (Meta) on Mac
      if (e.metaKey && !e.shiftKey && !e.altKey) {
        const tabs: HubTab[] = ['analytics', 'flow', 'lab', 'nexus', 'satellite'];
        const key = parseInt(e.key);
        
        if (key >= 1 && key <= 5) {
          e.preventDefault();
          setActiveTab(tabs[key - 1]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTab]);

  if (!activeProjectId) {
    return (
      <ForensicPageLayout
        title="Forensic Hub"
        subtitle="Unified Investigation Workspace"
        icon={Layers}
      >
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <HolographicProjection 
            title="NO_PROJECT_MOUNTED"
            subtitle="Select a target project to initiate forensic stream"
            type="cube"
          />
        </div>
      </ForensicPageLayout>
    );
  }

  return (
    <ForensicPageLayout
      title="Forensic Hub"
      subtitle="Unified Investigation Workspace"
      icon={Layers}
      headerActions={
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 rounded-xl bg-slate-900/50 border border-white/10">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Project</span>
            <p className="text-sm font-bold text-white">{activeProjectId}</p>
          </div>
        </div>
      }
    >
      <div className="flex flex-col h-full">
        {/* Tab Navigation */}
        <HubTabs />

        {/* Cross-Tool Insights Bar */}
        <CrossToolInsights />

        {/* Tab Content with Animation */}
        {/* Tab Content with Animation */}
        <div className="flex-1 min-h-0 flex relative overflow-hidden">
             {/* Primary Pane */}
             <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: focusMode ? 0 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: focusMode ? 0 : -20 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className={`${comparisonMode ? 'w-1/2 border-r border-white/10' : 'w-full'} h-full overflow-hidden transition-[width] duration-300`}
                >
                  <TabContent activeTab={activeTab} />
                </motion.div>
             </AnimatePresence>

             {/* Secondary Pane (Split View) */}
             <AnimatePresence>
                {comparisonMode && (
                     <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: '50%', opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="h-full overflow-hidden bg-slate-900/20 relative"
                     >
                         {/* Secondary Tab Label overlay */}
                         <div className="absolute top-4 right-6 z-10 px-3 py-1 bg-black/60 backdrop-blur rounded-full border border-white/10 text-[10px] font-black uppercase text-slate-400 pointer-events-none">
                             Comparison: {secondaryTab || 'Nexus'}
                         </div>
                         <TabContent activeTab={secondaryTab || 'nexus'} />
                     </motion.div>
                )}
             </AnimatePresence>
        </div>
      </div>
    </ForensicPageLayout>
  );
};

export default function ForensicHubPage() {
  return (
    <React.Suspense fallback={<div className="flex items-center justify-center h-screen bg-slate-950 text-slate-500">Loading Hub...</div>}>
      <ForensicHubContent />
    </React.Suspense>
  );
}
