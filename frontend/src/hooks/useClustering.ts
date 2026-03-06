/**
 * useClustering Hook
 * 
 * Custom hook for managing multi-scale clustering functionality.
 * Provides state management and API integration for the clustering system.
 * 
 * Features:
 * - Automatic zoom-based clustering
 * - Bubble expansion management
 * - Performance optimization
 * - Error handling and fallbacks
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Simple debounce implementation
function debounce<T extends (...args: never[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Types
interface FocusBubble {
  id: string;
  level: 'city' | 'regional' | 'national';
  position?: {
    lat?: number;
    lng?: number;
  };
  size: number;
  density: number;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high';
  size_category: 'small' | 'medium' | 'large' | 'xlarge';
  transaction_count: number;
  total_amount: number;
  entity_types: string[];
  has_geographic_data: boolean;
  expandable: boolean;
  expanded: boolean;
}

interface ExpandedBubbleData {
  entities: Array<{ id: string; label: string; type: string }>;
  transactions: Array<{ source: string; target: string; amount: number }>;
  total_entities: number;
  total_transactions: number;
}

interface NetworkStats {
  node_count: number;
  edge_count: number;
  density: number;
  avg_degree: number;
}

interface ClusteringStats {
  total_entities: number;
  total_clusters: number;
  avg_cluster_size: number;
  largest_cluster: number;
}

interface ClusteringMetadata {
  clustering_enabled: boolean;
  cluster_level: 'city' | 'regional' | 'national';
  zoom_level: number;
  timestamp: string;
  fallback_mode?: boolean;
}

interface ClusteredNetworkData {
  bubbles: FocusBubble[];
  expanded_data: Record<string, ExpandedBubbleData>;
  network_stats: NetworkStats;
  clustering_stats: ClusteringStats;
  lod_data: Record<string, unknown>;
  metadata: ClusteringMetadata;
}

interface ClusteringConfig {
  city_threshold: number;
  regional_threshold: number;
  national_threshold: number;
  louvain_resolution: number;
  min_cluster_size: number;
}

interface PerformanceMetrics {
  network_stats: NetworkStats;
  clustering_performance: {
    total_time_ms: number;
    parse_time_ms: number;
    cluster_time_ms: number;
    render_time_ms: number;
  };
  rendering_strategy: {
    strategy: string;
    use_web_workers: boolean;
    lod_enabled: boolean;
    max_bubbles: number;
    estimated_render_time_ms: number;
  };
  recommendations: string[];
  metadata: {
    project_id: string;
    dataset_size: number;
    timestamp: string;
  };
}

interface UseClusteringOptions {
  projectId: string;
  enableClustering?: boolean;
  initialZoomLevel?: number;
  autoOptimize?: boolean;
  cacheEnabled?: boolean;
  debounceMs?: number;
}

interface UseClusteringReturn {
  // State
  clusteredData: ClusteredNetworkData | null;
  isLoading: boolean;
  error: string | null;
  zoomLevel: number;
  expandedBubbles: Set<string>;
  selectedBubble: FocusBubble | null;
  config: ClusteringConfig | null;
  performanceMetrics: PerformanceMetrics | null;
  
  // Computed values
  isClusteringEnabled: boolean;
  currentClusteringLevel: 'city' | 'regional' | 'national' | null;
  bubbleCount: number;
  totalEntities: number;
  shouldUseWorkers: boolean;
  lodLevel: 'low' | 'medium' | 'high';
  
  // Actions
  fetchClusteredData: (zoomLevel?: number) => Promise<void>;
  expandBubble: (bubbleId: string) => Promise<void>;
  collapseBubble: (bubbleId: string) => void;
  setZoomLevel: (zoomLevel: number) => void;
  updateConfig: (newConfig: Partial<ClusteringConfig>) => Promise<void>;
  getPerformanceMetrics: () => Promise<void>;
  clearCache: () => Promise<void>;
  refreshData: () => Promise<void>;
}

// Default clustering configuration
const DEFAULT_CONFIG: ClusteringConfig = {
  city_threshold: 50,
  regional_threshold: 200,
  national_threshold: 1000,
  louvain_resolution: 1.0,
  min_cluster_size: 3
};

// Hook implementation
export function useClustering(options: UseClusteringOptions): UseClusteringReturn {
  const {
    projectId,
    enableClustering = true,
    initialZoomLevel = 1.0,
    autoOptimize = true,
    cacheEnabled = true,
    debounceMs = 300
  } = options;

  // State
  const [clusteredData, setClusteredData] = useState<ClusteredNetworkData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevelState] = useState(initialZoomLevel);
  const [expandedBubbles, setExpandedBubbles] = useState<Set<string>>(new Set());
  const [selectedBubble, setSelectedBubble] = useState<FocusBubble | null>(null);
  const [config, setConfig] = useState<ClusteringConfig | null>(DEFAULT_CONFIG);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);

  // Refs
  const cacheRef = useRef<Map<string, ClusteredNetworkData>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  // Computed values
  const isClusteringEnabled = enableClustering && clusteredData?.metadata?.clustering_enabled !== false;
  const currentClusteringLevel = clusteredData?.metadata?.cluster_level || null;
  const bubbleCount = clusteredData?.bubbles?.length || 0;
  const totalEntities = clusteredData?.clustering_stats?.total_entities || 0;
  const shouldUseWorkers = performanceMetrics?.rendering_strategy?.use_web_workers || totalEntities > 1000;
  const lodLevel = (zoomLevel <= 0.3 ? 'low' : zoomLevel <= 0.7 ? 'medium' : 'high') as 'low' | 'medium' | 'high';

  // Fetch clustered network data
  const fetchClusteredData = useCallback(async (targetZoomLevel?: number) => {
    if (!projectId || !enableClustering) return;

    const zoom = targetZoomLevel ?? zoomLevel;
    const cacheKey = `clusters_${String(projectId)}_${zoom.toFixed(2)}`;

    // Check cache first
    if (cacheEnabled && cacheRef.current.has(cacheKey)) {
      const cachedData = cacheRef.current.get(cacheKey);
      if (cachedData) {
        setClusteredData(cachedData);
      }
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/v4/projects/${projectId}/clusters?zoom_level=${zoom}&include_expanded=true`,
        {
          signal: abortControllerRef.current.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch clustered data: ${response.statusText}`);
      }

      const data: ClusteredNetworkData = await response.json();

      // Cache the result
      if (cacheEnabled) {
        cacheRef.current.set(cacheKey, data);
        
        // Limit cache size
        if (cacheRef.current.size > 50) {
          const firstKey = cacheRef.current.keys().next().value;
          if (firstKey) {
            cacheRef.current.delete(firstKey);
          }
        }
      }

      setClusteredData(data);

      // Auto-optimize if enabled
      if (autoOptimize && data.metadata?.fallback_mode) {
        console.warn('Clustering fell back to traditional mode due to performance constraints');
      }

    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
        console.error('Error fetching clustered data:', err);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [projectId, enableClustering, zoomLevel, cacheEnabled, autoOptimize]);

  // Debounced zoom level handler
  const debouncedZoomChange = useCallback(
    (newZoomLevel: number) => {
      const handler = debounce((zoom: number) => {
        if (isClusteringEnabled) {
          fetchClusteredData(zoom);
        }
      }, debounceMs);
      handler(newZoomLevel);
    },
    [isClusteringEnabled, fetchClusteredData, debounceMs]
  );

  // Expand a bubble
  const expandBubble = useCallback(async (bubbleId: string) => {
    if (!projectId) return;

    try {
      const response = await fetch(`/api/v4/projects/${projectId}/clusters/${bubbleId}/expand`);
      
      if (!response.ok) {
        throw new Error(`Failed to expand bubble: ${response.statusText}`);
      }

      const expandedData = await response.json();

      // Update expanded bubbles state
      setExpandedBubbles(prev => new Set(prev).add(bubbleId));

      // Update clustered data with expanded information
      setClusteredData(prev => prev ? {
        ...prev,
        expanded_data: {
          ...prev.expanded_data,
          [bubbleId]: expandedData
        }
      } : null);

      // Set selected bubble
      const bubble = clusteredData?.bubbles.find(b => b.id === bubbleId);
      if (bubble) {
        setSelectedBubble(bubble);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to expand bubble');
      console.error('Error expanding bubble:', err);
    }
  }, [projectId, clusteredData]);

  // Collapse a bubble
  const collapseBubble = useCallback((bubbleId: string) => {
    setExpandedBubbles(prev => {
      const next = new Set(prev);
      next.delete(bubbleId);
      return next;
    });

    // Remove expanded data
    setClusteredData(prev => prev ? {
      ...prev,
      expanded_data: Object.fromEntries(
        Object.entries(prev.expanded_data).filter(([key]) => key !== bubbleId)
      )
    } : null);

    // Clear selection if this bubble was selected
    if (selectedBubble?.id === bubbleId) {
      setSelectedBubble(null);
    }
  }, [selectedBubble]);

  // Set zoom level with debouncing
  const setZoomLevel = useCallback((newZoomLevel: number) => {
    const clampedZoom = Math.max(0, Math.min(1, newZoomLevel));
    setZoomLevelState(clampedZoom);
    if (isClusteringEnabled) {
      fetchClusteredData(clampedZoom);
    }
  }, [isClusteringEnabled, fetchClusteredData]);

  // Update clustering configuration
  const updateConfig = useCallback(async (newConfig: Partial<ClusteringConfig>) => {
    try {
      const response = await fetch('/api/v4/clusters/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newConfig),
      });

      if (!response.ok) {
        throw new Error(`Failed to update config: ${response.statusText}`);
      }

      const updatedConfig = await response.json();
      setConfig(updatedConfig.new_config);

      // Clear cache to force re-computation
      cacheRef.current.clear();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update config');
      console.error('Error updating config:', err);
    }
  }, []);

  // Get performance metrics
  const getPerformanceMetrics = useCallback(async () => {
    if (!projectId) return;

    try {
      const response = await fetch(`/api/v4/projects/${projectId}/clusters/performance`);
      
      if (!response.ok) {
        throw new Error(`Failed to get performance metrics: ${response.statusText}`);
      }

      const metrics: PerformanceMetrics = await response.json();
      setPerformanceMetrics(metrics);

      // Auto-optimize config based on metrics if enabled
      if (autoOptimize) {
        const recommendations = metrics.recommendations || [];
        const optimizations: Partial<ClusteringConfig> = {};

        if (recommendations.includes('Increase clustering cache TTL')) {
          // Would adjust cache TTL in a real implementation
        }

        if (recommendations.includes('Consider pre-computing clusters')) {
          optimizations.city_threshold = Math.max(config?.city_threshold || 50, 100);
        }

        if (Object.keys(optimizations).length > 0) {
          await updateConfig(optimizations);
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get performance metrics');
      console.error('Error getting performance metrics:', err);
    }
  }, [projectId, config, autoOptimize, updateConfig]);

  // Clear cache
  const clearCache = useCallback(async () => {
    if (!projectId) return;

    try {
      await fetch(`/api/v4/projects/${projectId}/clusters/clear-cache`, {
        method: 'POST',
      });

      cacheRef.current.clear();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cache');
      console.error('Error clearing cache:', err);
    }
  }, [projectId]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    cacheRef.current.clear();
    if (projectId) {
      await fetchClusteredData();
      await getPerformanceMetrics();
    }
  }, [fetchClusteredData, getPerformanceMetrics, projectId]);

  // Initial data fetch
  useEffect(() => {
    if (projectId && enableClustering) {
      fetchClusteredData();
      getPerformanceMetrics();
    }
  }, [projectId, enableClustering, fetchClusteredData, getPerformanceMetrics]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // State
    clusteredData,
    isLoading,
    error,
    zoomLevel,
    expandedBubbles,
    selectedBubble,
    config,
    performanceMetrics,

    // Computed values
    isClusteringEnabled,
    currentClusteringLevel,
    bubbleCount,
    totalEntities,
    shouldUseWorkers,
    lodLevel,

    // Actions
    fetchClusteredData,
    expandBubble,
    collapseBubble,
    setZoomLevel,
    updateConfig,
    getPerformanceMetrics,
    clearCache,
    refreshData,
  };
}

// Helper function to calculate optimal zoom level for dataset size
export function calculateOptimalZoomLevel(entityCount: number): number {
  if (entityCount > 10000) return 0.1;  // National level
  if (entityCount > 1000) return 0.3;   // Regional level
  if (entityCount > 100) return 0.7;    // City level
  return 1.0;                           // Individual entities
}

// Helper function to determine if clustering should be enabled
export function shouldEnableClustering(entityCount: number, userPreference?: boolean): boolean {
  if (userPreference !== undefined) return userPreference;
  return entityCount > 50; // Auto-enable for larger datasets
}

export type { UseClusteringOptions, UseClusteringReturn, FocusBubble, ClusteredNetworkData, ClusteringConfig, PerformanceMetrics };