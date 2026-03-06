import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { ProjectService } from '../services/ProjectService';
import type { Project } from '../schemas';
import { secureStorage } from '../lib/crypto';

/**
 * ProjectState interface for the project store
 */
interface ProjectState {
    activeProjectId: string | null;
    activeProject: Project | null;
    projects: Project[];
    isLoading: boolean;
    preferredCurrency: 'IDR' | 'USD';
    budgetForecast: any | null;
    
    /** Sets the active project by ID */
    setActiveProject: (projectId: string | null) => void;
    /** Sets preferred currency */
    setPreferredCurrency: (currency: 'IDR' | 'USD') => void;
    /** Fetches all projects from the API */
    fetchProjects: () => Promise<void>;
    /** Fetches budget forecast for active project */
    fetchBudgetForecast: () => Promise<void>;
    /** Forensic Purge: Clears all cached state for security */
    purgeState: () => void;
}

/**
 * useProject - Zustand store for managing project state
 * Handles project selection, fetching, and persistence
 */
export const useProject = create<ProjectState>()(
    persist(
        (set, get) => ({
            activeProjectId: null,
            activeProject: null,
            projects: [],
            isLoading: false,
            preferredCurrency: 'IDR',
            budgetForecast: null,
            
            setPreferredCurrency: (currency) => set({ preferredCurrency: currency }),

            setActiveProject: (projectId) => {
                const project = get().projects.find(p => p.id === projectId) || null;
                set({ activeProjectId: projectId, activeProject: project, budgetForecast: null });
                if (projectId) {
                    get().fetchBudgetForecast();
                }
            },

            purgeState: () => {
                set({ activeProjectId: null, activeProject: null, projects: [], preferredCurrency: 'IDR', budgetForecast: null });
                localStorage.removeItem('zenith-project-storage');
            },

            fetchBudgetForecast: async () => {
                const projectId = get().activeProjectId;
                if (!projectId) return;
                
                try {
                    const forecast = await ProjectService.getBudgetForecast(projectId);
                    set({ budgetForecast: forecast });
                } catch (err) {
                    console.error("Failed to fetch budget forecast", err);
                }
            },

            fetchProjects: async () => {
                set({ isLoading: true });
                try {
                    const projects = await ProjectService.fetchProjects();
                    set({ projects });
                    
                    if (get().activeProjectId) {
                        const current = projects.find((p) => p.id === get().activeProjectId);
                        if (current) set({ activeProject: current });
                    }
                } catch (err) {
                    console.error("Failed to fetch projects", err);
                } finally {
                    set({ isLoading: false });
                }
            }
        }),
        {
            name: 'zenith-project-storage',
            storage: createJSONStorage(() => secureStorage as any),
        }
    )
);

export type { Project } from '../schemas';
