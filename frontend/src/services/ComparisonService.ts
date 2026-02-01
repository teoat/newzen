import { authenticatedFetch } from '../lib/api';

export interface ComparisonSummary {
  total_transactions: number;
  agreed: number;
  disagreed: number;
  app_found_more: number;
  user_found_more: number;
  agreement_rate: number;
}

export interface ComparisonResult {
  row_no: number;
  date: string;
  description: string;
  amount: number;
  app_verdict: string;
  app_reasoning: string[];
  user_marked_as_project: boolean;
  user_comment: string | null;
  match_status: 'agree' | 'disagree';
}

export interface FullComparisonResponse {
  summary: ComparisonSummary;
  comparisons: ComparisonResult[];
  discovered_entities: Record<string, number>;
  discovered_patterns: Record<string, number>;
}

export const ComparisonService = {
  compare: async (projectId: string, bankFile: File, userFile: File): Promise<FullComparisonResponse> => {
    const formData = new FormData();
    formData.append('bank_statement', bankFile);
    formData.append('user_analysis', userFile);

    const res = await authenticatedFetch(`/api/v1/forensic/${projectId}/analyst-comparison/compare?project_id=${projectId}`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) throw new Error('Failed to run comparison analysis');
    return res.json();
  }
};
