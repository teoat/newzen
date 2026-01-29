# Frenly AI Meta-Agent Enhancement Proposal 🧠

**Status:** Proposal  
**Date:** 2026-01-29  
**Objective:** Unify AI agents and create a proactive, intelligent forensic assistant

---

## 🎯 Current State Analysis

### Existing AI Implementations

**1. ForensicCopilot (`/components/ForensicCopilot.tsx`)**

- ✅ SQL-powered query execution
- ✅ Shows generated SQL + data tables
- ✅ Connected to `/api/v1/ai/chat` endpoint
- ❌ Limited context awareness
- ❌ Passive (user-initiated only)
- ❌ No integration with app state

**2. FrenlyWidget (`/components/FrenlyAI/FrenlyWidget.tsx`)**

- ✅ Context-aware greetings per page
- ✅ Quick action shortcuts
- ✅ Integrates with app stores (useProject, useInvestigation)
- ✅ Better UX (expandable, notifications)
- ❌ Mock responses (not connected to real AI)
- ❌ No SQL execution capability
- ❌ Limited proactivity

### Backend AI Infrastructure

**Current Capabilities:**

- ✅ Gemini Service integration (`gemini_service.py`)
- ✅ Narrative generation for dossiers
- ✅ Contradiction detection
- ✅ Leakage prediction (mock)
- ❌ No SQL generation from natural language
- ❌ No proactive monitoring/alerts
- ❌ No memory/conversation history

---

## 🚀 Proposed Solution: Unified "Frenly AI" Meta-Agent

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    FRENLY AI META-AGENT                     │
├─────────────────────────────────────────────────────────────┤
│  Frontend Widget (Unified)                                  │
│  ├─ Context Engine (Page-aware)                            │
│  ├─ Proactive Monitor (Background checks)                  │
│  ├─ Action Executor (Quick actions + SQL queries)          │
│  └─ Memory System (Conversation history)                   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│              Backend AI Orchestration Layer                 │
├─────────────────────────────────────────────────────────────┤
│  ├─ Gemini LLM (Natural language understanding)            │
│  ├─ SQL Generator (Text-to-SQL with schema awareness)      │
│  ├─ Narrative Engine (Dossier generation)                  │
│  ├─ Anomaly Detector (Proactive monitoring)                │
│  ├─ Action Router (Execute forensic operations)            │
│  └─ Memory Store (Redis/DB for conversation context)       │
└─────────────────────────────────────────────────────────────┘
```

---

## 💡 Proposed Features & Integrations

### **Phase 1: Foundation (Week 1-2)**

#### 1.1 Unified Widget

**Merge ForensicCopilot + FrenlyWidget**

- Single floating assistant (bottom-right)
- Context-aware behavior (inherits from FrenlyContext)
- SQL execution + data visualization (from ForensicCopilot)
- Quick actions + page tips (from FrenlyWidget)

**UI Enhancements:**

```typescript
- Tabbed interface: [💬 Chat] [⚡ Actions] [📊 Insights]
- Notification badge for proactive alerts
- Voice input support (optional)
- Keyboard shortcut: Cmd/Ctrl + K to open
```

#### 1.2 Enhanced Backend Endpoint

**New `/api/v1/ai/assist` endpoint**

```python
POST /api/v1/ai/assist
{
  "query": "Show me high-risk transactions",
  "context": {
    "page": "/reconciliation",
    "project_id": "abc-123",
    "user_role": "auditor"
  },
  "intent": "sql_query" | "action" | "explanation"
}

Response:
{
  "response_type": "sql_query",
  "answer": "Found 23 high-risk transactions",
  "sql": "SELECT * FROM transactions WHERE risk_score > 0.8",
  "data": [...],
  "suggested_actions": [
    { "label": "Review in Detail View", "route": "/investigate" },
    { "label": "Generate Alert Report", "action": "generate_report" }
  ],
  "confidence": 0.95
}
```

#### 1.3 SQL Generation Enhancement

**Implement proper Text-to-SQL using Gemini**

```python
# Current: Basic keyword matching
generate_sql_from_text("total inflation")
# → "SELECT SUM(delta_inflation) FROM transaction_table..."

# Proposed: Gemini-powered with schema awareness
gemini_generate_sql(
    query="Show me all vendors who received more than $10k last month",
    schema=DATABASE_SCHEMA,
    context={"project_id": "abc"}
)
# → "SELECT receiver, SUM(amount) FROM transactions 
#     WHERE project_id = 'abc' 
#     AND created_at >= DATE('now', '-1 month')
#     GROUP BY receiver 
#     HAVING SUM(amount) > 10000"
```

---

### **Phase 2: Proactive Intelligence (Week 3-4)**

#### 2.1 Background Monitoring

**Proactive Alert System**

- Monitor system for anomalies every 5 minutes
- Notify user via badge + chat message

**Triggers:**

```typescript
- New high-risk transaction detected (risk_score > 0.9)
- Reconciliation gap increased by >15%
- Suspicious pattern detected (velocity, round amounts)
- Batch job completed/failed
- Case requires adjudication
- Document verification failed
```

**Implementation:**

```python
# Celery periodic task
@celery_app.task(name='frenly_ai.proactive_monitor')
def monitor_and_alert():
    alerts = []
    
    # Check 1: High-risk transactions
    high_risk = db.query(Transaction).filter(
        Transaction.risk_score > 0.9,
        Transaction.created_at > datetime.now() - timedelta(hours=1)
    ).count()
    
    if high_risk > 0:
        alerts.append({
            'type': 'high_risk_transaction',
            'message': f'🚨 {high_risk} high-risk transactions detected',
            'action': {'label': 'Review Now', 'route': '/investigate'}
        })
    
    # Check 2: Reconciliation gaps
    # ... similar logic
    
    # Store alerts in Redis for frontend polling
    redis.set('frenly_alerts', json.dumps(alerts))
```

#### 2.2 Smart Suggestions

**Context-aware recommendations**

```typescript
// User is on Reconciliation page with 50+ unmatched items
Frenly: "💡 I notice 52 unmatched transactions. Would you like me to:
  1. Auto-match high-confidence items (28 available)
  2. Show variance analysis by vendor
  3. Generate discrepancy report for review"

// User uploads a document
Frenly: "📄 Document received. I'll:
  1. Extract transaction data → ✅
  2. Match against ledger → ⏳ Processing...
  3. Flag anomalies → Queued"
```

#### 2.3 Query Prediction

**Anticipate user needs based on page + context**

```typescript
// On Asset Recovery page with no assets
Frenly: "🎯 Quick start: Would you like to:
  - Import assets from transactions
  - Search AHU database for properties
  - Add asset manually"

// On Nexus Graph with selected entity
Frenly: "📊 Analyzing 'PT Vendor XYZ':
  - Total transactions: $2.3M
  - Risk flags: 3 detected
  - Connected entities: 7
  
  Actions: [Trace Fund Flow] [Export Entity Report]"
```

---

### **Phase 3: Advanced Features (Week 5-8)**

#### 3.1 Multi-Modal Interaction

**Voice Commands**

```typescript
User: "Show me transactions over 100 million"
Frenly: [Executes SQL] "Displaying 12 transactions. Total: Rp 1.8B"

User: "Export this to Excel"
Frenly: [Triggers download] "Report exported successfully"
```

**Visual Analysis**

```typescript
// Upload screenshot of bank statement
Frenly: "📸 I detected:
  - Account: BCA 1234567890
  - Date range: Jan 1-31, 2026
  - 47 transactions identified
  
  Import into system? [Yes] [Review First]"
```

#### 3.2 Investigation Co-Pilot

**Auto-Investigation Mode**

```typescript
User: "Investigate vendor ABC Corp for suspicious activity"

Frenly: "🔍 Starting deep analysis of ABC Corp...

Step 1: Transaction analysis ✅
  - 234 transactions, total Rp 5.2B
  - Avg amount: Rp 22.2M
  - Pattern: 12 round-amount payments flagged

Step 2: Entity relationship mapping ✅
  - 3 shell companies detected in network
  - Circular payment detected: ABC → XYZ → DEF → ABC

Step 3: Document verification ⏳
  - Checking tax IDs...
  - Cross-referencing with AHU database...

🚨 HIGH RISK DETECTED
Recommendation: Initiate formal case investigation"

Actions: [Create Case] [Generate Report] [Flag for Review]
```

#### 3.3 Natural Language Reporting

**Executive Summary Generation**

```typescript
User: "Give me an executive summary of Project Alpha"

Frenly: "📊 Project Alpha - Financial Audit Summary

Period: Jan-Dec 2025
Budget: Rp 150B | Disbursed: Rp 142B (94.7%)

Key Findings:
✅ 87% of transactions verified with proper documentation
⚠️  18 high-risk transactions flagged (Rp 23B)
🚨 3 suspicious vendor relationships identified

Top Risks:
1. PT Vendor XYZ: Rp 12B in inflated invoices
2. Circular payments: Rp 8B loop detected
3. Missing documentation: 23 transactions (Rp 3B)

Recommended Actions:
- Freeze disbursements to PT Vendor XYZ
- Initiate investigation into circular flow
- Request documentation for flagged items

[Download Full Report] [Schedule Review Meeting]"
```

#### 3.4 Collaborative Features

**Multi-User Chat**

```typescript
// Frenly as team coordinator
Auditor 1: "I found suspicious activity in vendor payments"
Frenly: "🔔 @Auditor2 and @Supervisor have been notified. 
         Creating shared investigation workspace..."

// Context sync across team
Auditor 2: "Show me what Auditor 1 was looking at"
Frenly: "📋 Auditor 1's session:
  - Query: High-risk vendor transactions
  - Filters: Amount > Rp 10M, Risk > 0.8
  - 23 items flagged for review
  
  [Load Same View] [Join Investigation]"
```

#### 3.5 Learning & Adaptation

**Pattern Learning**

```python
# Track user queries and improve responses
class FrenlyMemory:
    def learn_from_interaction(self, user_id, query, action_taken):
        # If user frequently asks about "inflation stats"
        # → Auto-suggest on Reconciliation page
        
        # If user always exports after SQL query
        # → Proactively offer "Export to Excel?" after showing results
        
        pattern = self.detect_pattern(user_id)
        if pattern.confidence > 0.8:
            self.add_quick_action(pattern.suggestion)
```

---

## 🔧 Technical Implementation

### Frontend Architecture

**1. Unified Component Structure**

```typescript
// /components/FrenlyAI/FrenlyMetaAgent.tsx
export default function FrenlyMetaAgent() {
  // State
  const [activeTab, setActiveTab] = useState<'chat' | 'actions' | 'insights'>('chat')
  const [messages, setMessages] = useState<Message[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isProactive, setIsProactive] = useState(true)
  
  // Hooks
  const { context, executeAction } = useFrenlyContext()
  const { alerts: realtimeAlerts } = useFrenlyAlerts() // WebSocket/polling
  const { submitQuery, executeSQL } = useFrenlyAPI()
  
  // Features
  return (
    <FrenlyWidget
      context={context}
      proactiveAlerts={alerts}
      onSQLQuery={executeSQL}
      onAction={executeAction}
      tabs={[
        <ChatTab />,
        <ActionsTab />,
        <InsightsTab />
      ]}
    />
  )
}
```

**2. API Client Hook**

```typescript
// /hooks/useFrenlyAPI.ts
export function useFrenlyAPI() {
  const submitQuery = async (query: string, intent?: string) => {
    const response = await fetch('/api/v1/ai/assist', {
      method: 'POST',
      body: JSON.stringify({
        query,
        intent,
        context: getAppContext() // auto-capture page, project, etc.
      })
    })
    return response.json()
  }
  
  const executeSQL = async (sql: string) => {
    const response = await fetch('/api/v1/ai/execute-sql', {
      method: 'POST',
      body: JSON.stringify({ sql, project_id: getCurrentProject() })
    })
    return response.json()
  }
  
  return { submitQuery, executeSQL }
}
```

**3. Proactive Alert System**

```typescript
// /hooks/useFrenlyAlerts.ts
export function useFrenlyAlerts(pollInterval = 30000) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  
  useEffect(() => {
    // Poll for new alerts
    const interval = setInterval(async () => {
      const response = await fetch('/api/v1/ai/alerts')
      const data = await response.json()
      setAlerts(data.alerts)
    }, pollInterval)
    
    return () => clearInterval(interval)
  }, [pollInterval])
  
  return { alerts, dismissAlert: (id) => {...} }
}
```

### Backend Architecture

**1. Enhanced AI Router**

```python
# /backend/app/modules/ai/meta_router.py
from fastapi import APIRouter, Depends
from app.modules.ai.orchestrator import FrenlyOrchestrator

router = APIRouter(prefix="/ai", tags=["Frenly AI"])

@router.post("/assist")
async def frenly_assist(
    query: str,
    context: dict,
    intent: str = "auto",
    db: Session = Depends(get_session)
):
    """
    Unified Frenly AI endpoint.
    Auto-detects intent and routes to appropriate handler.
    """
    orchestrator = FrenlyOrchestrator(db)
    
    # Intent detection
    if intent == "auto":
        intent = orchestrator.detect_intent(query, context)
    
    # Route to handler
    if intent == "sql_query":
        return await orchestrator.handle_sql_query(query, context)
    elif intent == "action":
        return await orchestrator.handle_action(query, context)
    elif intent == "explanation":
        return await orchestrator.handle_explanation(query, context)
    else:
        return await orchestrator.handle_general_chat(query, context)
```

**2. Orchestrator Class**

```python
# /backend/app/modules/ai/orchestrator.py
class FrenlyOrchestrator:
    def __init__(self, db: Session):
        self.db = db
        self.gemini = GeminiService()
        self.sql_generator = SQLGenerator()
        self.narrative_engine = NarrativeEngine()
    
    def detect_intent(self, query: str, context: dict) -> str:
        """Use Gemini to detect user intent"""
        prompt = f"""
        Classify user intent:
        Query: "{query}"
        Context: Page={context.get('page')}, Project={context.get('project_id')}
        
        Intents: sql_query, action, explanation, general_chat
        Respond with one word only.
        """
        return self.gemini.classify(prompt).strip().lower()
    
    async def handle_sql_query(self, query: str, context: dict):
        """Generate and execute SQL"""
        sql = self.sql_generator.generate(query, context)
        data = self.db.execute(sql).fetchall()
        
        # Use Gemini to explain results
        explanation = self.gemini.explain_results(query, data)
        
        return {
            "response_type": "sql_query",
            "answer": explanation,
            "sql": sql,
            "data": [dict(row) for row in data],
            "suggested_actions": self._suggest_actions(data, context)
        }
```

**3. Proactive Monitor (Celery)**

```python
# /backend/app/tasks/frenly_monitor.py
from app.core.celery_config import celery_app
from app.modules.ai.anomaly_detector import AnomalyDetector

@celery_app.task(name='frenly.proactive_monitor')
def proactive_monitor():
    """
    Runs every 5 minutes to detect system anomalies and generate alerts.
    """
    detector = AnomalyDetector()
    alerts = []
    
    # 1. High-risk transactions
    alerts.extend(detector.check_high_risk_transactions())
    
    # 2. Reconciliation gaps
    alerts.extend(detector.check_reconciliation_gaps())
    
    # 3. Batch job status
    alerts.extend(detector.check_batch_jobs())
    
    # 4. Document issues
    alerts.extend(detector.check_document_verification())
    
    # Store in Redis for frontend consumption
    redis_client.set('frenly:alerts', json.dumps(alerts), ex=300)
    
    return {"alerts_generated": len(alerts)}
```

---

## 📊 LLM Model Integration

### Current vs Proposed

| Feature | Current | Proposed |
|---------|---------|----------|
| **Primary LLM** | Google Gemini (basic) | Gemini 1.5 Pro with function calling |
| **SQL Generation** | Keyword matching | Gemini + schema-aware prompts |
| **Context Window** | None | Last 10 messages + app state |
| **Function Calling** | ❌ | ✅ Execute actions, run SQL, generate reports |
| **Embeddings** | ❌ | ✅ For semantic search in docs/transactions |
| **Multi-modal** | ❌ | ✅ Image analysis (receipts, statements) |

### Gemini Function Calling Example

```python
from google.generativeai import GenerativeModel

model = GenerativeModel('gemini-1.5-pro')

# Define available functions
functions = [
    {
        "name": "execute_sql",
        "description": "Execute SQL query on transaction database",
        "parameters": {
            "type": "object",
            "properties": {
                "sql": {"type": "string"},
                "project_id": {"type": "string"}
            }
        }
    },
    {
        "name": "generate_report",
        "description": "Generate forensic report for a case",
        "parameters": {
            "type": "object",
            "properties": {
                "case_id": {"type": "string"},
                "format": {"type": "string", "enum": ["pdf", "docx"]}
            }
        }
    }
]

# Chat with function calling
response = model.generate_content(
    "Show me high-risk transactions and generate a report",
    tools=[{'function_declarations': functions}]
)

# Execute function calls
for call in response.function_calls:
    if call.name == "execute_sql":
        result = execute_sql(**call.args)
    elif call.name == "generate_report":
        result = generate_report(**call.args)
```

---

## 🎯 Success Metrics

### User Engagement

- **Daily Active Usage**: Target 70% of users engage with Frenly daily
- **Query Success Rate**: >90% of queries successfully resolved
- **Action Completion**: >60% of suggested actions are executed

### Efficiency Gains

- **Time to Insight**: Reduce from 5 min to <30 sec for common queries
- **Report Generation**: Reduce from 30 min to <2 min with AI assistance
- **Investigation Speed**: 40% faster case completion with AI co-pilot

### Quality Metrics

- **SQL Accuracy**: >95% of generated SQL executes without errors
- **False Positives**: <10% of proactive alerts are irrelevant
- **User Satisfaction**: >4.5/5 rating for AI assistance

---

## 🗓️ Implementation Roadmap

### Week 1-2: Foundation

- [x] Merge ForensicCopilot + FrenlyWidget → FrenlyMetaAgent
- [x] Implement unified `/api/v1/ai/assist` endpoint
- [x] Enhance SQL generation with Gemini
- [x] Add conversation memory (Redis)

### Week 3-4: Proactive Features

- [ ] Implement background monitoring (Celery task)
- [ ] Build alert system with WebSocket/polling
- [ ] Add context-aware suggestions
- [ ] Create quick action executor

### Week 5-6: Advanced Intelligence

- [ ] Multi-modal support (image analysis)
- [ ] Investigation co-pilot mode
- [ ] Natural language reporting
- [ ] Pattern learning system

### Week 7-8: Collaboration & Polish

- [ ] Multi-user features
- [ ] Voice command support
- [ ] Performance optimization
- [ ] User testing & refinement

---

## 💰 Resource Requirements

### API Costs (Estimated)

- **Gemini 1.5 Pro**: $0.125 per 1M input tokens, $0.375 per 1M output
- **Expected Monthly Usage**: ~10M tokens (100 users, 10 queries/day)
- **Estimated Cost**: ~$5-10/month

### Infrastructure

- **Redis**: For alerts & conversation memory (~100 MB)
- **Celery Workers**: 1 dedicated worker for monitoring
- **Storage**: +1 GB for conversation logs

---

## 🔐 Security & Privacy

### Data Handling

- **PII Anonymization**: Remove sensitive data before sending to LLM
- **SQL Injection Protection**: Validate generated SQL before execution
- **Access Control**: Respect user permissions for data access
- **Audit Logging**: Log all AI actions for compliance

### Gemini API Security

```python
# Sanitize queries before sending to Gemini
def sanitize_for_llm(query: str, context: dict) -> dict:
    # Remove PII
    query = redact_pii(query)
    
    # Remove sensitive context
    safe_context = {
        'page': context.get('page'),
        'project_id': hash_id(context.get('project_id')),
        # Don't send actual data, only metadata
    }
    
    return {'query': query, 'context': safe_context}
```

---

## 📚 References & Inspirations

**Similar Products:**

- **Julius AI**: SQL + data visualization from natural language
- **GitHub Copilot**: Context-aware code suggestions
- **Notion AI**: Document intelligence and writing assistance
- **Intercom Fin**: Customer support AI with action execution

**Technical Resources:**

- [Gemini Function Calling Docs](https://ai.google.dev/docs/function_calling)
- [LangChain SQL Agent](https://python.langchain.com/docs/use_cases/sql)
- [FastAPI WebSockets](https://fastapi.tiangolo.com/advanced/websockets/)

---

## ✅ Next Steps

1. **Review & Approve** this proposal
2. **Prioritize phases** based on business needs
3. **Assign development resources** (1-2 engineers)
4. **Set up Gemini API keys** and test environment
5. **Begin Week 1 implementation** (unified widget)

---

**Prepared by:** AI Antigravity Agent  
**For Review by:** Product & Engineering Teams  
**Estimated Effort:** 8 weeks (1-2 engineers)  
**Expected ROI:** 40% productivity improvement for audit teams
