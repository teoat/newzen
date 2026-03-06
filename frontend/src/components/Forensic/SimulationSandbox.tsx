import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ForensicScenarioEngine,
  type SimulationExclusionRequest,
  type SimulationResult,
  type ProjectEntity,
  type ProjectTransaction,
  WhatIfScenario,
  BaselineMetrics
} from '../../services/ForensicScenarioEngine';
import { ScenarioComparisonView } from './ScenarioComparisonView';
import { useInvestigation } from '../../store/useInvestigation';
import { audioService } from '../../lib/audioService';

interface SimulationSandboxProps {
  projectId: string;
  onSimulationChange?: (result: SimulationResult | null) => void;
}

interface StoredSimulationState {
  exclusions: SimulationExclusionRequest;
  result: SimulationResult;
  timestamp: number;
}

export const SimulationSandbox: React.FC<SimulationSandboxProps> = ({
  projectId,
  onSimulationChange
}) => {
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [simulationState, setSimulationState] = useState<StoredSimulationState | null>(null);
  const [baselineMetrics, setBaselineMetrics] = useState<BaselineMetrics | null>(null);
  const [availableEntities, setAvailableEntities] = useState<{
    transactions: ProjectTransaction[];
    entities: ProjectEntity[];
  } | null>(null);
  const [whatIfScenarios, setWhatIfScenarios] = useState<WhatIfScenario[]>([]);
  const [selectedTab, setSelectedTab] = useState<'transactions' | 'entities' | 'scenarios'>('transactions');
  const [isLoading, setIsLoading] = useState(false);
  const [excludedTransactions, setExcludedTransactions] = useState<Set<string>>(new Set());
  const [excludedEntities, setExcludedEntities] = useState<Set<string>>(new Set());
  const [mergedEntities, setMergedEntities] = useState<Map<string, string>>(new Map());

  const { activeInvestigation, addAction } = useInvestigation();

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      if (!projectId) return;

      try {
        setIsLoading(true);
        
        // Load baseline metrics
        const baselineResponse = await ForensicScenarioEngine.getBaselineMetrics(projectId);
        setBaselineMetrics(baselineResponse.baseline_metrics);

        // Load available entities and transactions
        const entitiesResponse = await ForensicScenarioEngine.getAvailableEntities(projectId);
        setAvailableEntities({
          transactions: entitiesResponse.transactions,
          entities: entitiesResponse.entities
        });

        // Load what-if scenarios
        const scenariosResponse = await ForensicScenarioEngine.generateWhatIfScenarios(projectId);
        setWhatIfScenarios(scenariosResponse.scenarios);

        // Check for existing simulation state
        const storedState = ForensicScenarioEngine.getSimulationState(projectId);
        if (storedState) {
          setSimulationState(storedState as StoredSimulationState);
          setIsSimulationMode(true);
          
          // Restore UI state
          setExcludedTransactions(new Set(storedState.exclusions.transaction_ids));
          setExcludedEntities(new Set(storedState.exclusions.entity_ids));
          const mergeMap = new Map();
          storedState.exclusions.merged_entities.forEach(merge => {
            mergeMap.set(merge.source_id, merge.target_id);
          });
          setMergedEntities(mergeMap);

          onSimulationChange?.(storedState.result);
        }
      } catch (error) {
        console.error('Failed to load initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [projectId, onSimulationChange]);

  // Calculate simulation delta
  const calculateSimulation = useCallback(async () => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      
      const exclusions: SimulationExclusionRequest = {
        transaction_ids: Array.from(excludedTransactions),
        entity_ids: Array.from(excludedEntities),
        merged_entities: Array.from(mergedEntities.entries()).map(([source, target]) => ({
          source_id: source,
          target_id: target
        }))
      };

      const result = await ForensicScenarioEngine.calculateSimulationDelta(projectId, exclusions);
      
      const newSimulationState: StoredSimulationState = {
        exclusions,
        result,
        timestamp: Date.now()
      };

      setSimulationState(newSimulationState);
      ForensicScenarioEngine.storeSimulationState(projectId, newSimulationState);
      onSimulationChange?.(result);

      // Log action to investigation if active
      if (activeInvestigation) {
        addAction({
          action: 'SIMULATION_RUN',
          tool: 'ForensicScenarioEngine',
          result: {
            context: `What-If simulation with ${exclusions.transaction_ids.length} exclusions, ${exclusions.merged_entities.length} merges`,
            value: result.delta.leakage_delta,
            severity: Math.abs(result.delta.leakage_delta) * 100
          }
        });
      }

      void audioService.playSuccess();
    } catch (error) {
      console.error('Failed to calculate simulation:', error);
      void audioService.playError();
    } finally {
      setIsLoading(false);
    }
  }, [projectId, excludedTransactions, excludedEntities, mergedEntities, activeInvestigation, addAction, onSimulationChange]);

  // Toggle simulation mode
  const toggleSimulationMode = () => {
    if (isSimulationMode) {
      // Exit simulation mode
      setIsSimulationMode(false);
      setSimulationState(null);
      setExcludedTransactions(new Set());
      setExcludedEntities(new Set());
      setMergedEntities(new Map());
      ForensicScenarioEngine.clearSimulationState(projectId);
      onSimulationChange?.(null);
      void audioService.playClick();
    } else {
      // Enter simulation mode
      setIsSimulationMode(true);
      void audioService.playClick();
    }
  };

  // Apply what-if scenario
  const applyScenario = (scenario: WhatIfScenario) => {
    const exclusions = scenario.exclusions as SimulationExclusionRequest;
    setExcludedTransactions(new Set(exclusions.transaction_ids));
    setExcludedEntities(new Set(exclusions.entity_ids));
    const mergeMap = new Map();
    exclusions.merged_entities.forEach(merge => {
      mergeMap.set(merge.source_id, merge.target_id);
    });
    setMergedEntities(mergeMap);
    
    void audioService.playClick();
  };

  // Toggle transaction exclusion
  const toggleTransactionExclusion = (txId: string) => {
    const newSet = new Set(excludedTransactions);
    if (newSet.has(txId)) {
      newSet.delete(txId);
    } else {
      newSet.add(txId);
    }
    setExcludedTransactions(newSet);
  };

  // Toggle entity exclusion
  const toggleEntityExclusion = (entityId: string) => {
    const newSet = new Set(excludedEntities);
    if (newSet.has(entityId)) {
      newSet.delete(entityId);
    } else {
      newSet.add(entityId);
    }
    setExcludedEntities(newSet);
  };

  // Get risk level color
  const getRiskLevelColor = (score: number) => {
    if (score >= 0.8) return 'text-red-600';
    if (score >= 0.6) return 'text-orange-600';
    if (score >= 0.4) return 'text-amber-500';
    return 'text-green-600';
  };

  // Get impact level color
  const getImpactLevelColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'text-red-600';
      case 'MEDIUM': return 'text-amber-500';
      case 'LOW': return 'text-green-600';
      default: return 'text-gray-500';
    }
  };

  if (isLoading && !baselineMetrics) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading Simulation Sandbox...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Simulation Mode Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🧪</span>
                Forensic Scenario Engine
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Virtual Adjudication Mode - Test hypotheses without affecting the &quot;Chain of Truth&quot;
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isSimulationMode && (
                <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                  Simulation Active
                </span>
              )}
              <Button
              onClick={toggleSimulationMode}
              variant={isSimulationMode ? "destructive" : "default"}
              >
                {isSimulationMode ? "Exit Simulation" : "Enter Simulation"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {isSimulationMode && (
        <>
          {/* Baseline vs Simulation Comparison */}
          {baselineMetrics && simulationState && (
            <ScenarioComparisonView 
              baseline={baselineMetrics} 
              simulated={simulationState.result} 
            />
          )}

          {/* Simulation Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Simulation Controls</CardTitle>
              <p className="text-sm text-gray-600">
                Configure your what-if scenario by excluding transactions or merging entities
              </p>
            </CardHeader>
            <CardContent>
              {/* Tab Navigation */}
              <div className="flex space-x-1 mb-4">
                <button
                  onClick={() => setSelectedTab('transactions')}
                  className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                    selectedTab === 'transactions'
                      ? 'bg-white border-t border-l border-r text-blue-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Transactions ({excludedTransactions.size} excluded)
                </button>
                <button
                  onClick={() => setSelectedTab('entities')}
                  className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                    selectedTab === 'entities'
                      ? 'bg-white border-t border-l border-r text-blue-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Entities ({excludedEntities.size} excluded)
                </button>
                <button
                  onClick={() => setSelectedTab('scenarios')}
                  className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                    selectedTab === 'scenarios'
                      ? 'bg-white border-t border-l border-r text-blue-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  What-If Scenarios
                </button>
              </div>

              {/* Tab Content */}
              <div className="border border-t-0 rounded-b-lg">
                {selectedTab === 'transactions' && availableEntities && (
                  <div className="max-h-96 overflow-y-auto">
                    {availableEntities.transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                          excludedTransactions.has(tx.id) ? 'bg-red-50' : ''
                        }`}
                        onClick={() => toggleTransactionExclusion(tx.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{tx.description}</div>
                            <div className="text-sm text-gray-500">
                              {tx.sender} → {tx.receiver}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {ForensicScenarioEngine.formatCurrency(tx.amount)}
                            </div>
                            <div className={`text-sm ${getRiskLevelColor(tx.risk_score)}`}>
                              Risk: {(tx.risk_score * 100).toFixed(1)}%
                            </div>
                            {excludedTransactions.has(tx.id) && (
                              <div className="text-xs text-red-600 font-medium">EXCLUDED</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedTab === 'entities' && availableEntities && (
                  <div className="max-h-96 overflow-y-auto">
                    {availableEntities.entities.map((entity) => (
                      <div
                        key={entity.id}
                        className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                          excludedEntities.has(entity.id) ? 'bg-red-50' : ''
                        }`}
                        onClick={() => toggleEntityExclusion(entity.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{entity.name}</div>
                            <div className="text-sm text-gray-500">
                              {entity.type} • {entity.transaction_count} transactions
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {ForensicScenarioEngine.formatCurrency(entity.total_amount)}
                            </div>
                            <div className={`text-sm ${getRiskLevelColor(entity.average_risk)}`}>
                              Avg Risk: {(entity.average_risk * 100).toFixed(1)}%
                            </div>
                            {excludedEntities.has(entity.id) && (
                              <div className="text-xs text-red-600 font-medium">EXCLUDED</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedTab === 'scenarios' && (
                  <div className="p-4 space-y-3">
                    {whatIfScenarios.map((scenario) => (
                      <div
                        key={scenario.id}
                        className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => applyScenario(scenario)}
                      >
                        <div className="font-medium text-blue-600">{scenario.name}</div>
                        <div className="text-sm text-gray-600 mt-1">{scenario.description}</div>
                      </div>
                    ))}
                    {whatIfScenarios.length === 0 && (
                      <div className="text-center text-gray-500 py-8">
                        No pre-configured scenarios available
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end mt-4 space-x-2">
                <Button
                  onClick={() => {
                    setExcludedTransactions(new Set());
                    setExcludedEntities(new Set());
                    setMergedEntities(new Map());
                  }}
                  variant="outline"
                >
                  Reset Selections
                </Button>
                <Button
                  onClick={calculateSimulation}
                  disabled={isLoading}
                >
                  {isLoading ? 'Calculating...' : 'Calculate Impact'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!isSimulationMode && baselineMetrics && (
        <Card>
          <CardHeader>
            <CardTitle>Current Baseline</CardTitle>
            <p className="text-sm text-gray-600">
              Project metrics without any simulation adjustments
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-500 mb-1">Leakage Probability</div>
                <div className={`text-2xl font-bold ${getRiskLevelColor(baselineMetrics.leakage_probability)}`}>
                  {(baselineMetrics.leakage_probability * 100).toFixed(2)}%
                </div>
                <div className="text-sm text-gray-600">
                  {ForensicScenarioEngine.formatCurrency(baselineMetrics.leakage_amount)} lost
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Overall Risk Score</div>
                <div className={`text-2xl font-bold ${getRiskLevelColor(baselineMetrics.risk_score)}`}>
                  {(baselineMetrics.risk_score * 100).toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">
                  {ForensicScenarioEngine.formatCurrency(baselineMetrics.total_amount)} total value
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};