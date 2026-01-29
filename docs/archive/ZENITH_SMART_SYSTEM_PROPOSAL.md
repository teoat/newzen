# Zenith Active Intelligence Protocol (AIP) Proposal

## Diagnosis: The "Toolbox Paradox"

**Current State**:
The platform currently consists of powerful, isolated "verticals":

- **Predictive AI** (Leakage forecasting)
- **Satellite Verification** (Physical proof)
- **Asset Tracer** (Money flow)
- **Sanction Screening** (Legal compliance)

**The Problem**:
This creates high cognitive load. An investigator must *know* which tool to pull from the sidebar and *when*.

- *"Why would I check satellite imagery if I don't know the project is stalled?"*
- *"Why would I trace assets if I haven't confirmed fraud?"*

The user is forced to be the "Orchestrator," manually stitching these tools together. This reduces adoption and misses critical insights.

---

## Proposed Solution: Context-Driven Reflex System

Instead of a static sidebar of tools, we propose an **Active Intelligence Protocol (AIP)**. The system should "push" tools to the user based on live context.

### 1. The "Signal" Engine

The system listens for specific forensic triggers (Signals):

- **Signal**: `Project Progress < 10%` AND `Cash Burn > 50%`
  - **Reflex Action**: "Launch Satellite Verification" (Contextual Prompt)
- **Signal**: `Vendor Name == 'Global Corp'` AND `New Entity`
  - **Reflex Action**: "Run Immediate Sanction Screen"
- **Signal**: `Funds Transferred -> Offshore`
  - **Reflex Action**: "Initiate Asset Recovery Trace"

### 2. The "Simulation Lab" (Training & War Games)

To solve the "User wouldn't know how to use it" problem, we introduce a **Simulation Mode**.

- **Concept**: A scripted "Fire Drill" where the system generates a fake scenario (e.g., "Code Red: Embezzlement Alert").
- **Flow**:
    1. User receives a "Red Alert".
    2. System *locks* the sidebar and highlights only the **War Room**.
    3. War Room shows a suspect transaction.
    4. Clicking the transaction *automatically opens* the **Sanction Scanner** in a modal.
    5. Scanning reveals a hit -> System *automatically guides* user to **Asset Tracer**.
    6. Traced funds lead to a luxury villa -> System *automatically prompts* **Satellite View**.

    **Result**: The user learns the *workflow*, not just the tool.

### 3. Smart Sidebar (Dynamic Navigation)

Refactor the sidebar to hide advanced tools under a "Tools" accordion, but **promote** them to the top level dynamically when relevant.

- *Normal State*: Dashboard, Projects, Reports.
- *Alert State*: **⚠️ SATELLITE VERIFICATION RECOMMENDED** appears prominently.

---

## Implementation Roadmap (Phase 6)

1. **Event Bus**: Create a frontend event bus (`ForensicEventBus`) to handle Signals.
2. **Notification-Action System**: Toast notifications that include "Run Tool" buttons.
3. **Scenario Script**: A JSON-based scenario engine for the Simulation Lab.
4. **Contextual Routing**: Modals/overlays for tools instead of full page redirects, keeping the user in the context of the investigation.
