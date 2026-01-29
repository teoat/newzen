'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ArrowRight, PlusCircle, CheckCircle2 } from 'lucide-react';
import { useHubStore } from '@/store/useHubStore';
import { useInvestigation } from '@/store/useInvestigation';
import { useState } from 'react';

export function CrossToolInsights() {
  const { 
    selectedEntity, 
    selectedMilestone, 
    selectedHotspot,
    navigateToTab,
    activeTab 
  } = useHubStore();

  const { activeInvestigation, startInvestigation, injectEvidence } = useInvestigation();
  const [justInjected, setJustInjected] = useState<string | null>(null);

  const handleInject = (type: 'entity' | 'milestone' | 'hotspot', id: string, label: string) => {
    if (!activeInvestigation) {
        if (confirm("No active case. Start a new investigation?")) {
            startInvestigation(`Discovery: ${label}`);
        } else {
            return;
        }
    }
    
    // Check if we need to get a new ID after starting (react state update might be laggy, but for now assuming synchronous store update or user retry)
    // Ideally we'd await startInvestigation if it was async, but it returns ID synchronously.
    
    const currentInvId = useInvestigation.getState().activeInvestigation?.id;
    if (!currentInvId) return;

    injectEvidence(currentInvId, {
        id,
        type: type as 'entity' | 'transaction' | 'milestone' | 'document', // Cast to domain type
        label,
        sourceTool: 'Forensic Hub',
        timestamp: new Date().toISOString()
    });

    setJustInjected(id);
    setTimeout(() => setJustInjected(null), 2000);
  };

  // Generate cross-tool insights based on current context
  const insights: Array<{
    message: string;
    action: string;
    targetTab: 'analytics' | 'flow' | 'lab' | 'nexus' | 'satellite';
    context?: Record<string, unknown>;
  }> = [];

  // Entity selected → suggest viewing in Nexus
  if (selectedEntity && activeTab !== 'nexus') {
    insights.push({
      message: `Entity "${selectedEntity}" is selected`,
      action: 'View relationships in Nexus',
      targetTab: 'nexus',
      context: { entityId: selectedEntity }
    });
  }

  // Milestone selected → suggest viewing in Flow
  if (selectedMilestone && activeTab !== 'flow') {
    insights.push({
      message: `Milestone "${selectedMilestone}" flagged`,
      action: 'Analyze in Flow',
      targetTab: 'flow',
      context: { milestoneId: selectedMilestone }
    });
  }

  // Hotspot selected → suggest viewing in Analytics
  if (selectedHotspot && activeTab !== 'analytics') {
    insights.push({
      message: `Risk hotspot detected`,
      action: 'Review in Analytics',
      targetTab: 'analytics',
      context: { hotspotId: selectedHotspot }
    });
  }

  // Combine selection context for Injection UI
  const activeSelection = selectedEntity ? { type: 'entity', id: selectedEntity, label: selectedEntity } :
                          selectedMilestone ? { type: 'milestone', id: selectedMilestone, label: selectedMilestone } :
                          selectedHotspot ? { type: 'hotspot', id: selectedHotspot, label: 'Geo-Hotspot' } : null;


  if (insights.length === 0 && !activeSelection) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="px-6 py-3 border-b border-indigo-500/20 bg-indigo-500/5 flex justify-between items-center"
      >
        <div className="flex items-center gap-4 text-sm">
          {insights.length > 0 && <AlertCircle className="w-4 h-4 text-indigo-400 flex-shrink-0" />}
          
          <div className="flex items-center gap-6 flex-wrap">
            {insights.map((insight, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-indigo-200/70">{insight.message}</span>
                <button
                  onClick={() => navigateToTab(insight.targetTab, insight.context)}
                  className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition-colors"
                >
                  {insight.action}
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Injection Action */}
        {activeSelection && (
            <div className="flex items-center gap-3">
                 <span className="text-xs font-medium text-slate-400">
                    Active Context: <span className="text-white font-bold">{activeSelection.label}</span>
                 </span>
                 <button
                    onClick={() => handleInject(activeSelection.type as 'entity' | 'milestone' | 'hotspot', activeSelection.id, activeSelection.label)}
                    disabled={justInjected === activeSelection.id}
                    className={`
                        px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all
                        ${justInjected === activeSelection.id 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' 
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20'
                        }
                    `}
                 >
                    {justInjected === activeSelection.id ? (
                        <><CheckCircle2 className="w-3 h-3" /> Injected</>
                    ) : (
                        <><PlusCircle className="w-3 h-3" /> Push to Case</>
                    )}
                 </button>
            </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
