# 🚀 Quick Integration Guide - New Components

## For Immediate Use (No Backend Changes Needed)

### 1. AI Transaction Explainer

**Add to any page with transaction data:**

```tsx
// Example: Reconciliation page, Dashboard, etc.
import { useState } from 'react';
import AIExplainerModal from '@/app/components/AIExplainerModal';

export default function YourPage() {
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  return (
    <>
      {/* Your transaction table */}
      <table>
        {transactions.map(tx => (
          <tr key={tx.id}>
            <td>{tx.description}</td>
            <td>
              <button 
                onClick={() => setSelectedTxId(tx.id)}
                className="text-indigo-400 hover:underline text-sm"
              >
                🧠 AI Explain
              </button>
            </td>
          </tr>
        ))}
      </table>

      {/* Modal */}
      <AIExplainerModal
        isOpen={selectedTxId !== null}
        onClose={() => setSelectedTxId(null)}
        transactionId={selectedTxId || ''}
      />
    </>
  );
}
```

### 2. Reconciliation Optimizer

**Add to Reconciliation page:**

```tsx
// File: frontend/src/app/reconciliation/page.tsx
import ReconciliationOptimizer from '@/app/components/ReconciliationOptimizer';

export default function ReconciliationPage() {
  return (
    <div>
      {/* Existing reconciliation workspace */}
      <ReconciliationWorkspace />

      {/* Add this */}
      <div className="mt-8">
        <ReconciliationOptimizer />
      </div>
    </div>
  );
}
```

### 3. Project Creation

**Already integrated in ProjectGate!**

Just click "New Operation" button when no project is selected.

---

## API Endpoints Available

### MCP Tools (AI-Powered)

```bash
# Get AI rationale for a transaction
GET /api/v1/forensic/mcp/rationale/{transaction_id}

# Search entities semantically
POST /api/v1/forensic/mcp/search-entities
{
  "query": "PT Contractor",
  "threshold": 0.8,
  "limit": 10
}

# Run reconciliation optimization
POST /api/v1/forensic/mcp/optimize-reconciliation
{
  "project_id": "uuid",
  "strategies": ["waterfall", "fuzzy", "structuring", "striping"]
}
```

### Project Management

```bash
# List all projects
GET /api/v1/project/

# Create new project
POST /api/v1/project/
{
  "name": "Skyrise Tower Audit",
  "contractor_name": "PT Konstruksi Megah",
  "contract_value": 50000000000,
  "start_date": "2026-01-01T00:00:00Z",
  "end_date": "2026-12-31T00:00:00Z",
  "location": "Jakarta",
  "description": "Annual construction audit"
}

# Get project dashboard metrics
GET /api/v1/project/{project_id}/dashboard
```

---

## Testing Locally

```bash
# Start backend
cd backend
uvicorn app.main:app --reload --port 8200

# Start frontend
cd frontend
npm run dev

# Navigate to:
http://localhost:3000
```

---

## Common Issues & Fixes

**Issue:** "Cannot find module AIExplainerModal"
**Fix:** Make sure file exists at `frontend/src/app/components/AIExplainerModal.tsx`

**Issue:** "API call fails with 404"
**Fix:** Ensure backend is running and MCP router is registered in `main.py`

**Issue:** "No projects showing"
**Fix:** Seed database with at least one project or create via "New Operation"

---

## Performance Tips

1. **AI Explainer:** Cache results in component state to avoid repeated API calls
2. **Optimizer:** Show progress indicator, don't allow concurrent runs
3. **Project List:** Fetch once, store in Zustand (already implemented)

---

**Questions?** See `COMPLETE_IMPLEMENTATION_REPORT.md` for full details.
