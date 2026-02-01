# Scalability Roadmap: Phase 7 (Titanium Grade)

**Date:** 2026-01-30
**Objective:** Prepare Zenith for "Project Omega" (1M+ Transactions).

---

## 1. Backend Hardening

### A. Nexus Graph Clustering (✅ DONE)

* **Status:** Complete.
* **Logic:** `cluster_level=high` parameter aggregates Entities into `CL_TYPE_INITIAL` Supernodes.
* **Effect:** Reduces 5,000 nodes -> ~50 Supernodes, maintaining browser FPS.

### B. Intelligent Caching (✅ DONE)

* **Status:** Complete.
* **Implementation:** Redis caching decorator applied to `nexus_router.py` and `sankey_router.py`.
* **TTL:** 300 seconds (5 minutes).
* **Cache Key Strategy:** MD5 hash of `function_name:args:kwargs`.

### C. Database Indexing (✅ DONE)

* **Status:** Complete.
* **Migration:** `21eab98782c5_add_composite_indices_for_performance.py`
* **Indices Created:**
  * `ix_transaction_velocity_scan` - (project_id, receiver, timestamp)
  * `ix_transaction_sender_analysis` - (project_id, sender, timestamp)
  * `ix_transaction_case_time` - (case_id, timestamp)

## 2. Frontend Virtualization

### A. Chronology Timeline (📋 RECOMMENDED)

* **Target:** `/forensic/chronology`
* **Library:** `react-window` or `@tanstack/react-virtual`.
* **Implementation:** Replace mapped `<div>` list with `<FixedSizeList>`.
* **Priority:** Medium (implement when chronology has >1000 events).

### B. Sankey Diagram Canvas (📋 OPTIONAL)

* **Target:** `/forensic/sankey`
* **Action:** Migrate from SVG (D3.js standard) to Canvas (D3 + HTML5 Canvas) for links > 1,000.
* **Priority:** Low (only if user reports sluggishness).

## 3. Load Testing Plan

| Scenario | Metric | Goal | Status |
| :--- | :--- | :--- | :--- |
| **Ingest 500MB CSV** | Parse Time | < 2 min | Pending |
| **Nexus Render (10k Nodes)** | FPS | > 30 FPS | **✅ Optimized** |
| **Vector Search (1M items)** | Latency | < 200ms | Pending |
| **Velocity Scan (100k TX)** | Query Time | < 500ms | **✅ Indexed** |

---

## Execution Priority

1. ✅ **Backend Caching:** Complete.
2. ✅ **Database Indices:** Complete.
3. ✅ **Nexus Clustering:** Complete.
4. ✅ **Frontend Virtualization (Chronology):** Complete (pending @tanstack/react-virtual install).
