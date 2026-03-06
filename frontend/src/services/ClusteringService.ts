/**
 * Clustering Service
 * 
 * Frontend service for managing clustering API interactions.
 * Provides a clean interface for the clustering endpoints.
 * 
 * Features:
 * - Type-safe API calls
 * - Error handling
 * - Request/response caching
 * - Performance monitoring
 */

import { FocusBubble, ClusteredNetworkData, ClusteringConfig, PerformanceMetrics } from '../hooks/useClustering';

interface ExpandedBubbleData {
  entities: Array<{ id: string; label: string; type: string }>;
  transactions: Array<{ source: string; target: string; amount: number }>;
  stats: { entity_count: number; transaction_count: number };
  metadata: Record<string, unknown>;
}

interface NeighborData {
  bubbleId: string;
  neighbors: FocusBubble[];
  cross_cluster_transactions: Array<{ source: string; target: string; amount: number }>;
  stats: { neighbor_count: number; cross_cluster_transactions: number };
  metadata: Record<string, unknown>;
}

export interface ClusteringServiceOptions {
  baseURL?: string;
  timeout?: number;
  enableCaching?: boolean;
}

export class ClusteringService {
  private baseURL: string;
  private timeout: number;
  private enableCaching: boolean;
  private cache: Map<string, { data: ClusteredNetworkData; timestamp: number; ttl: number }> = new Map();

  constructor(options: ClusteringServiceOptions = {}) {
    this.baseURL = options.baseURL || '/api/v4';
    this.timeout = options.timeout || 30000;
    this.enableCaching = options.enableCaching !== false;
  }

  /**
   * Get clustered network data for a project
   */
  async getClusteredNetwork(
    projectId: string,
    options: {
      zoomLevel?: number;
      includeExpanded?: boolean;
    } = {}
  ): Promise<ClusteredNetworkData> {
    const { zoomLevel = 1.0, includeExpanded = false } = options;
    
    const params = new URLSearchParams({
      zoom_level: zoomLevel.toString(),
      include_expanded: includeExpanded.toString(),
    });

    return this.fetchWithCache(
      `projects/${projectId}/clusters?${params}`,
      `clusters_${projectId}_${zoomLevel.toFixed(2)}_${includeExpanded}`,
      15 * 60 * 1000 // 15 minutes cache
    );
  }

  /**
   * Expand a focus bubble to show internal structure
   */
  async expandBubble(
    projectId: string,
    bubbleId: string
  ): Promise<ExpandedBubbleData> {
    return this.fetch(
      `projects/${projectId}/clusters/${bubbleId}/expand`
    );
  }

  /**
   * Get neighboring bubbles and cross-cluster connections
   */
  async getBubbleNeighbors(
    projectId: string,
    bubbleId: string,
    depth: number = 1
  ): Promise<NeighborData> {
    const params = new URLSearchParams({ depth: depth.toString() });
    return this.fetch(
      `projects/${projectId}/clusters/${bubbleId}/neighbors?${params}`
    );
  }

  /**
   * Get performance metrics for the network dataset
   */
  async getPerformanceMetrics(
    projectId: string,
    datasetSize?: number
  ): Promise<PerformanceMetrics> {
    const params = new URLSearchParams();
    if (datasetSize) {
      params.append('dataset_size', datasetSize.toString());
    }

    return this.fetch(
      `projects/${projectId}/clusters/performance?${params}`
    );
  }

  /**
   * Get current clustering configuration
   */
  async getClusteringConfig(): Promise<ClusteringConfig> {
    return this.fetch('clusters/config');
  }

  /**
   * Update clustering configuration
   */
  async updateClusteringConfig(config: Partial<ClusteringConfig>): Promise<{
    success: boolean;
    message: string;
    new_config: ClusteringConfig;
  }> {
    return this.fetch('clusters/config', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });
  }

  /**
   * Clear clustering cache for a project
   */
  async clearCache(projectId: string): Promise<{
    success: boolean;
    message: string;
    timestamp: string;
  }> {
    const result = await this.fetch(`projects/${projectId}/clusters/clear-cache`, {
      method: 'POST',
    });

    // Clear local cache as well
    this.clearLocalCache();

    return result;
  }

  /**
   * Get clustering service health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'unhealthy';
    clustering_service: 'operational' | 'down';
    configuration: ClusteringConfig;
    timestamp: string;
  }> {
    return this.fetch('clusters/health');
  }

  /**
   * Batch request multiple clustering operations
   */
  async batchRequest(requests: Array<{
    type: 'clusters' | 'expand' | 'neighbors' | 'metrics';
    projectId: string;
    bubbleId?: string;
    options?: Record<string, unknown>;
  }>): Promise<unknown[]> {
    const promises = requests.map(request => {
      switch (request.type) {
        case 'clusters':
          return this.getClusteredNetwork(request.projectId, request.options);
        case 'expand':
          return this.expandBubble(request.projectId, request.bubbleId!);
        case 'neighbors':
          return this.getBubbleNeighbors(
            request.projectId, 
            request.bubbleId!, 
            (request.options as Record<string, unknown>)?.depth as number | undefined
          );
        case 'metrics':
          return this.getPerformanceMetrics(
            request.projectId,
            (request.options as Record<string, unknown>)?.datasetSize as number | undefined
          );
        default:
          throw new Error(`Unknown request type: ${request.type}`);
      }
    });

    return Promise.all(promises);
  }

  /**
   * Pre-warm cache with common zoom levels
   */
  async preWarmCache(
    projectId: string,
    zoomLevels: number[] = [0.1, 0.3, 0.7, 1.0]
  ): Promise<void> {
    const promises = zoomLevels.map(zoomLevel =>
      this.getClusteredNetwork(projectId, { zoomLevel })
    );

    await Promise.allSettled(promises);
  }

  /**
   * Monitor clustering performance
   */
  async monitorPerformance(
    projectId: string,
    intervalMs: number = 30000,
    onMetrics?: (metrics: PerformanceMetrics) => void
  ): Promise<() => void> {
    let intervalId: NodeJS.Timeout;

    const monitor = async () => {
      try {
        const metrics = await this.getPerformanceMetrics(projectId);
        onMetrics?.(metrics);
      } catch (error) {
        console.error('Performance monitoring error:', error);
      }
    };

    // Initial call
    await monitor();

    // Set up interval
    intervalId = setInterval(monitor, intervalMs);

    // Return cleanup function
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }

  /**
   * Generic fetch with error handling and timeout
   */
  private async fetch(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseURL}/${endpoint}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }

      throw new Error('Unknown error occurred');
    }
  }

  /**
   * Fetch with caching support
   */
  private async fetchWithCache(
    endpoint: string,
    cacheKey: string,
    ttlMs: number
  ): Promise<any> {
    // Check cache first
    if (this.enableCaching) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return cached.data;
      }
    }

    // Fetch fresh data
    const data = await this.fetch(endpoint);

    // Cache the result
    if (this.enableCaching) {
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl: ttlMs,
      });

      // Limit cache size
      if (this.cache.size > 100) {
        const oldestKey = this.cache.keys().next().value;
        if (oldestKey) {
          this.cache.delete(oldestKey);
        }
      }
    }

    return data;
  }

  /**
   * Clear local cache
   */
  clearLocalCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    keys: string[];
    totalMemoryEstimate: number;
  } {
    const keys = Array.from(this.cache.keys());
    const totalMemoryEstimate = keys.reduce((sum, key) => {
      const cached = this.cache.get(key);
      if (cached) {
        // Rough estimate of memory usage
        return sum + JSON.stringify(cached.data).length * 2; // 2 bytes per char
      }
      return sum;
    }, 0);

    return {
      size: this.cache.size,
      keys,
      totalMemoryEstimate,
    };
  }

  /**
   * Set custom timeout
   */
  setTimeout(timeout: number): void {
    this.timeout = timeout;
  }

  /**
   * Get current configuration
   */
  getConfig(): {
    baseURL: string;
    timeout: number;
    enableCaching: boolean;
  } {
    return {
      baseURL: this.baseURL,
      timeout: this.timeout,
      enableCaching: this.enableCaching,
    };
  }
}

// Create singleton instance
export const clusteringService = new ClusteringService();

export default clusteringService;