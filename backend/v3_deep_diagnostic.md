# Zenith V3 Deep Diagnostic & Implementation Plan

## 1. Deep Dive Diagnostics

### A. Infrastructure Readiness

- **Docker**: `poppler-utils` was missing, which would have crashed the V2 Vision Service on deployment. **Status: Fixed**.
- **Redis**: The `redis_client.py` uses standard Redis keys/lists. It does *not* yet support Redis Streams (Consumer Groups) which are required for the V3 "Event-Driven" architecture. The current async implementation relies on `BackgroundTasks` which is not durable across restarts.

### B. Database Schema Gaps

- **Vector Embeddings**: `models.py` has `embeddings_json` on Transactions and Entities. This is good for "Small Data", but storing vectors in Postgres JSON columns is **not scalable** for similarity search.
- **Graph Consistency**: The current `Entity` model handles basic node properties, but complex relationships are split between `CorporateRelationship` and ad-hoc logic. V3 needs a dedicated Graph DB or a recursive CTE structure for deep pathfinding.
- **Data Hospital**: There is no "Quarantine" table. Failed ingestion rows currently vanish or stay in limbo.

### C. Async/Celery State

- `ProcessingJob` model exists with `celery_task_ids`, but the actual `celery_app` configuration and worker definition is not fully decoupled from the web server.

## 2. V3 "Autonomous" Implementation Steps

### Phase 1: Infrastructure Hardening (Immediate)

1. [x] **Docker**: Add `poppler-utils`.
2. [ ] **Celery**: Formalize the Worker container in `docker-compose` and K8s manifests.
3. [ ] **Redis Stream Client**: specific utility class for publishing/consuming stream events.

### Phase 2: The "Data Hospital" (Self-Healing)

1. **Schema**: Create `QuarantineRow` table.
2. **Agent**: "Nurse" LLM Agent that reads `QuarantineRow`, suggests fixes (e.g., regex repair), and re-injects to Ingestion Pipeline.

### Phase 3: The "Always-On" Auditors

1. **Event Bus**: Define event schema `transaction.created`, `entity.updated`.
2. **Auditor Agent**: Subscribes to `transaction.created`. Runs `ProphetServiceV2`. If risk > 80, publishes `alert.raised`.

## 3. Tech Stack Evolution

| Component | Current (V2) | Target (V3) |
| :--- | :--- | :--- |
| **Messaging** | `FastAPI.BackgroundTasks` | **Redis Streams** / RabbitMQ |
| **Vector Store** | Postgres `JSON` | **Qdrant** / **pgvector** |
| **PDF Parsing** | `pdf2image` (Sync) | **Unstructured.io** (Async Worker) |
| **Logic** | HTTP Request/Response | Event-Driven Consumers |

## 4. Next Actions

- Please review the [V3 Strategic Plan](v3_strategic_plan.md) which outlines the high-level vision.
- The system is currently stable at **V2 (Production Grade)** for core forensics.
- Migration to V3 is a scaling task, not a feature fix.
