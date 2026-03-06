import React, { useState } from 'react';
import { SimulationSandbox } from './SimulationSandbox';
import { SimulationIndicator } from './SimulationIndicator';
import { useSimulationStore } from '../../store/useSimulationStore';
import { useInvestigation } from '../../store/useInvestigation';
import type { SimulationResult } from '../../services/ForensicScenarioEngine';

interface ForensicScenarioIntegrationProps {
  projectId: string;
  showIndicator?: boolean;
  compact?: boolean;
}

export const ForensicScenarioIntegration: React.FC<ForensicScenarioIntegrationProps> = ({
  projectId,
  showIndicator = true,
  compact = false
}) => {
  const [showSandbox, setShowSandbox] = useState(false);
  const { endSimulation } = useSimulationStore();
  const { addAction, activeInvestigation } = useInvestigation();

  const handleSimulationChange = (result: SimulationResult | null) => {
    // Log simulation results to investigation if active
    if (activeInvestigation && result) {
      addAction({
        action: 'SIMULATION_RESULT',
        tool: 'ForensicScenarioEngine',
        result: {
          context: `Simulation Impact: ${result.summary.impact_level} - ${result.summary.leakage_change} leakage`,
          value: result.delta.financial_impact,
          severity: Math.abs(result.delta.leakage_delta) * 100
        }
      });
    }
  };

  const handleExitSimulation = () => {
    endSimulation();
    if (activeInvestigation) {
      addAction({
        action: 'SIMULATION_EXIT',
        tool: 'ForensicScenarioEngine',
        result: {
          context: 'Exited forensic scenario simulation',
          value: 0,
          severity: 0
        }
      });
    }
    setShowSandbox(false);
  };

  if (compact) {
    return (
      <>
        {showIndicator && <SimulationIndicator onToggle={handleExitSimulation} />}
        {showSandbox && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">Forensic Scenario Engine</h2>
                <button
                  onClick={() => setShowSandbox(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <div className="p-4">
                <SimulationSandbox
                  projectId={projectId}
                  onSimulationChange={handleSimulationChange}
                />
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {showIndicator && <SimulationIndicator onToggle={handleExitSimulation} />}
      {showSandbox && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Forensic Scenario Engine</h2>
              <button
                onClick={() => setShowSandbox(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <SimulationSandbox
                projectId={projectId}
                onSimulationChange={handleSimulationChange}
              />
            </div>
          </div>
        </div>
      )}
      <div className="mb-4">
        <button
          onClick={() => setShowSandbox(true)}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <span className="text-lg">🧪</span>
          Open Forensic Scenario Engine
        </button>
      </div>
    </>
  );
};