import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type HubTab = 'analytics' | 'flow' | 'lab' | 'nexus' | 'satellite';

interface HubState {
  // Active tab
  activeTab: HubTab;
  setActiveTab: (tab: HubTab) => void;
  
  // Focus mode
  focusMode: boolean;
  toggleFocusMode: () => void;
  
  // Comparison Mode
  comparisonMode: boolean;
  toggleComparisonMode: () => void;
  secondaryTab: HubTab | null;
  setSecondaryTab: (tab: HubTab | null) => void;

  // Shared investigation context
  selectedEntity: string | null;
  setSelectedEntity: (id: string | null) => void;
  
  selectedMilestone: string | null;
  setSelectedMilestone: (id: string | null) => void;
  
  selectedHotspot: string | null;
  setSelectedHotspot: (id: string | null) => void;

  selectedTransaction: string | null;
  setSelectedTransaction: (id: string | null) => void;
  
  // Evidence flags
  evidenceFlags: Record<string, boolean>;
  setEvidenceFlag: (id: string, flagged: boolean) => void;
  
  // Cross-tool navigation
  navigateToTab: (tab: HubTab, context?: {
    entityId?: string;
    milestoneId?: string;
    hotspotId?: string;
    transactionId?: string;
  }) => void;
  
  // Tab History
  tabHistory: HubTab[];
  
  // Reset context
  clearContext: () => void;
}

export const useHubStore = create<HubState>()(
  persist(
    (set) => ({
      // Initial state
      activeTab: 'analytics',
      focusMode: false,
      comparisonMode: false,
      secondaryTab: null,
      selectedEntity: null,
      selectedMilestone: null,
      selectedHotspot: null,
      selectedTransaction: null,
      evidenceFlags: {},
      tabHistory: ['analytics'],
      
      // Actions
      setActiveTab: (tab) => set((state) => ({ 
        activeTab: tab,
        tabHistory: [tab, ...state.tabHistory.filter(t => t !== tab)].slice(0, 5) as HubTab[]
      })),
      
      toggleFocusMode: () => set((state) => ({ focusMode: !state.focusMode })),
      
      toggleComparisonMode: () => set((state) => ({ 
        comparisonMode: !state.comparisonMode,
        secondaryTab: !state.comparisonMode && !state.secondaryTab ? 'nexus' : state.secondaryTab
      })),
      
      setSecondaryTab: (tab) => set({ secondaryTab: tab }),
      
      setSelectedEntity: (id) => set({ 
        selectedEntity: id,
        activeTab: id ? 'nexus' : 'analytics' 
      }),
      
      setSelectedMilestone: (id) => set({ selectedMilestone: id }),
      
      setSelectedHotspot: (id) => set({ 
        selectedHotspot: id,
        activeTab: id ? 'satellite' : 'flow'
      }),

      setSelectedTransaction: (id) => set({ 
        selectedTransaction: id 
      }),
      
      setEvidenceFlag: (id, flagged) =>
        set((state) => ({
          evidenceFlags: { ...state.evidenceFlags, [id]: flagged }
        })),
      
      navigateToTab: (tab, context = {}) =>
        set((state) => ({
          activeTab: tab,
          tabHistory: [tab, ...state.tabHistory.filter(t => t !== tab)].slice(0, 5) as HubTab[],
          selectedEntity: context.entityId || null,
          selectedMilestone: context.milestoneId || null,
          selectedHotspot: context.hotspotId || null,
          selectedTransaction: context.transactionId || null
        })),
      
      clearContext: () =>
        set({
          selectedEntity: null,
          selectedMilestone: null,
          selectedHotspot: null,
          selectedTransaction: null
        }),
    }),
    {
      name: 'forensic-hub-storage',
      partialize: (state) => ({
        activeTab: state.activeTab,
        focusMode: state.focusMode,
        tabHistory: state.tabHistory,
        selectedEntity: state.selectedEntity,
        selectedTransaction: state.selectedTransaction,
        selectedHotspot: state.selectedHotspot,
        comparisonMode: state.comparisonMode,
        secondaryTab: state.secondaryTab
      })
    }
  )
);
