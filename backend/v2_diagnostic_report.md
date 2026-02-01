# v2 Upgrade Diagnostic & Roadmap

## 1. Executive Summary
The Zenith Forex platform has several core modules operating with "Step 1" logic—functional but unoptimized placeholders or naive implementations. This document outlines the critical areas identified for "v2" upgrades to achieve production-grade performance and forensic depth.

## 2. Identified Breakages & Weaknesses

### A. NetworkService (`backend/app/modules/forensic/network_service.py`)
- **Status**: Naive Implementation.
- **Issues**:
  - `get_neighborhood` uses a hardcoded concentric layout that fails for complex graphs.
  - Relies entirely on `entity_id` foreign keys; fails if Entity Resolution hasn't linked transactions.
  - `detect_communities` and `detect_circular_flows` wrap basic library calls with no forensic semantic layer (e.g., distinguishing "Structuring Loops" from normal business cycles).
- **Recommendation**: Write `NetworkServiceV2` with hybrid ID/String matching and Force-Directed Layouts.

### B. RABService (`backend/app/modules/forensic/rab_service.py`)
- **Status**: Critical Performance Bottleneck.
- **Issues**:
  - `recalculate_variance` contains a severe **N+1 Query** vulnerability. It iterates every Budget Line and queries the Transaction table individually. For a project with 1,000 budget lines, this triggers 1,000 SQL queries.
  - PDF Parsing is explicitly unimplemented.
  - Excel parsing swallows row-level errors.
- **Recommendation**: Rewrite `recalculate_variance` using Batch Loading + Pandas In-Memory Aggregation. **(High Priority)**

### C. Ingestion Tasks (`backend/app/modules/ingestion/tasks.py`)
- **Status**: Placeholder Logic.
- **Issues**:
  - `ReconciliationEngine.match_waterfall` is a print statement returning dummy data.
  - `VectorEngine` falls back to `random.uniform` if the heavy ML model fails to load, rendering semantic search useless.
  - Hardcoded keywords for "ForensicCopilot" (e.g., "PRIVATE", "MALL") which are brittle.
- **Recommendation**: Implement `WaterFallV2` with real multi-pass SQL logic and offload Embeddings to an external API (OpenAI/Gemini/Cohere) to keep the container light.

### D. AI Router (`backend/app/modules/ai/frenly_orchestrator.py`)
- **Status**: Partial Implementation.
- **Issues**:
  - Several monitoring methods (`_check_velocity_anomalies`, `_check_round_amounts`) are empty returns `[]`.
- **Recommendation**: Implement SQL window functions to detect these patterns efficiently.

## 3. Proposal: RABService V2 (Proof of Concept)

We will implement `RABServiceV2` to address the critical N+1 performance flaw.

**Key Changes:**
1.  **Batch Data Fetching**: Load all `BudgetLines` and `Transactions` in 2 queries maximum.
2.  **Pandas Vectorization**: Perform fuzzy matching and aggregation in memory using optimized C-based Pandas operations.
3.  **Bulk Updates**: Write results back to DB in batches.
4.  **Error Report Object**: standardized JSON structure for parsing errors.

**Target File**: `backend/app/modules/forensic/rab_service_v2.py`
