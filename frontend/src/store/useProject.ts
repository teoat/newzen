import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { ProjectService } from '@/services/ProjectService';

export interface Project {
    id: string;
    name: string;
    status: 'active' | 'archived' | 'pending';
    site_location?: string;
}

interface ProjectState {
    activeProjectId: string | null;
    activeProject: Project | null;
    projects: Project[];
    isLoading: boolean;
    
    // Actions
    setActiveProject: (projectId: string) => void;
    fetchProjects: () => Promise<void>;
}

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
                        const current = projects.find((p: Project) => p.id === get().activeProjectId);
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
        }
    )
);
