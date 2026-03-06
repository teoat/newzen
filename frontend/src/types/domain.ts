/**
 * Centralized Domain Types
 * Matches backend Pydantic models for type safety
 */

// Core Entity Types
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at?: string;
}

// Transaction Types
export enum TransactionSource {
    INTERNAL_LEDGER = "INTERNAL_LEDGER",
    BANK_STATEMENT = "BANK_STATEMENT",
    INFERRED_GAP = "INFERRED_GAP"
}

export interface BankRecord {
    id: string;
    amount: number;
    description: string;
    transaction_date: string;
    timestamp: string;
    booking_date?: string;
    bank_name?: string;
    source_type: TransactionSource;
    matched?: boolean;
    project_id?: string;
    latitude?: number;
    longitude?: number;
    location_category?: string;
    normalized_location?: string;
    geospatial_metadata?: Record<string, any>;
    batch_reference?: string;
}

export interface ExpenseRecord {
    id: string;
    actual_amount: number;
    description: string;
    transaction_date: string;
    category_code: string;
    status: string;
    mens_rea_description?: string;
    receiver?: string;
    proposed_amount?: number;
    source_type: TransactionSource;
    matched?: boolean;
    project_id?: string;
    risk_score?: number;
    sender?: string;
    potential_misappropriation?: boolean;
}

export enum MatchType {
  DIRECT = 'direct',
  AGGREGATE = 'aggregate',
  MANUAL = 'manual',
  SUGGESTED = 'suggested'
}

// Budget Variance Type
export interface BudgetVariance {
  id: string;
  budget_category: string;
  actual_amount: number;
  budgeted_amount: number;
  variance_amount: number;
  variance_percentage: number;
  period: string;
  project_id?: string;
  // RAB Comparison specific fields
  item_name?: string;
  category?: string;
  unit_price_rab?: number;
  avg_unit_price_actual?: number;
  volume_discrepancy?: number;
  markup_percentage?: number;
}

export enum MatchStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
  REQUIRES_REVIEW = 'requires_review'
}

export interface Match {
    id: string;
    internal_tx_id: string;
    bank_tx_id: string;
    confidence_score: number;
    match_type: string;
    ai_reasoning: string;
    confirmed?: boolean;
    tier?: string;
}

export interface ReconciliationSettings {
    clearing_window_days: number;
    amount_tolerance_percent: number;
    batch_window_days: number;
    auto_confirm_threshold: number;
}

export interface Entity {
    id: string;
    project_id?: string;
    name: string;
    type: 'person' | 'company' | 'bank_account' | 'unknown';
    risk_score: number;
    is_watchlisted: boolean;
    metadata_json: Record<string, unknown>;
}

export interface Transaction {
    id: string;
    proposed_amount: number;
    actual_amount: number;
    amount: number;
    currency: string;
    sender: string;
    receiver: string;
    description?: string;
    category_code: string;
    account_entity?: string;
    timestamp: string;
    transaction_date?: string;
    source_type: TransactionSource;
    bank_name?: string;
    booking_date?: string;
    risk_score: number;
    status: string;
    verification_status: 'UNVERIFIED' | 'VERIFIED' | 'EXCLUDED';
    investigator_note?: string;
    batch_reference?: string;
    audit_comment?: string;
    delta_inflation: number;
    latitude?: number;
    longitude?: number;
    mens_rea_description?: string;
    project_id?: string;
}

export interface Case {
    id: string;
    project_id?: string;
    title: string;
    description: string;
    status: 'new' | 'investigating' | 'resolved' | 'closed' | 'sealed';
    priority: 'low' | 'medium' | 'high' | 'critical';
    assigned_to_id?: string;
    created_at: string;
    updated_at: string;
    risk_score: number;
    final_report_hash?: string;
    sealed_at?: string;
}
