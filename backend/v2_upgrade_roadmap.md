# Zenith V2 Upgrade Roadmap

## 1. Critical Upgrades Required

### A. Ingestion & Reconciliation Engine (`backend/app/modules/ingestion/tasks.py`)

- **Status**: **PLACEHOLDER / MOCK**
- **Diagnosis**:
  - The `match_waterfall` method, intended to be the core reconciliation logic, is currently a print statement returning dummy data.
  - It does not utilize the robust `ReconciliationIntelligence` utilities available in `app.core`.
  - Advanced features like "Thinning Aggregate" (matching N bank items to 1 ledger item) are documented but unimplemented.
- **V2 Goal**: Implement `ReconciliationEngineV2` that orchestrates:
  1. **Exact Matching**: Amount + Date + Ref.
  2. **Fuzzy Matching**: Using `VendorMatcher` and `SemanticMatcher`.
  3. **One-to-Many Matching**: "Thinning" aggregations.

### B. Prophet Service (`backend/app/modules/forensic/intelligence/prophet_service.py`)

- **Status**: **NAIVE HEURISTIC**
- **Diagnosis**:
  - Risk scoring (`predict_transaction_risk`) relies on simple conditional checks (If round number, +0.3 risk).
  - Lacks dynamic thresholding or machine learning.
  - Vendor screening (`pre_screen_vendor`) has placeholders for external sanctions lists.
- **V2 Goal**:
  1. **Dynamic Scoring**: Implement a weighted scoring model based on historical anomalies.
  2. **External Simulation**: Improve vendor screening to at least simulate external API calls structure for future integration.

### C. Vision Service (`backend/app/modules/forensic/vision_service.py`)

- **Status**: **PARTIAL**
- **Diagnosis**:
  - `analyze_bank_statement` explicitly returns "PDF OCR not yet implemented" for PDF files.
  - This forces users to convert PDFs to images manually.
- **V2 Goal**:
  1. **PDF-to-Image Pipeline**: Integrate `pdf2image` or direct Gemini PDF processing to handle statement uploads natively.

### D. Network Service (`backend/app/modules/forensic/network_service.py`)

- **Status**: **NAIVE**
- **Diagnosis**:
  - Uses a hardcoded concentric circle layout algorithm which is visually cluttered for large graphs.
  - Relies solely on `entity_id` links, missing unlinked text-based connections.
- **V2 Goal**:
  1. **Force-Directed Layout**: Move layout logic to a physics-based approach (or offload to frontend library).
  2. **Hybrid Linking**: Link nodes based on text similarity if Foreign Keys are missing.

## 2. Recommended Action Plan

1. **Step 1 (Immediate)**: Implement `ReconciliationEngineV2`. This is the "Brain" of the financial platform. Without it, ingestion is just data entry.
2. **Step 2**: Upgrade `ProphetService` to V2 logic for better demo value.
3. **Step 3**: Fix `VisionService` PDF handling.

## 3. Previously Completed

- ~**RAB Service**~: Upgraded to V2 (Batch Processing) in previous session.
- ~**Diagnostic Integrity**~: Schema drift fixed.
