import { z } from 'zod';
import { ApiClient } from '../lib/apiClient';

/**
 * Predictive Exposure Schema
 */
export const PredictiveExposureSchema = z.object({
  projectId: z.string(),
  currentLeakage: z.number(),
  predictedLeakage: z.number(),
  confidence: z.number(),
  highRiskSectors: z.array(z.object({
    sector: z.string(),
    probability: z.number(),
    estimatedValue: z.number(),
  })),
  trend: z.enum(['UP', 'DOWN', 'STABLE']),
  lastUpdated: z.string(),
});

export type PredictiveExposure = z.infer<typeof PredictiveExposureSchema>;

/**
 * PredictiveService
 * Handles data-driven leakage forecasting and risk prediction
 */
export class PredictiveService {
  /**
   * Fetches predicted leakage exposure for a project
   */
  static async getExposure(projectId: string): Promise<PredictiveExposure> {
    return ApiClient.request(
      PredictiveExposureSchema,
      `/api/v1/predictive/exposure?project_id=${projectId}`
    );
  }

  /**
   * Runs an ad-hoc predictive scan on the current project state
   */
  static async triggerPredictiveScan(projectId: string): Promise<{ job_id: string }> {
    return ApiClient.request(
      z.object({ job_id: z.string() }),
      `/api/v1/predictive/scan/${projectId}`,
      { method: 'POST' }
    );
  }
}
