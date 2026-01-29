
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
    eta?: number;
}
