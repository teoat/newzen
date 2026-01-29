import { useState, useCallback } from 'react';
import { useForensicNotifications } from '@/components/ForensicNotificationProvider';

interface UseApiOptions<T> {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    showSuccessToast?: boolean;
    successMessage?: string;
    showErrorToast?: boolean;
}

export function useApi<T = unknown>() {
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const notifications = useForensicNotifications();

    const execute = useCallback(async (
        url: string, 
        options: RequestInit = {}, 
        hookOptions: UseApiOptions<T> = {}
    ) => {
        setIsLoading(true);
        setError(null);
        
        try {
            const res = await fetch(url, options);
            
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.detail || errorData.message || `Request failed with status ${res.status}`);
            }
            
            const jsonData = await res.json();
            setData(jsonData);
            
            if (hookOptions.showSuccessToast) {
                notifications.success('REQUEST_COMPLETE', hookOptions.successMessage || 'Operation executed successfully.');
            }
            
            if (hookOptions.onSuccess) {
                hookOptions.onSuccess(jsonData);
            }
            
            return jsonData;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            console.error("API Error:", error);
            
            if (hookOptions.showErrorToast !== false) {
                 notifications.error('EXECUTION_FAILURE', error.message || 'An unexpected error occurred during the request.');
            }
            
            if (hookOptions.onError) {
                hookOptions.onError(error);
            }
            
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [notifications]);

    return { data, isLoading, error, execute };
}
