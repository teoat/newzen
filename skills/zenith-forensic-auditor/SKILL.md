---
name: zenith-forensic-auditor
description: Specialized expert procedural guide for auditing, extending, and maintaining the Zenith Forensic Platform. Use when implementing new forensic features, modifying schemas, or auditing security middleware to ensure military-grade precision and data integrity.
---

# Zenith Forensic Auditor

## Overview

This skill transforms Gemini CLI into an Autonomous Platform Architect for the Zenith Forensic Platform. It enforces the "Sovereign Rules" of the architecture, ensuring that all code modifications adhere to our high-fidelity forensic standards and security protocols.

## Core Capabilities

### 1. Sovereign Code Auditing (Security)
Whenever a new router or endpoint is implemented, you MUST verify the application of the `verify_project_access` middleware.
- **Workflow:**
  1. Scan the new router for dependencies.
  2. If an endpoint is project-scoped (takes `project_id`), ensure `project: Project = Depends(verify_project_access)` is present.
  3. If an endpoint is administrative, ensure `require_role(["admin"])` is applied.

### 2. Schema-AI Alignment
All database modifications in `app/models.py` MUST be mirrored in the AI's reasoning layer.
- **Workflow:**
  1. Identify new fields in `Entity` or `Transaction` models.
  2. Update `ForensicCopilot.generate_reasoning` in `ingestion/router.py` to utilize these new fields.
  3. Update `GeminiSQLGenerator` schema context to include the new fields for natural language querying.

### 3. Legal Integrity Enforcement
Any feature producing legal-grade output (PDFs, Dossiers, Verdicts) MUST implement the Integrity Seal.
- **Workflow:**
  1. Ensure the final object is hashed using SHA-256.
  2. Register the hash in the `IntegrityRegistry` table.
  3. Overlay the `INTEGRITY_SEAL` and `REGISTRY_ID` on the output visual layer (e.g., PDF Footer).

## Sovereign Rules Reference

| Rule | Instruction |
| :--- | :--- |
| **Concurrency** | Always use `with_for_update()` for reconciliation/match confirmation. |
| **Model Canonicality** | `zenith-lite/backend/app/models.py` is the ONLY source of truth for models. |
| **Data At Rest** | All files in `storage/uploads` MUST be AES-256 encrypted via `FieldEncryption`. |
| **Observability** | All critical state changes MUST be logged via `AuditLogger.log_change()`. |

## Advanced Diagnostic Pipeline

Use the following commands to validate the system state after modifications:
- `cd backend && python scripts/verify_services.py` (Validates core service logic)
- `cd frontend && npm run build:check` (Validates UI and Type integrity)
- `scripts/monitor_logs.sh` (Real-time forensic pattern monitoring)