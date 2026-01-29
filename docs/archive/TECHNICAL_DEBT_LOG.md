# 🛠 Zenith Technical Debt Log

**As of**: 2026-01-28
**Status**: In Progress

## 🟢 Resolved Items (Completed)

### 1. Hardcoded Secrets & Insecure Defaults [FIXED]

* **Fix**: `auth_utils.py` now enforces `SECRET_KEY` loading from environment variables and raises a hard error if missing.
* **Date**: 2026-01-28

### 2. Monolithic "God Components" [FIXED]

* **Fix**: `ReconciliationWorkspace.tsx` refactored into `RecordCard`, `ConfigSlider`, and `TopMetric`.
* **Date**: 2026-01-28

### 3. Lack of Shared Types [FIXED]

* **Fix**: Created `frontend/src/types/domain.ts` matching backend models.
* **Date**: 2026-01-28

### 4. Loose Typing in State Store [FIXED]

* **Fix**: `useInvestigation.ts` updated with strict typing for `context` fields.
* **Date**: 2026-01-28

### 5. Hardcoded API Routes [FIXED]

* **Fix**: Centralized all API usage into `frontend/src/services/apiRoutes.ts`.
* **Date**: 2026-01-28

## 🔴 High Priority (Remaining)

### 1. Ingestion Processing Async Sync

* **Location**: `zenith-lite/frontend/src/app/ingestion/page.tsx` vs `backend/app/modules/ingestion/router.py`
* **Issue**: Frontend does not yet support WebSocket/Polling for the async backend ingestion task.
* **Action**: Implement `useInterval` or WebSocket listener in `IngestionPage`.

### 2. Missing Error Boundaries

* **Location**: `frontend/src/app`
* **Issue**: `ForensicErrorBoundary` exists but is not globally applied.
* **Action**: Wrap `layout.tsx` or key page roots.

## 🟡 Medium Priority (Maintainability)

### 1. Asset Persistence (Optimistic UI)

* **Location**: `AssetRecoveryPage`
* **Issue**: "Freeze" status updates optimistically but needs rigorous backend sync validation.

### 2. Linting & Accessibility

* **Issue**: Miscellaneous lint errors (unused imports) and missing ARIA labels in `forensic/*` pages.

### 3. Documentation Sprawl

* **Issue**: Root directory cluttered with markdown documents.
* **Action**: Archive old docs to `docs/archive/`.

## 🟢 Low Priority (Optimization)

### 1. Synchronous CSV Parsing

* **Location**: `IngestionPage.tsx`
* **Issue**: Large files block the main thread.
* **Action**: Implement Web Worker for parsing.

### 2. Bundle Size Optimization

* **Action**: Use `next/dynamic` for heavy visual components (`NexusGraph`, `SatelliteMap`).
