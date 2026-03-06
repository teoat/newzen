'use client';
export const dynamic = 'force-dynamic';

import React from 'react';
import { BrainCircuit, Users, Zap } from 'lucide-react';
import ForensicPageLayout from '../../components/ForensicPageLayout';
import { SwarmReconciliation } from '../../../components/Forensic/SwarmReconciliation';
import { useProject } from '@/store/useProject';

export default function SwarmIntelligencePage() {
  const { activeProjectId } = useProject();

  return (
    <ForensicPageLayout
      title="Swarm Intelligence V2"
      subtitle="Autonomous Semantic Clustering"
      icon={BrainCircuit}
    >
      <div className="h-full w-full p-8 pb-12">
        <SwarmReconciliation />
      </div>
    </ForensicPageLayout>
  );
}