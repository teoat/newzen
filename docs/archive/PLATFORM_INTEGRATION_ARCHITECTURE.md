# ZENITH PLATFORM AUDIT & INTEGRATION ARCHITECTURE

## Executive Summary

Date: 2026-01-28  
Version: Post-V3 Completion Audit

---

## 🔍 PLATFORM INVENTORY

### Frontend Pages (22 Active Routes)

#### Core Workflows

1. **War Room Dashboard** (`/`) - Central command center
2. **Evidence Ingestion** (`/ingestion`) - CSV/Excel upload & processing
3. **Reconciliation Workspace** (`/reconciliation`) - Ledger matching engine
4. **Discrepancy Bench** (`/investigate`) - Flagged transactions review

#### Forensic Tools (9 Specialized Modules)

5. **Forensic Lab** (`/forensic/lab`) - Image metadata analysis
2. **S-Curve & RAB** (`/forensic/analytics`) - Progress curves
3. **Termin Flow Tracer** (`/forensic/flow`) - Payment milestone visualization
4. **Vendor Nexus Graph** (`/forensic/nexus`) - Relationship mapping
5. **Asset Seizure** (`/forensic/assets`) - UBO & recovery operations
6. **Forensic Map** (`/forensic/map`) - Geospatial visualization
7. **Predictive AI** (`/forensic/analytics/predictive`) - Risk forecasting
8. **Satellite Verification** (`/forensic/satellite`) - Change detection
9. **Asset Recovery Tracer** (`/forensic/recovery`) - Multi-ledger tracking

#### Legal & Compliance

14. **Legal Dossier (AML)** (`/legal/aml`) - Framework documentation
2. **Sanction Screening** (`/legal/screening`) - Watchlist checks

#### Support & Training

16. **Simulation Lab** (`/simulation`) - Guided scenario training
2. **Test Transaction** (`/test-transaction`) - Manual entry sandbox
3. **Analyst Comparison** (`/analyst-comparison`) - Benchmark tables
4. **Settings/Security** (`/settings/security`) - Configuration

#### Case Management

20. **Cases List** (`/cases`) - Investigation registry
2. **Case Detail** (`/cases/[id]`) - Individual case view
3. **Login** (`/login`) - Authentication

---

### Backend API Modules (8 Domains)

1. **Auth** - User authentication & MFA
2. **Cases** - Case CRUD operations
3. **Projects** - Project metadata management
4. **Ingestion** - File processing & validation
5. **Evidence** - Document storage & notarization
6. **Fraud** - Reconciliation, Nexus, Sankey, Geo-linking
7. **AI** - Copilot chat, Narrative generation, Predictive risk
8. **Forensic Tools** - Satellite, Asset recovery
9. **Legal** - Sanction screening

---

## 🚨 IDENTIFIED PROBLEMS

### 1. **Fragmentation Crisis**

- **22 disconnected pages** with no shared state
- User must manually navigate between tools
- No "breadcrumb trail" or investigation session

### 2. **Redundant Data Fetching**

- War Room, Reconciliation, and Investigate pages all fetch transactions independently
- No centralized state management (Redux/Zustand)

### 3. **Context Loss**

- Clicking "Asset Seizure" loses the context of which project/transaction triggered it
- Tools don't "remember" where you came from

### 4. **No Event-Driven Flow**

- Discovering a suspicious transaction doesn't trigger sanction screening
- Flagging a vendor doesn't auto-prompt satellite verification

### 5. **Tool Discoverability**

- Critical tools (Predictive AI, Satellite) are buried in sidebar
- No in-app guidance on when to use what

---

## 🎯 UNIFIED ARCHITECTURE PROPOSAL

### Phase 6.1: Forensic Event Bus (Foundation)

**Purpose**: A pub-sub system for cross-module communication

```typescript
// frontend/src/lib/ForensicEventBus.ts
type ForensicEvent = 
  | { type: 'TRANSACTION_FLAGGED', payload: { txId: string, reason: string } }
  | { type: 'VENDOR_SUSPICIOUS', payload: { vendorName: string, riskScore: number } }
  | { type: 'PROJECT_STALLED', payload: { projectId: string, progress: number } }
  | { type: 'OFFSHORE_TRANSFER', payload: { amount: number, destination: string } };

class EventBus {
  private listeners = new Map<string, Function[]>();
  
  subscribe(eventType: string, callback: Function) { /*...*/ }
  publish(event: ForensicEvent) { /*...*/ }
}

export const forensicBus = new EventBus();
```

**Trigger Examples**:

- Reconciliation detects mismatch → `TRANSACTION_FLAGGED` → Auto-opens Investigate modal
- Ingestion finds "Global Corp" → `VENDOR_SUSPICIOUS` → Triggers Sanction Screen
- Project progress < 10% → `PROJECT_STALLED` → Suggests Satellite Verification

---

### Phase 6.2: Contextual Notification System

**UI Component**: Toast with Action Buttons

```tsx
// When a high-risk vendor is detected:
<Toast>
  <AlertTriangle /> Vendor "CV. BINTANG" flagged (Risk: 0.87)
  <Button onClick={() => navigate('/legal/screening?q=CV.+BINTANG')}>
    Screen Now
  </Button>
</Toast>
```

**Smart Routing**: Instead of full page navigation, open tools in:

- **Side Panel** (for quick checks like Sanction Screening)
- **Modal Overlay** (for Satellite View)
- **Split View** (keep Investigation panel open while viewing Nexus)

---

### Phase 6.3: Investigation Session Manager

**Concept**: A persistent "Investigation Thread"

```typescript
interface Investigation {
  id: string;
  title: string;
  startedAt: Date;
  context: {
    projectId?: string;
    transactionIds: string[];
    suspects: string[];
    toolsUsed: string[];
  };
  timeline: Array<{
    timestamp: Date;
    action: string;
    tool: string;
    result: any;
  }>;
}
```

**Flow**:

1. User clicks "Investigate" on a transaction → Creates new Investigation
2. All subsequent actions (Sanction Screen, Satellite Check) are logged
3. "Generate Dossier" compiles the entire Investigation into PDF

---

### Phase 6.4: Smart Sidebar (Dynamic Recommendations)

**Current State**: Static list of 12 tools  
**Proposed State**: Context-aware recommendations

```tsx
// Sidebar shows what's relevant NOW:
{isInvestigating && recommendations.map(tool => (
  <SidebarItem highlighted pulse>
    <ShieldAlert /> {tool.name} 
    <Badge>Recommended</Badge>
  </SidebarItem>
))}
```

**Logic**:

- If `TRANSACTION_FLAGGED` event → Highlight "Nexus Graph"
- If vendor is offshore → Highlight "Asset Recovery"
- If project is construction → Highlight "Satellite Verification"

---

### Phase 6.5: Scenario Engine (JSON-Driven)

**File**: `scenarios/operation-red-sky.json`

```json
{
  "id": "RED_SKY_001",
  "title": "Operation Red Sky",
  "steps": [
    {
      "trigger": "ANOMALY_DETECTED",
      "description": "45% budget burn, 12% progress",
      "requiredTool": "/forensic/analytics/predictive",
      "expectedAction": "VIEW_RISK_SCORE"
    },
    {
      "trigger": "VENDOR_IDENTIFIED",
      "description": "CV. BINTANG TIMUR appears in ledger",
      "requiredTool": "/legal/screening",
      "expectedAction": "RUN_SANCTION_CHECK"
    }
  ]
}
```

**Engine**: Validates user follows the correct forensic workflow

---

## 📊 INTEGRATION MAP

### Data Flow Unification

```mermaid
┌─────────────────┐
│  War Room       │──┐
│  (Dashboard)    │  │
└─────────────────┘  │
                     ├──> Shared State Store
┌─────────────────┐  │    (Transactions, Projects, Cases)
│  Reconciliation │──┤
└─────────────────┘  │
                     │
┌─────────────────┐  │
│  Investigate    │──┘
└─────────────────┘
         │
         └──> Event Bus ──> Triggers ──> Forensic Tools
```

### Tool Orchestration

```
[User Action] → [Event] → [Notification] → [Tool Launch] → [Log to Investigation]
    ↓                                            ↓
 "Flag Tx"                                  "Sanction Check"
    ↓                                            ↓
TRANSACTION_FLAGGED                        Result saved
    ↓
Suggests: Nexus, Asset Tracer, Satellite
```

---

## 🛠️ IMPLEMENTATION PRIORITY

### Sprint 1: Foundation (Week 1-2)

- [ ] Implement ForensicEventBus
- [ ] Add Zustand state store
- [ ] Create Investigation Session model

### Sprint 2: Notifications (Week 3)

- [ ] Build Toast notification system
- [ ] Implement event listeners in key pages
- [ ] Add "Quick Action" buttons

### Sprint 3: Context Routing (Week 4)

- [ ] Modal/Drawer components for tools
- [ ] Split-view investigation layout
- [ ] Breadcrumb navigation

### Sprint 4: Smart Recommendations (Week 5)

- [ ] Algorithm for tool suggestions
- [ ] Dynamic sidebar highlighting
- [ ] Scenario engine parser

---

## 💡 QUICK WINS (Can Implement Today)

1. **Global Investigation Context**: Add a `useInvestigation()` hook
2. **Event Bus Skeleton**: Basic pub-sub with 3 event types
3. **Toast Library**: Install `react-hot-toast` or `sonner`
4. **Modal Wrapper**: Create `<ToolModal>` component

---

## 🎬 DEMO SCENARIO (Post-Implementation)

**User Journey**:

1. Opens War Room → Sees "Project Nexus 45% burn, 12% progress"
2. Toast appears: "⚠️ High stall risk. Run Predictive AI?"
3. Clicks "Analyze" → Modal opens with risk score 85%
4. System suggests: "Check this vendor: CV. BINTANG"
5. Clicks vendor → Sanction screen runs automatically
6. Hit found → System asks: "Freeze assets?"
7. Clicks "Yes" → Asset Seizure panel slides in
8. All actions logged → "Generate Investigation Report" creates PDF

**Result**: User completed 7-step forensic investigation without manual navigation.
