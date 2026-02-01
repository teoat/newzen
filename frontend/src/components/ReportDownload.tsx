'use client';

import { useState } from 'react';
import { FileDown, Loader2, Check, AlertCircle } from 'lucide-react';
import type { Investigation, InvestigationAction } from '../store/useInvestigation';

interface ReportDownloadProps {
  investigation: Investigation;
  variant?: 'button' | 'icon' | 'dropdown';
}

export function ReportDownload({ investigation, variant = 'button' }: ReportDownloadProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investigation: {
            id: investigation.id,
            title: investigation.title,
            status: investigation.status,
            startedAt: new Date(investigation.startedAt).toISOString(),
            updatedAt: new Date(investigation.updatedAt).toISOString(),
            context: investigation.context,
            timeline: (investigation.timeline || []).map((t: any) => ({
              ...t,
              timestamp: new Date(t.timestamp).toISOString(),
            })),
            findings: investigation.findings,
            riskScore: investigation.riskScore,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to generate report');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `investigation-report-${investigation.id}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleDownload}
        disabled={loading}
        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        title="Download Report"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
      </button>
    );
  }

  if (variant === 'dropdown') {
    return (
      <button
        onClick={handleDownload}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-800 rounded-lg transition-colors w-full"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
        <span>{loading ? 'Generating...' : 'Download Report'}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white text-sm font-medium rounded-lg transition-colors"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Generating Report...
        </>
      ) : success ? (
        <>
          <Check className="w-4 h-4" />
          Report Downloaded
        </>
      ) : error ? (
        <>
          <AlertCircle className="w-4 h-4" />
          Retry
        </>
      ) : (
        <>
          <FileDown className="w-4 h-4" />
          Download Report
        </>
      )}
    </button>
  );
}
