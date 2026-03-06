
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';

export interface QuarantineRow {
  id: string;
  project_id: string;
  raw_content: string;
  row_index: number;
  error_message: string;
  error_type: string;
  status: 'new' | 'repaired' | 'fixed_manually' | 'ignored' | 'needs_specialist';
  suggested_fix?: Record<string, unknown>;
  created_at: string;
}

export interface QuarantineStats {
  total: number;
  new: number;
  repaired: number;
  needs_attention: number;
}

export interface AgentStatus {
  auditor: {
      status: string;
      type: string;
      stream_metrics?: {
          lag?: number;
          [key: string]: unknown;
      };
  };
  nurse: {
      status: string;
      type: string;
      interval_seconds: number;
  };
  environment: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function useQuarantine() {
  const { token } = useAuth();
  const [stats, setStats] = useState<QuarantineStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async (projectId?: string) => {
    try {
        setLoading(true);
        const url = new URL(`${API_BASE_URL}/api/v1/ingestion/quarantine/stats`);
        if (projectId) url.searchParams.append('project_id', projectId);
        
        const res = await fetch(url.toString(), {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch stats');
        const data = await res.json();
        setStats(data);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
    } finally {
        setLoading(false);
    }
  };

  const listRows = async (status?: string, projectId?: string) => {
      const url = new URL(`${API_BASE_URL}/api/v1/ingestion/quarantine/`);
      if (status) url.searchParams.append('status', status);
      if (projectId) url.searchParams.append('project_id', projectId);
      
      const res = await fetch(url.toString(), {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.json() as Promise<QuarantineRow[]>;
  };
  
  const resolveRow = async (rowId: string, correctedContent: string) => {
      const res = await fetch(`${API_BASE_URL}/api/v1/ingestion/quarantine/${rowId}/resolve`, {
          method: 'POST',
          headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ corrected_content: correctedContent })
      });
      if (!res.ok) throw new Error("Failed to resolve row");
      return res.json();
  };

  return { stats, loading, error, fetchStats, listRows, resolveRow };
}

export function useAgentStatus() {
    const { token } = useAuth();
    const [status, setStatus] = useState<AgentStatus | null>(null);
    
    const checkHealth = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/v2/system/agents/`, {
                 headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setStatus(await res.json());
            }
        } catch (e) {
            console.error("Agent check failed", e);
        }
    }, [token]);
    
    useEffect(() => {
        const runCheck = async () => {
            await checkHealth();
        };
        runCheck();
        const interval = setInterval(checkHealth, 5000); // Pulse every 5s
        return () => clearInterval(interval);
    }, [checkHealth]);
    
    return status;
}
