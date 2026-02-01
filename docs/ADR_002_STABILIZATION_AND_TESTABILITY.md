e ADR 002: Platform Stabilization and Testability Enhancements
se areas that might cause drift issues and possible err

## Status

Accepted

## Context

During the final Phase 4 integration and E2E testing of the Zenith Platform, several technical blockers and maintenance debt items were identified:

1. **Event Bus Fragility**: The event bus was inconsistent across modules, leading to race conditions and lost events in background tasks.
2. **Testing Friction**: CSRF protection and strict JWT validation made automated E2E testing difficult in isolated environments.
3. **Legacy Datetime Patterns**: The use of `datetime.utcnow()` was triggering deprecation warnings in Python 3.12+ and could lead to timezone ambiguity.
4. **Maintenance Debt**: Lingering linting issues and unhandled local variables were causing sporadic failures in batch job endpoints.

## Decision

### 1. Unified Redis-Backed Event Bus

We refactored `app/core/event_bus.py` to use a singleton `EventBus` pattern backed by Redis Pub/Sub.

- Introduced `EventType` enum to standardize all system events (e.g., `BATCH_JOB_STARTED`, `HIGH_RISK_ALERT`).
- Provided a thread-safe `publish` method and a compatibility `publish_event` wrapper.
- All background workers (JudgeAgent) now subscribe via this unified bus.

### 2. Testing Environment Bypasses

To enable high-fidelity E2E testing without compromising production security:

- **CSRF Bypass**: Added a `TESTING` flag in `app/core/config.py`. When `TESTING=true`, `CSRFProtectionMiddleware` automatically exempts all requests.
- **Mock Authentication**: Enhanced `get_current_user` to return an administrative `test_user` when receiving a `mock_token`.
- These features are strictly compiled/checked against the `settings.TESTING` flag.

### 3. Modern Datetime Standards

Migrated all instances of `datetime.utcnow()` to `datetime.now(UTC)` or `datetime.now(datetime.UTC)`.

- Enforces timezone-aware objects across the entire backend.
- Aligns with Python 3.12+ best practices.

### 4. Code Quality and Resiliency

- Fixed indentation and local variable scoping bugs in `batch_jobs.py`.
- Implemented comprehensive `tests/test_resiliency_flow.py` to verify failure handling and job cancellation.
- Standardized database query formatting for better readability.

## Consequences

### Positive

- **Reliable E2E Testing**: `tests/test_e2e_flow.py` now passes consistently.
- **Future-Proof Code**: Eliminated critical deprecation warnings.
- **Better Observability**: Standardized event logging and publishing.

### Neutral

- Development environment now requires `TESTING=true` env var to run automated suites that bypass security.

### Negative

- None identified.
