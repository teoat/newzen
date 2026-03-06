import { cache } from 'react';

export interface ProjectData {
  project: {
    name: string;
    code: string;
    status: string;
  };
  financials: {
    contract_value: number;
    total_released: number;
    total_spent_onsite: number;
  };
  leakage: {
    total_leakage: number;
    markup_leakage: number;
  };
  budget_variance?: Array<{
    id?: string;
    item_name?: string;
    category?: string;
    unit_price_rab?: number;
    avg_unit_price_actual?: number;
    markup_percentage?: number;
    volume_discrepancy?: number;
  }>;
}

export interface SCurveData {
  curve_data?: Array<{
    date: string;
    pv: number;
    ac: number;
  }>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const getProjectDashboard = cache(async (projectId: string): Promise<ProjectData> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${API_URL}/api/v2/forensic-v2/analytics/dashboard/${projectId}`, {
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Dashboard API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('[RSC] Failed to fetch project dashboard:', error);
    throw error;
  }
});

export const getSCurveData = cache(async (projectId: string): Promise<SCurveData> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${API_URL}/api/v2/forensic-v2/analytics/s-curve/${projectId}`, {
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`S-Curve API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('[RSC] Failed to fetch S-Curve data:', error);
    throw error;
  }
});

export const getProjectData = cache(async (projectId: string) => {
  const [dashboard, sCurve] = await Promise.all([
    getProjectDashboard(projectId),
    getSCurveData(projectId),
  ]);

  return {
    dashboard,
    sCurve,
  };
});
