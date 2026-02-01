# Forensic Traceability Report: RAB & CCO Integration

## 1. System Overview

The Zenith platform now supports comprehensive **Contract Change Order (CCO)** forensic analysis. This integration allows investigators to track technical optimizations and budget reallocations from the original contract to final execution.

## 2. Data Genealogy

* **Source File:** `CCO 01-Table 1.csv`
* **Intermediate Extraction:** `rab_data_full.csv`
* **Target Backend Model:** `BudgetLine` (Updated with CCO fields)
* **Detection Baseline:** Actual Ledger Transactions vs. Revised (CCO) Budget.

## 3. Key Forensic Components

### A. Extended Schema

The `BudgetLine` model has been extended to support the **Triple-Baseline** approach:

1. **Original (Planned):** Initial contract values.
2. **CCO (Revised):** Legally modified budget values (The current "Truth").
3. **Actual (Realization):** Real-world spend from bank ledgers.

### B. Intelligent Mapping

The `RABService` now includes a robust CSV parser that:

* Extracts `item_code` for exact matching (e.g., `7.1.(5a)`).
* Handles regional formatting (Indonesian `1.000,00` currency styles).
* Automatically triggers **Variance Recalculation** upon file upload.

### C. Variance Heuristics

The forensic engine flags items that meet either criteria:

* **Price Markup > 10%:** Unit price in ledger exceeds CCO price.
* **Volume Discrepancy > 15%:** Physical quantity used exceeds CCO allocation.

## 4. Implementation Status

| Component | Status | Location |
|---|---|---|
| CSV Processor | COMPLETE | `generate_detailed_rab_v4.py` |
| Database Model | UPDATED | `backend/app/models.py` |
| Ingestion Service | ENHANCED | `backend/app/modules/forensic/rab_service.py` |
| API Layer | VERIFIED | `/rab/upload` (forensic_services.py) |
| UI Indicators | DRAFTED | `AcquireStep.tsx` (RAB Icon & Logic) |

## 5. Next Forensic Step

Run the **Physical Verification** (Vision Engine) on the high-variance items identified in the CCO (e.g., Bridge Foundation Piles) to ensure that the increased budget for underground work matches physical site progress.
