import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Hub Selection Store
 * Manages selected entities, milestones, hotspots, and evidence
 */

interface HubSelectionState {
  // Selected Items
  selectedEntity?: string;
  selectedMilestone?: string;
  selectedHotspot?: string;
  selectedTransaction?: string;
  evidenceFlags: Set<string>;

  // Actions
  selectEntity: (id: string) => void;
  selectMilestone: (id: string) => void;
  selectHotspot: (id: string) => void;
  selectTransaction: (id: string) => void;
  toggleEvidenceFlag: (id: string) => void;
  clearSelection: () => void;
  clearEvidenceFlags: () => void;
}

export const useHubSelection = create<HubSelectionState>()(
  persist(
    (set) => ({
      // Initial State
      selectedEntity: undefined,
      selectedMilestone: undefined,
      selectedHotspot: undefined,
      selectedTransaction: undefined,
      evidenceFlags: new Set(),

      // Actions
      selectEntity: (id) =>
        set((state) => ({
          selectedEntity: id,
          // Clear other single selections when entity is selected
          selectedMilestone: undefined,
          selectedHotspot: undefined,
          selectedTransaction: undefined,
        })),

      selectMilestone: (id) =>
        set((state) => ({
          selectedMilestone: id,
          // Clear other single selections when milestone is selected
          selectedEntity: undefined,
          selectedHotspot: undefined,
          selectedTransaction: undefined,
        })),

      selectHotspot: (id) =>
        set((state) => ({
          selectedHotspot: id,
          // Clear other single selections when hotspot is selected
          selectedEntity: undefined,
          selectedMilestone: undefined,
          selectedTransaction: undefined,
        })),

      selectTransaction: (id) =>
        set((state) => ({
          selectedTransaction: id,
          // Clear other single selections when transaction is selected
          selectedEntity: undefined,
          selectedMilestone: undefined,
          selectedHotspot: undefined,
        })),

      toggleEvidenceFlag: (id) =>
        set((state) => {
          const newFlags = new Set(state.evidenceFlags);
          if (newFlags.has(id)) {
            newFlags.delete(id);
          } else {
            newFlags.add(id);
          }
          return { evidenceFlags: newFlags };
        }),

      clearSelection: () =>
        set({
          selectedEntity: undefined,
          selectedMilestone: undefined,
          selectedHotspot: undefined,
          selectedTransaction: undefined,
        }),

      clearEvidenceFlags: () => set({ evidenceFlags: new Set() }),
    }),
    {
      name: 'hub-selection-storage',
      partialize: (state) => ({
        evidenceFlags: Array.from(state.evidenceFlags),
      }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        evidenceFlags: new Set(persistedState.evidenceFlags || []),
      }),
    },
  ),
);
