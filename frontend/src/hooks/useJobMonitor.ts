/**
 * React hook for monitoring batch processing jobs
 * Provides real-time updates on job progress and status
 */

import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '@/utils/constants';

interface JobStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress_percent: number;
  items_processed: number;
  items_failed: number;
  total_items: number;
  total_batches: number;
  batches_completed: number;
  success_rate: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  estimated_completion_time?: string;
  error_message?: string;
}

export function useJobMonitor(
  jobId: string | null,
  pollInterval: number = 2000 // 2 seconds
) {
  const [job, setJob] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchJobStatus = useCallback(async () => {
    if (!jobId) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_URL}/api/v1/batch-jobs/${jobId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setJob(data);
        setError(null);
      } else if (response.status === 404) {
        setError('Job not found');
      } else {
        setError('Failed to fetch job status');
      }
    } catch (err) {
      setError('Network error');
      console.error('Job status fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (!jobId) return;

    // Initial fetch
    fetchJobStatus();

    // Set up polling if job is still running
    const shouldPoll = 
      job?.status === 'pending' || job?.status === 'processing';
    
    if (shouldPoll) {
      const intervalId = setInterval(fetchJobStatus, pollInterval);
      return () => clearInterval(intervalId);
    }
  }, [jobId, job?.status, fetchJobStatus, pollInterval]);

  const cancelJob = useCallback(async () => {
    if (!jobId) return;

    try {
      const response = await fetch(
        `${API_URL}/api/v1/batch-jobs/${jobId}/cancel`,
        { method: 'POST' }
      );
      
      if (response.ok) {
        await fetchJobStatus(); // Refresh status
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to cancel job:', err);
      return false;
    }
  }, [jobId, fetchJobStatus]);

  return {
    job,
    error,
    isLoading,
    refresh: fetchJobStatus,
    cancelJob
  };
}
