# Verdict Command Implementation Plan

**Objective**: Consolidate the investigation workflow into a unified "Verdict Command" center and enable seamless evidence injection from the Forensic Hub.

## Phase 1: Store Enhancement (Core Logic)

- [ ] **Enhance `useInvestigation` store**:
  - Add `injectEvidence(investigationId: string, evidence: EvidenceItem)` action.
  - Add `generateNarrative(investigationId: string)` action (mocked AI).
  - Support generic evidence types (Entities, Hotspots, Transactions) in `Investigation` context.

## Phase 2: Hub Injection (Bridge)

- [ ] **Update `CrossToolInsights`**:
  - Add "Add to Investigation" button for selected context items.
  - If no active investigation, prompt to create new or select existing.
- [ ] **Create `InjectionModal`**:
  - A quick-select modal to choose which investigation to inject evidence into.

## Phase 3: Verdict Command UI (The "War Room")

- [ ] **Upgrade `/investigate` (Adjudication Bench)**:
  - **Unified Evidence List**: Instead of just transactions, show a mixed feed of injected entities, hotspots, and transactions.
  - **Verdict Actions**: Verify, Exclude, or Flag each item.
  - **Dossier V2 Panel**: A side panel showing the real-time "Narrative" being built.
- [ ] **Integrate Dashboard**: move the stats from `/investigations` into a "Command Overview" mode in `/investigate`.

## Phase 4: Narrative AI (Dossier V2)

- [ ] **Implement `NarrativeEngine`**:
  - A utility that takes the `timeline` from `useInvestigation` and converts it into a "Forensic Story".
  - Example: "At 10:00 AM, Investigator X flagged Entity Y. Relationships revealed Z..."
- [ ] **Export**: Generate a clean Markdown/PDF report from the narrative.
