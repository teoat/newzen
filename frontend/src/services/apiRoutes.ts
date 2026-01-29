/**
 * Centralized API Routes Configuration
 * Single source of truth for all API endpoints with TypeScript interfaces
 */

// Environment-based API URL
const getApiUrl = (): string => {
  if (typeof window !== 'undefined') {
    // Client-side: use environment variable if defined (even if empty), otherwise default
    // We explicitly check for undefined to allow empty string (relative path)
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    return envUrl !== undefined ? envUrl : 'http://localhost:8200';
  }
  // Server-side
  return process.env.API_URL || 'http://localhost:8200';
};

export const API_URL = getApiUrl();

/**
 * Complete API Routes Definition
 */
export const API_ROUTES = {
  BASE_URL: API_URL,

  // System & Health
  SYSTEM: {
    HEALTH: `${API_URL}/health`,
    HEALTH_DETAILED: `${API_URL}/health/detailed`,
    METRICS: `${API_URL}/metrics`,
  },

  // Authentication & Authorization
  AUTH: {
    LOGIN: `${API_URL}/api/v1/auth/login`,
    REGISTER: `${API_URL}/api/v1/auth/register`,
    LOGOUT: `${API_URL}/api/v1/auth/logout`,
    ME: `${API_URL}/api/v1/auth/me`,
    REFRESH: `${API_URL}/api/v1/auth/refresh`,
    RESET_PASSWORD: `${API_URL}/api/v1/auth/reset-password`,
  },

  // Projects
  PROJECTS: {
    LIST: `${API_URL}/api/v1/project`,
    CREATE: `${API_URL}/api/v1/project`,
    DETAIL: (id: string) => `${API_URL}/api/v1/project/${id}`,
    UPDATE: (id: string) => `${API_URL}/api/v1/project/${id}`,
    DELETE: (id: string) => `${API_URL}/api/v1/project/${id}`,
    USERS: (id: string) => `${API_URL}/api/v1/admin/project/${id}/users`,
    S_CURVE: (id: string) => `${API_URL}/api/v1/project/${id}/s-curve-data`,
    TRANSACTIONS: (id: string) => `${API_URL}/api/v1/project/${id}/transactions`,
  },

  // Transactions
  TRANSACTIONS: {
    LIST: (projectId: string) => `${API_URL}/api/v1/project/${projectId}/transactions`,
    CREATE: (projectId: string) => `${API_URL}/api/v1/project/${projectId}/transaction`,
    DETAIL: (projectId: string, txId: string) => `${API_URL}/api/v1/project/${projectId}/transaction/${txId}`,
    UPDATE: (projectId: string, txId: string) => `${API_URL}/api/v1/project/${projectId}/transaction/${txId}`,
    DELETE: (projectId: string, txId: string) => `${API_URL}/api/v1/project/${projectId}/transaction/${txId}`,
  },

  // Reconciliation
  RECONCILIATION: {
    BANK: (projectId: string) => `${API_URL}/api/v1/reconciliation/${projectId}/bank`,
    INTERNAL: (projectId: string) => `${API_URL}/api/v1/reconciliation/${projectId}/internal`,
    SUGGESTED_MATCHES: (projectId: string) => `${API_URL}/api/v1/reconciliation/${projectId}/suggested`,
    SEMANTIC_MATCHES: (projectId: string) => `${API_URL}/api/v1/reconciliation/${projectId}/semantic`,
    CONFIRM: (projectId: string, matchId: string) => `${API_URL}/api/v1/reconciliation/${projectId}/confirm/${matchId}`,
    AUTO_CONFIRM: (projectId: string) => `${API_URL}/api/v1/reconciliation/${projectId}/auto-confirm`,
    STATS: (projectId: string) => `${API_URL}/api/v1/reconciliation/${projectId}/stats`,
    SETTINGS: (projectId?: string) => `${API_URL}/api/v1/reconciliation/settings${projectId ? `/${projectId}` : ''}`,
  },

  // Forensic Analysis
  FORENSIC: {
    DASHBOARD_STATS: (projectId: string) => `${API_URL}/api/v1/forensic/${projectId}/dashboard-stats`,
    TIMELINE: (projectId: string) => `${API_URL}/api/v1/forensic/${projectId}/timeline`,
    CHRONOLOGY: (projectId: string) => `${API_URL}/api/v1/forensic/${projectId}/chronology`,
    FORECAST: (projectId: string) => `${API_URL}/api/v1/forensic/${projectId}/forecast`,
    UBO: (projectId: string, entityId: string) => `${API_URL}/api/v1/forensic/ubo/${projectId}/${entityId}`,
    COMPLIANCE: (projectId: string) => `${API_URL}/api/v1/compliance/${projectId}/report`,
    NEXUS: (projectId: string) => `${API_URL}/api/v1/forensic/nexus/${projectId}`,
    FAMILY_TREE: (projectId: string) => `${API_URL}/api/v1/forensic/${projectId}/family-tree`,
    RECOVERY_PROFILE: (projectId: string) => `${API_URL}/api/v1/forensic/recovery-profile/${projectId}`,
  },

  // AI Services
  AI: {
    ASSIST: `${API_URL}/api/v1/ai/assist`,
    QUERY: `${API_URL}/api/v1/ai/query`,
    ALERTS: (projectId: string) => `${API_URL}/api/v1/ai/alerts?project_id=${projectId}`,
    HISTORY: (sessionId: string) => `${API_URL}/api/v1/ai/conversation-history/${sessionId}`,
    DOSSIER: (caseId: string) => `${API_URL}/api/v1/ai/dossier/${caseId}`,
    DOSSIER_PROFESSIONAL: (caseId: string) => `${API_URL}/api/v1/ai/dossier-professional/${caseId}`,
    CONTRADICTIONS: (caseId: string) => `${API_URL}/api/v1/ai/contradictions/${caseId}`,
    MULTIMODAL: `${API_URL}/api/v1/ai/multimodal`,
    VOICE: `${API_URL}/api/v1/ai/voice`,
  },

  // Data Ingestion
  INGESTION: {
    CONSOLIDATE: `${API_URL}/api/v1/ingestion/consolidate`,
    STATUS: (id: string) => `${API_URL}/api/v1/ingestion/status/${id}`,
    HISTORY: (projectId: string) => `${API_URL}/api/v1/ingestion/history/${projectId}`,
    VALIDATE: `${API_URL}/api/v1/ingestion/validate`,
    VERIFY: (hash: string) => `${API_URL}/api/v1/ingestion/verify-integrity/${hash}`,
    NOTARIZE: (batchId: string) => `${API_URL}/api/v1/evidence/notarize/batch/${batchId}`,
    SAMPLE_DATA: `${API_URL}/api/v1/ingestion/sample-data`,
  },

  // Assets
  ASSETS: {
    LIST: (projectId: string) => `${API_URL}/api/v1/assets/${projectId}`,
    FREEZE: (assetId: string) => `${API_URL}/api/v1/assets/${assetId}/freeze`,
    WARRANT: (assetId: string) => `${API_URL}/api/v1/assets/${assetId}/generate-warrant`,
  },

  // Currency
  CURRENCY: {
    CONVERT: `${API_URL}/api/v1/currency/convert`,
    RATES: `${API_URL}/api/v1/currency/rates`,
    SUPPORTED: `${API_URL}/api/v1/currency/supported`,
  },

  // Admin
  ADMIN: {
    USERS: `${API_URL}/api/v1/admin/users`,
    USER_DETAIL: (id: string) => `${API_URL}/api/v1/admin/users/${id}`,
    ANALYTICS: `${API_URL}/api/v1/admin/analytics`,
  },
};

/**
 * TypeScript Interfaces for API Requests/Responses
 */

// System
export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  service: string;
}

export interface DetailedHealthResponse extends HealthResponse {
  overall_status: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    database: ComponentHealth;
    redis: ComponentHealth;
    ai_service: ComponentHealth;
    rate_limiter: ComponentHealth;
  };
  version: string;
}

interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'configured' | 'unknown';
  message: string;
  metrics?: Record<string, number>;
}

// Authentication
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Projects
export interface ProjectListResponse {
  projects: Project[];
  total: number;
  has_more: boolean;
}

export interface Project {
  id: string;
  name: string;
  contractor_name: string;
  contract_value: number;
  start_date: string;
  end_date?: string;
  status: string;
}

// Reconciliation
export interface SemanticMatchRequest {
  project_id: string;
  source_transactions: string[];
  target_transactions: string[];
  threshold?: number;
}

export interface SemanticMatchResponse {
  matches: Array<{
    source_index: number;
    target_index: number;
    similarity: number;
    match_type: 'semantic';
  }>;
}

// Currency
export interface CurrencyConvertRequest {
  amount: number;
  from_currency: string;
  to_currency: string;
  date?: string;
}

export interface CurrencyConvertResponse {
  converted_amount: number;
  rate: number;
  from_currency: string;
  to_currency: string;
}

// AI
export interface AIAssistRequest {
  message: string;
  project_id?: string;
  session_id?: string;
  multimodal?: boolean;
  image?: string;
}

export interface AIAssistResponse {
  response: string;
  session_id: string;
  sql_query?: string;
  results?: any[];
}

// Chronology
export interface ChronologyEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  type: 'transaction' | 'evidence' | 'milestone' | 'risk_flag';
  entity?: string;
  amount?: number;
  currency?: string;
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
}

export interface ChronologyResponse {
  events: ChronologyEvent[];
  total: number;
}

/**
 * Utility function to build query parameters
 */
export function buildQueryString(params: Record<string, any>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.append(key, String(value));
    }
  });
  return query.toString();
}

/**
 * Fetch wrapper with typed responses
 */
export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}
