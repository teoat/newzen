'use client';

import React from 'react';
import ReconciliationWorkspace from './ReconciliationWorkspace';
import UploadEvidence from '@/components/UploadEvidence';

import { useProject } from '@/store/useProject';
import ForensicPageLayout from '@/app/components/ForensicPageLayout';
import ReconciliationOptimizer from '@/app/components/ReconciliationOptimizer';
import { ShieldAlert, BookOpen } from 'lucide-react';

export default function ReconciliationPage() {
  const { activeProjectId } = useProject();

  return (
    <ForensicPageLayout
        title="Reconciliation"
        subtitle="Automated Ledger vs Evidence Sync"
        icon={ShieldAlert}
        headerActions={
            <div className="flex items-center gap-4">
                 <button className="depth-layer-2 depth-border-subtle rounded-2xl px-6 py-3 flex items-center gap-3 hover:depth-layer-3 transition-all text-[10px] font-black uppercase tracking-widest text-indigo-400 depth-elevate">
                    <BookOpen className="w-4 h-4" /> Policy Guidelines
                 </button>
            </div>
        }
    >
        <div className="h-full overflow-y-auto custom-scrollbar p-8 space-y-12">
            <ReconciliationWorkspace />
            
            <div className="max-w-7xl mx-auto">
                <ReconciliationOptimizer />
            </div>
            
            <div className="max-w-7xl mx-auto pb-20">
                <div className="tactical-frame depth-layer-1 rounded-3xl p-8 depth-border-medium">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-depth-primary mb-2">Multimodal Context Library</h2>
                    <p className="text-depth-secondary">Add supporting evidence to resolve complex reconciliation discrepancies via RAG.</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <UploadEvidence />
                    
                    <div className="tactical-card depth-layer-2 p-6 rounded-2xl flex flex-col justify-center items-center text-center space-y-4 depth-shadow-md">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-blue-500/40 rounded border-dashed animate-spin"></div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-depth-primary">Retrieval Augmented Matching</h4>
                        <p className="text-sm text-depth-secondary mt-2">The system is ready to cross-reference your uploaded PDF statements and chat exports with the ledger gaps shown above.</p>
                    </div>
                    <button className="text-blue-400 text-sm font-bold hover:underline">View AI Reasoning Logs</button>
                    </div>
                </div>
                </div>
            </div>
        </div>
    </ForensicPageLayout>
  );
}
