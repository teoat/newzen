import React from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { Button } from '@/components/ui/button';

interface SimulationIndicatorProps {
  onToggle?: () => void;
}

export const SimulationIndicator: React.FC<SimulationIndicatorProps> = ({ onToggle }) => {
  const { isSimulationMode, activeSimulation } = useSimulationStore();

  if (!isSimulationMode) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-amber-50 border-2 border-amber-200 rounded-lg shadow-lg p-3 max-w-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
          <div>
            <div className="font-semibold text-amber-800 text-sm">Simulation Mode Active</div>
            <div className="text-xs text-amber-600">
              {activeSimulation?.scenarioName || 'Custom Scenario'}
            </div>
          </div>
        </div>
        {onToggle && (
          <Button
            onClick={onToggle}
            variant="ghost"
            size="sm"
            className="text-amber-800 hover:bg-amber-100 px-2 py-1 text-xs"
          >
            Exit
          </Button>
        )}
      </div>
    </div>
  );
};