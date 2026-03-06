/**
 * Clustering Web Worker
 * 
 * Handles heavy clustering computations in the background
 * to maintain 60FPS performance on the main thread.
 * 
 * Capabilities:
 * - Louvain community detection
 * - Geographic clustering
 * - Hierarchical bubble generation
 * - Performance monitoring
 */

// Note: In a real implementation, you would use a proper import or bundle the library
// For now, we'll implement simplified versions of the needed algorithms

// Types for clustering data
interface EntityNode {
  id: string;
  name: string;
  type: string;
  lat?: number;
  lng?: number;
  city?: string;
  region?: string;
  country?: string;
}

interface TransactionEdge {
  source: string;
  target: string;
  amount: number;
  risk_score: number;
  date: string;
}

interface GraphData {
  nodes: EntityNode[];
  edges: TransactionEdge[];
}

interface ClusterConfig {
  city_threshold: number;
  regional_threshold: number;
  national_threshold: number;
  louvain_resolution: number;
  min_cluster_size: number;
}

interface FocusBubble {
  id: string;
  level: 'city' | 'regional' | 'national';
  center_lat?: number;
  center_lng?: number;
  node_count: number;
  transaction_count: number;
  total_amount: number;
  avg_risk_score: number;
  density: number;
  entities: string[];
  sub_clusters: string[];
  metadata: Record<string, unknown>;
}

interface ClusteringStats {
  total_bubbles: number;
  total_entities: number;
  total_transactions: number;
  avg_cluster_size: number;
  max_cluster_size: number;
  clustering_time_ms: number;
}

interface GeoLocation {
  id: string;
  lat: number;
  lng: number;
}

interface NetworkNode {
  id: string;
  neighbors: string[];
  edges: TransactionEdge[];
  lat?: number;
  lng?: number;
}

interface LODResult {
  lod_level: 'low' | 'medium' | 'high';
  visible_bubbles: number;
  total_bubbles: number;
  rendered_entities: number;
  total_entities: number;
}

interface WorkerMessage {
  type: string;
  data: unknown;
  id?: string;
}

class ClusteringWorker {
  private config: ClusterConfig;
  private performanceMetrics: Record<string, number> = {};

  constructor() {
    this.config = {
      city_threshold: 50,
      regional_threshold: 200,
      national_threshold: 1000,
      louvain_resolution: 1.0,
      min_cluster_size: 3
    };

    // Listen for messages from main thread
    self.onmessage = this.handleMessage.bind(this);
  }

  private async handleMessage(event: MessageEvent<WorkerMessage>) {
    const { type, data, id } = event.data;
    
    try {
      let result;
      
      switch (type) {
        case 'CONFIGURE':
          this.updateConfig(data as Partial<ClusterConfig>);
          result = { success: true, config: this.config };
          break;
          
        case 'CLUSTER':
          result = await this.performClustering(data as { graph: GraphData; zoomLevel: number; level: string });
          break;
          
        case 'EXPAND_BUBBLE':
          result = await this.expandBubble(data as { bubbleId: string; graph: GraphData });
          break;
          
        case 'CALCULATE_LOD':
          result = this.calculateLOD(data as { bubbles: FocusBubble[]; zoomLevel: number });
          break;
          
        default:
          throw new Error(`Unknown message type: ${type}`);
      }
      
      // Send success response
      self.postMessage({
        type: `${type}_SUCCESS`,
        data: result,
        id
      });
      
    } catch (error) {
      // Send error response
      self.postMessage({
        type: `${type}_ERROR`,
        error: error instanceof Error ? error.message : 'Unknown error',
        id
      });
    }
  }

  private updateConfig(newConfig: Partial<ClusterConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  private async performClustering(data: {
    graph: GraphData;
    zoomLevel: number;
    level: string;
  }): Promise<{ bubbles: FocusBubble[]; stats: ClusteringStats }> {
    const startTime = performance.now();
    
    const { graph, zoomLevel, level } = data;
    
    // Determine clustering parameters based on zoom level
    const clusterConfig = this.getClusterConfig(zoomLevel, level);
    
    // Create network graph for clustering
    const network = this.createNetwork(graph);
    
    // Apply community detection
    const communities = this.detectCommunities(network, clusterConfig);
    
    // Filter and merge clusters
    const filteredClusters = this.filterAndMergeClusters(
      communities, network, clusterConfig
    );
    
    // Generate focus bubbles
    const bubbles = this.createFocusBubbles(
      filteredClusters, graph, clusterConfig.level
    );
    
    // Calculate performance metrics
    const endTime = performance.now();
    this.performanceMetrics['clustering_time_ms'] = endTime - startTime;
    
    const stats = {
      total_bubbles: bubbles.length,
      total_entities: graph.nodes.length,
      total_transactions: graph.edges.length,
      avg_cluster_size: bubbles.length > 0 
        ? bubbles.reduce((sum, b) => sum + b.node_count, 0) / bubbles.length 
        : 0,
      max_cluster_size: bubbles.length > 0 
        ? Math.max(...bubbles.map(b => b.node_count))
        : 0,
      clustering_time_ms: this.performanceMetrics['clustering_time_ms']
    };
    
    return { bubbles, stats };
  }

  private getClusterConfig(zoomLevel: number, requestedLevel: string) {
    let level: 'city' | 'regional' | 'national';
    let threshold: number;
    
    if (zoomLevel <= 0.3) {
      level = 'national';
      threshold = this.config.national_threshold;
    } else if (zoomLevel <= 0.7) {
      level = 'regional';
      threshold = this.config.regional_threshold;
    } else {
      level = 'city';
      threshold = this.config.city_threshold;
    }
    
    // Override with requested level if specified
    if (requestedLevel && ['city', 'regional', 'national'].includes(requestedLevel)) {
      level = requestedLevel as 'city' | 'regional' | 'national';
      threshold = this.config[`${level}_threshold`];
    }
    
    return { level, threshold };
  }

  private createNetwork(graph: GraphData) {
    // Create node lookup for efficient access
    const nodes = new Map();
    graph.nodes.forEach(node => {
      nodes.set(node.id, node);
    });
    
    // Create adjacency list with geographic weights
    const network = new Map();
    
    graph.nodes.forEach(node => {
      network.set(node.id, {
        ...node,
        neighbors: new Set(),
        weights: new Map()
      });
    });
    
    // Add edges with geographic weighting
    graph.edges.forEach(edge => {
      const source = network.get(edge.source);
      const target = network.get(edge.target);
      
      if (source && target) {
        source.neighbors.add(target.id);
        target.neighbors.add(source.id);
        
        // Calculate geographic weight
        let geoWeight = 1.0;
        if (source.lat && source.lng && target.lat && target.lng) {
          const distance = this.calculateDistance(
            source.lat, source.lng, target.lat, target.lng
          );
          geoWeight = 1.0 / (1.0 + distance * 100);
        }
        
        // Combined weight (transaction amount + geographic proximity)
        const combinedWeight = edge.amount * (1.0 + 0.3 * geoWeight);
        
        source.weights.set(target.id, combinedWeight);
        target.weights.set(source.id, combinedWeight);
      }
    });
    
    return network;
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    // Simple Euclidean distance (good enough for clustering)
    return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2));
  }

  private detectCommunities(
    network: Map<string, any>,
    config: { level: string; threshold: number }
  ): Map<string, Set<string>> {
    // Simplified Louvain implementation
    // In production, use a proper library like 'louvain-javascript'
    
    const communities = new Map();
    let nodeId = 0;
    
    // Initialize each node as its own community
    network.forEach((node, nodeId) => {
      communities.set(nodeId, new Set([nodeId]));
    });
    
    // Iteratively merge communities based on modularity
    let improved = true;
    while (improved) {
      improved = false;
      const communityArray = Array.from(communities.entries());
      
      for (let i = 0; i < communityArray.length; i++) {
        for (let j = i + 1; j < communityArray.length; j++) {
          const [id1, comm1] = communityArray[i];
          const [id2, comm2] = communityArray[j];
          
          if (this.shouldMerge(comm1, comm2, network)) {
            // Merge communities
            const merged = new Set([...comm1, ...comm2]);
            communities.set(id1, merged);
            communities.delete(id2);
            improved = true;
            break;
          }
        }
        if (improved) break;
      }
    }
    
    return communities;
  }

  private shouldMerge(
    comm1: Set<string>,
    comm2: Set<string>,
    network: Map<string, any>
  ): boolean {
    // Calculate connection strength between communities
    let connectionsBetween = 0;
    let totalConnections = 0;
    
    comm1.forEach(node1Id => {
      const node1 = network.get(node1Id);
      node1.neighbors.forEach((neighborId: string) => {
        totalConnections++;
        if (comm2.has(neighborId)) {
          connectionsBetween++;
        }
      });
    });
    
    // Merge if strong connection
    const ratio = connectionsBetween / totalConnections;
    return ratio > 0.3; // 30% of connections are between communities
  }

  private filterAndMergeClusters(
    communities: Map<string, Set<string>>,
    network: Map<string, any>,
    config: { level: string; threshold: number }
  ): Map<string, Set<string>> {
    const filtered = new Map();
    const smallClusters: string[] = [];
    
    // Filter by size
    communities.forEach((members, communityId) => {
      if (members.size >= this.config.min_cluster_size) {
        if (members.size <= config.threshold) {
          filtered.set(communityId, members);
        } else {
          // Split large clusters
          const subClusters = this.splitLargeCluster(
            Array.from(members), network, config.threshold
          );
          subClusters.forEach((subCluster, index) => {
            filtered.set(`${communityId}_${index}`, subCluster);
          });
        }
      } else {
        smallClusters.push(communityId);
      }
    });
    
    // Merge small clusters into nearest ones
    if (smallClusters.length > 0 && filtered.size > 0) {
      this.mergeSmallClusters(smallClusters, communities, filtered, network);
    }
    
    return filtered;
  }

  private splitLargeCluster(
    members: string[],
    network: Map<string, NetworkNode>,
    threshold: number
  ): Set<string>[] {
    if (members.length <= threshold) {
      return [new Set(members)];
    }
    
    // Get geographic coordinates if available
    const locations: GeoLocation[] = members
      .map(memberId => {
        const node = network.get(memberId);
        return node && node.lat && node.lng
          ? { id: memberId, lat: node.lat, lng: node.lng }
          : null;
      })
      .filter((loc): loc is GeoLocation => loc !== null);
    
    if (locations.length >= 2) {
      // Use k-means clustering on geographic coordinates
      return this.kMeansClustering(locations, Math.ceil(members.length / threshold));
    } else {
      // Fallback: split by connected components
      return this.splitByConnectivity(members, network, threshold);
    }
  }

  private kMeansClustering(
    locations: GeoLocation[],
    k: number
  ): Set<string>[] {
    // Simple k-means implementation
    const clusters = Array.from({ length: k }, () => new Set<string>());
    
    // Initialize centroids randomly from locations
    const centroids = locations
      .sort(() => Math.random() - 0.5)
      .slice(0, k)
      .map(loc => ({ lat: loc.lat, lng: loc.lng }));
    
    // Assign points to nearest centroid
    locations.forEach(location => {
      let minDistance = Infinity;
      let nearestCluster = 0;
      
      centroids.forEach((centroid, index) => {
        const distance = this.calculateDistance(
          location.lat, location.lng,
          centroid.lat, centroid.lng
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearestCluster = index;
        }
      });
      
      clusters[nearestCluster].add(location.id);
    });
    
    return clusters.filter(cluster => cluster.size > 0);
  }

  private splitByConnectivity(
    members: string[],
    network: Map<string, any>,
    threshold: number
  ): Set<string>[] {
    const clusters: Set<string>[] = [];
    const visited = new Set<string>();
    
    members.forEach(memberId => {
      if (!visited.has(memberId)) {
        const cluster = new Set<string>();
        const queue = [memberId];
        
        while (queue.length > 0 && cluster.size < threshold) {
          const current = queue.shift()!;
          if (visited.has(current)) continue;
          
          visited.add(current);
          cluster.add(current);
          
          // Add neighbors
          const node = network.get(current);
          node.neighbors.forEach((neighborId: string) => {
            if (!visited.has(neighborId) && members.includes(neighborId)) {
              queue.push(neighborId);
            }
          });
        }
        
        clusters.push(cluster);
      }
    });
    
    return clusters;
  }

  private mergeSmallClusters(
    smallClusterIds: string[],
    originalCommunities: Map<string, Set<string>>,
    filteredClusters: Map<string, Set<string>>,
    network: Map<string, any>
  ): void {
    smallClusterIds.forEach(smallId => {
      const smallMembers = originalCommunities.get(smallId);
      if (!smallMembers) return;
      
      // Find best cluster to merge into
      let bestCluster: string | null = null;
      let maxConnections = 0;
      
      filteredClusters.forEach((members, clusterId) => {
        const connections = this.countConnectionsBetween(
          Array.from(smallMembers), Array.from(members), network
        );
        
        if (connections > maxConnections) {
          maxConnections = connections;
          bestCluster = clusterId;
        }
      });
      
      // Merge into best cluster
      if (bestCluster) {
        const targetCluster = filteredClusters.get(bestCluster)!;
        smallMembers.forEach((member: string) => targetCluster.add(member));
      }
    });
  }

  private countConnectionsBetween(
    group1: string[],
    group2: string[],
    network: Map<string, NetworkNode>
  ): number {
    let connections = 0;
    
    group1.forEach(node1Id => {
      const node1 = network.get(node1Id);
      if (node1) {
        node1.neighbors.forEach((neighborId: string) => {
          if (group2.includes(neighborId)) {
            connections++;
          }
        });
      }
    });
    
    return connections;
  }

  private createFocusBubbles(
    clusters: Map<string, Set<string>>,
    graph: GraphData,
    level: 'city' | 'regional' | 'national'
  ): FocusBubble[] {
    const bubbles: FocusBubble[] = [];
    
    // Create entity lookup
    const entities = new Map();
    graph.nodes.forEach(node => {
      entities.set(node.id, node);
    });
    
    // Create edge lookup
    const edges = new Map<string, TransactionEdge[]>();
    graph.edges.forEach(edge => {
      if (!edges.has(edge.source)) edges.set(edge.source, []);
      if (!edges.has(edge.target)) edges.set(edge.target, []);
      edges.get(edge.source)!.push(edge);
      edges.get(edge.target)!.push(edge);
    });
    
    clusters.forEach((members, clusterId) => {
      const memberArray = Array.from(members);
      
      // Calculate geographic center
      const lats = memberArray
        .map(id => entities.get(id)?.lat)
        .filter(Boolean);
      const lngs = memberArray
        .map(id => entities.get(id)?.lng)
        .filter(Boolean);
      
      const center_lat = lats.length > 0 ? lats.reduce((a, b) => a + b, 0) / lats.length : undefined;
      const center_lng = lngs.length > 0 ? lngs.reduce((a, b) => a + b, 0) / lngs.length : undefined;
      
      // Calculate transaction statistics
      let transactionCount = 0;
      let totalAmount = 0;
      let riskScores: number[] = [];
      
      memberArray.forEach(entityId => {
        const entityEdges = edges.get(entityId) || [];
        entityEdges.forEach((edge: TransactionEdge) => {
          if (memberArray.includes(edge.source) && memberArray.includes(edge.target)) {
            transactionCount++;
            totalAmount += edge.amount;
            riskScores.push(edge.risk_score);
          }
        });
      });
      
      const avgRiskScore = riskScores.length > 0 
        ? riskScores.reduce((a, b) => a + b, 0) / riskScores.length 
        : 0;
      
      // Calculate density
      const density = this.calculateClusterDensity(memberArray, edges);
      
      bubbles.push({
        id: `${level}_${clusterId}`,
        level,
        center_lat,
        center_lng,
        node_count: memberArray.length,
        transaction_count: transactionCount,
        total_amount: totalAmount,
        avg_risk_score: avgRiskScore,
        density,
        entities: memberArray,
        sub_clusters: [],
        metadata: {
          created_at: new Date().toISOString(),
          entity_types: [...new Set(memberArray.map(id => entities.get(id)?.type).filter(Boolean))],
          has_geographic_data: lats.length > 0
        }
      });
    });
    
    // Sort by size (largest first)
    bubbles.sort((a, b) => b.node_count - a.node_count);
    
    return bubbles;
  }

  private calculateClusterDensity(entities: string[], edges: Map<string, TransactionEdge[]>): number {
    if (entities.length < 2) return 1.0;
    
    let internalConnections = 0;
    const maxPossible = entities.length * (entities.length - 1);
    
    entities.forEach(entityId => {
      const entityEdges = edges.get(entityId) || [];
      entityEdges.forEach(edge => {
        const otherEntityId: string = edge.source === entityId ? edge.target : edge.source;
        if (entities.includes(otherEntityId)) {
          internalConnections++;
        }
      });
    });
    
    // Divide by 2 since each connection is counted twice
    internalConnections = Math.floor(internalConnections / 2);
    
    return internalConnections / maxPossible;
  }

  private async expandBubble(data: {
    bubbleId: string;
    graph: GraphData;
  }): Promise<any> {
    // Extract cluster information from bubble ID
    const [level, clusterId] = data.bubbleId.split('_');
    
    // This would contain the actual expansion logic
    // For now, return a placeholder
    return {
      bubbleId: data.bubbleId,
      entities: [],
      transactions: [],
      stats: {
        entity_count: 0,
        transaction_count: 0,
        total_amount: 0,
        avg_risk_score: 0
      }
    };
  }

  private calculateLOD(data: {
    bubbles: FocusBubble[];
    zoomLevel: number;
  }): LODResult {
    const { bubbles, zoomLevel } = data;
    
    // Determine LOD level
    let lodLevel: 'low' | 'medium' | 'high';
    if (zoomLevel <= 0.3) {
      lodLevel = 'low';
    } else if (zoomLevel <= 0.7) {
      lodLevel = 'medium';
    } else {
      lodLevel = 'high';
    }
    
    // Filter bubbles based on LOD
    let filteredBubbles: FocusBubble[];
    switch (lodLevel) {
      case 'low':
        filteredBubbles = bubbles.filter(b => b.node_count > 100);
        break;
      case 'medium':
        filteredBubbles = bubbles.filter(b => b.node_count > 20);
        break;
      default:
        filteredBubbles = bubbles;
    }
    
    return {
      lod_level: lodLevel,
      visible_bubbles: filteredBubbles.length,
      total_bubbles: bubbles.length,
      rendered_entities: filteredBubbles.reduce((sum, b) => sum + b.node_count, 0),
      total_entities: bubbles.reduce((sum, b) => sum + b.node_count, 0)
    };
  }
}

// Initialize the clustering worker
new ClusteringWorker();