'use client';

import React from 'react';
import { Shield, FileText, Hash } from 'lucide-react';
import ForensicPageLayout from '../../components/ForensicPageLayout';
import ComplianceDashboard from '../../../components/ComplianceDashboard';
import { useProject } from '@/store/useProject';
import PageFeatureCard from '../../components/PageFeatureCard';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function CompliancePage() {
  const { activeProjectId } = useProject();

  return (
    <ForensicPageLayout
      title="Compliance Hardening"
      subtitle="Hash-linked AI Narratives with State Validation"
      icon={Shield}
      headerActions={
        <Link href="/">
            <button className="text-slate-500 hover:text-white text-[11px] font-black uppercase tracking-widest px-4 py-2 border border-white/5 rounded-xl flex items-center gap-2 transition-all">
                <ChevronRight className="w-3 h-3 rotate-180" /> Hub
            </button>
        </Link>
      }
    >
      <div className="p-8 space-y-8 overflow-y-auto h-full custom-scrollbar">
        {/* Operational Analysis Card */}
        <div className="max-w-6xl w-full">
            <PageFeatureCard 
                phase={11}
                title="Compliance Matrix"
                description="The cryptographic integrity layer of Zenith. Bridges architectural and financial findings with immutable state validation and non-repudiable audit trails."
                features={[
                    "Hash-linked AI 'Narrative Verification' protocols",
                    "Immutable State Validation via ledger anchoring",
                    "Multispectral 'Non-Repudiation' audit logs",
                    "Court-admissible compliance report generation"
                ]}
                howItWorks="Compliance Matrix serves as the final integrity gate. It enforces hash-validation on AI narratives, ensuring that every finding is linked back to an immutable data state. This creates the 'Verifiable Truth' required for regulatory and legal adjudication."
            />
        </div>

        <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 text-indigo-400">
            <Hash className="w-6 h-6 animate-pulse" />
            <span className="text-sm font-black uppercase tracking-widest italic">Blockchain Integrity Active</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-3 text-emerald-400">
            <FileText className="w-4 h-4" />
            <span className="text-[11px] font-black uppercase tracking-widest">Chain Validation</span>
            </div>
            <div className="flex items-center gap-3 text-slate-400">
            <Shield className="w-4 h-4" />
            <span className="text-[11px] font-black uppercase tracking-widest">State Admissibility confirmed</span>
            </div>
        </div>

      <div className="h-[calc(100%-120px)]">
        <ComplianceDashboard />
      </div>
    </div>
    </ForensicPageLayout>
  );
}