import { ApiClient } from '../lib/apiClient';
import {
  SimulationExclusionRequest,
  SimulationResult,
  AvailableEntitiesResponse,
  BaselineResponse,
  BaselineMetrics,
  ScenariosResponse,
  ProjectEntity,
  ProjectTransaction,
  WhatIfScenario,
  SimulationResultSchema,
  AvailableEntitiesResponseSchema,
  BaselineResponseSchema,
  ScenariosResponseSchema
} from '../schemas/forensic';

// Export types from central schema for backward compatibility if needed
export type { 
  SimulationExclusionRequest, 
  SimulationResult, 
  AvailableEntitiesResponse, 
  BaselineResponse, 
  BaselineMetrics,
  ScenariosResponse,
  ProjectEntity,
  ProjectTransaction,
  WhatIfScenario
};

/**
 * ForensicScenarioEngine Service
 * Handles "What-If" sandbox functionality for forensic analysis
 */
export class ForensicScenarioEngine {
  /**
   * Calculate the impact delta for a forensic scenario simulation
   */
  static async calculateSimulationDelta(
    projectId: string,
    exclusions: SimulationExclusionRequest
  ): Promise<SimulationResult> {
    return ApiClient.request(
      SimulationResultSchema,
      `/api/v1/simulation/${projectId}/calculate-delta`,
      {
        method: 'POST',
        body: JSON.stringify(exclusions)
      }
    );
  }

  /**
   * Get all entities and transactions available for simulation in a project
   */
  static async getAvailableEntities(projectId: string): Promise<AvailableEntitiesResponse> {
    return ApiClient.request(
      AvailableEntitiesResponseSchema,
      `/api/v1/simulation/${projectId}/available-entities`
    );
  }

  /**
   * Get current baseline metrics for a project (without any simulation)
   */
  static async getBaselineMetrics(projectId: string): Promise<BaselineResponse> {
    return ApiClient.request(
      BaselineResponseSchema,
      `/api/v1/simulation/${projectId}/baseline-metrics`
    );
  }

  /**
   * Generate pre-configured "what-if" scenarios for analysts to explore
   */
  static async generateWhatIfScenarios(projectId: string): Promise<ScenariosResponse> {
    return ApiClient.request(
      ScenariosResponseSchema,
      `/api/v1/simulation/${projectId}/what-if-scenarios`,
      {
        method: 'POST'
      }
    );
  }

  /**
   * Store simulation state in sessionStorage (non-persistent)
   */
  static storeSimulationState(projectId: string, state: {
    exclusions: SimulationExclusionRequest;
    result: SimulationResult;
    timestamp: number;
  }): void {
    try {
      const storageKey = `forensic-simulation-${projectId}`;
      sessionStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to store simulation state:', error);
    }
  }

  /**
   * Retrieve simulation state from sessionStorage
   */
  static getSimulationState(projectId: string): {
    exclusions: SimulationExclusionRequest;
    result: SimulationResult;
    timestamp: number;
  } | null {
    try {
      const storageKey = `forensic-simulation-${projectId}`;
      const stored = sessionStorage.getItem(storageKey);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      // Validate the result structure
      if (parsed && parsed.result && parsed.result.delta) {
        return parsed;
      }
      return null;
    } catch (error) {
      console.warn('Failed to retrieve simulation state:', error);
      return null;
    }
  }

  /**
   * Clear simulation state from sessionStorage
   */
  static clearSimulationState(projectId: string): void {
    try {
      const storageKey = `forensic-simulation-${projectId}`;
      sessionStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to clear simulation state:', error);
    }
  }

  /**
   * Check if simulation is active for a project
   */
  static isSimulationActive(projectId: string): boolean {
    const state = this.getSimulationState(projectId);
    return state !== null;
  }

  /**
   * Format percentage change for display
   */
  static formatPercentageChange(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${(value * 100).toFixed(2)}%`;
  }

  /**
   * Format currency amount for display
   */
  static formatCurrency(amount: number, currency: string = 'IDR'): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Get risk level color based on score
   */
  static getRiskLevelColor(score: number): string {
    if (score >= 0.8) return '#dc2626'; // red-600
    if (score >= 0.6) return '#ea580c'; // orange-600
    if (score >= 0.4) return '#f59e0b'; // amber-500
    return '#16a34a'; // green-600
  }

  /**
   * Get impact level color based on level
   */
  static getImpactLevelColor(level: 'LOW' | 'MEDIUM' | 'HIGH'): string {
    switch (level) {
      case 'HIGH': return '#dc2626'; // red-600
      case 'MEDIUM': return '#f59e0b'; // amber-500
      case 'LOW': return '#16a34a'; // green-600
      default: return '#6b7280'; // gray-500
    }
  }
}