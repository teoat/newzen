# 🔍 INVESTIGATION & EVALUATION ROADMAP

**Document Type:** Operational Playbook  
**Purpose:** Step-by-Step Diagnostic Execution Guide  
**Timestamp:** 2026-01-31T05:01 JST  
**Status:** Active Investigation Protocol

---

## 📋 OVERVIEW

This roadmap provides a systematic approach to investigating, diagnosing, and evaluating the Zenith Platform using the scoring framework. Each investigation phase includes:

- **Specific commands to run**
- **Metrics to collect**
- **Scoring criteria**
- **Analysis templates**
- **Remediation triggers**

---

## 🎯 INVESTIGATION PROTOCOL

### Phase 1: Bootstrap Investigation (Day 1)

#### Objective

Establish baseline metrics and identify critical issues requiring immediate attention.

#### 1.1 Health Check Commands

```bash
# Navigate to project root
cd /Users/Arief/Newzen/zenith-lite

# Backend health check
curl http://localhost:8200/health

# Frontend build status
cd frontend && npm run build

# Database connection test
cd ../backend
python -c "from app.database import engine; print(engine.execute('SELECT 1').scalar())"

# Redis connectivity
redis-cli ping
```

**Scoring:**

- All pass: +5 points (Infrastructure: Functionality)
- 1 failure: +3 points
- 2+ failures: 0 points (critical investigation required)

---

#### 1.2 Security Scan

```bash
# Backend security audit
cd backend
pip install bandit
bandit -r app/ -f json -o security_report.json

# Frontend dependency audit
cd ../frontend
npm audit --json > npm_audit.json

# Check for exposed secrets
cd ..
git secrets --scan
```

**Scoring Criteria:**

- 0 high/critical vulnerabilities: +5 points (Security)
- 1-3 high/critical: +3 points
- 4+ high/critical: 0 points (immediate remediation)

---

#### 1.3 Performance Baseline

```bash
# API response time measurement
cd backend
python << EOF
import requests
import time

url = "http://localhost:8200/api/v1/cases"
times = []
for _ in range(10):
    start = time.time()
    requests.get(url, cookies={"session": "test"})
    times.append(time.time() - start)

p95 = sorted(times)[int(len(times) * 0.95)]
print(f"P95 Latency: {p95*1000:.0f}ms")
EOF

# Frontend Core Web Vitals
cd ../frontend
npm run build
npm install -g lighthouse
lighthouse http://localhost:3000 --only-categories=performance --output=json --output-path=./lighthouse.json
```

**Scoring Criteria:**

- API p95 <500ms: +5 points (Performance)
- API p95 500-1000ms: +3 points
- API p95 >1000ms: +1 point

---

### Phase 2: Deep Dive Analysis (Days 2-3)

#### 2.1 Database Performance Investigation

```bash
# Enable PostgreSQL query logging
cd backend
cat << EOF >> alembic.ini
[logger_sqlalchemy]
level = INFO
handlers =
qualname = sqlalchemy.engine
EOF

# Run test suite with query logging
pytest tests/integration/ -v --log-cli-level=INFO 2>&1 | grep "SELECT" > slow_queries.log

# Analyze slow queries
cat slow_queries.log | awk '{print $NF}' | sort | uniq -c | sort -rn | head -20
```

**Analysis Template:**

| Query Pattern | Count | Avg Time | Issue | Recommendation |
|---------------|-------|----------|-------|----------------|
| SELECT * FROM transactions WHERE... | 157 | 850ms | Missing index | Add composite index on (user_id, created_at) |

**Scoring:**

- All queries <100ms: +5 points
- 1-5 queries >100ms: +3 points
- 5+ queries >100ms: +1 point

---

#### 2.2 Code Quality Deep Dive

```bash
# Run comprehensive linting
cd backend
flake8 app/ --statistics --output-file=flake8_report.txt
mypy app/ --strict --html-report mypy_report/

cd ../frontend
npm run lint -- --format json --output-file eslint_report.json

# Calculate cyclomatic complexity
pip install radon
radon cc app/ -a -s --json > complexity_report.json

# Find the most complex functions
cat complexity_report.json | jq 'to_entries[] | select(.value[] | select(.complexity > 10))'
```

**Scoring Criteria:**

- Average complexity <5: +5 points (Maintainability)
- Average complexity 5-10: +3 points
- Average complexity >10: +1 point (refactoring needed)

---

#### 2.3 Test Coverage Analysis

```bash
# Backend coverage
cd backend
pytest --cov=app --cov-report=html --cov-report=term

# Frontend coverage
cd ../frontend
npm run test -- --coverage --coverageReporters=lcov --coverageReporters=text

# Generate coverage badge
pip install coverage-badge
coverage-badge -o coverage.svg
```

**Scoring:**

- Coverage >80%: +5 points (Maintainability)
- Coverage 60-80%: +3 points
- Coverage <60%: +1 point

---

### Phase 3: Stress Testing (Days 4-5)

#### 3.1 Load Testing Setup

```bash
# Install k6
brew install k6

# Create load test script
cat << 'EOF' > load_test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up
    { duration: '5m', target: 100 },  // Stay at 100
    { duration: '2m', target: 200 },  // Spike
    { duration: '5m', target: 200 },
    { duration: '2m', target: 0 },    // Ramp down
  ],
};

export default function () {
  let res = http.get('http://localhost:8200/api/v1/cases');
  check(res, { 'status was 200': (r) => r.status == 200 });
  sleep(1);
}
EOF

# Run load test
k6 run load_test.js --out json=load_test_results.json
```

**Scoring:**

- 95th percentile <1s under load: +5 points (Performance)
- 95th percentile 1-2s: +3 points
- 95th percentile >2s: +1 point

---

#### 3.2 Concurrency Testing

```bash
# Test concurrent user operations
cd backend
python << EOF
import concurrent.futures
import requests

def create_case(user_id):
    return requests.post(
        "http://localhost:8200/api/v1/cases",
        json={"title": f"Case {user_id}", "description": "Test"},
    )

with concurrent.futures.ThreadPoolExecutor(max_workers=50) as executor:
    futures = [executor.submit(create_case, i) for i in range(100)]
    results = [f.result() for f in concurrent.futures.as_completed(futures)]

success_count = sum(1 for r in results if r.status_code == 201)
print(f"Success rate: {success_count}%")
EOF
```

**Scoring:**

- Success rate >95%: +5 points (Functionality)
- Success rate 85-95%: +3 points
- Success rate <85%: 0 points (concurrency issues)

---

### Phase 4: Security Penetration Testing (Days 6-7)

#### 4.1 OWASP Top 10 Assessment

```bash
# Install ZAP scanner
brew install --cask owasp-zap

# Automated security scan (headless)
zap-cli quick-scan --self-contained --start-options '-config api.disablekey=true' \
  http://localhost:3000 > zap_report.txt

# SQL injection testing
sqlmap -u "http://localhost:8200/api/v1/search?q=test" \
  --cookie="session=..." --batch --level=3 --risk=2
```

**Scoring:**

- 0 high/critical findings: +5 points (Security)
- 1-2 high findings: +3 points
- 3+ high findings: 0 points (immediate fix required)

---

#### 4.2 Authentication Attack Simulation

```bash
# Brute force attempt (should be blocked by rate limiting)
cd backend
python << EOF
import requests

login_url = "http://localhost:8200/api/v1/auth/login"
for i in range(20):
    res = requests.post(login_url, json={
        "username": "admin",
        "password": f"wrong{i}"
    })
    print(f"Attempt {i+1}: {res.status_code}")
    if res.status_code == 429:
        print("✅ Rate limiting working!")
        break
EOF
```

**Scoring:**

- Rate limiting triggers <15 attempts: +5 points (Security)
- Rate limiting triggers 15-30 attempts: +3 points
- No rate limiting: 0 points (critical security gap)

---

### Phase 5: User Experience Evaluation (Days 8-9)

#### 5.1 Frontend Performance Audit

```bash
# Lighthouse CI
npm install -g @lhci/cli
lhci autorun --collect.url=http://localhost:3000 \
  --upload.target=temporary-public-storage

# Bundle size analysis
cd frontend
npm install -g webpack-bundle-analyzer
npm run build -- --stats
npx webpack-bundle-analyzer build/stats.json
```

**Scoring:**

- Lighthouse score >90: +5 points (Performance)
- Lighthouse score 75-90: +3 points
- Lighthouse score <75: +1 point

---

#### 5.2 Accessibility Audit

```bash
# Run axe-core accessibility scan
cd frontend
npm install -D @axe-core/cli
npx axe http://localhost:3000 --save axe_report.json

# Check WCAG compliance
cat axe_report.json | jq '.violations | length'
```

**Scoring:**

- 0 critical a11y issues: +5 points (Documentation/UX)
- 1-5 critical issues: +3 points
- 5+ critical issues: +1 point

---

### Phase 6: Documentation Audit (Day 10)

#### 6.1 API Documentation Completeness

```bash
# Generate OpenAPI spec
cd backend
python << EOF
from app.main import app
import json

spec = app.openapi()
endpoints = len(spec['paths'])
documented = sum(1 for path in spec['paths'].values() 
                 for method in path.values() 
                 if method.get('description'))

print(f"Documented endpoints: {documented}/{endpoints}")
print(f"Coverage: {documented/endpoints*100:.1f}%")
EOF
```

**Scoring:**
>
- >90% endpoints documented: +5 points (Documentation)
- 70-90% documented: +3 points
- <70% documented: +1 point

---

#### 6.2 Code Comment Analysis

```bash
# Analyze comment density
cd backend
radon raw app/ -s | grep -E "Comments|LOC"

cd ../frontend/src
find . -name "*.tsx" -o -name "*.ts" | xargs wc -l | tail -1
grep -r "^[[:space:]]*\/\/" . | wc -l
```

**Scoring:**

- Comment ratio >15%: +5 points (Maintainability)
- Comment ratio 5-15%: +3 points
- Comment ratio <5%: +1 point

---

## 📊 INVESTIGATION DASHBOARD

### Daily Progress Tracking

```markdown
## Investigation Log — Day 1

### Health Check Results
- ✅ Backend API: Healthy (200 OK)
- ✅ Frontend build: Success
- ✅ Database: Connected
- ✅ Redis: Operational

**Score:** 20/20 (Infrastructure: Functionality)

### Security Scan
- 🟡 2 medium vulnerabilities found (outdated dependencies)
- ✅ 0 high/critical vulnerabilities
- ✅ No exposed secrets

**Score:** 18/20 (Infrastructure: Security)

### Performance Baseline
- API p95: 680ms
- Frontend LCP: 1.2s
- FID: 50ms

**Score:** 15/20 (Infrastructure: Performance)

### Next Actions
1. Update dependencies to patch medium vulnerabilities
2. Investigate slow API queries (>500ms)
3. Optimize frontend bundle size
```

---

## 🎯 SCORING AGGREGATION FORMULA

### Per Subsystem

```python
def calculate_subsystem_score(results):
    return {
        'functionality': results['health_check'] + results['concurrency_test'],
        'security': results['security_scan'] + results['penetration_test'],
        'performance': results['load_test'] + results['frontend_audit'],
        'maintainability': results['complexity'] + results['test_coverage'],
        'documentation': results['api_docs'] + results['code_comments'],
    }

total_score = sum(calculate_subsystem_score(results).values())
grade = get_grade(total_score)
```

### Grade Mapping

```python
def get_grade(score):
    if score >= 90:
        return "Sovereign Grade 🏆"
    elif score >= 75:
        return "Enterprise Grade ✅"
    elif score >= 60:
        return "Functional ⚠️"
    else:
        return "Critical 🚨"
```

---

## 🚨 REMEDIATION TRIGGERS

### Critical Issues (Immediate Action Required)

| **Trigger** | **Threshold** | **Action** |
|-------------|---------------|------------|
| Security vulnerability | 1+ high/critical | Hotfix within 24h |
| API p95 latency | >2000ms | Emergency optimization |
| Success rate | <80% | Rollback deployment |
| Database deadlocks | >5/hour | Enable query logging, analyze locks |

### High Priority (This Week)

| **Trigger** | **Threshold** | **Action** |
|-------------|---------------|------------|
| Test coverage | <60% | Add integration tests |
| Lighthouse score | <75 | Frontend optimization sprint |
| Cyclomatic complexity | >15 | Refactor complex functions |
| Memory leak | Heap grows >10% | Profile with memory profiler |

### Medium Priority (This Sprint)

| **Trigger** | **Threshold** | **Action** |
|-------------|---------------|------------|
| API documentation | <80% | Document missing endpoints |
| Code comments | <10% | Add docstrings to modules |
| Bundle size | >2MB | Implement code splitting |
| Cache hit rate | <70% | Tune cache strategy |

---

## 📈 CONTINUOUS MONITORING SETUP

### Prometheus Metrics

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'zenith-backend'
    static_configs:
      - targets: ['localhost:8200']
    metrics_path: '/metrics'

  - job_name: 'zenith-postgres'
    static_configs:
      - targets: ['localhost:9187']
```

### Key Metrics to Track

| **Metric** | **Dimension** | **Target** | **Alert Threshold** |
|------------|---------------|------------|---------------------|
| `http_request_duration_p95` | Performance | <500ms | >1000ms |
| `db_query_duration_p95` | Performance | <100ms | >300ms |
| `auth_failures_per_minute` | Security | <5 | >10 |
| `error_rate` | Functionality | <0.1% | >1% |
| `test_coverage_percentage` | Maintainability | >80% | <70% |

---

## 🔄 INVESTIGATION WORKFLOW

### Weekly Cadence

```
Monday:    Run Phase 1 (Health Check)
Tuesday:   Run Phase 2 (Deep Dive)
Wednesday: Run Phase 3 (Stress Testing)
Thursday:  Run Phase 4 (Security)
Friday:    Run Phase 5-6 (UX & Docs)
──────────────────────────────────────
Saturday:  Aggregate scores, generate report
Sunday:    Review findings, plan remediation
```

### Monthly Review

1. **Compare scores month-over-month**
2. **Identify regressions** (score decreases)
3. **Celebrate improvements** (score increases)
4. **Update investigation playbook** based on learnings
5. **Adjust scoring thresholds** if needed

---

## 📋 INVESTIGATION CHECKLIST

### Before Starting

- [ ] Ensure all services are running
- [ ] Create backup of production data
- [ ] Notify team of investigation window
- [ ] Prepare investigation environment (tools installed)

### During Investigation

- [ ] Document all findings in real-time
- [ ] Take screenshots of anomalies
- [ ] Export raw data (JSON reports)
- [ ] Note any unexpected behaviors

### After Investigation

- [ ] Calculate scores using aggregation formula
- [ ] Generate investigation report
- [ ] Create tickets for remediation
- [ ] Schedule follow-up investigation
- [ ] Update scoring baseline

---

## 🎯 SUCCESS CRITERIA

### Investigation Complete When

1. ✅ All 7 layers evaluated
2. ✅ All 19 subsystems scored
3. ✅ Performance baseline established
4. ✅ Security audit passed
5. ✅ Documentation coverage measured
6. ✅ Remediation plan created
7. ✅ Monitoring dashboards configured

### Evaluation Quality Gates

- **Minimum score:** 75/100 per subsystem
- **Platform average:** >85/100
- **Zero critical security issues**
- **Zero blocking functional defects**

---

## 🏆 FINAL DELIVERABLES

### Investigation Report Template

```markdown
# Zenith Platform Investigation Report — [Date]

## Executive Summary
- Overall Score: [X]/100
- Grade: [Sovereign/Enterprise/Functional/Critical]
- Critical Issues: [N]
- High Priority Issues: [N]

## Dimension Breakdown
- Functionality: [X]/20
- Security: [X]/20
- Performance: [X]/20
- Maintainability: [X]/20
- Documentation: [X]/20

## Top 5 Findings
1. [Issue] — [Subsystem] — [Priority]
2. ...

## Remediation Roadmap
### Week 1
- [ ] Action 1
- [ ] Action 2

### Week 2-4
- [ ] Strategic initiative 1

## Monitoring Setup
- Dashboards created: [URLs]
- Alerts configured: [Count]
- Baseline metrics: [Table]

## Next Investigation Date
[Date + 30 days]
```

---

## 🔧 TOOLS REFERENCE

### Essential Tools

```bash
# Backend
pip install bandit radon pytest-cov mypy flake8 black isort

# Frontend
npm install -g lighthouse @lhci/cli webpack-bundle-analyzer

# Performance
brew install k6 ab siege

# Security
brew install --cask owasp-zap
pip install sqlmap

# Monitoring
docker run -d -p 9090:9090 prom/prometheus
docker run -d -p 3001:3000 grafana/grafana
```

---

## 📞 ESCALATION MATRIX

| **Severity** | **Response Time** | **Escalate To** |
|--------------|-------------------|-----------------|
| Critical (Score <60) | Immediate | CTO + Engineering Lead |
| High (Score 60-74) | 24 hours | Engineering Lead |
| Medium (Score 75-89) | 1 week | Team Lead |
| Low (Score 90+) | Continuous improvement | Sprint planning |

---

**Investigation Protocol Version:** 1.0  
**Last Updated:** 2026-01-31  
**Next Review:** 2026-02-28  
**Owner:** Sovereign System Architect

---

**Usage Notes:**

- Execute phases sequentially for comprehensive evaluation
- Adapt thresholds based on your SLAs
- Automate repetitive investigations with CI/CD
- Share findings transparently with stakeholders
