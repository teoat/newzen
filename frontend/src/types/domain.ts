export interface BankRecord {
    id: string;
    amount: number;
    description: string;
    timestamp: string;
    booking_date?: string;
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
}

export interface Match {
    id: string;
    internal_tx_id: string;
    bank_tx_id: string;
    confidence_score: number;
    match_type: string;
    ai_reasoning: string;
    confirmed?: boolean;
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
