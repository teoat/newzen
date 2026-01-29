import { useState } from 'react';

// Asset-related type definitions for better type safety
export type AssetStatus = 'ACTIVE' | 'VERIFIED' | 'FROZEN' | 'FLAGGED';

export interface Asset {
  id: string;
  status: AssetStatus;
  type: string;
  value: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetAction {
  type: 'VERIFY' | 'UNVERIFY' | 'FREEZE' | 'UNFREEZE' | 'GENERATE_REPORT';
  assetId: string;
  reason?: string;
  timestamp: Date;
}

export interface ApiErrorResponse {
  detail?: string;
  message?: string;
  error?: string;
}

export interface AssetVerificationResponse {
  success: boolean;
  assetId: string;
  previousStatus: AssetStatus;
  newStatus: AssetStatus;
  timestamp: string;
}

export interface AssetReport {
  id: string;
  assetId: string;
  generatedAt: string;
  format: 'PDF' | 'JSON';
  downloadUrl?: string;
  content?: Record<string, unknown>;
}

// API URL configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8200'; 

interface AssetActionsState {
    isFreezing: boolean;
    isGeneratingWarrant: boolean;
    error: string | null;
}

export function useAssetActions() {
    const [state, setState] = useState<AssetActionsState>({ 
        isFreezing: false, 
        error: null,
        isGeneratingWarrant: false
    });

    const toggleVerification = async (assetId: string, currentStatus: 'ACTIVE' | 'VERIFIED'): Promise<boolean> => {
        setState({ ...state, isFreezing: true, error: null }); // Use spread to preserve other state properties
        
        // Determine target state (If currently ACTIVE, we want to VERIFY. If VERIFIED, we UNVERIFY)
        const shouldVerify = currentStatus === 'ACTIVE'; // If active, we want to verify it. If verified, we want to unverify.
        
        try {
            const res = await fetch(`${API_URL}/api/v1/assets/${assetId}/verify-link?verified=${shouldVerify}&reason=Analyst%20Review`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!res.ok) {
                const err: ApiErrorResponse = await res.json();
                throw new Error(err.detail || err.message || 'Failed to update asset status');
            }

            setState({ ...state, isFreezing: false, error: null });
            return true;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            console.error('Asset verification failed:', error);
            setState({ ...state, isFreezing: false, error: error.message });
            return false;
        }
    };

    const generateReport = async (assetId: string) => {
        setState({ ...state, isGeneratingWarrant: true, error: null }); // Assuming isGeneratingWarrant is used for report generation
        try {
            const res = await fetch(`${API_URL}/api/v1/assets/${assetId}/generate-report`, {
                method: 'POST'
            });
            if(!res.ok) {
                const err: ApiErrorResponse = await res.json();
                throw new Error(err.detail || err.message || "Failed to generate report");
            }
            setState({ ...state, isGeneratingWarrant: false, error: null });
            return await res.json() as AssetReport;
        } catch(err) {
            const error = err instanceof Error ? err : new Error(String(err));
            console.error(error);
            setState({ ...state, isGeneratingWarrant: false, error: error.message });
            return null;
        }
    };

    return {
        toggleVerification,
        generateReport,
        isFreezing: state.isFreezing, // Use local state for isFreezing
        isGeneratingWarrant: state.isGeneratingWarrant, // Use local state for isGeneratingWarrant
        error: state.error // Use local state for error
    };
}
