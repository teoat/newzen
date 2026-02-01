export interface LegalComplianceResult {
  entity: string;
  sanctioned: boolean;
  lists?: string[];
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  notes?: string;
}

export const LegalService = {
  screenEntity: async (projectId: string, entityName: string): Promise<LegalComplianceResult> => {
    // Call the backend legal router
    // Route: /api/v1/forensic/{project_id}/legal/screen/{entity_name}
    // Updated to match backend params
    const res = await fetch(`/api/v1/forensic/${projectId}/legal/screen/${encodeURIComponent(entityName)}`, {
       headers: { 'Content-Type': 'application/json' } 
    });
    if (!res.ok) throw new Error('Screening failed');
    return res.json();
  }
};
