/**
 * Forensic Simulation Store
 * Manages the "What-If" sandbox state across the application
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ForensicScenarioEngine } from '../services/ForensicScenarioEngine';
import { type SimulationResult, type SimulationExclusionRequest } from '../schemas/forensic';
import { secureStorage } from '../lib/crypto';
import { audioService } from '../lib/audioService';

export interface SimulationSession {
  id: string;
  projectId: string;
  scenarioName: string;
  exclusions: SimulationExclusionRequest;
  result: SimulationResult | null;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  notes?: string;
}

interface SimulationState {
  // Current active simulation
  activeSimulation: SimulationSession | null;
  
  // History of simulations (non-persistent for security)
  simulationHistory: SimulationSession[];
  
  // UI state
  isSimulationMode: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  startSimulation: (projectId: string, scenarioName?: string) => string;
  endSimulation: () => void;
  
  // Exclusion management
  excludeTransaction: (txId: string) => void;
  includeTransaction: (txId: string) => void;
  excludeEntity: (entityId: string) => void;
  includeEntity: (entityId: string) => void;
  mergeEntities: (sourceId: string, targetId: string) => void;
  unmergeEntities: (sourceId: string) => void;
  
  // Simulation execution
  runSimulation: () => Promise<void>;
  
  // History management
  addToHistory: (simulation: SimulationSession) => void;
  clearHistory: () => void;
  
  // State management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Utility
  getExcludedTransactions: () => string[];
  getExcludedEntities: () => string[];
  getMergedEntities: () => Array<{source_id: string, target_id: string}>;
  isTransactionExcluded: (txId: string) => boolean;
  isEntityExcluded: (entityId: string) => boolean;
}

export const useSimulationStore = create<SimulationState>()(
  persist(
    (set, get) => ({
      activeSimulation: null,
      simulationHistory: [],
      isSimulationMode: false,
      isLoading: false,
      error: null,

      startSimulation: (projectId: string, scenarioName = 'Custom Scenario') => {
        const simulationId = `sim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date();
        
        const newSimulation: SimulationSession = {
          id: simulationId,
          projectId,
          scenarioName,
          exclusions: {
            transaction_ids: [],
            entity_ids: [],
            merged_entities: []
          },
          result: null,
          createdAt: now,
          updatedAt: now,
          isActive: true
        };

        void audioService.playClick();
        
        set((state) => ({
          activeSimulation: newSimulation,
          isSimulationMode: true,
          simulationHistory: [...state.simulationHistory, newSimulation],
          error: null
        }));

        return simulationId;
      },

      endSimulation: () => {
        const { activeSimulation } = get();
        if (activeSimulation) {
          // Clear sessionStorage
          ForensicScenarioEngine.clearSimulationState(activeSimulation.projectId);
        }

        void audioService.playClick();
        
        set({
          activeSimulation: null,
          isSimulationMode: false,
          error: null
        });
      },

      excludeTransaction: (txId: string) => {
        const { activeSimulation } = get();
        if (!activeSimulation) return;

        void audioService.playClick();

        set((state) => {
          if (!state.activeSimulation) return state;

          const updatedExclusions = {
            ...state.activeSimulation.exclusions,
            transaction_ids: [...new Set([...state.activeSimulation.exclusions.transaction_ids, txId])]
          };

          const updatedSimulation = {
            ...state.activeSimulation,
            exclusions: updatedExclusions,
            updatedAt: new Date()
          };

          return {
            activeSimulation: updatedSimulation,
            simulationHistory: state.simulationHistory.map(sim => 
              sim.id === updatedSimulation.id ? updatedSimulation : sim
            )
          };
        });
      },

      includeTransaction: (txId: string) => {
        const { activeSimulation } = get();
        if (!activeSimulation) return;

        void audioService.playClick();

        set((state) => {
          if (!state.activeSimulation) return state;

          const updatedExclusions = {
            ...state.activeSimulation.exclusions,
            transaction_ids: state.activeSimulation.exclusions.transaction_ids.filter(id => id !== txId)
          };

          const updatedSimulation = {
            ...state.activeSimulation,
            exclusions: updatedExclusions,
            updatedAt: new Date()
          };

          return {
            activeSimulation: updatedSimulation,
            simulationHistory: state.simulationHistory.map(sim => 
              sim.id === updatedSimulation.id ? updatedSimulation : sim
            )
          };
        });
      },

      excludeEntity: (entityId: string) => {
        const { activeSimulation } = get();
        if (!activeSimulation) return;

        void audioService.playClick();

        set((state) => {
          if (!state.activeSimulation) return state;

          const updatedExclusions = {
            ...state.activeSimulation.exclusions,
            entity_ids: [...new Set([...state.activeSimulation.exclusions.entity_ids, entityId])]
          };

          const updatedSimulation = {
            ...state.activeSimulation,
            exclusions: updatedExclusions,
            updatedAt: new Date()
          };

          return {
            activeSimulation: updatedSimulation,
            simulationHistory: state.simulationHistory.map(sim => 
              sim.id === updatedSimulation.id ? updatedSimulation : sim
            )
          };
        });
      },

      includeEntity: (entityId: string) => {
        const { activeSimulation } = get();
        if (!activeSimulation) return;

        void audioService.playClick();

        set((state) => {
          if (!state.activeSimulation) return state;

          const updatedExclusions = {
            ...state.activeSimulation.exclusions,
            entity_ids: state.activeSimulation.exclusions.entity_ids.filter(id => id !== entityId)
          };

          const updatedSimulation = {
            ...state.activeSimulation,
            exclusions: updatedExclusions,
            updatedAt: new Date()
          };

          return {
            activeSimulation: updatedSimulation,
            simulationHistory: state.simulationHistory.map(sim => 
              sim.id === updatedSimulation.id ? updatedSimulation : sim
            )
          };
        });
      },

      mergeEntities: (sourceId: string, targetId: string) => {
        const { activeSimulation } = get();
        if (!activeSimulation) return;

        void audioService.playClick();

        set((state) => {
          if (!state.activeSimulation) return state;

          const existingMerges = state.activeSimulation.exclusions.merged_entities;
          
          // Remove any existing merge for this source entity
          const filteredMerges = existingMerges.filter(merge => merge.source_id !== sourceId);
          
          // Add new merge
          const updatedMerges = [...filteredMerges, { source_id: sourceId, target_id: targetId }];

          const updatedExclusions = {
            ...state.activeSimulation.exclusions,
            merged_entities: updatedMerges
          };

          const updatedSimulation = {
            ...state.activeSimulation,
            exclusions: updatedExclusions,
            updatedAt: new Date()
          };

          return {
            activeSimulation: updatedSimulation,
            simulationHistory: state.simulationHistory.map(sim => 
              sim.id === updatedSimulation.id ? updatedSimulation : sim
            )
          };
        });
      },

      unmergeEntities: (sourceId: string) => {
        const { activeSimulation } = get();
        if (!activeSimulation) return;

        void audioService.playClick();

        set((state) => {
          if (!state.activeSimulation) return state;

          const updatedMerges = state.activeSimulation.exclusions.merged_entities.filter(
            merge => merge.source_id !== sourceId
          );

          const updatedExclusions = {
            ...state.activeSimulation.exclusions,
            merged_entities: updatedMerges
          };

          const updatedSimulation = {
            ...state.activeSimulation,
            exclusions: updatedExclusions,
            updatedAt: new Date()
          };

          return {
            activeSimulation: updatedSimulation,
            simulationHistory: state.simulationHistory.map(sim => 
              sim.id === updatedSimulation.id ? updatedSimulation : sim
            )
          };
        });
      },

      runSimulation: async () => {
        const { activeSimulation } = get();
        if (!activeSimulation) return;

        try {
          get().setLoading(true);
          get().clearError();

          const result = await ForensicScenarioEngine.calculateSimulationDelta(
            activeSimulation.projectId,
            activeSimulation.exclusions
          );

          void audioService.playSuccess();

          set((state) => {
            if (!state.activeSimulation) return state;

            const updatedSimulation = {
              ...state.activeSimulation,
              result,
              updatedAt: new Date()
            };

            // Store in sessionStorage (non-persistent)
            ForensicScenarioEngine.storeSimulationState(
              updatedSimulation.projectId,
              {
                exclusions: updatedSimulation.exclusions,
                result,
                timestamp: Date.now()
              }
            );

            return {
              activeSimulation: updatedSimulation,
              simulationHistory: state.simulationHistory.map(sim => 
                sim.id === updatedSimulation.id ? updatedSimulation : sim
              )
            };
          });

        } catch (error) {
          console.error('Simulation failed:', error);
          void audioService.playError();
          get().setError(error instanceof Error ? error.message : 'Simulation failed');
        } finally {
          get().setLoading(false);
        }
      },

      addToHistory: (simulation: SimulationSession) => {
        set((state) => ({
          simulationHistory: [...state.simulationHistory, simulation]
        }));
      },

      clearHistory: () => {
        set({ simulationHistory: [] });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      // Utility functions
      getExcludedTransactions: () => {
        return get().activeSimulation?.exclusions.transaction_ids || [];
      },

      getExcludedEntities: () => {
        return get().activeSimulation?.exclusions.entity_ids || [];
      },

      getMergedEntities: () => {
        return get().activeSimulation?.exclusions.merged_entities || [];
      },

      isTransactionExcluded: (txId: string) => {
        return get().activeSimulation?.exclusions.transaction_ids.includes(txId) || false;
      },

      isEntityExcluded: (entityId: string) => {
        return get().activeSimulation?.exclusions.entity_ids.includes(entityId) || false;
      }
    }),
    {
      name: 'forensic-simulation-storage',
      storage: createJSONStorage(() => secureStorage as any),
      // Only persist UI state, not actual simulation data (for security)
      partialize: (state) => ({
        isSimulationMode: state.isSimulationMode,
        // Don't persist activeSimulation or simulationHistory for security
        simulationHistory: [],
        activeSimulation: null
      }),
      onRehydrateStorage: () => (state) => {
        // Clear any persisted simulation data on load for security
        if (state) {
          state.activeSimulation = null;
          state.simulationHistory = [];
          state.isSimulationMode = false;
        }
      }
    }
  )
);