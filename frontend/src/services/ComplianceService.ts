import { authenticatedFetch } from '../lib/api';

export interface ComplianceFinding {
  rule: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  count: number;
  description: string;
  items: string[];
}

export interface ComplianceReport {
  project_name: string;
  compliance_score: number;
  findings: ComplianceFinding[];
}

export const ComplianceService = {
  getReport: async (projectId: string): Promise<ComplianceReport> => {
    const res = await authenticatedFetch(`/api/v1/compliance/${projectId}/report`);
    if (!res.ok) throw new Error('Failed to fetch compliance report');
    return res.json();
  },

  getAuditTrail: async (entityId: string) => {
    const res = await authenticatedFetch(`/api/v1/reconciliation/audit/${entityId}`);
    if (!res.ok) throw new Error('Failed to fetch audit trail');
    return res.json();
  }
};
