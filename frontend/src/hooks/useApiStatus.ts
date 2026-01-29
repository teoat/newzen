import { useState, useCallback } from 'react';

export type ApiStatus = 'idle' | 'loading' | 'success' | 'error';

interface UseApiStatusReturn {
  status: ApiStatus;
  error: string | null;
  setLoading: () => void;
  setSuccess: () => void;
  setError: (message: string) => void;
  reset: () => void;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}

export function useApiStatus(initialStatus: ApiStatus = 'idle'): UseApiStatusReturn {
  const [status, setStatus] = useState<ApiStatus>(initialStatus);
  const [error, setErrorState] = useState<string | null>(null);

  const setLoading = useCallback(() => {
    setStatus('loading');
    setErrorState(null);
  }, []);

  const setSuccess = useCallback(() => {
    setStatus('success');
    setErrorState(null);
  }, []);

  const setError = useCallback((message: string) => {
    setStatus('error');
    setErrorState(message);
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setErrorState(null);
  }, []);

  return {
    status,
    error,
    setLoading,
    setSuccess,
    setError,
    reset,
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
  };
}
