import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Hub Navigation Store
 * Manages active tab and navigation history
 */

export type HubTab =
  | 'analytics'
  | 'flow'
  | 'lab'
  | 'nexus'
  | 'satellite'
  | 'timeline'
  | 'assets'
  | 'reasoning';

interface HubNavigationState {
  // State
  activeTab: HubTab;
  tabHistory: HubTab[];
  secondaryTab?: HubTab;

  // Actions
  setActiveTab: (tab: HubTab) => void;
  setSecondaryTab: (tab?: HubTab) => void;
  navigateToTab: (tab: HubTab) => void;
  goBack: () => void;
  clearHistory: () => void;
}

export const useHubNavigation = create<HubNavigationState>()(
  persist(
    (set, get) => ({
      // Initial State
      activeTab: 'analytics',
      tabHistory: ['analytics'],
      secondaryTab: undefined,

      // Actions
      setActiveTab: (tab) =>
        set((state) => ({
          activeTab: tab,
          tabHistory: [...state.tabHistory, tab],
        })),

      setSecondaryTab: (tab) => set({ secondaryTab: tab }),

      navigateToTab: (tab) => {
        const { activeTab, tabHistory } = get();
        const newHistory = [...tabHistory.slice(0, -1), tab];
        set({ activeTab: tab, tabHistory: newHistory });
      },

      goBack: () => {
        const { tabHistory } = get();
        if (tabHistory.length > 1) {
          const newHistory = tabHistory.slice(0, -1);
          set({
            activeTab: newHistory[newHistory.length - 1],
            tabHistory: newHistory,
          });
        }
      },

      clearHistory: () => set({ tabHistory: ['analytics'] }),
    }),
    {
      name: 'hub-navigation-storage',
      partialize: (state) => ({
        activeTab: state.activeTab,
        tabHistory: state.tabHistory,
      }),
    },
  ),
);
