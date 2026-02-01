import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ForensicService } from '../ForensicService';
import { ApiClient } from '../../lib/apiClient';

// Mock ApiClient
vi.mock('../../lib/apiClient', () => ({
  ApiClient: {
    get: vi.fn(),
    request: vi.fn(),
  }
}));

describe('ForensicService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchThreats should call ApiClient.get with correct parameters', async () => {
    const mockThreats = [{ id: '1', type: 'FRAUD', severity: 'HIGH', description: 'Test', risk_score: 0.9 }];
    (ApiClient.get as any).mockResolvedValue(mockThreats);

    const result = await ForensicService.fetchThreats('proj-123');

    expect(ApiClient.get).toHaveBeenCalledWith(expect.anything(), '/api/v1/forensic/threats/proj-123');
    expect(result).toEqual(mockThreats);
  });

  it('fetchGlobalStats should call ApiClient.get with correct parameters', async () => {
    const mockStats = { total_projects: 10, total_transactions: 100, high_risk_count: 5, leakage_total: 5000000 };
    (ApiClient.get as any).mockResolvedValue(mockStats);

    const result = await ForensicService.fetchGlobalStats('proj-123');

    expect(ApiClient.get).toHaveBeenCalledWith(expect.anything(), '/api/v1/forensic/global-stats/proj-123');
    expect(result).toEqual(mockStats);
  });

  it('exportCourtDossier should call ApiClient.request with correct headers', async () => {
    const mockResponse = { status: 200 };
    (ApiClient.request as any).mockResolvedValue(mockResponse);

    await ForensicService.exportCourtDossier('proj-123');

    expect(ApiClient.request).toHaveBeenCalledWith(
      expect.anything(), 
      '/api/v1/forensic/export/court-dossier?project_id=proj-123',
      { headers: { 'Accept': 'application/pdf' } }
    );
  });
});
