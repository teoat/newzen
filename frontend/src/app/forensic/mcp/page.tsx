'use client';

import React from 'react';
import { Cpu, Brain, Shield, Hash } from 'lucide-react';
import ForensicPageLayout from '../../components/ForensicPageLayout';
import MCPClient from '../../../components/MCPClient';
import { useProject } from '@/store/useProject';

export default function MCPPage() {
  const { activeProjectId } = useProject();

  return (
    <ForensicPageLayout
      title="Model Context Protocol"
      subtitle="AI Assistant with Context Management & Integrity Validation"
      icon={Brain}
    >
      <div className="h-full p-6">
        <div className="mb-6 flex items-center gap-6">
          <div className="flex items-center gap-3 text-indigo-400">
            <Cpu className="w-6 h-6" />
            <span className="text-sm font-bold uppercase tracking-widest">Zenith MCP</span>
          </div>
          <div className="flex items-center gap-3 text-emerald-400">
            <Shield className="w-5 h-5" />
            <span className="text-xs font-medium">Hash-linked Contexts</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <Hash className="w-5 h-5" />
            <span className="text-xs font-medium">State Validation</span>
          </div>
        </div>

        <div className="h-[calc(100%-120px)]">
          <MCPClient projectId={activeProjectId || undefined} />
        </div>
      </div>
    </ForensicPageLayout>
  );
}