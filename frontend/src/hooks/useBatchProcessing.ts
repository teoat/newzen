
import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '@/utils/constants';

export interface BatchJob {
    id: string;
    type: 'ocr' | 'entity_resolution' | 'validation' | 'indexing';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    result?: Record<string, unknown>;
    error?: string;
    createdAt: string;
    projectId: string;
    name: string;
    eta?: number; // Estimated seconds remaining
}

interface UseBatchProcessingResult {
    submitBatchJob: (type: BatchJob['type'], data: unknown, name: string) => Promise<string>;
    cancelBatchJob: (jobId: string) => Promise<void>;
    activeJobs: BatchJob[];
    completedJobs: BatchJob[];
    getJobStatus: (jobId: string) => Promise<BatchJob | null>;
}

export function useBatchProcessing(projectId: string): UseBatchProcessingResult {
    const [jobs, setJobs] = useState<BatchJob[]>([]);

    // Determine jobs requiring polling (pending or processing)
    const activeJobs = jobs.filter(j => ['pending', 'processing'].includes(j.status));
    const completedJobs = jobs.filter(j => ['completed', 'failed'].includes(j.status));

    const activeJobIds = activeJobs.map(j => j.id).join(',');
    
    // Poll active jobs
    useEffect(() => {
        if (activeJobs.length === 0) return;

        const intervalId = setInterval(async () => {
            const updatedJobs = await Promise.all(activeJobs.map(async (job) => {
                try {
                    const res = await fetch(`${API_URL}/api/v1/batch-jobs/${job.id}`);
                    if (res.ok) {
                        const data = await res.json();
                        // Map backend format to frontend format if needed
                        return {
                            ...job,
                            status: data.status,
                            progress: data.progress_percent,
                            itemsProcessed: data.items_processed,
                            itemsFailed: data.items_failed,
                            eta: data.estimated_completion_time ? (new Date(data.estimated_completion_time).getTime() - Date.now()) / 1000 : undefined
                        } as BatchJob;
                    }
                } catch (error) {
                    console.error(`Failed to poll job ${job.id}`, error);
                }
                return job; // Return unchanged on error
            }));

            // Smart merge update
            setJobs(prev => prev.map(current => {
                const updated = updatedJobs.find(u => u.id === current.id);
                return updated ? { ...current, ...updated } : current;
            }));

        }, 2000); // 2 second polling interval

        return () => clearInterval(intervalId);
    }, [activeJobIds]); // Depend on memoized/stable ID list

    const submitBatchJob = useCallback(async (type: BatchJob['type'], data: unknown, name: string) => {
        try {
            const res = await fetch(`${API_URL}/api/v1/batch-jobs/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    data_type: type, 
                    items: data, 
                    project_id: projectId,
                    // name is not in backend schema yet, ignoring
                })
            });
            
            if (!res.ok) throw new Error('Failed to submit batch job');
            
            const jobInfo = await res.json();
            
            // Optimistic addition
            const newJob: BatchJob = {
                id: jobInfo.job_id,
                type,
                status: 'pending',
                progress: 0,
                createdAt: new Date().toISOString(),
                projectId,
                name
            };
            
            setJobs(prev => [newJob, ...prev]);
            return newJob.id;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }, [projectId]);

    const cancelBatchJob = useCallback(async (jobId: string) => {
        try {
            await fetch(`${API_URL}/api/v1/batch-jobs/${jobId}/cancel`, { method: 'POST' });
            // Optimistic update
            setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'failed', error: 'Cancelled by user' } : j));
        } catch (error) {
            console.error('Failed to cancel job', error);
        }
    }, []);

    const getJobStatus = useCallback(async (jobId: string) => {
        const res = await fetch(`${API_URL}/api/v1/batch-jobs/${jobId}`);
        if (res.ok) return res.json();
        return null;
    }, []);

    return {
        submitBatchJob,
        cancelBatchJob,
        activeJobs: activeJobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        completedJobs: completedJobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        getJobStatus
    };
}
