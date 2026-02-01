# System Diagnostics & Version Enhancement Proposal

## 1. Executive Summary

This document outlines the current state of key "v1.0" systems within the Zenith Platform and proposes a roadmap for their "v2.0" evolution. The goal is to transition from "Mock/MVP" implementations to fully functional, high-agency forensic tools.

## 2. System Analysis & Upgrade Targets

### A. Reasoning Engine (The Brain)

* **Current State (v1.0):**
  * **Status:** **MOCK / SIMULATED**
  * **Frontend:** `ReasoningEnginePage` displays a sophisticated UI for hypotheses.
  * **Backend:** `api/v2/endpoints/reasoning.py` returns hardcoded static data ("Circular Fund Injection"). It does not connect to the database or LLM.
  * **Limitations:** Users cannot actually generate insights on their own data; they only see the demo data.
* **Proposed v2.0 Upgrade: "Active Inference"**
  * **Integration:** Connect the API endpoint to the existing `FrenlyOrchestrator`.
  * **Capability:**
    * Accept real `transaction_ids`.
    * Use `Gemini 2.5 Flash` (via Orchestrator) to analyze narrative fields.
    * Auto-generate SQL queries to verify patterns (e.g., "SELECT count(*) ...").
  * **Impact:** True AI-driven forensic investigation.

### B. Nexus Graph (The Eyes)

* **Current State (v1.0):**
  * **Status:** **STUB / STATIC**
  * **Frontend:** `NexusGraphPage` uses `react-force-graph` but often falls back to holographic mock data.
  * **Backend:** `api/v2/endpoints/graph.py` is a placeholder returning empty lists or static nodes.
  * **Limitations:** No real relationship traversal; cannot see flow of funds between entities.
* **Proposed v2.0 Upgrade: "Temporal Linkage"**
  * **Integration:** Implement `NetworkX` or recursive SQL queries in the backend.
  * **Capability:**
    * Calculate "Shortest Path" between two suspects.
    * Add **Time-Series Playback** to visualize funds moving over time.
    * "Sanction Sweep" button that actually checks a watchlist database.
  * **Impact:** Visual proof of money laundering structures.

### 3. Ingestion Lab (v1.0 - "Optical Tunnel")

**Current Status:**

* **Status:** **BASIC / MANUAL**
* **Frontend:** Functional drag-and-drop, schema mapping UI, and "Optical Tunnel" branding.
* **Backend:** Basic CSV parsing. "Visual" ingestion (PDF/Images) is largely simulated or relies on basic text extraction without semantic understanding.
* **Deficiency:** Lacks true multi-modal capability. Cannot read bank statements or invoices intelligently.

**v2.0 Upgrade Proposal:**

* **Vision-Language Model Integration:** Use FrenlyOrchestrator (Gemini 1.5 Pro) to visually parsing PDFs and Images.
* **Auto-Schema Alignment:** Replace fuzzy logic with LLM-based field mapping.
* **Scalability:** Implement async batch processing for large datasets (leveraging existing `batch_jobs.py` infrastructure).

---

### 4. Forensic Analytics (v1.0 - "Variance Engine")

**Current Status:**

* Frontend: `forensic/analytics/page.tsx` relies heavily on `HOLOGRAPHIC_SOURCE` (mock data).
* Backend: Endpoints for Project Dashboard and S-Curve are potentially stubbed or disconnected from real ledger aggregation.
* **Deficiency:** "Confidence Scores" and "Leakage Estimates" are hardcoded or randomized simulations.

**v2.0 Upgrade Proposal:**

* **Real-Time Aggregation:** Implement SQL-based aggregation of active transaction ledgers.
* **Dynamic S-Curve:** Generate S-Curves on-the-fly comparing `planned_value` (from RAB) vs `actual_cost` (from Transactions).

---

### 5. Asset Recovery (v1.0 - "Flux Tracer")

**Current Status:**

* Frontend: `forensic/recovery/page.tsx` uses `setTimeout` to simulate tracing.
* Backend: No real connection to blockchain explorers or internal graph traversal for asset tracking.
* **Deficiency:** Purely cosmetic "tracing" animation.

**v2.0 Upgrade Proposal:**

* **Graph Integration:** Connect to Nexus Graph to actually trace flow of funds between entities.
* **External Lookups:** Optional integration with public ledger explorers for crypto assets.

---

### 6. Site Verification Lab (v1.0 - "Reality Match")

**Current Status:**

* Frontend: `forensic/lab/page.tsx` uses mock "Site Truth" data.
* **Deficiency:** "Visual Scan" does not actually analyze uploaded site photos.

**v2.0 Upgrade Proposal:**

* **Computer Vision Analysis:** Send uploaded site photos to FrenlyOrchestrator to count objects (e.g., "count excavator buckets") and compare with invoiced quantities.

## 3. Future Horizon: v3.0 Systems (The Agentic Era)

While v2.0 focuses on *Analysis & Detection*, v3.0 focuses on *Action & Autonomy*.

### A. The "Judge" (Autonomous Adjudication)

* **Goal:** Move from "finding evidence" to "preparing the verdict".
* **Capabilities:**
  * **Auto-Dossier Generation:** Automatically assembles a comprehensive PDF legal brief including all flagged evidence, chain-of-custody hashes, and narrative summaries.
  * **Legal Document Drafting:** Drafts subpoenas, freezing orders, and audit finding letters based on templates and specific case facts.
  * **Confidence Scoring:** Assigns a "Prosecutorial Success Probability" to cases based on evidence strength.

### B. The "Prophet" (Predictive Compliance)

* **Goal:** Move from "Post-Mortem Analysis" to "Pre-Crime Prevention".
* **Capabilities:**
  * **Transaction Interceptor:** Hooks into the payment gateway to block transactions *before* they occur if they match high-confidence fraud patterns.
  * **Budget Simulation:** Simulates future project spend based on current burn rate and predicts specific dates where budget will be exhausted.
  * **Vendor Pre-Screening:** Autonomously crawls public records/news for new vendors before they are onboarded.

### C. The "Architect" (Digital Twin Reconstruction)

* **Goal:** Move from "Photo Storage" to "3D Truth".
* **Capabilities:**
  * **NeRF / Gaussian Splatting:** Converts a swarm of 2D site photos into a navigable 3D model.
  * **BIM Comparison:** Overlays the 3D reconstruction onto the original Building Information Model (BIM) to automatically calculate volume variance (e.g., "Concrete poured is 15% less than design").
  * **Satellite Chronology:** Integrates historical satellite imagery to valid site progress over time automatically.

---

## 4. Execution Roadmap

### Phase 1: The Brain (v2.0 Core) - **[COMPLETE]**

* **Objective:** Enable active logic and reasoning.
* **Key Deliverables:**
  * [x] `FrenlyOrchestrator` implementation.
  * [x] `/hypothesize` endpoint connected to LLM.
  * [x] Frontend displaying real hypotheses (connected to `/api/v2/reasoning/hypothesize`).

### Phase 2: The Nervous System (v2.0 Data) - **[COMPLETE]**

* **Objective:** Connect the dots between entities.
* **Key Deliverables:**
  * [x] `NetworkService` for graph traversal (nodes/links).
  * [x] `IngestionService` utilizing LLM for schema mapping.
  * [x] `AnalyticsService` aggregating real ledger data (includes RAB integration).

**Note on RAB Integration:** The `AnalyticsService` includes full RAB (Rencana Anggaran Biaya) support via the `BudgetLine` model, comparing planned budget (`unit_price_rab`, `qty_rab`) against actual spend (`avg_unit_price_actual`, `qty_actual`) to calculate markup percentages and volume discrepancies.

### Phase 3: The Senses (v2.0 Vision) - **[COMPLETE]**

* **Objective:** Give the system eyes.
* **Key Deliverables:**
  * [x] `VisionService` for invoice/receipt OCR and analysis.
  * [x] Basic site photo object counting.
  * [x] Photo manipulation detection (ELA/forensic analysis).

### Phase 4: The Agents (v3.0 Autonomy) - **[PROTOTYPED]**

* **Objective:** Allow the system to act.
* **Key Deliverables:**
  * [x] **The Judge:** Dossier generation with cryptographic integrity.
  * [x] **The Prophet:** Transaction risk prediction and budget forecasting.
  * [x] **The Architect:** 3D reconstruction architecture (R&D prototype).

## 5. Conclusion

Upgrading to v2.0 transitions Zenith from a "Demo" to a "Tool". Upgrading to v3.0 transitions it from a "Tool" to a "Partner". The infrastructure is laid; the next steps are filling the neural pathways with real logic.
