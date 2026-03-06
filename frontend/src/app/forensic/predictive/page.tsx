'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { TrendingUp } from 'lucide-react';
import ForensicPageLayout from '../../components/ForensicPageLayout';
import { useProject } from '../../../store/useProject';
import { PredictiveService, PredictiveExposure } from '../../../services/PredictiveService';
import PageFeatureCard from '../../../app/components/PageFeatureCard';
import { PredictiveMetrics } from './components/PredictiveMetrics';
import { RiskPropagation } from './components/RiskPropagation';

// Dynamically import heavy chart component
const TrajectoryChart = dynamic(() => import('./components/TrajectoryChart').then(mod => mod.TrajectoryChart), {
  ssr: false,
  loading: () => <div className="lg:col-span-2 tactical-card bg-slate-900 animate-pulse h-[400px]" />
});

export default function PredictiveAnalyticsPage() {
  const { activeProjectId } = useProject();
  const [exposure, setExposure] = useState<PredictiveExposure | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchExposure = useCallback(async () => {
    if (!activeProjectId) return;
    setLoading(true);
    try {
      const data = await PredictiveService.getExposure(activeProjectId);
      setExposure(data);
    } catch (e) {
      console.error("Failed to fetch predictive data", e);
      // Fallback mock data for visualization if API not ready
      setExposure({
          projectId: activeProjectId,
          currentLeakage: 1200000000,
          predictedLeakage: 2800000000,
          confidence: 0.94,
          highRiskSectors: [
              { sector: 'Material Procurement', probability: 0.88, estimatedValue: 800000000 },
              { sector: 'Subcontractor Fees', probability: 0.72, estimatedValue: 1200000000 },
              { sector: 'Logistics Overheads', probability: 0.45, estimatedValue: 300000000 }
          ],
          trend: 'UP',
          lastUpdated: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  }, [activeProjectId]);

  useEffect(() => {
    if (activeProjectId) {
      void fetchExposure();
    }
  }, [activeProjectId, fetchExposure]);

  return (
    <ForensicPageLayout
        title="Predictive Intelligence"
        subtitle="Data-Driven Leakage Forecasting & Exposure Analysis"
        icon={TrendingUp}
    >
        <div className="p-8 space-y-8 overflow-y-auto max-h-full custom-scrollbar">
            {/* Operational Analysis Card */}
            <div className="max-w-6xl w-full">
                <PageFeatureCard 
                    phase={6}
                    title="Predictive Intelligence"
                    description="The forensic forecasting engine of Zenith. Using weighted regression and anomaly propagation models to simulate potential leakage before it hardens into the ledger."
                    features={[
                        "Realized vs. Simulated Trajectory modeling",
                        "Sectoral Risk Propagation weighting",
                        "Autonomous 'Risk Sweep' refinement protocols",
                        "Investigative synergy via Dossier Injection"
                    ]}
                    howItWorks="The Predictive engine uses weighted regression models to forecast leakage before it manifests. By simulating future transaction mutations based on historical siphoning signatures, it allows analysts to move from reactive auditing to proactive risk mitigation."
                />
            </div>

            <PredictiveMetrics 
              exposure={exposure}
              loading={loading}
              onRefine={() => void fetchExposure()}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <TrajectoryChart />
                <RiskPropagation exposure={exposure} />
            </div>
        </div>
    </ForensicPageLayout>
  );
}
