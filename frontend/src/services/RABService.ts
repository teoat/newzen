import { authenticatedFetch } from '../lib/api';

export interface RABBudgetLine {
  id: string;
  item_code?: string;
  item_name: string;
  category: string;
  qty_rab: number;
  unit: string;
  unit_price_rab: number;
  total_price_rab: number;
  qty_actual: number;
  avg_unit_price_actual: number;
  markup_percentage: number;
  volume_discrepancy: number;
  requires_justification: boolean;
}

export interface RABUploadResponse {
  status: string;
  lines_imported: number;
  parsing_summary: {
    columns_detected: string[];
    schema_mapping: Record<string, string>;
    schema_confidence: number;
  };
  warnings?: string[];
  error?: string;
}

export interface RABVarianceAnalysis {
  project_id: string;
  summary: {
    original_contract_total: number;
    cco_revised_total: number;
    actual_spend_total: number;
    variance_idr: number;
    variance_pct: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };
  flagged_items: {
    item_code: string;
    item_name: string;
    markup_pct: number;
    volume_diff: number;
    actual_total: number;
    cco_total: number;
  }[];
  top_savings: any[];
  material_forensics: any;
}

export class RABService {
  static async uploadRAB(file: File, projectId: string): Promise<RABUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('project_id', projectId);

    const response = await authenticatedFetch(`/api/v2/forensic-v2/rab/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to upload RAB: ${errorText}`);
    }

    return response.json();
  }

  static async getProjectRAB(projectId: string, category?: string): Promise<{ budget_lines: RABBudgetLine[] }> {
    let endpoint = `/api/v2/forensic-v2/rab/project/${projectId}`;
    if (category) {
      endpoint += `?category=${encodeURIComponent(category)}`;
    }

    const response = await authenticatedFetch(endpoint);
    if (!response.ok) {
      throw new Error('Failed to fetch project RAB');
    }

    return response.json();
  }

  static async getVarianceAnalysis(projectId: string): Promise<RABVarianceAnalysis> {
    const response = await authenticatedFetch(`/api/v2/forensic-v2/rab/variance/${projectId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch variance analysis');
    }

    return response.json();
  }

  static async recalculateVariance(projectId: string): Promise<void> {
    const response = await authenticatedFetch(`/api/v2/forensic-v2/rab/recalculate/${projectId}`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to recalculate variance');
    }
  }
}
