import { useRef, useState, useCallback } from 'react';

interface WorkerPayload {
    csvContent?: string;
    fileName?: string;
    options?: Record<string, unknown>;
}

interface WorkerResponse {
    success: boolean;
    data?: unknown;
    error?: string;
}

/**
 * Unified Forensic Web Worker Hook
 * Handles both high-performance CSV parsing and multi-step ingestion logic
 */
export function useForensicWorker() {
    const workerRef = useRef<Worker | null>(null);
    const [progress, setProgress] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getWorker = useCallback((workerPath: string) => {
        if (!workerRef.current) {
            try {
                workerRef.current = new Worker(
                    new URL(workerPath, import.meta.url),
                    { type: 'module' }
                );
            } catch (err) {
                console.error('Failed to initialize Forensic Worker:', err);
                return null;
            }
        }
        return workerRef.current;
    }, []);

    const executeTask = useCallback(async (
        type: 'csv-parse' | 'ingestion',
        payload: WorkerPayload
    ): Promise<WorkerResponse> => {
        setIsProcessing(true);
        setProgress(0);
        setError(null);

        const workerPath = type === 'csv-parse' 
            ? '../workers/csvParser.worker.ts' 
            : '../workers/ingestion.worker.ts';

        const worker = getWorker(workerPath);
        if (!worker) {
            setIsProcessing(false);
            throw new Error('Worker initialization failed');
        }

        return new Promise((resolve, reject) => {
            worker.onmessage = (e) => {
                const { type: msgType, data, error: msgError, progress: msgProgress } = e.data;
                
                if (msgType === 'progress') setProgress(msgProgress);
                if (msgType === 'complete' || msgType === 'success') {
                    setIsProcessing(false);
                    resolve(data);
                }
                if (msgType === 'error') {
                    setError(msgError);
                    setIsProcessing(false);
                    reject(new Error(msgError));
                }
            };
            
            worker.postMessage({ type: 'start', payload });
        });
    }, [getWorker]);

    const terminate = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
        }
        setIsProcessing(false);
    }, []);

    return { executeTask, progress, isProcessing, error, terminate };
}
