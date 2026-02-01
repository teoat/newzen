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
    
    /** Sets the active project by ID */
    setActiveProject: (projectId: string | null) => void;
    /** Fetches all projects from the API */
    fetchProjects: () => Promise<void>;
    /** Forensic Purge: Clears all cached state for security */
    purgeState: () => void;
}

/**
 * useProject - Zustand store for managing project state
 * Handles project selection, fetching, and persistence
 * 
 * @example
 * ```tsx
 * const { projects, activeProject, fetchProjects, setActiveProject } = useProject()
 * 
 * // Fetch projects on mount
 * useEffect(() => { fetchProjects() }, [])
 * 
 * // Select a project
 * setActiveProject('project-123')
 * ```
 */
export const useProject = create<ProjectState>()(
    persist(
        (set, get) => ({
            activeProjectId: null,
            activeProject: null,
            projects: [],
            isLoading: false,

            setActiveProject: (projectId) => {
                const project = get().projects.find(p => p.id === projectId) || null;
                set({ activeProjectId: projectId, activeProject: project });
            },

            purgeState: () => {
                set({ activeProjectId: null, activeProject: null, projects: [] });
                localStorage.removeItem('zenith-project-storage');
            },

            fetchProjects: async () => {
                set({ isLoading: true });
                try {
                    const projects = await ProjectService.fetchProjects();
                    set({ projects });
                    
                    // Auto-select disabled to enforce manual selection (Forensic Protocol)
                    // if (!get().activeProjectId && projects.length > 0) {
                    //     set({ activeProjectId: projects[0].id, activeProject: projects[0] });
                    // } else
                    if (get().activeProjectId) {
                        // Refresh active project object details
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
