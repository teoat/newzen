# V3 Autonomous Architecture

## Overview

V3 shifts Zenith from a passive CRUD app to an active Agentic System.

### Components

1. **Event Bus (Redis Streams)**: The spine of the autonomy.
   - `transaction.created` -> Consumed by Auditor.
   - `data.uploaded` -> Consumed by Ingestion Workers.
   - `evidence.added` -> Consumed by Judge (Future).

2. **Auditor Agent (`app/modules/agents/auditor.py`)**:
   - **Type**: Event-Driven Consumer.
   - **Logic**:
     - Consumes `transaction.created`.
     - Calls `ProphetServiceV2` for risk scoring.
     - Writes `FraudAlert` if Risk > 50.

3. **Nurse Agent (`app/modules/agents/nurse.py`)**:
   - **Type**: Polling Loop (Interval: 30s).
   - **Logic**:
     - SELECT * FROM `quarantine_rows` WHERE status='new'.
     - Calls `DataHospital.shift_rounds()` to attempt Regex/Heuristic fixes.

## Configuration

- **Environment**: `ENABLE_EMBEDDED_AGENTS=true` (in `.env`) runs agents inside the main FastAPI process (for "Zenith Lite").
- **Deployment**: In Scale-up mode, run agents as separate Docker containers:
  `python -m app.modules.agents.auditor`

## Monitoring

- **API**: `GET /api/v2/system/agents`
- **Dashboard**: `SystemHealthWidget.tsx` in the frontend.
