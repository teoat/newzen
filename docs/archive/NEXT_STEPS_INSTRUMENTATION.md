# ## Recommendation

**Proceed with satisfying the new Event Schema by instrumenting the Ingestion and Evidence modules.**Next Step Proposal: "Event Instrumentation"

You have successfully defined the V3 Event Schema (`DATA_UPLOADED`, `EVIDENCE_ADDED`, etc.) in `event_bus.py`.
The logical next step is to **Instrument the Core Services** to actually fire these events.

Currently, the Event Bus is silent except for the test scripts and the specific `Auditor` triggers.

## 1. Instrument Ingestion Pipeline

**Goal**: Fire events during the file upload and processing lifecycle.
**Files**:

- `app/modules/ingestion/router.py`: Fire `DATA_UPLOADED` on successful upload.
- `app/modules/ingestion/tasks.py`: Fire `DATA_VALIDATED` after schema check, and `DATA_INGESTED` after DB commit.
**Benefit**: Enables a future "Progress Bar" agent or UI that relies on the Event Bus rather than polling DB status.

## 2. Instrument Evidence Locker

**Goal**: Fire `EVIDENCE_ADDED` when new files are attached to a case.
**File**: `app/modules/evidence/router.py`
**Benefit**: This is the trigger for the **Judge Agent** (future) to auto-analyze new evidence for contradictions.

## 3. Verify Event Flow

**Goal**: Ensure events are flowing correctly into Redis Streams.
**Action**: Use a script to monitor the stream while performing uploads via the UI.


