/**
 * React Hook for Ingestion Web Worker
 * Provides easy interface to use the ingestion worker
 */

import { useRef, useState, useCallback } from 'react';

export interface IngestionResult {
  headers: string[];
  transactions: any[];
  errors: Array<{ row: number; errors: string[] }>;
  stats: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
  };
}

export interface UseIngestionWorkerReturn {
  parseFile: (file: File) => Promise<IngestionResult>;
  progress: number;
  isProcessing: boolean;
  error: string | null;
  cancel: () => void;
}

export function useIngestionWorker(): UseIngestionWorkerReturn {
  const workerRef = useRef<Worker | null>(null);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize worker
  const getWorker = useCallback(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL('../workers/ingestion.worker.ts', import.meta.url),
        { type: 'module' }
      );
    }
    return workerRef.current;
  }, []);

  // Parse file using worker
  const parseFile = useCallback(async (file: File): Promise<IngestionResult> => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    return new Promise((resolve, reject) => {
      const worker = getWorker();

      // Read file
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const text = e.target?.result as string;
        
        // Send to worker
        worker.postMessage({
          type: 'parse',
          payload: { text, chunkSize: 1000 }
        });
      };

      reader.onerror = () => {
        setError('Failed to read file');
        setIsProcessing(false);
        reject(new Error('Failed to read file'));
      };

      // Handle worker messages
      worker.onmessage = (event) => {
        const { type, data, error: workerError, progress: workerProgress } = event.data;

        switch (type) {
          case 'progress':
            setProgress(workerProgress || 0);
            break;

          case 'complete':
            setProgress(100);
            setIsProcessing(false);
            resolve(data as IngestionResult);
            break;

          case 'error':
            setError(workerError || 'Unknown error');
            setIsProcessing(false);
            reject(new Error(workerError || 'Processing failed'));
            break;
        }
      };

      worker.onerror = (err) => {
        setError('Worker error: ' + err.message);
        setIsProcessing(false);
        reject(err);
      };

      // Start reading
      reader.readAsText(file);
    });
  }, [getWorker]);

  // Cancel processing
  const cancel = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setIsProcessing(false);
    setProgress(0);
  }, []);

  // Cleanup on unmount
  useState(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  });

  return {
    parseFile,
    progress,
    isProcessing,
    error,
    cancel
  };
}
