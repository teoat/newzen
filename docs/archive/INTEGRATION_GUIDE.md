# Zenith Integration Quick Start Guide

## For Developers Adding New Features

---

## 🎯 Key Question: "When should my feature trigger a forensic event?"

**Rule of Thumb**: If your feature detects something *noteworthy* that might require action, publish an event.

---

## 📢 Publishing Events

### Step 1: Import the Bus

```typescript
import { forensicBus } from '@/lib/ForensicEventBus';
```

### Step 2: Publish at the Right Time

```typescript
// Example: In your transaction analysis component
const analyzeTransaction = (txData) => {
  const variance = calculateVariance(txData);
  
  if (variance > 0.2) {
    // This is noteworthy! Publish an event.
    forensicBus.publish(
      'TRANSACTION_FLAGGED',
      {
        txId: txData.id,
        reason: `Variance of ${(variance * 100).toFixed(1)}% detected`,
        variance: variance
      },
      'TransactionAnalyzer' // Optional: your component name
    );
  }
};
```

---

## 🔔 Available Event Types

| Event Type | When to Use | Example Payload |
|-----------|-------------|-----------------|
| `TRANSACTION_FLAGGED` | Anomaly in payment/ledger | `{ txId, reason }` |
| `VENDOR_SUSPICIOUS` | High-risk entity identified | `{ vendorName, riskScore }` |
| `PROJECT_STALLED` | Progress/budget mismatch | `{ projectId, progress, burn }` |
| `OFFSHORE_TRANSFER` | Funds moved to tax haven | `{ amount, destination }` |
| `SANCTION_HIT` | Watchlist match | `{ entity, list, similarity }` |
| `SATELLITE_DISCREPANCY` | Verification fail | `{ projectId, reported, detected }` |
| `ASSET_DISCOVERED` | Recoverable asset found | `{ name, value }` |
| `INVESTIGATION_STARTED` | New case initiated | `{ id, title }` |
| `INVESTIGATION_ENDED` | Case closed | `{ id }` |

---

## 🗂️ Working with Investigations

### Starting an Investigation

```typescript
import { useInvestigation } from '@/store/useInvestigation';

function MyComponent() {
  const { startInvestigation, addAction } = useInvestigation();

  const handleInvestigate = () => {
    // Create new investigation session
    const invId = startInvestigation('Case #42: Vendor Fraud', {
      projectId: 'PROJ-123',
      transactionIds: ['TX-001', 'TX-002']
    });

    // Log the first action
    addAction({
      action: 'Initiated investigation from reconciliation workspace',
      tool: 'Reconciliation',
      result: { flaggedCount: 12 }
    });
  };
}
```

### Logging Actions

```typescript
// Every time user uses a forensic tool, log it:
const runSanctionCheck = async (vendorName) => {
  const result = await api.screening.check(vendorName);
  
  addAction({
    action: `Ran sanction screening on ${vendorName}`,
    tool: 'Sanction Screening',
    result: {
      status: result.status,
      riskScore: result.risk_score,
      matches: result.matches.length
    }
  });
  
  return result;
};
```

### Accessing Active Investigation

```typescript
const { activeInvestigation } = useInvestigation();

if (activeInvestigation) {
  console.log('Current investigation:', activeInvestigation.title);
  console.log('Tools used:', activeInvestigation.context.toolsUsed);
  console.log('Timeline:', activeInvestigation.timeline);
}
```

---

## 🎨 Listening to Events (for Advanced Features)

### Subscribe in a React Component

```typescript
import { useEffect } from 'react';
import { forensicBus } from '@/lib/ForensicEventBus';

function MyWidget() {
  useEffect(() => {
    // Subscribe to vendor events
    const listenerId = forensicBus.subscribe(
      'VENDOR_SUSPICIOUS',
      (event) => {
        console.log('Suspicious vendor detected:', event.payload);
        // Your custom logic here
        showAlert(event.payload.vendorName);
      }
    );

    // Cleanup on unmount
    return () => forensicBus.unsubscribe(listenerId);
  }, []);

  return <div>...</div>;
}
```

---

## 🚨 Common Patterns

### Pattern 1: Detection → Notification → Tool Launch

```typescript
// In your detection logic:
if (isAnomalous(data)) {
  forensicBus.publish('TRANSACTION_FLAGGED', { txId, reason });
  // ForensicNotificationProvider will auto-show toast with action button
}
```

### Pattern 2: Tool Result → Event → Next Tool Suggestion

```typescript
// After running satellite verification:
const result = await satelliteAPI.verify(projectId);

if (result.status === 'DISCREPANCY') {
  forensicBus.publish('SATELLITE_DISCREPANCY', {
    projectId,
    reported: result.reported_progress,
    detected: result.delta_detected_percent
  });
  // System will suggest "Asset Recovery" next
}
```

### Pattern 3: Investigation Timeline → Dossier

```typescript
import { useInvestigation } from '@/store/useInvestigation';

const { activeInvestigation } = useInvestigation();

const generateDossier = () => {
  if (!activeInvestigation) return;

  const timeline = activeInvestigation.timeline;
  const suspects = activeInvestigation.context.suspects;
  
  // Pass to PDF generation:
  api.dossier.generate({
    investigationId: activeInvestigation.id,
    timeline: timeline,
    suspects: suspects,
    findings: activeInvestigation.findings
  });
};
```

---

## 🧪 Testing Your Integration

### 1. Verify Event is Published

Open browser console and check for:

```
[ForensicEventBus] TRANSACTION_FLAGGED { txId: "TX-123", reason: "..." } from YourComponent
```

### 2. Verify Notification Appears

Check that toast notification shows up with the correct action button.

### 3. Verify Investigation Logging

```typescript
const { activeInvestigation } = useInvestigation();
console.log(activeInvestigation?.timeline);
// Should show your action logged
```

---

## ✅ Checklist for New Features

- [ ] Identified events my feature should publish
- [ ] Published events with meaningful payload
- [ ] Logged tool usage to investigation timeline
- [ ] Tested notification appears correctly
- [ ] Verified action button navigates properly

---

## 📚 Related Files

- **Event Bus**: `frontend/src/lib/ForensicEventBus.ts`
- **Investigation Store**: `frontend/src/store/useInvestigation.ts`
- **Notification Provider**: `frontend/src/components/ForensicNotificationProvider.tsx`
- **Architecture Doc**: `PLATFORM_INTEGRATION_ARCHITECTURE.md`
- **Phase 6 Summary**: `PHASE_6_SUMMARY.md`

---

## 💬 Questions?

Refer to the **Event History** for debugging:

```typescript
const history = forensicBus.getHistory('TRANSACTION_FLAGGED');
console.log('All transaction flag events:', history);
```
