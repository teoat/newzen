'use client';

import React from 'react';
import { useSimulation } from '../hooks/useSimulation';
import { FlaskConical, X, Check, AlertTriangle } from 'lucide-react';

export const SimulationBanner: React.FC = () => {
  const { 
    isSimulating, 
    simulationData, 
    endSimulation, 
    applySimulation, 
    excludedCount 
  } = useSimulation();

  if (!isSimulating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-50 border-b border-amber-200 shadow-md transform transition-transform duration-300 ease-in-out">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          
          {/* Status Indicator */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-600">
              <FlaskConical className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-900">
                SIMULATION MODE ACTIVE
              </h3>
              <p className="text-xs text-amber-700">
                {simulationData?.scenarioName || 'Custom Scenario'} • {excludedCount} items excluded
              </p>
            </div>
          </div>

          {/* Metrics Summary (Optional placeholder for future expansion) */}
          {simulationData?.result && (
            <div className="hidden md:flex items-center space-x-4 text-sm border-l border-amber-200 pl-4">
               <div className="flex flex-col">
                 <span className="text-xs text-amber-600">Leakage Delta</span>
                 <span className={`font-bold ${simulationData.result.delta.leakage_delta < 0 ? 'text-green-600' : 'text-red-600'}`}>
                   {(simulationData.result.delta.leakage_delta * 100).toFixed(2)}%
                 </span>
               </div>
               <div className="flex flex-col">
                 <span className="text-xs text-amber-600">Risk Delta</span>
                 <span className={`font-bold ${simulationData.result.delta.risk_delta < 0 ? 'text-green-600' : 'text-red-600'}`}>
                   {(simulationData.result.delta.risk_delta * 100).toFixed(2)}%
                 </span>
               </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-2 ml-auto">
            <button
              onClick={applySimulation}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-amber-900 bg-amber-200 hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
            >
              <Check className="w-3.5 h-3.5 mr-1.5" />
              Apply Changes
            </button>
            <button
              onClick={endSimulation}
              className="inline-flex items-center px-3 py-1.5 border border-amber-300 text-xs font-medium rounded text-amber-800 bg-transparent hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
            >
              <X className="w-3.5 h-3.5 mr-1.5" />
              Exit Simulation
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
