'use client';

import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useProject } from '../../../store/useProject';
import ForensicPageLayout from '../../../app/components/ForensicPageLayout';
import { FlaskConical } from 'lucide-react';
import { SimulationSandbox } from '../../../components/Forensic/SimulationSandbox';

export default function SimulationPage() {
  const searchParams = useSearchParams();
  const { activeProjectId, setActiveProject } = useProject();
  
  // Set project from URL query param if provided
  useEffect(() => {
    const projectIdFromUrl = searchParams.get('projectId');
    if (projectIdFromUrl && projectIdFromUrl !== activeProjectId) {
      setActiveProject(projectIdFromUrl);
    }
  }, [searchParams, activeProjectId, setActiveProject]);

  return (
    <ForensicPageLayout
      title="Scenario Sandbox"
      subtitle="Virtual Adjudication & What-If Analysis"
      icon={FlaskConical}
    >
      <div className="p-8 max-w-7xl mx-auto">
        {activeProjectId ? (
          <SimulationSandbox projectId={activeProjectId} />
        ) : (
          <div className="flex items-center justify-center h-64 bg-slate-900/50 border border-white/5 rounded-[2rem] text-slate-500 font-black uppercase tracking-widest italic">
            Select a project to enter sandbox
          </div>
        )}
      </div>
    </ForensicPageLayout>
  );
}
