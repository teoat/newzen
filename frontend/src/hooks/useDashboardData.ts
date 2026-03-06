/**
 * Custom hook for fetching and managing dashboard data
 */
import { useState, useEffect, useCallback } from 'react';
import { authenticatedFetch } from '@/lib/api';

export interface DashboardMetrics {
  total_investigations: number;
  active_investigations: number;
  completed_investigations: number;
  total_projects: number;
  active_projects: number;
  total_leakage_identified: number;
  risk_score: number;
  data_sources: number;
  alerts_count: number;
  system_uptime: number;
  last_updated: string;
}

export interface RecentActivity {
  id: string;
  type: 'investigation' | 'alert' | 'system';
  message: string;
  timestamp: string;
  severity: 'high' | 'medium' | 'low';
  user_id?: string;
}

export interface SystemHealth {
  api_gateway: {
    status: string;
    response_time_ms: number;
    last_check: string;
  };
  database: {
    status: string;
    connection_pool_size: number;
    active_connections: number;
    last_check: string;
  };
  ai_processing: {
    status: string;
    queue_size: number;
    processing_time_avg: number;
    last_check: string;
  };
  redis_cache: {
    status: string;
    memory_usage_mb: number;
    hit_rate: number;
    last_check: string;
  };
  autonomous_agents: {
    auditor_agent: {
      status: string;
      type: string;
      lag_events: number;
      last_activity: string;
    };
    nurse_agent: {
      status: string;
      type: string;
      interval_seconds: number;
      last_activity: string;
    };
  };
}

export interface AnalyticsOverview {
  data_quality_score: number;
  entities_analyzed: number;
  suspicious_patterns: number;
  transaction_volume: number;
  risk_distribution: {
    high: number;
    medium: number;
    low: number;
  };
  leakage_trend: Array<{
    date: string;
    amount: number;
  }>;
}

export interface QuickStats {
  alerts_summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  performance_metrics: {
    avg_processing_time: number;
    success_rate: number;
    error_rate: number;
  };
  resource_usage: {
    cpu_percent: number;
    memory_percent: number;
    disk_percent: number;
  };
  active_users: number;
  daily_transactions_processed: number;
}

export function useDashboardData() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [analyticsOverview, setAnalyticsOverview] = useState<AnalyticsOverview | null>(null);
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await authenticatedFetch('/api/v2/metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard metrics:', err);
    }
  }, []);

  const fetchRecentActivity = useCallback(async () => {
    try {
      const response = await authenticatedFetch('/api/v2/recent-activity?limit=10');
      if (response.ok) {
        const data = await response.json();
        setRecentActivity(data);
      }
    } catch (err) {
      console.error('Failed to fetch recent activity:', err);
    }
  }, []);

  const fetchSystemHealth = useCallback(async () => {
    try {
      const response = await authenticatedFetch('/api/v2/system-health');
      if (response.ok) {
        const data = await response.json();
        setSystemHealth(data);
      }
    } catch (err) {
      console.error('Failed to fetch system health:', err);
    }
  }, []);

  const fetchAnalyticsOverview = useCallback(async () => {
    try {
      const response = await authenticatedFetch('/api/v2/analytics-overview');
      if (response.ok) {
        const data = await response.json();
        setAnalyticsOverview(data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics overview:', err);
    }
  }, []);

  const fetchQuickStats = useCallback(async () => {
    try {
      const response = await authenticatedFetch('/api/v2/quick-stats');
      if (response.ok) {
        const data = await response.json();
        setQuickStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch quick stats:', err);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchMetrics(),
        fetchRecentActivity(),
        fetchSystemHealth(),
        fetchAnalyticsOverview(),
        fetchQuickStats()
      ]);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard data loading error:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchMetrics, fetchRecentActivity, fetchSystemHealth, fetchAnalyticsOverview, fetchQuickStats]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Set up real-time updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  return {
    metrics,
    recentActivity,
    systemHealth,
    analyticsOverview,
    quickStats,
    loading,
    error,
    refresh: fetchAllData
  };
}