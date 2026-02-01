# Quick Start Guide - Batch Processing & Frenly AI

## 🚀 Batch Processing - Quick Commands

### 1. Fix Migration (Required First)

```bash
# Open migration file
code backend/alembic/versions/5eee4913c150_add_processingjob_model_for_batch_.py

# Comment out line 46 (SQLite constraint issue):
# op.create_foreign_key(None, 'case', 'user', ['sealed_by_id'], ['id'])

# Run migration
cd backend && alembic upgrade head
```

### 2. Start Celery Services

```bash
# Create Docker network (if not exists)
docker network create zenith-network

# Start Redis + Workers + Flower + Beat
docker-compose -f docker-compose.celery.yml up -d

# View logs
docker-compose -f docker-compose.celery.yml logs -f
```

### 3. Monitor Jobs

```bash
# Flower web UI
open http://localhost:5555

# API endpoints
curl http://localhost:8200/api/v1/batch-jobs/stats/summary
curl http://localhost:8200/api/v1/batch-jobs/
```

### 4. Submit Test Job (via Python)

```python
import requests

response = requests.post('http://localhost:8200/api/v1/batch-jobs/submit', json={
    "project_id": "test-project",
    "data_type": "transaction",
    "items": [{"id": str(i), "amount": i * 100} for i in range(1000)]
})

job_id = response.json()['job_id']
print(f"Job submitted: {job_id}")

# Check status
status = requests.get(f'http://localhost:8200/api/v1/batch-jobs/{job_id}').json()
print(f"Progress: {status['progress_percent']}%")
```

---

## 🧠 Frenly AI - Implementation Checklist

### Phase 1: Merge Agents (Week 1-2)

- [ ] Review proposal: `/FRENLY_AI_ENHANCEMENT_PROPOSAL.md`
- [ ] Get stakeholder approval
- [ ] Create `FrenlyMetaAgent.tsx` (merge ForensicCopilot + FrenlyWidget)
- [ ] Implement `/api/v1/ai/assist` endpoint
- [ ] Add Gemini function calling for SQL generation
- [ ] Test context-aware responses

### Phase 2: Proactive Features (Week 3-4)

- [ ] Implement `frenly.proactive_monitor` Celery task
- [ ] Create alert WebSocket/polling endpoint
- [ ] Add notification badge to widget
- [ ] Build smart suggestion engine
- [ ] Test background monitoring

### Phase 3: Advanced (Week 5-8)

- [ ] Voice command support
- [ ] Multi-modal image analysis
- [ ] Investigation co-pilot mode
- [ ] Natural language reporting
- [ ] Pattern learning system

---

## 📊 Key Metrics to Track

### Batch Processing

- **Throughput**: Items processed per hour
- **Success Rate**: % of items processed without errors
- **Resource Usage**: CPU, RAM, Disk I/O during processing
- **Queue Depth**: Number of pending jobs

### Frenly AI (Once Deployed)

- **Daily Active Users**: % of users engaging with AI
- **Query Success Rate**: % of queries successfully resolved
- **Time to Insight**: Average time from query to answer
- **User Satisfaction**: Rating out of 5

---

## 🐛 Common Issues & Fixes

### Batch Processing

**Issue:** Migration fails with foreign key error  
**Fix:** Comment out line 46 in migration file (see above)

**Issue:** Celery workers not starting  
**Fix:** Check Redis is running: `docker ps | grep redis`

**Issue:** Jobs stuck in PENDING  
**Fix:** Check worker logs: `docker logs -f zenith-celery-worker-1`

**Issue:** High CPU usage  
**Fix:** BatchOptimizer will auto-reduce batch size, or manually reduce `worker_concurrency` in celery_config.py

### Frenly AI

**Issue:** No Gemini responses  
**Fix:** Set environment variable: `GOOGLE_API_KEY=your_key_here`

**Issue:** SQL generation errors  
**Fix:** Check database schema is loaded in GeminiService context

**Issue:** Context not updating  
**Fix:** Verify FrenlyContextProvider wraps app in layout.tsx

---

## 📱 Frontend Integration Example

```typescript
// Example: Using JobProgressMonitor in a page
'use client';

import { useState } from 'react';
import { JobProgressMonitor } from '@/components/JobProgressMonitor';
import { API_URL } from '@/utils/constants';

export default function MyPage() {
  const [jobId, setJobId] = useState<string | null>(null);

  const handleProcess = async () => {
    const response = await fetch(`${API_URL}/api/v1/batch-jobs/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: 'my-project',
        data_type: 'transaction',
        items: myData // your data array
      })
    });
    
    const { job_id } = await response.json();
    setJobId(job_id);
  };

  return (
    <div>
      <button onClick={handleProcess}>Process Data</button>
      {jobId && (
        <JobProgressMonitor 
          jobId={jobId}
          onComplete={() => console.log('Done!')}
        />
      )}
    </div>
  );
}
```

---

## 🔐 Environment Variables

Add to `.env`:

```bash
# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1

# Gemini AI (for Frenly)
GOOGLE_API_KEY=your_gemini_api_key_here

# Optional: Alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

---

## 📚 Documentation Links

- **Architecture**: `/BACKGROUND_PROCESSING_ARCHITECTURE.md`
- **Implementation Guide**: `/IMPLEMENTATION_COMPLETE.md`
- **Frenly AI Proposal**: `/FRENLY_AI_ENHANCEMENT_PROPOSAL.md`
- **Full Summary**: `/SESSION_SUMMARY.md`
- **API Docs**: `http://localhost:8200/docs` (Swagger)
- **Flower Dashboard**: `http://localhost:5555`

---

## ✅ Health Check Commands

```bash
# Check backend is running
curl http://localhost:8200/api/v1/health

# Check Redis
redis-cli ping  # Should return "PONG"

# Check Celery workers
docker exec zenith-celery-worker-1 celery -A app.core.celery_config:celery_app inspect active

# Check job stats
curl http://localhost:8200/api/v1/batch-jobs/stats/summary
```

---

**Quick Ref Version:** 1.0  
**Last Updated:** 2026-01-29  
**Maintained By:** Development Team
