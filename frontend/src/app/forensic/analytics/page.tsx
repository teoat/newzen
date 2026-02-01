import { Suspense } from 'react';
import { Briefcase } from 'lucide-react';
import { ProjectDashboard } from './components/Dashboard';
import { ProjectDashboardSkeleton } from './components/Skeletons';
import { getProjectData } from './components/data';
import ForensicPageLayout from '../../../app/components/ForensicPageLayout';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ projectId: string }>;
}

async function AnalyticsContent({ projectId }: { projectId: string }) {
  const { dashboard, sCurve } = await getProjectData(projectId);
  return <ProjectDashboard projectData={dashboard} sCurveData={sCurve} projectId={projectId} />;
}

export default async function ForensicAnalyticsPage({ params }: PageProps) {
  const { projectId } = await params;

  return (
    <ForensicPageLayout
      title="Project Analytics"
      subtitle={`Code: ${projectId} // Real-time Variance Analysis`}
      icon={Briefcase}
    >
      <Suspense fallback={<ProjectDashboardSkeleton />}>
        <AnalyticsContent projectId={projectId} />
      </Suspense>
    </ForensicPageLayout>
  );
}
