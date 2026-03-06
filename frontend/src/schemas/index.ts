import { z } from 'zod';

// ========================================
// SHARED SCHEMAS
// ========================================

export const UUIDSchema = z.string().uuid('Invalid UUID format');

export const TimestampSchema = z.string().datetime('Invalid datetime format');

export const MoneySchema = z.number().nonnegative('Amount must be non-negative');

export const PercentageSchema = z.number().min(0).max(100, 'Percentage must be between 0 and 100');

// ========================================
// PROJECT SCHEMAS
// ========================================

export const ProjectStatusSchema = z.union([
  z.literal('draft'),
  z.literal('active'),
  z.literal('on_hold'),
  z.literal('completed'),
  z.literal('archived')
]).catch('draft');

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  code: z.string().regex(/^[A-Z]{3}-\d{4}$/).optional(),
  contract_value: z.number().positive().optional(),
  contractor_name: z.string().max(500).optional(),
  status: ProjectStatusSchema.optional(),
  created_at: z.string().datetime().optional(),
  start_date: z.string().date().optional(),
  end_date: z.string().date().nullable().optional(),
  site_location: z.string().max(1000).nullable().optional(),
  realized_spend: z.number().min(0).optional(),
});

export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  contract_value: MoneySchema,
});

export const UpdateProjectSchema = CreateProjectSchema.partial();

export const ProjectListResponseSchema = z.object({
  projects: z.array(ProjectSchema),
  total: z.number().int().nonnegative().default(0),
  limit: z.number().int().min(1).default(50),
  offset: z.number().int().nonnegative().default(0),
  has_more: z.boolean().default(false),
});

export type Project = z.infer<typeof ProjectSchema>;
export type CreateProject = z.infer<typeof CreateProjectSchema>;
export type UpdateProject = z.infer<typeof UpdateProjectSchema>;
export type ProjectListResponse = z.infer<typeof ProjectListResponseSchema>;

// ========================================
// ENTITY SCHEMAS
// ========================================

export const EntityTypeSchema = z.enum([
  'VENDOR',
  'SUBCONTRACTOR',
  'SUPPLIER',
  'EMPLOYEE',
  'BANK',
  'OTHER',
]);

export const EntitySchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(500),
  type: EntityTypeSchema,
  tax_id: z.string().optional(),
  registration_number: z.string().optional(),
  country: z.string().length(2).toUpperCase().optional(),
  risk_score: PercentageSchema,
  is_sanctioned: z.boolean(),
  sanction_source: z.string().optional(),
  created_at: TimestampSchema,
});

export const CreateEntitySchema = z.object({
  name: z.string().min(1).max(500),
  type: EntityTypeSchema,
  tax_id: z.string().optional(),
  registration_number: z.string().optional(),
  country: z.string().length(2).toUpperCase().optional(),
});

export type Entity = z.infer<typeof EntitySchema>;
export type EntityType = z.infer<typeof EntityTypeSchema>;

// ========================================
// TRANSACTION SCHEMAS
// ========================================

export const TransactionStatusSchema = z.enum([
  'PENDING',
  'VERIFIED',
  'REJECTED',
  'FLAGGED',
]);

export const TransactionSchema = z.object({
  id: UUIDSchema,
  project_id: UUIDSchema,
  entity_id: UUIDSchema,
  amount: MoneySchema,
  currency: z.string().length(3).toUpperCase(),
  date: TimestampSchema,
  reference: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
  status: TransactionStatusSchema,
  category: z.string().max(100).optional(),
  created_at: TimestampSchema,
});

export const CreateTransactionSchema = z.object({
  project_id: UUIDSchema,
  entity_id: UUIDSchema,
  amount: MoneySchema,
  currency: z.string().length(3).toUpperCase(),
  date: TimestampSchema,
  reference: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
});

export type Transaction = z.infer<typeof TransactionSchema>;
export type TransactionStatus = z.infer<typeof TransactionStatusSchema>;

// ========================================
// EVIDENCE SCHEMAS
// ========================================

export const EvidenceTypeSchema = z.enum([
  'DOCUMENT',
  'IMAGE',
  'VIDEO',
  'AUDIO',
  'TRANSACTION_RECORD',
  'OTHER',
]);

export const EvidenceStatusSchema = z.enum([
  'UPLOADED',
  'VERIFIED',
  'FLAGGED',
  'REJECTED',
  'LINKED',
]);

export const EvidenceMetadataSchema = z.object({
  checksum: z.string().optional(),
  ocr_text: z.string().optional(),
  extracted_entities: z.array(z.string()).optional(),
  risk_flags: z.array(z.string()).optional(),
  related_transactions: z.array(UUIDSchema).optional(),
});

export const EvidenceSchema = z.object({
  id: UUIDSchema,
  investigation_id: UUIDSchema,
  type: EvidenceTypeSchema,
  file_name: z.string().max(500),
  file_size: z.number().positive(),
  file_url: z.string().url(),
  mime_type: z.string().max(100),
  status: EvidenceStatusSchema,
  metadata: EvidenceMetadataSchema.optional(),
  uploaded_by: UUIDSchema,
  uploaded_at: TimestampSchema,
  verified_at: TimestampSchema.optional(),
  verified_by: UUIDSchema.optional(),
});

export const UploadEvidenceSchema = z.object({
  investigation_id: UUIDSchema,
  file: z.instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, 'File size must be less than 10MB')
    .refine(
      (file) => ['application/pdf', 'image/*', 'video/*'].some((type) => file.type.startsWith(type)),
      'File type not allowed',
    ),
  type: EvidenceTypeSchema.optional(),
  description: z.string().max(1000).optional(),
});

export type Evidence = z.infer<typeof EvidenceSchema>;
export type EvidenceType = z.infer<typeof EvidenceTypeSchema>;

// ========================================
// INVESTIGATION SCHEMAS
// ========================================

export const InvestigationStatusSchema = z.enum([
  'PENDING',
  'IN_PROGRESS',
  'PAUSED',
  'COMPLETED',
  'CANCELLED',
]);

export const InvestigationPhaseSchema = z.enum([
  'INITIALIZATION',
  'GATHERING_EVIDENCE',
  'ANALYSIS',
  'VERIFICATION',
  'REPORTING',
  'CLOSED',
]);

export const InvestigationSchema = z.object({
  id: UUIDSchema,
  project_id: UUIDSchema,
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  status: InvestigationStatusSchema,
  phase: InvestigationPhaseSchema,
  progress: PercentageSchema,
  risk_score: PercentageSchema.optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  assigned_to: UUIDSchema.optional(),
  created_by: UUIDSchema,
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
  started_at: TimestampSchema.optional(),
  completed_at: TimestampSchema.optional(),
});

export const CreateInvestigationSchema = z.object({
  project_id: UUIDSchema,
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  assigned_to: UUIDSchema.optional(),
});

export const UpdateInvestigationSchema = z.object({
  status: InvestigationStatusSchema.optional(),
  phase: InvestigationPhaseSchema.optional(),
  progress: PercentageSchema.optional(),
  description: z.string().max(5000).optional(),
  assigned_to: UUIDSchema.optional(),
});

export type Investigation = z.infer<typeof InvestigationSchema>;
export type InvestigationStatus = z.infer<typeof InvestigationStatusSchema>;
export type InvestigationPhase = z.infer<typeof InvestigationPhaseSchema>;

// ========================================
// ALERT SCHEMAS
// ========================================

export const AlertSeveritySchema = z.enum(['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export const AlertTypeSchema = z.enum([
  'FRAUD',
  'ANOMALY',
  'COMPLIANCE',
  'SANCTION',
  'DUPLICATE',
  'DISCREPANCY',
  'OTHER',
]);

export const AlertMetadataSchema = z.object({
  transaction_ids: z.array(UUIDSchema).optional(),
  entity_ids: z.array(UUIDSchema).optional(),
  risk_score: z.number().min(0).max(100).optional(),
  affected_amount: MoneySchema.optional(),
  related_alerts: z.array(UUIDSchema).optional(),
});

export const AlertSchema = z.object({
  id: UUIDSchema,
  project_id: UUIDSchema,
  investigation_id: UUIDSchema.optional(),
  type: AlertTypeSchema,
  severity: AlertSeveritySchema,
  title: z.string().min(1).max(500),
  message: z.string().min(1).max(2000),
  source: z.string().max(100).optional(),
  metadata: AlertMetadataSchema.optional(),
  is_acknowledged: z.boolean().default(false),
  acknowledged_by: UUIDSchema.optional(),
  acknowledged_at: TimestampSchema.optional(),
  created_at: TimestampSchema,
});

export type Alert = z.infer<typeof AlertSchema>;
export type AlertSeverity = z.infer<typeof AlertSeveritySchema>;
export type AlertType = z.infer<typeof AlertTypeSchema>;

// ========================================
// API RESPONSE SCHEMAS
// ========================================

export const PaginatedResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: z.array(dataSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    page_size: z.number().int().positive(),
    total_pages: z.number().int().nonnegative(),
  });

export const ApiErrorDetailsSchema = z.object({
  field: z.string().optional(),
  constraint: z.string().optional(),
  value: z.unknown().optional(),
});

export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  status_code: z.number().int().positive(),
  details: ApiErrorDetailsSchema.optional(),
});

export const SuccessResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: ApiErrorSchema,
});

// ========================================
// FILE UPLOAD SCHEMAS
// ========================================

export const FileUploadSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size > 0, 'File is empty')
    .refine((file) => file.size <= 50 * 1024 * 1024, 'File size must be less than 50MB'),
  category: z.enum(['DOCUMENT', 'IMAGE', 'VIDEO', 'AUDIO', 'DATA']).optional(),
  description: z.string().max(1000).optional(),
});

export const BatchFileUploadSchema = z.object({
  files: z
    .array(
      z.instanceof(File)
        .refine((file) => file.size > 0, 'File is empty')
        .refine((file) => file.size <= 50 * 1024 * 1024, 'File size must be less than 50MB'),
    )
    .min(1, 'At least one file is required')
    .max(20, 'Maximum 20 files allowed'),
  batch_name: z.string().min(1).max(200).optional(),
  project_id: UUIDSchema,
});

export type FileUpload = z.infer<typeof FileUploadSchema>;
export type BatchFileUpload = z.infer<typeof BatchFileUploadSchema>;

/**
 * Validation utility to safely parse data against a schema
 */
export function validate<T>(schema: z.ZodType<T>, data: unknown): T {
  return schema.parse(data);
}

// ========================================
// INVESTIGATION FINDING SCHEMAS
// ========================================

export const InvestigationFindingSchema = z.object({
  id: UUIDSchema,
  investigation_id: UUIDSchema,
  type: z.enum(['ANOMALY', 'PATTERN', 'CONTRADICTION', 'RISK_FLAG', 'RECOMMENDATION']),
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(5000),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  evidence_ids: z.array(UUIDSchema).optional(),
  transaction_ids: z.array(UUIDSchema).optional(),
  created_at: TimestampSchema,
});

export type InvestigationFinding = z.infer<typeof InvestigationFindingSchema>;

// ========================================
// TIMELINE EVENT SCHEMAS
// ========================================

export const TimelineEventTypeSchema = z.enum([
  'TRANSACTION',
  'EVIDENCE',
  'MILESTONE',
  'RISK_FLAG',
  'ALERT',
  'DOCUMENT',
  'USER_ACTION',
]);

export const TimelineEventMetadataSchema = z.object({
  file_hash: z.string().optional(),
  ip_address: z.string().optional().refine((val) => !val || /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(val), 'Invalid IP address'),
  user_agent: z.string().optional(),
  location_coordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }).optional(),
  document_pages: z.number().int().positive().optional(),
  ocr_confidence: z.number().min(0).max(1).optional(),
});

export const TimelineEventSchema = z.object({
  id: UUIDSchema,
  investigation_id: UUIDSchema,
  event_type: TimelineEventTypeSchema,
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  timestamp: TimestampSchema,
  entity: z.string().optional(),
  amount: MoneySchema.optional(),
  currency: z.string().length(3).optional(),
  risk_level: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  source: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
  related_entities: z.array(z.string()).optional(),
  metadata: TimelineEventMetadataSchema.optional(),
});

export type TimelineEvent = z.infer<typeof TimelineEventSchema>;
export type TimelineEventMetadata = z.infer<typeof TimelineEventMetadataSchema>;

// ========================================
// INVESTIGATION REPORT SCHEMAS
// ========================================

export const InvestigationReportSchema = z.object({
  id: UUIDSchema,
  investigation_id: UUIDSchema,
  title: z.string().min(1).max(500),
  executive_summary: z.string().min(1),
  methodology: z.string().optional(),
  findings: z.array(InvestigationFindingSchema),
  recommendations: z.array(z.string()),
  risk_assessment: z.object({
    overall_score: z.number().min(0).max(100),
    factors: z.array(z.object({
      name: z.string(),
      score: z.number().min(0).max(100),
      description: z.string().optional(),
    })),
  }),
  created_by: UUIDSchema,
  created_at: TimestampSchema,
  status: z.enum(['DRAFT', 'REVIEW', 'FINAL', 'ARCHIVED']),
});

export type InvestigationReport = z.infer<typeof InvestigationReportSchema>;

// ========================================
// REASONING SCHEMAS
// ========================================

export const InferenceHypothesisSchema = z.object({
  id: z.string(),
  title: z.string(),
  confidence: z.number(),
  reasoning: z.string(),
  agent_consensus: z.enum(['HIGH', 'MED', 'LOW']).optional(),
});

export const SwarmLogSchema = z.object({
  agent: z.string(),
  thought: z.string(),
});

export const SwarmResponseSchema = z.object({
  hypotheses: z.array(InferenceHypothesisSchema),
  swarm_logs: z.array(SwarmLogSchema),
});

export const VerificationResultSchema = z.object({
  hypothesis_id: z.string(),
  status: z.enum(['VERIFIED', 'DISPROVED', 'INCONCLUSIVE']),
  evidence_count: z.number(),
  summary: z.string(),
});

export type InferenceHypothesis = z.infer<typeof InferenceHypothesisSchema>;
export type SwarmLog = z.infer<typeof SwarmLogSchema>;
export type SwarmResponse = z.infer<typeof SwarmResponseSchema>;
export type VerificationResult = z.infer<typeof VerificationResultSchema>;

// ========================================
// FORENSIC SCHEMAS
// ========================================

export const ThreatSchema = z.object({
  id: z.string(),
  type: z.string(),
  severity: z.string(),
  description: z.string(),
  entity_id: z.string().optional(),
  risk_score: z.number(),
});

export const GlobalStatsSchema = z.object({
  total_projects: z.number(),
  total_transactions: z.number(),
  high_risk_count: z.number(),
  leakage_total: z.number(),
});

export type Threat = z.infer<typeof ThreatSchema>;
export type GlobalStats = z.infer<typeof GlobalStatsSchema>;

// ========================================
// GEOLOCATION SCHEMAS
// ========================================

export const GeoLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
  country: z.string().length(2).optional(),
  region: z.string().optional(),
});

export const HotspotSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(200),
  location: GeoLocationSchema,
  risk_score: z.number().min(0).max(100),
  threat_type: z.string().max(100),
  description: z.string().optional(),
  affected_projects: z.array(UUIDSchema).optional(),
  incident_count: z.number().int().nonnegative().optional(),
  last_incident: TimestampSchema.optional(),
});

export type GeoLocation = z.infer<typeof GeoLocationSchema>;
export type Hotspot = z.infer<typeof HotspotSchema>;
