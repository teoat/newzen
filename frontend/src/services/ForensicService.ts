import { ApiClient } from '../lib/apiClient';
import { z } from 'zod';
import { ThreatSchema, GlobalStatsSchema } from '../schemas';

export const ForensicService = {
    async fetchThreats(projectId: string) {
        return ApiClient.get(z.array(ThreatSchema), `/api/v1/forensic/threats/${projectId}`);
    },

    async fetchGlobalStats(projectId: string) {
        return ApiClient.get(GlobalStatsSchema, `/api/v1/forensic/global-stats/${projectId}`);
    },

    async exportCourtDossier(projectId: string) {
        // Dossier export returns a binary response, so we use a permissive schema or specialized handling
        return ApiClient.request(z.any(), `/api/v1/forensic/export/court-dossier?project_id=${projectId}`, {
            headers: { 'Accept': 'application/pdf' }
        });
    }
};
