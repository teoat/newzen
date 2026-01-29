import { API_ROUTES } from './apiRoutes';
import { IngestionHistoryItem, DiagnosticMetrics } from '../app/ingestion/types';

export const IngestionService = {
    async fetchHistory(projectId: string): Promise<IngestionHistoryItem[]> {
        const res = await fetch(API_ROUTES.INGESTION.HISTORY(projectId));
        if (!res.ok) throw new Error('Failed to fetch history');
        const data = await res.json();
        return data.ingestions;
    },

    async notarizeBatch(ingestionId: string): Promise<{ tx_hash: string }> {
        const res = await fetch(API_ROUTES.INGESTION.NOTARIZE(ingestionId), {
            method: 'POST'
        });
        if (!res.ok) throw new Error('Notarization failed');
        return res.json();
    },

    async consolidate(payload: Record<string, unknown>): Promise<{ diagnostics: DiagnosticMetrics; recordsProcessed: number; balanceCheck?: unknown; ingestionId?: string }> {
        const res = await fetch(API_ROUTES.INGESTION.CONSOLIDATE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ detail: 'Unknown forensic error' }));
            throw new Error(errorData.detail || errorData.message || res.statusText);
        }
        
        return res.json();
    },

    async validate(payload: Record<string, unknown>): Promise<{ insights: unknown[] }> {
        const res = await fetch(API_ROUTES.INGESTION.VALIDATE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Validation failed');
        return res.json();
    },

    async verifyIntegrity(hash: string): Promise<{ verified: boolean }> {
        const res = await fetch(API_ROUTES.INGESTION.VERIFY(hash));
        if (!res.ok) throw new Error('Integrity check failed');
        return res.json();
    },

    exportAuditExcel(): void {
        window.location.href = `${API_ROUTES.BASE_URL}/api/v1/forensic/export/excel`;
    }
};
