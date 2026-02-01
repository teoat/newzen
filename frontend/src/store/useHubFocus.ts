import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Hub Focus Mode Store
 * Manages focus mode for concentrated investigation
 */

interface HubFocusState {
  // State
  focusMode: boolean;
  comparisonMode: boolean;
  focusedEntity?: string;
  focusedTransaction?: string;

  // Actions
  toggleFocusMode: () => void;
  setFocusMode: (enabled: boolean) => void;
  toggleComparisonMode: () => void;
  setComparisonMode: (enabled: boolean) => void;
  setFocusedEntity: (id?: string) => void;
  setFocusedTransaction: (id?: string) => void;
  clearFocus: () => void;
}

export const useHubFocus = create<HubFocusState>()(
  persist(
    (set) => ({
      // Initial State
      focusMode: false,
      comparisonMode: false,
      focusedEntity: undefined,
      focusedTransaction: undefined,

      // Actions
      toggleFocusMode: () => set((state) => ({ focusMode: !state.focusMode })),
      setFocusMode: (enabled) => set({ focusMode: enabled }),

      toggleComparisonMode: () =>
        set((state) => ({ comparisonMode: !state.comparisonMode })),
      setComparisonMode: (enabled) => set({ comparisonMode: enabled }),

      setFocusedEntity: (id) => set({ focusedEntity: id }),
      setFocusedTransaction: (id) => set({ focusedTransaction: id }),

      clearFocus: () =>
        set({
          focusedEntity: undefined,
          focusedTransaction: undefined,
        }),
    }),
    {
      name: 'hub-focus-storage',
    },
  ),
);
