import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { secureStorage } from '../lib/crypto';

/**
 * Hub tab types for forensic analysis views
 */
export type HubTab = 'analytics' | 'flow' | 'lab' | 'nexus' | 'satellite' | 'architect';

/**
 * HubState interface for the hub store
 */
interface HubState {
  // Active tab
  activeTab: HubTab;
  /** Set the active tab */
  setActiveTab: (tab: HubTab) => void;
  
  // Focus mode
  focusMode: boolean;
  /** Toggle focus mode on/off */
  toggleFocusMode: () => void;
  
  // Comparison Mode
  comparisonMode: boolean;
  /** Toggle comparison mode */
  toggleComparisonMode: () => void;
  secondaryTab: HubTab | null;
  /** Set secondary tab for comparison */
  setSecondaryTab: (tab: HubTab | null) => void;

  // Shared investigation context
  selectedEntity: string | null;
  /** Set selected entity ID */
  setSelectedEntity: (id: string | null) => void;
  
  selectedMilestone: string | null;
  /** Set selected milestone ID */
  setSelectedMilestone: (id: string | null) => void;
  
  selectedHotspot: string | null;
  /** Set selected hotspot ID */
  setSelectedHotspot: (id: string | null) => void;

  selectedTransaction: string | null;
  /** Set selected transaction ID */
  setSelectedTransaction: (id: string | null) => void;
  
  // Evidence flags
  evidenceFlags: Record<string, boolean>;
  /** Set evidence flag status */
  setEvidenceFlag: (id: string, flagged: boolean) => void;
  
  // Cross-tool navigation
  /** Navigate to a tab with optional context */
  navigateToTab: (tab: HubTab, context?: {
    entityId?: string;
    milestoneId?: string;
    hotspotId?: string;
    transactionId?: string;
  }) => void;
  
  // Tab History
  tabHistory: HubTab[];
  
  // Reset context
  /** Clear all selected context */
  clearContext: () => void;
}

/**
 * useHubStore - Zustand store for managing forensic hub state
 * Handles tab navigation, focus mode, comparison mode, and investigation context
 * 
 * @example
 * ```tsx
 * const { activeTab, setActiveTab, focusMode, toggleFocusMode } = useHubStore()
 * 
 * // Switch tabs
 * setActiveTab('nexus')
 * 
 * // Toggle focus mode
 * toggleFocusMode()
 * ```
 */
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
      }),
      storage: createJSONStorage(() => secureStorage as any)
    }
  )
);
