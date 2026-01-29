import { API_URL } from '@/utils/constants';

export const ForensicService = {
    async fetchThreats(projectId: string) {
        const res = await fetch(`${API_URL}/api/v1/forensic/threats/${projectId}`);
        if (!res.ok) throw new Error('Failed to fetch threats');
        return res.json();
    },

    async fetchGlobalStats(projectId: string) {
        const res = await fetch(`${API_URL}/api/v1/forensic/global-stats/${projectId}`);
        if (!res.ok) throw new Error('Failed to fetch global stats');
        return res.json();
    },

    async exportCourtDossier(projectId: string) {
        const res = await fetch(`${API_URL}/api/v1/forensic/export/court-dossier?project_id=${projectId}`);
        if (!res.ok) throw new Error('Failed to export dossier');
        return res;
    }
};
