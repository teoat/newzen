/**
 * Forensic Scenario Hook
 * Integrates Forensic Scenario Engine with Predictive Leakage model
 */

import { useState, useCallback, useEffect } from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { PredictiveService } from '../services/PredictiveService';
import { ForensicScenarioEngine } from '../services/ForensicScenarioEngine';
import type { PredictiveExposure } from '../services/PredictiveService';
import type { SimulationResult } from '../services/ForensicScenarioEngine';

interface UseForensicScenarioOptions {
  projectId: string;
  autoRefresh?: boolean;
  integrateWithPredictive?: boolean;
}

interface ScenarioImpact {
  predictiveDelta: {
    currentPredictedLeakage: number;
    simulatedPredictedLeakage: number;
    deltaChange: number;
  };
  forensicDelta: SimulationResult['delta'];
  combinedRisk: {
    baseline: number;
    simulated: number;
    adjustment: number;
  };
}

export const useForensicScenario = (options: UseForensicScenarioOptions) => {
  const { projectId, autoRefresh = false, integrateWithPredictive = true } = options;
  
  const [baselinePredictive, setBaselinePredictive] = useState<PredictiveExposure | null>(null);
  const [simulatedPredictive, setSimulatedPredictive] = useState<PredictiveExposure | null>(null);
  const [combinedImpact, setCombinedImpact] = useState<ScenarioImpact | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { activeSimulation, isSimulationMode } = useSimulationStore();

  // Load baseline predictive data
  const loadBaselinePredictive = useCallback(async () => {
    if (!projectId || !integrateWithPredictive) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const predictiveData = await PredictiveService.getExposure(projectId);
      setBaselinePredictive(predictiveData);
    } catch (err) {
      console.error('Failed to load baseline predictive data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load predictive data');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, integrateWithPredictive]);

  // Calculate simulated predictive data (mock calculation)
  const calculateSimulatedPredictive = useCallback(async () => {
    if (!baselinePredictive || !activeSimulation?.result || !integrateWithPredictive) {
      return;
    }

    try {
      setIsLoading(true);
      
      // Adjust predictive exposure based on simulation impact
      const leakageAdjustment = activeSimulation.result.delta.leakage_delta;
      const riskAdjustment = activeSimulation.result.delta.risk_delta;
      
      // Apply adjustments to baseline predictions
      const adjustedPredictedLeakage = baselinePredictive.predictedLeakage * (1 + leakageAdjustment);
      const adjustedConfidence = Math.max(0.1, Math.min(1.0, 
        baselinePredictive.confidence + (riskAdjustment * 0.2))); // Adjust confidence slightly
      
      // Update high-risk sectors based on simulation
      const adjustedHighRiskSectors = baselinePredictive.highRiskSectors.map(sector => ({
        ...sector,
        probability: Math.max(0, Math.min(1, sector.probability + (riskAdjustment * sector.probability)))
      }));
      
      // Determine new trend
      let newTrend: 'UP' | 'DOWN' | 'STABLE' = baselinePredictive.trend;
      if (Math.abs(leakageAdjustment) > 0.05) {
        newTrend = leakageAdjustment > 0 ? 'UP' : 'DOWN';
      }
      
      const simulatedData: PredictiveExposure = {
        ...baselinePredictive,
        predictedLeakage: adjustedPredictedLeakage,
        confidence: adjustedConfidence,
        highRiskSectors: adjustedHighRiskSectors,
        trend: newTrend,
        lastUpdated: new Date().toISOString()
      };
      
      setSimulatedPredictive(simulatedData);
    } catch (err) {
      console.error('Failed to calculate simulated predictive data:', err);
      setError(err instanceof Error ? err.message : 'Failed to calculate simulated predictions');
    } finally {
      setIsLoading(false);
    }
  }, [baselinePredictive, activeSimulation, integrateWithPredictive]);

  // Calculate combined impact
  const calculateCombinedImpact = useCallback(() => {
    if (!baselinePredictive || !activeSimulation?.result || !simulatedPredictive) {
      return;
    }

    const impact: ScenarioImpact = {
      predictiveDelta: {
        currentPredictedLeakage: baselinePredictive.predictedLeakage,
        simulatedPredictedLeakage: simulatedPredictive.predictedLeakage,
        deltaChange: simulatedPredictive.predictedLeakage - baselinePredictive.predictedLeakage
      },
      forensicDelta: activeSimulation.result.delta,
      combinedRisk: {
        baseline: (baselinePredictive.predictedLeakage + baselinePredictive.currentLeakage) / 2,
        simulated: (simulatedPredictive.predictedLeakage + activeSimulation.result.delta.simulated_leakage * (baselinePredictive.predictedLeakage / baselinePredictive.currentLeakage)) / 2,
        adjustment: 0 // Will be calculated below
      }
    };

    // Calculate risk adjustment
    impact.combinedRisk.adjustment = impact.combinedRisk.simulated - impact.combinedRisk.baseline;

    setCombinedImpact(impact);
  }, [baselinePredictive, activeSimulation, simulatedPredictive]);

  // Trigger new predictive scan with simulation context
  const triggerPredictiveScanWithSimulation = useCallback(async () => {
    if (!projectId || !activeSimulation) {
      // Use regular predictive scan
      return PredictiveService.triggerPredictiveScan(projectId);
    }

    try {
      setIsLoading(true);
      
      // In a real implementation, you would pass simulation context to the backend
      // For now, we'll trigger a regular scan and then adjust the results
      const scanResult = await PredictiveService.triggerPredictiveScan(projectId);
      
      // Reload baseline data after scan
      await loadBaselinePredictive();
      
      return scanResult;
    } catch (err) {
      console.error('Failed to trigger predictive scan with simulation:', err);
      setError(err instanceof Error ? err.message : 'Failed to trigger predictive scan');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [projectId, activeSimulation, loadBaselinePredictive]);

  // Reset simulation
  const resetSimulation = useCallback(() => {
    setSimulatedPredictive(null);
    setCombinedImpact(null);
    setError(null);
  }, []);

  // Effects
  useEffect(() => {
    loadBaselinePredictive();
  }, [loadBaselinePredictive]);

  useEffect(() => {
    if (isSimulationMode && activeSimulation?.result) {
      calculateSimulatedPredictive();
    } else {
      resetSimulation();
    }
  }, [isSimulationMode, activeSimulation, calculateSimulatedPredictive, resetSimulation]);

  useEffect(() => {
    if (simulatedPredictive && activeSimulation?.result) {
      calculateCombinedImpact();
    }
  }, [simulatedPredictive, activeSimulation, calculateCombinedImpact]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (!isSimulationMode) {
        loadBaselinePredictive();
      }
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [autoRefresh, isSimulationMode, loadBaselinePredictive]);

  // Utility function
  const formatImpact = (impact: ScenarioImpact) => {
    const confidenceDiff = ((simulatedPredictive?.confidence || 0) - (baselinePredictive?.confidence || 0)) * 100;
    
    return {
      leakageChange: ForensicScenarioEngine.formatPercentageChange(
        impact.predictiveDelta.deltaChange / (baselinePredictive?.predictedLeakage || 1)
      ),
      riskAdjustment: ForensicScenarioEngine.formatPercentageChange(impact.forensicDelta.risk_delta),
      financialImpact: ForensicScenarioEngine.formatCurrency(impact.forensicDelta.financial_impact),
      confidenceChange: `${confidenceDiff > 0 ? '+' : ''}${confidenceDiff.toFixed(1)}%`
    };
  };

  return {
    // Data
    baselinePredictive,
    simulatedPredictive,
    combinedImpact,
    
    // State
    isLoading,
    error,
    isSimulationMode,
    
    // Actions
    loadBaselinePredictive,
    calculateSimulatedPredictive,
    triggerPredictiveScanWithSimulation,
    resetSimulation,
    
    // Utilities
    formatImpact
  };
};