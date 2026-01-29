import { LucideIcon } from 'lucide-react';

export type UploadStatus = 'idle' | 'analyzing' | 'review' | 'success' | 'error';

export interface MappingItem {
    systemField: string;
    label: string;
    fileColumn: string;
    required: boolean;
    isCustom?: boolean;
    intent?: 'GENERAL' | 'LOCATION' | 'QUANTITY' | 'SECONDARY_ID' | 'TIMESTAMP' | 'RISK_INDICATOR';
}

export interface FileEntry {
    id: string;
    file: File;
    status: UploadStatus;
    progress: number;
    type: 'bank_statement' | 'expense' | 'chat_history' | 'photo' | 'video' | 'pdf' | 'other';
    metadata: {
        size: string;
        lastModified: string;
        allColumns: string[];
    };
    hash?: string;
    mappings: MappingItem[];
    previewData?: Record<string, unknown>[];
    validationInsights?: { primary: string; [key: string]: unknown }[];
}

export interface IngestionHistoryItem {
    id: string;
    projectId: string;
    fileName: string;
    timestamp: string;
    recordsProcessed: number;
    status: 'completed' | 'failed';
}

export type Step = 'ACQUIRE' | 'INSPECT' | 'INTEGRATE';

export interface DiagnosticMetrics {
    anomalies?: Record<string, number>;
    entities_resolved?: number;
    ghost_transactions?: number;
    ingestion_type?: string;
    state_dashboard?: {
        processed: number;
        pending: number;
        ignored: number;
    };
    ingestionId?: string;
    status?: string;
    recordsProcessed?: number;
    anomalyCount?: number;
    warnings?: string[];
}

export interface SchemaField {
    field: string;
    label: string;
    required: boolean;
    icon: LucideIcon;
}
