# 📋 ZENITH PLATFORM - TODO LIST

**Last Updated:** 2026-01-29 08:42 JST  
**Priority Legend:** 🔴 Critical | 🟡 High | 🟢 Medium | ⚪ Low

---

## 🔴 CRITICAL (This Week)

### 1. Database Migration for Authorization

**Priority:** 🔴 CRITICAL  
**Effort:** 1 hour  
**Blocker:** Required before multi-user deployment

**Tasks:**

```bash
# Create Alembic migration
cd backend
alembic revision --autogenerate -m "Add UserProjectAccess table"
alembic upgrade head
```

**Files to Create:**

- [x] `backend/alembic/versions/9ec1d705c983_initial_schema.py`
- [x] `backend/scripts/seed_project_access.py` (seed initial relationships)

**Acceptance:**

- [x] `user_project_access` table exists
- [x] Foreign keys to `user` and `project` tables
- [x] Indexes on `user_id` and `project_id`
- [x] Existing users have access to all projects (initial seed)

---

### 2. Apply Authorization Middleware to Endpoints

**Priority:** 🔴 CRITICAL  
**Effort:** 2-3 hours  
**Blocker:** Security vulnerability until implemented

**Endpoints to Secure (20 total):**

```python
# Example pattern:
from app.core.auth_middleware import verify_project_access

@router.get("/{project_id}/dashboard")
async def get_dashboard(
    project: Project = Depends(verify_project_access),  # ← Add this
    db: Session = Depends(get_session)
):
    # User is now verified
    ...
```

**Files to Update:**

- [x] `backend/app/modules/project/router.py` (5 endpoints)
- [x] `backend/app/modules/fraud/reconciliation_router.py` (4 endpoints)
- [x] `backend/app/modules/fraud/forensic_router.py` (3 endpoints)
- [x] `backend/app/modules/cases/router.py` (2 endpoints)
- [x] `backend/app/modules/ingestion/router.py` (2 endpoints)
- [x] `backend/app/modules/evidence/router.py` (2 endpoints)
- [x] `backend/app/modules/forensic/mcp_router.py` (2 endpoints)

**Acceptance:**

- [x] All project-scoped endpoints use `verify_project_access`
- [x] 403 Forbidden returned for unauthorized access
- [x] Admin-only endpoints use `verify_project_admin`
- [x] Manual test: User A cannot access User B's project

---

### 3. Enhance FrenlyWidget Frontend with Gemini Integration

**Priority:** 🔴 CRITICAL  
**Effort:** 3-4 hours  
**Blocker:** Users can't use new AI features yet

**Current State:**

- `FrenlyWidget.tsx` has mock responses
- New `/api/v1/ai/assist` endpoint ready but not connected

**Tasks:**

- [x] Replace mock `handleSend()` with API call to `/ai/assist`
- [x] Display SQL queries and data tables (like ForensicCopilot)
- [x] Show suggested actions as clickable buttons
- [x] Add tabbed interface: [💬 Chat] [⚡ Actions] [📊 Alerts]
- [x] Poll `/ai/alerts` every 30s for proactive notifications
- [x] Add notification badge when alerts exist

**Files to Update:**

- [x] `frontend/src/components/FrenlyAI/FrenlyWidget.tsx`

**Acceptance:**

- [x] User can type "Show high-risk transactions" → See SQL + data
- [x] Suggested actions are clickable
- [x] Alerts tab shows proactive warnings
- [x] Loading states work correctly

---

## 🟡 HIGH (Next Sprint)

### 4. Create User Management UI

**Priority:** 🟡 HIGH  
**Effort:** 4-5 hours

**Needs:**

- Admin page to manage user access to projects
- Grant/revoke access with role selection
- List users with access to current project

**Files to Create:**

- `frontend/src/app/admin/users/page.tsx`
- `backend/app/modules/admin/user_management_router.py`

**Endpoints Needed:**

```text
GET    /api/v1/admin/project/:id/users        # List users with access
POST   /api/v1/admin/project/:id/users        # Grant access
DELETE /api/v1/admin/project/:id/users/:uid   # Revoke access
PATCH  /api/v1/admin/project/:id/users/:uid   # Change role
```

**Acceptance:**

- [x] Admin can see who has access to each project
- [x] Admin can grant access with role (viewer, analyst, admin)
- [x] Admin can revoke access
- [x] Audit log captures all changes

---

### 5. Integrate AI Components into Existing Pages

**Priority:** 🟡 HIGH  
**Effort:** 2-3 hours

**Pages to Enhance:**

**1. Reconciliation Page:**

```tsx
// Add ReconciliationOptimizer
import ReconciliationOptimizer from '@/app/components/ReconciliationOptimizer';

// Add in page:
<ReconciliationOptimizer />
```

**2. Investigation/Cases Page:**

```tsx
// Add AI Explainer to transaction table
import AIExplainerModal from '@/app/components/AIExplainerModal';

// Add "AI Explain" button per transaction
// Modal opens with forensic analysis
```

**3. Dashboard:**

```tsx
// Show top 3 proactive alerts
// Link to "View All Alerts" modal
```

**Files to Update:**

- `frontend/src/app/reconciliation/page.tsx`
- `frontend/src/app/cases/page.tsx`
- `frontend/src/app/page.tsx` (dashboard)

**Acceptance:**

- [x] Users can optimize reconciliation with 1 click
- [x] Users can explain any transaction with AI
- [x] Dashboard shows critical alerts

---

### 6. Conversation Memory (Redis)

**Priority:** 🟡 HIGH  
**Effort:** 3-4 hours

**Current:** Each query is stateless  
**Needed:** Remember conversation context for follow-ups

**Tasks:**

- [x] Set up Redis connection in backend
- [x] Store last 10 messages per user session
- [x] Pass conversation history to Gemini for context
- [x] Implement `/api/v1/ai/conversation-history/:session_id`

**Files to Create/Update:**

- `backend/app/core/redis_client.py`
- `backend/app/modules/ai/conversation_memory.py`
- Update `frenly_orchestrator.py` to use history

**Acceptance:**

- [x] User asks "Show high-risk transactions" → AI responds
- [x] User asks "Who are the top 3 vendors?" → AI knows context
- [x] Conversation clears on page refresh or explicit "Clear Chat"

---

## 🟢 MEDIUM (Backlog - Next Month)

### 7. Multi-Modal AI (Receipt/Document Analysis)

**Priority:** 🟢 MEDIUM  
**Effort:** 6-8 hours

**Use Case:**

- User uploads receipt image → AI extracts transaction data
- User uploads bank statement screenshot → AI reads table

**Tasks:**

- [x] Add image upload to FrenlyWidget
- [x] Implement Gemini Vision API calls
- [x] Extract structured data from images
- [ ] Auto-populate transaction forms

**Endpoints:**

```text
POST /api/v1/ai/analyze-image
{
  "image_base64": "...",
  "type": "receipt" | "statement" | "invoice"
}

Response:
{
  "extracted_data": {
    "amount": 1500000,
    "date": "2026-01-15",
    "vendor": "PT ABC Corp",
    "description": "Construction materials"
  },
  "confidence": 0.92
}
```

---

### 8. Voice Commands

**Priority:** 🟢 MEDIUM  
**Effort:** 4-5 hours

**Use Case:**

- User clicks microphone icon → speaks query
- AI processes speech and executes

**Tasks:**

- [x] Add Web Speech API to FrenlyWidget
- [x] Convert audio to text
- [x] Send to `/ai/assist` as normal query
- [ ] Text-to-speech for responses (optional)

---

### 9. Pattern Learning & Personalization

**Priority:** 🟢 MEDIUM  
**Effort:** 8-10 hours

**Use Case:**

- Track which queries users run frequently
- Proactively suggest those queries on page load
- Learn preferred export formats

**Tasks:**

- [x] Create `user_query_patterns` table
- [x] Log all AI queries with metadata
- [x] Detect patterns (e.g., user always exports after SQL)
- [x] Auto-suggest based on patterns

---

### 10. A/B Testing for AI Prompts

**Priority:** 🟢 MEDIUM  
**Effort:** 5-6 hours

**Use Case:**

- Test different prompt engineering approaches
- Measure which generates better SQL
- Optimize over time

**Tasks:**

- [ ] Create variants of SQL generation prompts
- [ ] Randomly assign users to variants
- [ ] Track success rates (valid SQL, user satisfaction)
- [ ] Implement winner-takes-all rollout

---

## ⚪ LOW (Future/Nice-to-Have)

### 11. Collaborative Investigation Workspace

**Priority:** ⚪ LOW  
**Effort:** 10+ hours

**Use Case:**

- Multiple auditors work on same case simultaneously
- Real-time updates via WebSocket
- Shared note-taking and flagging

---

### 12. Advanced Visualizations

**Priority:** ⚪ LOW  
**Effort:** 8-10 hours

**Use Case:**

- AI generates D3.js visualizations from SQL results
- Interactive charts for trend analysis
- Anomaly highlighting

---

### 13. Email Report Generation

**Priority:** ⚪ LOW  
**Effort:** 4-5 hours

**Use Case:**

- Schedule weekly AI-generated audit summaries
- Email to stakeholders
- Automated executive reports

---

### 14. Mobile App (React Native)

**Priority:** ⚪ LOW  
**Effort:** 40+ hours

**Use Case:**

- Field auditors use mobile app for evidence collection
- Sync with main platform
- Offline mode

---

## 🧪 TESTING TODO

### Unit Tests Needed

- [x] `useProject` store state transitions
- [x] `GeminiSQLGenerator` safety validation
- [x] `FrenlyOrchestrator` intent detection
- [x] `verify_project_access` middleware

### Integration Tests Needed

- [x] `/api/v1/ai/assist` full flow
- [x] Project creation → selection → data fetch
- [x] Authorization enforcement (403 on unauthorized)

### E2E Tests Needed

- [x] Login → Project Gate → Create Project → Dashboard
- [x] AI query → SQL generation → Display results
- [x] Switch projects → Verify data isolation

---

## 📊 TECHNICAL DEBT

### Code Quality

- [x] Fix remaining linting warnings in `main.py` (module import order)
- [ ] Add proper exception handling in `sql_generator.py` (line 260)
- [ ] Remove unused imports in `frenly_orchestrator.py`
- [ ] Fix accessibility issues in modals (button titles, form labels)

### Performance

- [x] Add database indexes for `transaction.sender` and `transaction.receiver`
- [x] Implement query result caching (Redis)
- [x] Optimize S-curve data endpoint (currently slow  for large projects)
- [x] Add pagination to project list (currently loads all)

### Security

- [x] Replace stub `get_current_user_stub()` with real JWT auth
- [x] Implement rate limiting per user (currently global)
- [x] Add CSRF protection for state-changing endpoints
- [x] Encrypt sensitive fields in database (tax IDs, personal info)

---

## 🎯 SPRINT PLANNING RECOMMENDATION

### Sprint 1 (This Week) - Focus: Security & AI UX

1. ✅ Database migration for authorization
2. ✅ Apply middleware to all endpoints
3. ✅ Enhance FrenlyWidget with Gemini

### Sprint 2 (Next Week) - Focus: User Management

1. ✅ User management UI
2. ✅ Integrate AI components into pages
3. ✅ Conversation memory (Redis)

### Sprint 3 (Week 3) - Focus: Advanced Features

1. ✅ Multi-modal AI (images)
2. ✅ Voice commands
3. ✅ Pattern learning

### Sprint 4 (Week 4) - Focus: Testing & Polish

1. ✅ Write unit tests
2. ✅ E2E test suite
3. ✅ Fix technical debt
4. ✅ Performance optimization

---

## 📝 NOTES

### Dependencies to Install

```bash
# Backend
pip install redis  # For conversation memory
pip install pillow  # For image processing (multi-modal)

# Frontend
npm install @tanstack/react-query  # For better data fetching
npm install recharts  # For advanced visualizations
```

### Environment Variables to Add

```bash
# Backend .env
REDIS_URL=redis://localhost:6379
GEMINI_API_KEY=your_key  # Already added
JWT_SECRET=your_secret    # For real auth

# Frontend .env.local
NEXT_PUBLIC_ENABLE_VOICE=true  # Feature flag
NEXT_PUBLIC_ENABLE_IMAGES=true
```

---

## ✅ COMPLETION CRITERIA

**Phase 1 (Security) Complete When:**

- [x] All endpoints require authorization
- [x] Users cannot access other users' projects
- [ ] Admin can manage user access via UI

**Phase 2 (AI Integration) Complete When:**

- [x] FrenlyWidget uses real Gemini API
- [x] All proposed AI components integrated
- [x] Conversation memory working

**Phase 3 (Production Ready) Complete When:**

- [x] 80%+ test coverage on critical paths
- [x] Performance benchmarks met (< 2s API responses)
- [x] Security audit passed (internal)
- [x] Documentation complete

---

**Maintained By:** Zenith Platform Team  
**For Status:** See IMPLEMENTATION_STATUS.md  
**Last Review:** 2026-01-29
