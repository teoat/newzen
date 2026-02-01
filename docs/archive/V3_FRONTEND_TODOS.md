# V3 Visible Autonomy: Next Steps

The Backend APIs are ready. The goal is now to surface these capabilities to the user in the Frontend.

## 1. Frontend: Data Hospital Interface

- [ ] **Create API Hooks**: Implement `useQuarantineStats`, `useQuarantineList`, and `useResolveRow` in `frontend/src/api/hooks`.
- [ ] **Build `TriageTable` Component**: A table displaying `QuarantineRow` items with status badges (New vs Repaired) and an "Admit" button.
- [ ] **Build `PatientChart` Modal**: A code-editor style modal allowing the user to view the `raw_content` JSON/CSV and manually correct it.
- [ ] **Create Page Route**: Add `/admin/data-hospital` to the main navigation (Admin only).

## 2. Frontend: Agent Command Center

- [ ] **Create `AgentStatus` Hook**: Fetch data from `/api/v2/system/agents`.
- [ ] **Build `SystemHealth` Widget**: A dashboard card showing the "Heartbeat" status of the **Auditor** and **Nurse** agents.
  - *Visual*: Green Dot (Active) / Red Dot (Offline).
  - *Metric*: "Lag: 0 events" (for Auditor).

## 3. Integration & Testing

- [ ] **Manual E2E Test**:
  1. Manually corrupt a CSV file (e.g., bad JSON in a column).
  2. Upload via Ingestion.
  3. Verify it appears in the **Data Hospital**.
  4. Manually fix it in the UI.
  5. Verify status changes to `fixed_manually`.
