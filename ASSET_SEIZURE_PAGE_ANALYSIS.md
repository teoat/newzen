# Asset Discovery & Correlation Analysis

**Module**: Asset Identification (`/forensic/assets`)
**Date**: 2026-01-28
**Status**: V5 Horizon (Live Forensic Integration)

## 1. Functional Analysis

The page serves as the "Identification" phase of the investigation, where assets are mapped and their beneficial ownership links correlation is verified.

### Key Workflows

1. **Beneficial Ownership (UBO) Visualization**:
    - *Status*: **Live**. Renders a dynamic trace of ownership levels based on actual database relationships.
    - *Logic*: Fetches from `AssetRecoveryService.get_recovery_profile`, resolving `CorporateRelationship` links upstream.
2. **Asset Verification Cabinet**:
    - *Status*: **Functional**. List of asset cards with a "Verify Link" action.
    - *Logic*: `toggleVerification` updates the localized risk status via API.
    - *Terminology*: "Freeze" actions have been replaced with "Verify Link" to reflect an analyst's role in confirming data, not taking legal action.
3. **Forensic Reporting**:
    - *Status*: **Functional**. "Generate Forensic Report" button creates a timestamped artifact for downstream review.
    - *Logic*: Generates a unique Report ID (`REP-XXXX`) for verified assets.

## 2. Code Quality & Technical Debt

### A. Styling

- **Responsiveness**: The UBO visualization relies on localized absolute positioning which is optimized for desktop dashboards. Future iterations should use a responsive graph library.

## 3. Enhancement Proposal

### Short Term (Completed)

1. **Terminology Shift**: Removed all "Law Enforcement" language (Seize, Freeze, Warrant) in favor of "Forensic" language (Verify, Correlate, Report).
2. **Live Data**: Replaced hardcoded mocks with real DB queries.

### Medium Term (Features)

1. **Enhanced Correlation**: Visualize "Lateral Links" (e.g., shared addresses or directors) in the UBO graph, not just vertical ownership.
2. **External Validation**: Integrate public registry APIs to auto-verify entity existence.

### Long Term (AI)

1. **Valuation AI**: Use the `estimated_value` to check against real-time market proxies instead of static appraisals.
