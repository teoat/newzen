import { z } from 'zod';

// ========================================
// FORENSIC SIMULATION SCHEMAS
// ========================================

/**
 * Simulation Exclusion Request Schema
 */
export const SimulationExclusionRequestSchema = z.object({
  transaction_ids: z.array(z.string()).default([]),
  entity_ids: z.array(z.string()).default([]),
  merged_entities: z.array(z.object({
    source_id: z.string(),
    target_id: z.string()
  })).default([])
});

export type SimulationExclusionRequest = z.infer<typeof SimulationExclusionRequestSchema>;

/**
 * Simulation Delta Schema
 */
export const SimulationDeltaSchema = z.object({
  current_leakage: z.number(),
  simulated_leakage: z.number(),
  leakage_delta: z.number(),
  current_risk_score: z.number(),
  simulated_risk_score: z.number(),
  risk_delta: z.number(),
  financial_impact: z.number(),
  excluded_transactions_count: z.number(),
  merged_entities_count: z.number()
});

export type SimulationDelta = z.infer<typeof SimulationDeltaSchema>;

/**
 * Simulation Result Schema
 */
export const SimulationResultSchema = z.object({
  status: z.string(),
  project_id: z.string(),
  simulation_id: z.string(),
  delta: SimulationDeltaSchema,
  summary: z.object({
    leakage_change: z.string(),
    risk_change: z.string(),
    financial_impact: z.string(),
    impact_level: z.enum(['LOW', 'MEDIUM', 'HIGH'])
  })
});

export type SimulationResult = z.infer<typeof SimulationResultSchema>;

/**
 * Project Entity Schema
 */
export const ProjectEntitySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  transaction_count: z.number(),
  total_amount: z.number(),
  average_risk: z.number(),
  tax_id: z.string().optional()
});

export type ProjectEntity = z.infer<typeof ProjectEntitySchema>;

/**
 * Project Transaction Schema
 */
export const ProjectTransactionSchema = z.object({
  id: z.string(),
  description: z.string(),
  amount: z.number(),
  sender: z.string(),
  receiver: z.string(),
  risk_score: z.number(),
  status: z.string(),
  delta_inflation: z.number()
});

export type ProjectTransaction = z.infer<typeof ProjectTransactionSchema>;

/**
 * Available Entities Response Schema
 */
export const AvailableEntitiesResponseSchema = z.object({
  status: z.string(),
  project_id: z.string(),
  transactions: z.array(ProjectTransactionSchema),
  entities: z.array(ProjectEntitySchema),
  summary: z.object({
    total_transactions: z.number(),
    total_entities: z.number(),
    total_value: z.number()
  })
});

export type AvailableEntitiesResponse = z.infer<typeof AvailableEntitiesResponseSchema>;

/**
 * Baseline Metrics Schema
 */
export const BaselineMetricsSchema = z.object({
  leakage_probability: z.number(),
  risk_score: z.number(),
  total_amount: z.number(),
  leakage_amount: z.number()
});

export type BaselineMetrics = z.infer<typeof BaselineMetricsSchema>;

/**
 * Baseline Response Schema
 */
export const BaselineResponseSchema = z.object({
  status: z.string(),
  project_id: z.string(),
  baseline_metrics: BaselineMetricsSchema,
  interpretation: z.object({
    leakage_level: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    risk_level: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  })
});

export type BaselineResponse = z.infer<typeof BaselineResponseSchema>;

/**
 * Simulation Exclusion Schema
 */
export const SimulationExclusionSchema = z.object({
  transaction_ids: z.array(z.string().uuid()).optional(),
  date_range: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }).optional(),
  amount_threshold: z.number().positive().optional(),
  counterparty_ids: z.array(z.string().uuid()).optional(),
});

export type SimulationExclusion = z.infer<typeof SimulationExclusionSchema>;

/**
 * What-If Scenario Schema
 */
export const WhatIfScenarioSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  exclusions: SimulationExclusionSchema.optional()
});

export type WhatIfScenario = z.infer<typeof WhatIfScenarioSchema>;

/**
 * Scenarios Response Schema
 */
export const ScenariosResponseSchema = z.object({
  status: z.string(),
  project_id: z.string(),
  scenarios: z.array(WhatIfScenarioSchema),
  note: z.string()
});

export type ScenariosResponse = z.infer<typeof ScenariosResponseSchema>;
