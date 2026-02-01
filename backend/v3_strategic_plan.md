# Zenith V3 Strategic Plan: "Autonomous & Resilient"

## 1. Executive Vision

With V2 upgrades (Ingestion, Prophet, Vision) securing the **Accuracy** and **Performance** of the forensic core, **V3** focuses on **Autonomy** and **Scalability**.

The goal of V3 is to move from a "User-Initiated Tool" to an "Always-On Watchdog".

## 2. Core Pillars of V3

### A. Event-Driven Micro-Agents

**Current State:** Monolithic "Orchestrator" service.
**V3 Goal:** Decompose logic into autonomous agents listening to a Kafka/Redis Stream.

- **The Auditor Agent**: Wakes up when a new Transaction is inserted. Scores it.
- **The Hunter Agent**: Wakes up when a high-risk score is found. Crawls external OSINT sources.
- **The Judge Agent**: Wakes up when a case is closed. Drafts the PDF.

### B. Self-Healing Data Pipeline

**Current State:** Ingestion errors (PDF parsing fail) result in 500 errors or skipped rows.
**V3 Goal:** "Data Hospital" queue.

- Failed rows go to a "Quarantine Table".
- An LLM-powered "Nurse" attempts to fix JSON formatting or regex parsing errors automatically.
- Only "Terminal" errors notify a human.

### C. Federated Learning (Privacy-Preserving)

**Current State:** Global rules hardcoded or learned from single-project history.
**V3 Goal:** Cross-project intelligence without data leakage.

- Learn fraud patterns (e.g., "Structuring < 100M") from Project A.
- Apply pattern detection to Project B without exposing Project A's vendors.

## 3. Technical Architecture (V3)

1. **Message Broker**: Redis Streams / RabbitMQ (Decoupling services).
2. **Vector Database**: Qdrant / Pinecone (Long-term memory for semantic search).
3. **Graph Database**: Neo4j (Replacing NetworkX in-memory graphs for massive scale).

## 4. Immediate Next Steps (Pre-V3)

1. **Containerization**: Ensure `pdf2image` capabilities are in the Dockerfile (need `poppler-utils`).
2. **Async Refactor**: Move all AI calls to Celery tasks definitively.
