'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

import { API_URL } from '@/utils/constants';

export function useDossier() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState(0);

  const generateDossier = async (projectId: string = 'ZENITH-001', options = { 
    includeTransactions: true, 
    includeEntities: true, 
    includeForensicAnalysis: true 
  }) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    setProgress(0);

    // Initial progress
    setProgress(10);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 5;
      });
    }, 300);

    try {
      const params = new URLSearchParams({
        project_id: projectId,
        include_transactions: options.includeTransactions.toString(),
        include_entities: options.includeEntities.toString(),
        include_forensic_analysis: options.includeForensicAnalysis.toString(),
      });

      const response = await fetch(
        `${API_URL}/api/v1/forensic/export/court-dossier?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/pdf',
            'Authorization': `Bearer ${session?.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Dossier Protocol Failure: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ZENITH_DOSSIER_${projectId}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      clearInterval(progressInterval);
      setProgress(100);
      setSuccess(true);
      
      // Dispatch telemetry event
      window.dispatchEvent(new CustomEvent('telemetry-sync', { detail: { module: 'DOSSIER' } }));

      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : 'An unexpected security violation occurred');
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return { generateDossier, loading, error, success, progress };
}
