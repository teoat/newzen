// Shared type definitions for Zenith Lite
// Use these types instead of 'any' throughout the codebase

import { LucideIcon } from 'lucide-react';

// ====================
// Base Types
// ====================

export type JsonRecord = Record<string, unknown>;

export interface IdObject {
  id: string;
}

export interface Timestamped {
  created_at?: string;
  updated_at?: string;
}

// ====================
// Error Types
// ====================

export interface ErrorResponse {
  message: string;
  code?: string;
  details?: unknown;
}

export type ErrorHandler = (error: Error | ErrorResponse) => void;

// ====================
// API Response Types
// ====================

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ====================
// Graph/Network Types
// ====================

export interface GraphNode {
  id: string;
  label: string;
  type?: string;
  color?: string;
  size?: number;
  x?: number;
  y?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  weight?: number;
  color?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface FocusBubble {
  id: string;
  label: string;
  size: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  center_lat?: number;
  center_lng?: number;
}

export interface ClusteredNetworkData {
  entities: GraphNode[];
  transactions: GraphLink[];
  bubbles: FocusBubble[];
  stats: {
    total_entities: number;
    total_transactions: number;
    risk_distribution: Record<string, number>;
  };
  metadata: {
    cluster_level: string;
    node_count: number;
  };
}

// ====================
// Transaction Types
// ====================

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  sender: string;
  receiver: string;
  date: string;
  source_type: 'INTERNAL_LEDGER' | 'BANK_STATEMENT';
  status: 'pending' | 'flagged' | 'locked' | 'completed';
  category_code?: string;
  risk_score?: number;
}

// ====================
// Project Types
// ====================

export interface Project {
  id: string;
  name: string;
  code?: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  contract_value?: number;
  contractor_name?: string;
}

// ====================
// Form Types
// ====================

export interface FormFieldProps {
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

export interface SelectOption {
  value: string;
  label: string;
}

// ====================
// Component Props Types
// ====================

export interface CardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  icon?: LucideIcon;
}

export interface ListItemProps {
  id: string;
  title: string;
  subtitle?: string;
  onClick?: () => void;
}

// ====================
// Worker Types
// ====================

export interface WorkerMessage<T = unknown> {
  type: 'parse' | 'validate' | 'transform' | 'progress' | 'complete' | 'error';
  payload?: T;
  progress?: number;
  error?: string;
}

export interface WorkerResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  progress?: number;
}

// ====================
// Chart Types
// ====================

export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
}

// ====================
// Filter Types
// ====================

export interface DateRange {
  start: string;
  end: string;
}

export interface FilterOptions {
  dateRange?: DateRange;
  amountMin?: number;
  amountMax?: number;
  status?: string[];
  category?: string[];
}

// ====================
// Event Types
// ====================

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'deadline' | 'milestone' | 'meeting';
  description?: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'analysis' | 'finding' | 'action';
}

// ====================
// Store Types
// ====================

export interface ZustandPersist {
  name: string;
  storage: {
    getItem: (name: string) => string | null;
    setItem: (name: string, value: string) => void;
    removeItem: (name: string) => void;
  };
}
