# ADR 003: Unified Forensic Intelligence & Security Architecture

## Status

Accepted

## Context

As Zenith evolved, intelligence services (`JudgeService`, `ProphetService`, `ArchitectService`) were scattered across various modules (`modules/forensic`, `modules/ai`), leading to code duplication and inconsistent access patterns. Additionally, high-value forensic assets (e.g., sealed court dossiers) lacked granular Role-Based Access Control (RBAC), posing a security risk. The frontend timeline component (`ForensicChronology`) also suffered from performance bottlenecks when rendering large datasets (>10k events).

## Decisions

### 1. Unified Intelligence Layer

We consolidated all AI-driven services into a single directory: `app/services/intelligence/`.

- **JudgeService**: Unified adjudication logic and added a "Mens Rea" intent synthesis engine.
- **ProphetService**: Merged V1 and V2 logic, enabling weighted risk scoring and budget forecasting in one service.
- **ArchitectService**: Centralized spatial intelligence and NeRF reconstruction logic.

This consolidation simplifies import paths and ensures all forensic modules consume the same version of intelligence logic.

### 2. Resilient AI Fallback Strategy (Dual-Model)

To ensure 99.9% availability of investigative tools, we implemented a dual-model strategy in `JudgeService` and `ProphetService`:

- **Primary**: **Gemini Pro 1.5** (High fidelity, complex reasoning).
- **Secondary**: **Gemini Flash 1.5** (High speed, fallback).
The system automatically downgrades to Flash if Pro encounters rate limits or API errors, ensuring that investigations are never blocked by AI unavailability.

### 3. Advanced Money Laundering Detection

We enhanced the `NetworkService` to detect circular flow typologies (A -> B -> C -> A), a hallmark of money laundering and layering schemes. This is exposed via the new `GET /forensic-v2/graph/circular-flows/{project_id}` endpoint.

### 4. Sealed Evidence RBAC

We enforced strict RBAC on the evidence download endpoint (`/evidence/{project_id}/download/{document_id}`).

- **Logic**: If a document is marked `sealed` in metadata, the requester MUST have `ADJUDICATOR` or `ADMIN` roles.
- **Enforcement**: Implemented directly in the router using `UserProjectAccess` lookups, rejecting unauthorized requests with `HTTP 403`.

### 5. Frontend Virtualization

We migrated `ForensicChronology` from `react-window` to `@tanstack/react-virtual`.

- **Benefit**: Improved compatibility with Next.js 15+ and enabled stable rendering of 100,000+ timeline events with dynamic sizing.
- **Cleanup**: Removed `react-window` dependency to reduce bundle size.

## Consequences

- **Positive**:
  - Centralized logic reduces maintenance overhead.
  - Investigations are resilient to AI service outages.
  - Security posture is significantly hardened against internal threats.
  - Large-scale forensic timelines render smoothly.
- **Negative**:
  - "Flash" fallback responses may have slightly lower nuance than "Pro" responses, but are sufficient for triage.
  - Circular flow detection on very large graphs (>10k nodes) may be computationally expensive (mitigated by `max_hops` limit).

## Compliance

- **ISO 27001**: RBAC enforcement for sensitive assets.
- **ACFE Standards**: Logic-based fraud theory generation ("Mens Rea").
