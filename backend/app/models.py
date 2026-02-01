from datetime import datetime
from datetime import UTC
from typing import Optional, Dict, Any, List
from enum import Enum
import uuid
from sqlmodel import SQLModel, Field, Column, JSON
from pydantic import field_validator
from app.core.field_encryption import encrypt_field, decrypt_field


class CaseStatus(str, Enum):
    NEW = "new"
    INVESTIGATING = "investigating"
    RESOLVED = "resolved"
    CLOSED = "closed"
    SEALED = "sealed"


class CasePriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class TransactionCategory(str, Enum):
    XP = "XP"  # Personal Leakage
    V = "V"  # Vendor
    P = "P"  # Project
    F = "F"  # Field
    U = "U"  # Bank-Specific
    MAT = "MAT"  # Materials


class TransactionStatus(str, Enum):
    """Transaction lifecycle status"""

    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FLAGGED = "FLAGGED"
    MATCHED = "MATCHED"
    LOCKED = "LOCKED"


class VerificationStatus(str, Enum):
    """Investigator verification status"""

    UNVERIFIED = "UNVERIFIED"
    VERIFIED = "VERIFIED"
    EXCLUDED = "EXCLUDED"


class AMLStage(str, Enum):
    """Anti-Money Laundering stage classification"""

    PLACEMENT = "PLACEMENT"
    LAYERING = "LAYERING"
    INTEGRATION = "INTEGRATION"


class ForensicIntent(str, Enum):
    """Semantic instructions for dynamic schema fields"""

    GENERAL = "GENERAL"  # Default descriptive text
    LOCATION = "LOCATION"  # GPS or Address data
    QUANTITY = "QUANTITY"  # Volumes/Weights for BoQ verification
    SECONDARY_ID = "SECONDARY_ID"  # NIK, NPWP, or Account aliases
    TIMESTAMP = "TIMESTAMP"  # Sub-event timing
    RISK_INDICATOR = "RISK_INDICATOR"  # Tags like 'Urgent' or 'Suspect'


class EntityType(str, Enum):
    PERSON = "person"
    COMPANY = "company"
    BANK_ACCOUNT = "bank_account"
    UNKNOWN = "unknown"


class TransactionSource(str, Enum):
    """Origin of the transaction data"""

    INTERNAL_LEDGER = "INTERNAL_LEDGER"
    BANK_STATEMENT = "BANK_STATEMENT"
    INFERRED_GAP = "INFERRED_GAP"


class ExhibitStatus(str, Enum):
    PENDING = "PENDING"
    ADMITTED = "ADMITTED"
    REJECTED = "REJECTED"


class JobStatus(str, Enum):
    """Background job processing status."""

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class NotificationType(str, Enum):
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"
    ALERT = "alert"


class ProjectRole(str, Enum):
    VIEWER = "viewer"  # Read-only access
    ANALYST = "analyst"  # Can upload and flag
    ADJUDICATOR = "adjudicator"  # Can admit evidence to cases
    AUDITOR = "auditor"  # External auditor, limited view
    ADMIN = "admin"  # Full control


class User(SQLModel, table=True):
    id: Optional[str] = Field(
        default_factory=lambda: str(uuid.uuid4()), primary_key=True
    )
    username: str = Field(index=True, unique=True)
    full_name: str
    email: str
    hashed_password: str
    role: str = Field(
        default="investigator"
    )  # viewer, investigator, admin
    is_active: bool = True
    mfa_secret: Optional[str] = None
    mfa_enabled: bool = Field(default=False)
    mfa_backup_codes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))




class Entity(SQLModel, table=True):
    """
    Represents a distinct node in the forensic graph (Person, Company, etc.)
    Used for Nexus determination and relationship mapping.
    """

    id: Optional[str] = Field(
        default_factory=lambda: str(uuid.uuid4()), primary_key=True
    )
    project_id: Optional[str] = Field(
        default=None, foreign_key="project.id", index=True
    )
    name: str = Field(index=True)
    type: EntityType = Field(default=EntityType.UNKNOWN)
    risk_score: float = 0.0
    is_watchlisted: bool = False
    tax_id: Optional[str] = Field(default=None, index=True)
    bank_account_number: Optional[str] = Field(default=None, index=True)
    metadata_json: Dict[str, Any] = Field(
        default_factory=dict, sa_column=Column(JSON)
    )
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    embeddings_json: Optional[List[float]] = Field(
        default=None, sa_column=Column(JSON)
    )




class Transaction(SQLModel, table=True):
    id: Optional[str] = Field(
        default_factory=lambda: str(uuid.uuid4()), primary_key=True
    )
    # Aldi case uses Rupiah
    proposed_amount: float = Field(default=0.0)  # Aldi Awal Debit
    actual_amount: float = Field(default=0.0)  # Aldi Real Debit
    # DEPRECATED: Use verified_amount property
    amount: float = Field(default=0.0)
    currency: str = "IDR"
    sender: str = Field(index=True)
    receiver: str = Field(index=True)
    description: Optional[str] = None  # Uraian
    category_code: TransactionCategory = Field(
        default=TransactionCategory.P
    )
    account_entity: Optional[str] = None  # Account 921, 500, 358
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))
    risk_score: float = 0.0
    status: str = Field(default="pending")
    verification_status: VerificationStatus = Field(
        default=VerificationStatus.UNVERIFIED
    )
    investigator_note_enc: Optional[str] = Field(default=None, index=False)
    quantity: float = Field(default=0.0)
    unit: Optional[str] = None

    @property
    def investigator_note(self) -> Optional[str]:
        return decrypt_field(self.investigator_note_enc) if self.investigator_note_enc else None

    @investigator_note.setter
    def investigator_note(self, value: Optional[str]):
        self.investigator_note_enc = encrypt_field(value) if value else None
    # Batch payments
    batch_reference: Optional[str] = Field(default=None, index=True)
    # Forensic Flags and Metadata
    audit_comment: Optional[str] = None  # Comment field from source
    is_redacted: bool = Field(default=False)  # Tipex/Ti-pex detection
    potential_misappropriation: bool = Field(default=False)
    # ^ Personal/Family keywords
    is_circular: bool = Field(default=False)  # Flow loops back
    needs_proof: bool = Field(default=False)  # BUTUH BUKTI trigger
    delta_inflation: float = Field(
        default=0.0
    )  # Calculated: proposed - actual
    # Geospatial data for "Evidence Map"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    mens_rea_description: Optional[str] = None  # Reasons for suspecting intent
    # Ingestion / Construction Extensions
    project_id: Optional[str] = Field(
        default=None, foreign_key="project.id"
    )
    milestone_id: Optional[str] = Field(
        default=None, foreign_key="milestone.id"
    )
    receiver_entity_id: Optional[str] = Field(
        default=None, foreign_key="entity.id"
    )
    sender_entity_id: Optional[str] = Field(
        default=None, foreign_key="entity.id"
    )
    transaction_date: Optional[datetime] = None  # Actual date on document
    metadata_json: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    embeddings_json: Optional[List[float]] = Field(default=None, sa_column=Column(JSON))
    # Forensic reconstruction flags
    is_inferred: bool = Field(default=False)  # Created via gap analysis
    source_type: TransactionSource = Field(default=TransactionSource.INTERNAL_LEDGER)
    bank_name: Optional[str] = None
    booking_date: Optional[datetime] = None
    original_currency: Optional[str] = "IDR"
    
    # Theory Board Extensions
    is_pinned: bool = Field(default=False)
    theory_notes: Optional[str] = None

    @property
    def verified_amount(self) -> float:
        """
        Standardized amount accessor to resolve semantic drift.
        Prioritizes actual_amount (verified) > proposed_amount (claimed).
        Falls back to deprecated amount field for legacy data.
        """
        return self.actual_amount or self.proposed_amount or self.amount

    def redact_for_role(self, role: ProjectRole) -> "Transaction":
        """
        Forensic 'Need to Know' Logic.
        Redacts sensitive fields based on the investigator's role.
        """
        if role in [ProjectRole.VIEWER, ProjectRole.AUDITOR]:
            # Mask sensitive beneficiary info for lower-privileged roles
            if self.risk_score > 0.8:
                self.receiver = "REDACTED [HIGH RISK]"
                self.description = "REDACTED [PENDING ADJUDICATION]"
            self.investigator_note_enc = None # Remove encrypted notes
        return self

    @field_validator("transaction_date", mode="before")
    @classmethod
    def validate_transaction_date(cls, v):
        """Prevent future-dated transactions from corrupting timeline"""
        if v:
            if isinstance(v, str):
                v = datetime.fromisoformat(v)
            if v > datetime.now(UTC):
                raise ValueError("Transaction date cannot be in the future")
        return v

    @field_validator("actual_amount", mode="before")
    @classmethod
    def validate_actual_amount(cls, v, info):
        """Flag extreme variance between actual and proposed amounts"""
        # Note: info.data might be empty in some validation contexts
        if info.data and "proposed_amount" in info.data and info.data["proposed_amount"] > 0:
            if v > info.data["proposed_amount"] * 2:
                # Forensic recommendation: Raise error for extreme anomalies
                # to prevent data corruption or intentional spoofing.
                raise ValueError(
                    f"Actual ({v}) exceeds proposed "
                    f"({info.data['proposed_amount']}) by >100% "
                    "- Forensic Integrity Violation"
                )
        return v


class Case(SQLModel, table=True):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    project_id: Optional[str] = Field(default=None, foreign_key="project.id", index=True)
    title: str
    description: str
    status: CaseStatus = Field(default=CaseStatus.NEW, index=True)
    priority: CasePriority = Field(default=CasePriority.MEDIUM, index=True)
    assigned_to_id: Optional[str] = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    risk_score: float = 0.0
    # Forensic Integrity Fields
    chain_of_custody_json: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    final_report_hash: Optional[str] = None
    last_resolved_at: Optional[datetime] = None
    embeddings_json: Optional[List[float]] = Field(default=None, sa_column=Column(JSON))
    sealed_at: Optional[datetime] = None
    sealed_by_id: Optional[str] = Field(default=None, foreign_key="user.id")


class LLMKey(SQLModel, table=True):
    """
    Registry for LLM (Gemini) API Keys.
    Allows for persistent key management, load balancing, and failure tracking.
    """
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    provider: str = Field(default="gemini", index=True)
    alias: str = Field(index=True)  # User-friendly name e.g., "Dev Key 1"
    key_encrypted: str  # Encrypted using field encryption
    is_active: bool = Field(default=True)
    failure_count: int = Field(default=0)
    last_used_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    @property
    def key(self) -> str:
        return decrypt_field(self.key_encrypted)

    @key.setter
    def key(self, value: str):
        self.key_encrypted = encrypt_field(value)


class Document(SQLModel, table=True):
    """Multimodal document store for RAG & Forensic Evidence"""

    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    project_id: Optional[str] = Field(default=None, foreign_key="project.id", index=True)
    filename: str
    file_type: str  # pdf, image, video, chat, journal
    file_hash: Optional[str] = None  # SHA-256 for immutability
    content_text: Optional[str] = None
    metadata_json: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    case_id: Optional[str] = Field(default=None, foreign_key="case.id")
    transaction_id: Optional[str] = Field(default=None, foreign_key="transaction.id")
    
    # Theory Board Extensions
    is_pinned: bool = Field(default=False)
    theory_notes: Optional[str] = None


class ReconciliationMatch(SQLModel, table=True):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    internal_tx_id: str = Field(foreign_key="transaction.id")
    bank_tx_id: str
    confidence_score: float
    confirmed: bool = False
    matched_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    ai_reasoning: Optional[str] = None  # RAG derived reasoning
    match_type: str = "direct"  # direct, aggregate (Minimal Arus Uang)


class FraudAlert(SQLModel, table=True):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    project_id: Optional[str] = Field(default=None, foreign_key="project.id", index=True)
    case_id: Optional[str] = Field(default=None, foreign_key="case.id")
    transaction_id: str = Field(foreign_key="transaction.id")
    alert_type: str
    severity: str
    risk_score: float
    description: str
    status: str = Field(default="OPEN")
    metadata_json: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class AuditLog(SQLModel, table=True):
    """
    Forensic Audit Trail (Immutable)
    Tracks WHO changed WHAT, WHEN, and WHY.
    """

    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    entity_type: str  # e.g. "Transaction", "Case"
    entity_id: str = Field(index=True)
    action: str  # UPDATE, CREATE, DELETE, RECONCILE_CONFIRM
    field_name: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    changed_by_user_id: Optional[str] = None
    change_reason: Optional[str] = None
    # Cryptographic Chain of Custody
    previous_hash: Optional[str] = Field(default=None, index=True)
    hash_signature: Optional[str] = Field(default=None, index=True)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))


class AuditLogArchive(SQLModel, table=True):
    __tablename__ = "audit_log_archive"
    id: str = Field(primary_key=True)
    entity_type: str
    entity_id: str
    action: str
    field_name: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    changed_by_user_id: Optional[str] = None
    change_reason: Optional[str] = None
    previous_hash: Optional[str] = None
    hash_signature: Optional[str] = None
    timestamp: datetime
    archived_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class ProcessingJobArchive(SQLModel, table=True):
    __tablename__ = "processing_job_archive"
    id: str = Field(primary_key=True)
    project_id: str = Field(index=True)
    data_type: str
    total_items: int
    items_processed: int
    items_failed: int
    status: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    archived_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    job_snapshot: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))


class ReconciliationSettings(SQLModel, table=True):
    """
    Forensic Engine Configuration
    Allows users to tune the sensitivity of the matching logic.
    """

    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    project_id: str = Field(index=True, unique=True)
    # Temporal Elasticity: How many days of clearing lag to allow
    clearing_window_days: int = Field(default=7)
    # Fiscal Tolerance: % variance allowed for bank fees/rounding
    amount_tolerance_percent: float = Field(default=0.5)
    # Aggregation Window: How many days to look back for batch groups
    batch_window_days: int = Field(default=10)
    # Automation Level: Confidence score required for auto-confirmation
    auto_confirm_threshold: float = Field(default=0.98)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    change_reason: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))


# --- Project Audit / Construction Forensic Extension ---
class Project(SQLModel, table=True):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str = Field(index=True)
    code: str = Field(unique=True)  # Contract Number
    contract_value: float
    start_date: datetime
    end_date: Optional[datetime] = None
    contractor_name: str
    status: str = "audit_mode"  # active, stalled, completed, audit_mode
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    # Location Metadata
    site_location: Optional[str] = None  # Text description e.g. "Jakarta"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    # Forensic Fallback Rates: {"USD": 1.0, "IDR": 15000.0}
    contract_exchange_rate: Dict[str, float] = Field(
        default_factory=dict, sa_column=Column(JSON)
    )


class Milestone(SQLModel, table=True):
    """
    Represents a 'Termin' or Funding Tranche.
    Funds are released based on this schedule.
    """

    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    project_id: str = Field(foreign_key="project.id")
    name: str  # e.g., "Termin 1 (20%)", "Uang Muka"
    percentage: float
    expected_amount: float
    released_amount: float = 0.0
    status: str = "pending"  # pending, paid, flagged
    release_date: Optional[datetime] = None
    # Forensic Data
    is_premature: bool = False  # Released before physical progress matched?
    diverted_amount: float = 0.0  # Amount traced to non-project accounts


class BudgetLine(SQLModel, table=True):
    """
    Represents the RAB (Rencana Anggaran Biaya) or BoQ (Bill of Quantities).
    The 'Contractual Truth' of what should have been bought.
    Supports CCO (Contract Change Order) tracking.
    """

    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    project_id: str = Field(foreign_key="project.id")
    item_code: Optional[str] = Field(default=None, index=True) # e.g., "7.1.(5a)"
    category: str  # Material, Labor, Equipment, Overhead
    item_name: str  # e.g., "Semen Gresik 50kg"
    unit: str  # sak, m3, ton
    
    # RAB (Original Plan)
    unit_price_rab: float
    qty_rab: float
    total_price_rab: float
    
    # CCO (Revised Plan)
    unit_price_cco: float = 0.0
    qty_cco: float = 0.0
    total_price_cco: float = 0.0

    # Actual (Realization)
    avg_unit_price_actual: float = 0.0
    qty_actual: float = 0.0
    total_spend_actual: float = 0.0
    
    # Analysis vs RCO/Original
    markup_percentage: float = 0.0  # (Actual Price - CCO Price) / CCO Price
    volume_discrepancy: float = 0.0  # CCO Qty - Actual Qty
    
    # Metadata
    requires_justification: bool = False
    notes: Optional[str] = None


class Ingestion(SQLModel, table=True):
    """
    Tracks a specific file import session.
    """

    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    project_id: str = Field(foreign_key="project.id", index=True)
    file_name: str
    file_type: str
    file_hash: str
    records_processed: int
    status: str = "completed"  # completed, failed, warning
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    metadata_json: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))


class Asset(SQLModel, table=True):
    """
    Tracks physical and financial assets discovered during investigation.
    Linked to suspect entities for recovery.
    """

    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    project_id: Optional[str] = Field(default=None, foreign_key="project.id", index=True)
    name: str
    type: str  # Real Estate, Vehicle, Luxury Good, Bank Account, Crypto
    estimated_value: float
    original_value: Optional[float] = None
    purchase_date: Optional[datetime] = None
    owner_entity_id: str = Field(foreign_key="entity.id", index=True)
    is_frozen: bool = False
    location: Optional[str] = None
    image_evidence_id: Optional[str] = Field(default=None, foreign_key="document.id")
    metadata_json: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class CorporateRelationship(SQLModel, table=True):
    """
    Maps ownership and control between entities.
    Used to resolve Ultimate Beneficial Owners (UBO).
    """

    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    parent_entity_id: str = Field(foreign_key="entity.id", index=True)  # The Owner
    child_entity_id: str = Field(foreign_key="entity.id", index=True)  # The Owned
    relationship_type: str = "SHAREHOLDER"  # SHAREHOLDER, DIRECTOR, BENEFICIAL_OWNER
    stake_percentage: float = 0.0  # 0.0 to 100.0
    confirmed_at: Optional[datetime] = None
    discovery_source: str = "Public Records"  # AHU, Public Records, Leaked Data
    metadata_json: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))


class ForensicFieldWork(SQLModel, table=True):
    """
    Represents on-site investigative work (e.g. site visits, physical verification).
    Captures geospatial data, notes, and evidence from the field.
    """

    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    project_id: str = Field(foreign_key="project.id", index=True)
    investigator_id: str = Field(foreign_key="user.id")
    # Where?
    location_label: str  # e.g. "Site A - Storage"
    latitude: float
    longitude: float
    # What?
    activity_type: str = "SITE_VISIT"  # SITE_VISIT, SURVEILLANCE, INTERVIEW, AUDIT
    title: str
    notes: str
    # Evidence linkages
    metadata_json: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    visit_date: datetime = Field(default_factory=lambda: datetime.now(UTC))
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))




class CopilotInsight(SQLModel, table=True):
    """
    High-level AI findings and intelligence markers.
    Stored with embeddings for semantic retrieval.
    """

    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    project_id: str = Field(foreign_key="project.id", index=True)
    insight_type: str = "PATTERN"  # PATTERN, ANOMALY, RISK, SUMMARY
    title: str
    content: str
    confidence: float = 0.0
    metadata_json: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    embeddings_json: Optional[List[float]] = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class CaseExhibit(SQLModel, table=True):
    """
    Formalized evidence entry within a case.
    Ensures legal-grade tracking of what data made it into the final verdict.
    """

    id: Optional[str] = Field(
        default_factory=lambda: f"EXE-{uuid.uuid4().hex[:8].upper()}", primary_key=True
    )
    case_id: str = Field(foreign_key="case.id", index=True)
    evidence_type: str  # transaction, entity, document, hotspot
    evidence_id: str  # The ID in the source table
    label: str
    verdict: ExhibitStatus = Field(default=ExhibitStatus.PENDING)
    adjudicated_at: Optional[datetime] = None
    adjudicated_by_id: Optional[str] = Field(default=None, foreign_key="user.id")
    ai_contradiction_note: Optional[str] = None  # Notes from AI about inconsistencies
    hash_signature: str  # SHA-256 hash of the evidence at time of admission
    metadata_json: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))




class ProcessingJob(SQLModel, table=True):
    """Track background processing jobs for batch operations."""

    __tablename__ = "processing_jobs"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    project_id: Optional[str] = Field(default=None, foreign_key="project.id", index=True)
    # Job Metadata
    data_type: str  # 'transaction', 'entity', 'embedding', etc.
    status: JobStatus = Field(default=JobStatus.PENDING, index=True)
    # Batch Configuration
    total_items: int
    total_batches: int
    batch_config: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    # Progress Tracking
    batches_completed: int = Field(default=0)
    items_processed: int = Field(default=0)
    items_failed: int = Field(default=0)
    # Timing
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    # Error Handling
    error_message: Optional[str] = None
    retry_count: int = Field(default=0)
    # Celery Integration
    celery_task_ids: Dict[str, str] = Field(
        default_factory=dict, sa_column=Column(JSON)
    )  # Maps batch_num to task_id

    @property
    def progress_percent(self) -> float:
        """Calculate overall progress percentage."""
        if self.total_items == 0:
            return 0.0
        return (self.items_processed / self.total_items) * 100

    @property
    def success_rate(self) -> float:
        """Calculate success rate of processed items."""
        total_attempted = self.items_processed + self.items_failed
        if total_attempted == 0:
            return 0.0
        return (self.items_processed / total_attempted) * 100




class Notification(SQLModel, table=True):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    project_id: Optional[str] = Field(default=None, foreign_key="project.id", index=True)
    type: NotificationType = Field(default=NotificationType.INFO)
    title: str
    message: str
    link: Optional[str] = None
    is_read: bool = Field(default=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    metadata_json: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))




class UserProjectAccess(SQLModel, table=True):
    __tablename__ = "user_project_access"
    user_id: str = Field(foreign_key="user.id", primary_key=True)
    project_id: str = Field(foreign_key="project.id", primary_key=True)
    role: ProjectRole = Field(default=ProjectRole.ANALYST)
    granted_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    granted_by_id: Optional[str] = Field(default=None, foreign_key="user.id")


class UserFeedback(SQLModel, table=True):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="user.id")
    page: str
    rating: int = Field(ge=1, le=5)
    comment: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class UserQueryPattern(SQLModel, table=True):
    """
    Tracks AI query patterns for personalization and learning.
    Enables proactive suggestions based on user behavior.
    """
    __tablename__ = "user_query_patterns"

    id: Optional[str] = Field(
        default_factory=lambda: str(uuid.uuid4()), primary_key=True
    )
    user_id: str = Field(foreign_key="user.id", index=True)
    project_id: Optional[str] = Field(
        default=None, foreign_key="project.id", index=True
    )

    # Query metadata
    query_text: str
    intent_type: str  # sql_query, action, explanation, general_chat
    response_type: str
    page_context: Optional[str] = None

    # Execution metadata
    execution_time_ms: Optional[float] = None
    was_successful: bool = True
    error_message: Optional[str] = None

    # User behavior
    user_rating: Optional[int] = Field(default=None, ge=1, le=5)
    follow_up_action: Optional[str] = None  # export, create_case, etc.

    # Pattern detection fields
    query_frequency: int = Field(default=1)  # Incremented on duplicates
    preferred_export_format: Optional[str] = None  # pdf, excel, csv

    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    last_executed_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    metadata_json: Dict[str, Any] = Field(
        default_factory=dict, sa_column=Column(JSON)
    )


class IntegrityRegistry(SQLModel, table=True):
    """
    Cryptographic Registry for Dossiers and Exhibits.
    Ensures legal chain-of-custody and anti-tamper verification.
    """
    __tablename__ = "integrity_registry"
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    project_id: str = Field(foreign_key="project.id", index=True)
    entity_type: str # 'DOSSIER', 'EXHIBIT', 'TRANSACTION_SET', 'EXPORT'
    entity_id: str
    file_hash: str = Field(index=True) # SHA-256
    blockchain_tx_id: Optional[str] = None # For future L2 anchoring
    
    # Forensic V3: Digital Signatures
    digital_signature: Optional[str] = None
    signer_id: Optional[str] = Field(default=None, foreign_key="user.id")
    
    sealed_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    sealed_by_id: str = Field(foreign_key="user.id")
    metadata_json: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))


class AIFeedback(SQLModel, table=True):
    """
    Detailed feedback for AI responses.
    """
    __tablename__ = "ai_feedback"
    
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    session_id: str = Field(index=True)
    message_id: str
    user_id: Optional[str] = Field(default=None, foreign_key="user.id", index=True)
    rating: int = Field(ge=1, le=5)
    feedback_text: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class AICorrection(SQLModel, table=True):
    """
    Forensic Human-in-the-Loop Corrections.
    Stores investigator overrides of AI classifications to enable active learning.
    """
    __tablename__ = "ai_corrections"
    
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    project_id: str = Field(foreign_key="project.id", index=True)
    entity_type: str  # 'transaction', 'entity', 'cluster'
    entity_id: str = Field(index=True)
    
    original_ai_verdict: str
    corrected_verdict: str
    correction_reason: str
    
    investigator_id: str = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    
    # Store embeddings for semantic retrieval during active learning
    embeddings_json: Optional[List[float]] = Field(default=None, sa_column=Column(JSON))
    metadata_json: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))


class QuarantineRow(SQLModel, table=True):
    """
    Data Hospital Ward.
    Stores rows that failed ingestion for manual or AI repair.
    """
    __tablename__ = "quarantine_rows"
    
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    project_id: str = Field(foreign_key="project.id", index=True)
    ingestion_id: Optional[str] = Field(default=None, foreign_key="ingestion.id")
    
    # The raw data that failed
    raw_content: str
    row_index: int
    
    # Why it failed
    error_message: str
    error_type: str = "parsing_error" # validation_error, parsing_error
    
    # Repair Status
    status: str = "new" # new, repairing, repaired, ignored
    suggested_fix: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    resolved_at: Optional[datetime] = None


class VerificationVerdict(SQLModel, table=True):
    """
    Judge Agent's verdict on a document-transaction match.
    """
    __tablename__ = "verification_verdicts"

    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    document_id: str = Field(foreign_key="document.id", index=True)
    transaction_id: Optional[str] = Field(default=None, foreign_key="transaction.id")
    
    verdict: str = "PENDING"  # MATCH, MISMATCH, INCONCLUSIVE
    confidence_score: float = 0.0
    
    extracted_claims: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    reasoning: Optional[str] = None
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
