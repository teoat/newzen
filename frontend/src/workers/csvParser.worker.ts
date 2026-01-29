// CSV Parser Web Worker
// This worker handles CSV parsing off the main thread to prevent UI blocking

import Papa from 'papaparse';

interface ParseMessage {
    type: 'parse';
    file: File;
    preview: boolean;
}

self.onmessage = async (e: MessageEvent<ParseMessage>) => {
    const { type, file, preview } = e.data;

    if (type === 'parse') {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            preview: preview ? 100 : 0, // Preview mode: only first 100 rows
            complete: (results) => {
                self.postMessage({
                    type: 'success',
                    data: results.data,
                    meta: results.meta,
                    fileName: file.name
                });
            },
            error: (error) => {
                self.postMessage({
                    type: 'error',
                    error: error.message,
                    fileName: file.name
                });
            }
        });
    }
};

export {};
