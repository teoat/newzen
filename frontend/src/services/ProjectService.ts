import { API_URL } from '@/utils/constants';
import { Project } from '@/store/useProject';

export const ProjectService = {
    async fetchProjects(): Promise<Project[]> {
        const res = await fetch(`${API_URL}/api/v1/project/`);
        if (!res.ok) throw new Error('Failed to fetch projects');
        return res.json();
    }
};
