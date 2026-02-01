import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ReasoningService } from '../ReasoningService';
import { ApiClient } from '../../lib/apiClient';

// Mock ApiClient
vi.mock('../../lib/apiClient', () => ({
  ApiClient: {
    post: vi.fn(),
  }
}));

describe('ReasoningService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hypothesize should call ApiClient.post with transaction IDs', async () => {
    const mockResponse = { hypotheses: [], swarm_logs: [] };
    (ApiClient.post as any).mockResolvedValue(mockResponse);

    const result = await ReasoningService.hypothesize(['tx-1', 'tx-2']);

    expect(ApiClient.post).toHaveBeenCalledWith(
      expect.anything(), 
      '/api/v2/reasoning/hypothesize', 
      { transaction_ids: ['tx-1', 'tx-2'] }
    );
    expect(result).toEqual(mockResponse);
  });

  it('verify should call ApiClient.post with hypothesis ID', async () => {
    const mockResponse = { hypothesis_id: 'h-1', status: 'VERIFIED', evidence_count: 5, summary: 'Proof' };
    (ApiClient.post as any).mockResolvedValue(mockResponse);

    const result = await ReasoningService.verify('h-1');

    expect(ApiClient.post).toHaveBeenCalledWith(
      expect.anything(), 
      '/api/v2/reasoning/verify?hypothesis_id=h-1'
    );
    expect(result).toEqual(mockResponse);
  });
});
