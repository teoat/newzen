# ZENITH V2: Forensic Protocol Implementation Plan

This document outlines the phased roadmap for completing the user-guided forensic journey.
Status: ✅ **V2 PROTOCOL COMPLETE // TRANSITIONING TO V3: PREDICTIVE STACK**

---

## Phase 1: Intake & Integrity (Data Handshake) ✅

*Focus: Prove the data is authentic and reconciled.*

- [x] **API Tunnel Restoration**: Fixed port mismatch (8200) and unresponsive backend processes.
- [x] **Schema Stability**: Relaxed `Transaction.status` enum constraints to prevent SQLite lookup crashes.
- [x] **Smart Progression Logic**: Implement "Next Step" prompt after successful ingestion.
- [x] **SHA256 Anchor UI**: Added visual confirmation and 'Verify Integrity' protocol.
- [x] **Command Center Integration**: Redesigned the War Room Dashboard for next-action priority.
- [x] **Telemetric Sync**: Improved visibility of background processing.

---

## Phase 2: Scoping & Scrutiny (Leakage Detection) ✅

*Focus: Identify WHERE the money is leaving the project.*

- [x] **S-Curve Dynamic Linkage**: Connected the S-Curve dashboard to live Ingestion records.
- [x] **Termin Flow Tracer**: Built the visualization for Milestone dispersion.
- [x] **Forensic Lab V2**: Implement EXIF metadata extraction for photos to verify physical presence.
- [x] **Voucher Integrity**: Automated scan for "Tipex" (redaction) patterns using contrast analysis.

---

## Phase 3: The Nexus (Network Investigation) ✅

*Focus: Identify WHO is behind the leaks.*

- [x] **Recursive Nexus**: Allow the Nexus Graph to expand secondary relationships (Implemented in `nexus_router.py`).
- [x] **UBO Resolver**: Backend logic to calculate "Ultimate Beneficial Owner" based on stakes.
- [x] **The Discrepancy Bench**: A dedicated triage UI for investigators to "Approve" or "Escalate" flagged transactions.
- [x] **Fuzzy Vendor Search**: Improve vendor alias consolidation (Implemented in `EntityResolver`).

---

## Phase 4: Adjudication & Recovery (Closure) ✅

*Focus: Legal evidence and asset retrieval.*

- [x] **Dossier Builder**: Automated export of the "Forensic Dossier" via `DossierCompiler`.
- [x] **Asset Recovery Ledger**: Track identified assets (Bank Accounts, Vehicles) linked to suspects.
- [x] **Legal AML Workflow**: Add checklists for compliance with local AML reporting standards.

---

## Phase 5: Zenith V3 (Predictive AI & Immutable Proof) 🚀

*Focus: Proactive prevention and unshakeable evidence.*

- [x] **AI Narrative Engine**: Large Language Model integration to draft "Executive Summaries" for Dossiers based on audit findings.
- [x] **Blockchain Evidence Notary**: Anchor SHA256 hashes of all ingested evidence on-chain for Zero-Knowledge proof of authenticity.
- [x] **Predictive Leakage AI**: Neural Network model to predict stalling or leakage risk in new projects based on historical sub-contractor behavior.
- [x] **Satellite Delta Verification**: (Integration) Correlate reported progress with satellite image change detection.
- [x] **Real-time Sanction Screening**: Live API feed to global AML watchlists (OFAC, Interpol, UN) for every vendor ingested.
- [x] **Cross-Chain Asset Recovery**: Multi-ledger tracing of illicit capital flows.

---

## 🎯 Phase 6 — NEXUS: Unified Intelligence Layer (In Progress)

**Objective**: Transform 22 disconnected tools into a cohesive, event-driven investigation platform.

### Core Infrastructure

- [x] **ForensicEventBus**: Central pub-sub system for reactive cross-module communication
- [x] **Investigation Session Store**: Persistent workflow tracking with Zustand (timeline, context, findings)
- [x] **Notification-Action System**: Actionable toasts with direct tool navigation (Sonner integration)
- [x] **JSON Scenario Engine**: Declarative training scenarios (`operation-red-sky.json`)
- [x] **Enhanced Simulation Lab**: Event-driven guided training with investigation tracking

### Smart UX Features

- [x] **Modal/Drawer Routing**: Open tools in overlays without losing investigation context
- [x] **Split-View Layout**: Keep investigation panel visible while using forensic tools
- [x] **Dynamic Sidebar**: Context-aware tool recommendations based on active events
- [x] **Smart Recommendation Engine**: Algorithm-driven investigative action suggestions
- [x] **Investigation Dashboard**: Central hub for managing parallel cases

### AI-Powered Orchestration

- [x] **Frenly Copilot Integration**: AI assistant suggests forensic workflows
- [x] **Auto-Dossier Compilation**: Generate reports from investigation timeline

---

## Current Status

- **Backend Storage**: Local Vault @ `/storage/uploads`
- **API Core**: FastAPI `localhost:8200` (9 modules active)
- **UI Engine**: Next.js 14 Premium Tactical Theme
- **State Management**: Zustand (Investigation Store)
- **Event System**: ForensicEventBus (9 event types)
- **🎯 CURRENT GOAL**: Complete Phase 6 Smart UX Features for seamless investigation workflow.
