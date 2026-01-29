# zenith Commander: Orchestrated Redesign & Optimization Plan

## 1. Strategic Vision: Unified Forensic Command
The transition of **Zenith** from a collection of isolated forensic tools to a **Unified Command Environment**.
**Laser Focus**: Minimizing "Cognitive Load" and "Context Switching" for investigators by consolidating views and standardizing state propagation.

---

## 2. Layer Analysis & Continuity

### A. Data Acquisition Layer (PHASE I)
*   **Purpose**: Establish the digital chain of custody.
*   **Existing Components**: `ingestion`, `nexus`, `satellite`.
*   **Connection**: Ingestion triggers a `NEXUS_SYNC` event; results are visualized in the Hub.
*   **Risk**: Large datasets blocking UI responsiveness.
*   **Continuity**: Global Progress Bar via `TelemetrySync`.

### B. Forensic Hub Layer (PHASE II)
*   **Purpose**: Multi-dimensional anomaly detection.
*   **Proposed Consolidation**: Combine `/forensic/analytics`, `/forensic/flow`, `/forensic/lab`, `/forensic/nexus`, and `/forensic/satellite` into a single **Forensic Workspace**.
*   **Connection**: Common `projectId` filter driving all views.
*   **Continuity**: Tab-based switching prevents full page refreshes, maintaining component local state (e.g., map zoom level).

### C. Verdict & Action Layer (PHASE III)
*   **Purpose**: Converting findings into legal determinations.
*   **Proposed Consolidation**: Merge `/investigate` (Workbench) and `/investigations` (List) into `/war-room`.
*   **Connection**: Direct injection of Hub anomalies into Workbench cases.

---

## 3. Impact Scoring & Results Matrix

| Proposed Change | UX Score | Efficiency Score | ROI |
| :--- | :--- | :--- | :--- |
| **Unified Forensic Hub** | 9.8/10 | +45% | Extremely High (Primary User Value) |
| **Case Workbench Redesign** | 8.5/10 | +30% | High (Action Speed) |
| **Compliance Consolidation** | 7.5/10 | +20% | Medium (Legal Process) |
| **State Flow Optimization** | 9.0/10 | +60% | Critical (Reliability) |

---

## 4. Continuity & Connection Definitions

1.  **Event Bus (`ForensicEventBus`)**: The central nervous system connecting backend telemetry to Pulse UI elements.
2.  **Investigation Store**: Persistent case context shared across the Hub and Workbench.
3.  **Global UI Tokens**: Standardizing on tactical dark-mode palettes (Slate-950) and Indigo/Emerald highlights.

---

## 5. Risk Mitigation Strategy

*   **Risk**: Bundle Size of consolidated Hub.
    *   **Mitigation**: Use Next.js `dynamic()` imports for heavy components like `SatelliteMap` or `NexusGraph`.
*   **Risk**: State Complexity in a single Hub page.
    *   **Mitigation**: Atomic state management within the hub for view-specific data.
*   **Risk**: UX Overwhelm.
    *   **Mitigation**: "Focus Mode" providing a clean view of one tool at a time, while keeping others "hot" in background tabs.

---

## 6. Execution Roadmap (Orchestrated)

1.  **[NOW] Blueprinting**: Creating this master plan and auditing connections.
2.  **[STEP 2] Hub Prototype**: Creating the `/forensic/hub` unified container.
3.  **[STEP 3] Migration**: Porting individual tools into the Hub workspace.
4.  **[STEP 4] Workbench Refactor**: Streamlining Case navigation.
5.  **[STEP 5] Telemetry Overhaul**: Ensuring every consolidated action reflects in the Command Stream.
