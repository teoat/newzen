import { Suspense } from 'react';
import { Briefcase } from 'lucide-react';
import { ProjectDashboard } from './components/Dashboard';
import { ProjectDashboardSkeleton } from './components/Skeletons';
import { getProjectData } from './components/data';
import ForensicPageLayout from '../../../app/components/ForensicPageLayout';
import PageFeatureCard from '../../../app/components/PageFeatureCard';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

// Optimization: Dynamic rendering
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
      subtitle={`Dossier ${projectId} // Operational Telemetry Feed`}
      icon={Briefcase}
      headerActions={
        <Link href="/">
            <button className="text-slate-500 hover:text-white text-[11px] font-black uppercase tracking-widest px-4 py-2 border border-white/5 rounded-xl flex items-center gap-2 transition-all">
                <ChevronRight className="w-3 h-3 rotate-180" /> Hub
            </button>
        </Link>
      }
    >
      <div className="p-8 space-y-8">
        <PageFeatureCard 
            phase={8}
            title="Executive Analytics"
            description="The high-level adjudication command deck. Correlates multi-source financial variances into a unified 'S-Curve Replay' for strategic oversight."
            features={[
                "Budget vs. Actual 'S-Curve' Replay Engine",
                "Real-time leakage signature identification",
                "Virtualized Budget Variance (RAB) auditing",
                "High-fidelity Legal Dossier generation"
            ]}
            howItWorks="Analytics provides strategic oversight through S-Curve Replay. By correlating planned valuation against actual cost expenditure, it identifies macroeconomic leakage trends and calculates the 'S-Curve Delta'—the primary indicator of systemic project over-billing."
        />
        <Suspense fallback={<ProjectDashboardSkeleton />}>
            <AnalyticsContent projectId={projectId} />
        </Suspense>
      </div>
    </ForensicPageLayout>
  );
}
