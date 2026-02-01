import { authenticatedFetch } from '../lib/api';

export interface SankeyNode {
  id: string;
  label: string;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export interface SankeyFlowResponse {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export interface VelocityAlert {
  source: string;
  target: string;
  amount: number;
  velocity_id: string;
  timestamp: string;
}

export interface LayeringAnalysis {
  path_id: string;
  hops: number;
  total_value: number;
  entities: string[];
}

export const SankeyService = {
  getFlow: async (projectId: string, caseId: string): Promise<SankeyFlowResponse> => {
    const res = await authenticatedFetch(`/api/v1/forensic/${projectId}/sankey-map/flow/${caseId}`);
    if (!res.ok) throw new Error('Failed to fetch Sankey flow');
    return res.json();
  },

  getHighVelocity: async (projectId: string, caseId: string): Promise<VelocityAlert[]> => {
    const res = await authenticatedFetch(`/api/v1/forensic/${projectId}/sankey-map/high-velocity/${caseId}`);
    if (!res.ok) throw new Error('Failed to fetch high velocity alerts');
    return res.json();
  },

  getLayering: async (projectId: string, caseId: string): Promise<LayeringAnalysis[]> => {
    const res = await authenticatedFetch(`/api/v1/forensic/${projectId}/sankey-map/layering/${caseId}`);
    if (!res.ok) throw new Error('Failed to fetch layering analysis');
    return res.json();
  }
};
