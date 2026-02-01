/**
 * Graph Types for ForceGraph2D and Network Visualization
 */

export interface GraphNode {
  id: string;
  name: string;
  label?: string;
  type?: string;
  risk?: number;
  risk_score?: number;
  total_volume?: number;
  centrality?: number;
  x?: number;
  y?: number;
  val?: number;
  [key: string]: unknown;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  value?: number;
  risk_score?: number;
  [key: string]: unknown;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface NetworkData {
  nodes: Array<{
    id: string;
    label: string;
    type?: string;
    risk?: number;
    total_volume?: number;
    centrality?: number;
    [key: string]: unknown;
  }>;
  links: Array<{
    source: string;
    target: string;
    value?: number;
    risk_score?: number;
    [key: string]: unknown;
  }>;
}

export type TabType = 'chat' | 'actions' | 'alerts';

export interface FrenlyTab {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  badge?: number;
}
