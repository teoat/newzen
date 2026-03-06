import { z } from 'zod';
import { ApiClient } from '../lib/apiClient';

/**
 * Structural Anomaly Schema
 */
export const StructuralAnomalySchema = z.object({
  id: z.string(),
  component: z.string(),
  description: z.string(),
  material_variance: z.number(),
  financial_delta: z.number(),
  risk_level: z.enum(['CRITICAL', 'WARNING', 'INFO']),
  coords: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

export const StructuralVerifyResponseSchema = z.object({
  projectId: z.string(),
  anomalies: z.array(StructuralAnomalySchema),
  compliance_score: z.number(),
});

export type StructuralVerifyResponse = z.infer<typeof StructuralVerifyResponseSchema>;

/**
 * ArchitectService
 * Handles spatial fraud detection and structural-ledger correlation
 */
export class ArchitectService {
  /**
   * Performs spatial verification of physical progress vs financial ledger
   */
  static async verifySpatialIntegrity(projectId: string): Promise<StructuralVerifyResponse> {
    return ApiClient.request(
      StructuralVerifyResponseSchema,
      `/api/v2/forensic-v2/architect/spatial-verify/${projectId}`
    );
  }

  /**
   * Triggers a new LIDAR/Satellite scan correlation job
   */
  static async triggerSpatialScan(projectId: string): Promise<{ job_id: string }> {
    return ApiClient.request(
      z.object({ job_id: z.string() }),
      `/api/v2/forensic-v2/architect/scan/${projectId}`,
      { method: 'POST' }
    );
  }
}
