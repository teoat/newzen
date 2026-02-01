# Next Step Proposal: "Visible Autonomy"

The V3 Backend is now a powerful, autonomous engine. However, it is currently a "Black Box" to the user. The logical next step is to build the **Interface** for these new capabilities.

## 1. The "Data Hospital" Interface

**Problem:** The `NurseAgent` fixes simple errors, but rows marked `needs_specialist` (manual review) currently sit in the database forever.
**Solution:**

- **Backend API**: Create `quarantine_router.py` to allow fetching and resolving stuck rows.
- **Frontend UI**: Build a "Data Hospital" page where investigators can:
  - View raw failed JSON/CSV content.
  - Apply manual fixes.
  - Re-inject fixed data into the pipeline.

## 2. Agent Command Center

**Problem:** Agents are running in the background, but admins have no verified visibility.
**Solution:**

- **Frontend Dashboard**: A new "System Status" page consuming `/api/v2/system/agents`.
- **Metrics**: Show "Heartbeat", "Consumer Lag", and "Patients Healed" stats.

## 3. Real-Time Alert Stream

**Problem:** The `AuditorAgent` generates alerts in the background, but users only see them if they refresh the old lists.
**Solution:**

- **Frontend Polling**: Add a lightweight poller to the `Bell` icon to notify of new `PROPHET_AUTO_FLAG` alerts immediately.

## Recommended Action

**Implement the Quarantine API & UI first.** This completes the "Self-Healing" loop by bringing the human into the process when the AI fails.
