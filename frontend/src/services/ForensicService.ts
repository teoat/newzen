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

    async exportCourtDossier(projectId: string): Promise<Blob> {
        // Dossier export returns a binary PDF response
        const response = await ApiClient.request(z.any(), `/api/v1/forensic/export/court-dossier?project_id=${projectId}`, {
            headers: { 'Accept': 'application/pdf' }
        });
        return (response as unknown as Response).blob();
    },

    async fetchTransactions(projectId: string, sourceType?: 'INTERNAL_LEDGER' | 'BANK_STATEMENT') {
        const query = sourceType ? `?source_type=${sourceType}` : '';
        return ApiClient.get(z.array(z.any()), `/api/v1/project/${projectId}/transactions${query}`);
    }
};
