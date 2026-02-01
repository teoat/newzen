import { ApiClient } from '../lib/apiClient';
import { 
  SwarmResponseSchema, 
  VerificationResultSchema,
  SwarmResponse,
  VerificationResult
} from '../schemas';

export const ReasoningService = {
  hypothesize: async (transactionIds: string[]): Promise<SwarmResponse> => {
    return ApiClient.post(SwarmResponseSchema, '/api/v2/reasoning/hypothesize', { 
      transaction_ids: transactionIds 
    });
  },

  verify: async (hypothesisId: string): Promise<VerificationResult> => {
    return ApiClient.post(VerificationResultSchema, `/api/v2/reasoning/verify?hypothesis_id=${hypothesisId}`);
  }
};
