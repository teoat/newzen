import { useRef, useCallback } from 'react';

interface ParseResult {
    data: unknown[];
    meta: {
        fields?: string[];
        [key: string]: unknown;
    };
    fileName: string;
}

interface ParseError {
    error: string;
    fileName: string;
}

export function useCSVWorker() {
    const workerRef = useRef<Worker | null>(null);

    const parseCSV = useCallback((
        file: File,
        preview: boolean = false,
        onSuccess: (result: ParseResult) => void,
        onError: (error: string) => void
    ) => {
        // Initialize worker if not already created
        if (!workerRef.current) {
            try {
                workerRef.current = new Worker(
                    new URL('../workers/csvParser.worker.ts', import.meta.url),
                    { type: 'module' }
                );
            } catch (err) {
                console.error('Failed to create CSV worker:', err);
                onError('Web Worker initialization failed. Falling back to main thread.');
                return;
            }
        }

        const worker = workerRef.current;

        // Set up message handler
        worker.onmessage = (e: MessageEvent) => {
            const { type, data, meta, fileName, error } = e.data;

            if (type === 'success') {
                onSuccess({ data, meta, fileName });
            } else if (type === 'error') {
                onError(error);
            }
        };

        worker.onerror = (err) => {
            console.error('Worker error:', err);
            onError('CSV parsing failed in worker thread.');
        };

        // Send parse request to worker
        worker.postMessage({
            type: 'parse',
            file,
            preview
        });
    }, []);

    const terminate = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
        }
    }, []);

    return { parseCSV, terminate };
}
