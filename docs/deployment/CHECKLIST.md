# 🚀 PRODUCTION DEPLOYMENT CHECKLIST

**Platform:** Zenith Forensic Audit Platform  
**Version:** 1.0.0  
**Date:** 2026-01-29  

---

## PRE-DEPLOYMENT CHECKLIST

### 1. Code & Tests ✅

- [x] All tests passing

  ```bash
  cd backend && ./run_tests.sh
  # Expected: All 35+ tests pass
  ```

- [x] Performance benchmarks met

  ```bash
  cd backend && python benchmark.py
  # Expected: All endpoints <200ms
  ```

- [x] No critical lint errors

  ```bash
  cd backend && flake8 app/ --count
  cd frontend && npm run lint
  ```

### 2. Database ✅

- [x] Migrations up to date

  ```bash
  cd backend && alembic current
  # Expected: Shows latest migration hash
  ```

- [x] Indexes created

  ```bash
  cd backend && alembic history
  # Expected: add_performance_indexes migration present
  ```

- [ ] **Production database backup taken**

  ```bash
  # PostgreSQL
  pg_dump -U postgres zenith > backup_$(date +%Y%m%d).sql
  
  # SQLite
  sqlite3 zenith.db ".backup backup_$(date +%Y%m%d).db"
  ```

### 3. Environment Variables 🔐

- [ ] **Set all required secrets**

  ```bash
  # Backend .env
  DATABASE_URL=postgresql://user:pass@host:5432/zenith
  REDIS_URL=redis://host:6379/0
  JWT_SECRET=$(openssl rand -hex 32)
  ENCRYPTION_SECRET=$(openssl rand -hex 32)
  CSRF_SECRET=$(openssl rand -hex 32)
  GEMINI_API_KEY=<your_production_key>
  
  # Frontend .env.production
  NEXT_PUBLIC_API_URL=https://api.production.yourdomain.com
  NEXT_PUBLIC_ENABLE_VOICE=true
  NEXT_PUBLIC_ENABLE_IMAGES=true
  ```

- [ ] **Verify secrets are set**

  ```bash
  cd backend && python -c "import os; from dotenv import load_dotenv; load_dotenv(); print('JWT_SECRET:', 'SET' if os.getenv('JWT_SECRET') else 'MISSING')"
  ```

### 4. Security 🔒

- [ ] **HTTPS/TLS enabled**
  - SSL certificate installed
  - Force HTTPS redirect enabled
  - HSTS headers configured

- [ ] **CORS configured for production domain**

  ```python
  # In main.py
  app.add_middleware(
      CORSMiddleware,
      allow_origins=["https://app.yourdomain.com"],  # NOT "*"
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  ```

- [ ] **CSRF protection enabled (already done ✅)**

- [ ] **Rate limiting active**

  ```bash
  # Test: Make 61 requests, should get 429
  for i in {1..61}; do curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8200/health; done
  # Expected: Last response is 429
  ```

### 5. Infrastructure 🏗️

- [ ] **Redis running and accessible**

  ```bash
  redis-cli ping
  # Expected: PONG
  ```

- [ ] **Database accessible**

  ```bash
  # PostgreSQL
  psql -U postgres -d zenith -c "SELECT 1;"
  
  # SQLite
  sqlite3 zenith.db "SELECT 1;"
  ```

- [ ] **Disk space sufficient**

  ```bash
  df -h
  # Expected: At least 10GB free
  ```

- [ ] **Memory available**

  ```bash
  free -h
  # Expected: At least 2GB free
  ```

### 6. Monitoring & Logging 📊

- [ ] **Health check endpoint accessible**

  ```bash
  curl http://localhost:8200/health
  # Expected: {"status":"healthy",...}
  ```

- [ ] **Detailed health check working**

  ```bash
  curl http://localhost:8200/health/detailed | jq '.overall_status'
  # Expected: "healthy"
  ```

- [ ] **Metrics endpoint configured**

  ```bash
  curl http://localhost:8200/metrics
  # Expected: Prometheus metrics
  ```

- [ ] **Log aggregation configured** (optional)
  - Sentry/Datadog/ELK configured
  - Log level set to INFO or WARNING

---

## DEPLOYMENT STEPS

### Step 1: Run Validation

```bash
cd backend
python validate_deployment.py --url http://localhost:8200
```

**Expected Output:**

```
✅ DEPLOYMENT VALIDATION PASSED
All checks passed. Ready for production deployment!
```

**If Failed:** Fix issues before proceeding.

---

### Step 2: Deploy Backend

#### Option A: Docker

```bash
# Build image
docker build -t zenith-backend:1.0.0 ./backend

# Run container
docker run -d \
  --name zenith-backend \
  -p 8200:8200 \
  --env-file backend/.env.production \
  zenith-backend:1.0.0
```

#### Option B: Systemd Service

```bash
# Copy service file
sudo cp deployment/zenith-backend.service /etc/systemd/system/

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable zenith-backend
sudo systemctl start zenith-backend

# Check status
sudo systemctl status zenith-backend
```

#### Option C: Kubernetes

```bash
# Apply manifests
kubectl apply -f k8s/manifests/backend-deployment.yaml
kubectl apply -f k8s/manifests/postgres-deployment.yaml
kubectl apply -f k8s/manifests/redis-deployment.yaml

# Verify
kubectl get pods -n zenith-lite
```

---

### Step 3: Deploy Frontend

#### Build Production Bundle

```bash
cd frontend
npm run build
npm run start  # Or use PM2/Docker
```

#### PM2 (Recommended)

```bash
npm install -g pm2
pm2 start npm --name "zenith-frontend" -- run start
pm2 save
pm2 startup
```

---

### Step 4: Configure Reverse Proxy

#### Nginx Example

```nginx
# /etc/nginx/sites-available/zenith

server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:8200;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /health {
        proxy_pass http://localhost:8200/health;
        access_log off;
    }
}

server {
    listen 443 ssl http2;
    server_name app.yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/zenith /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## POST-DEPLOYMENT VALIDATION

### 1. Smoke Tests

```bash
# Health check
curl https://api.yourdomain.com/health
# Expected: {"status":"healthy",...}

# Detailed health
curl https://api.yourdomain.com/health/detailed | jq '.overall_status'
# Expected: "healthy"

# Metrics
curl https://api.yourdomain.com/metrics | grep zenith_health_status
# Expected: zenith_health_status 1
```

### 2. Authentication Test

```bash
# Should return 401/403 without token
curl -i https://api.yourdomain.com/api/v1/project
# Expected: HTTP/1.1 401 Unauthorized
```

### 3. Rate Limiting Test

```bash
# Make 61 requests
for i in {1..61}; do 
  curl -s -o /dev/null -w "%{http_code}\n" https://api.yourdomain.com/health
done
# Expected: Last response is 429
```

### 4. CSRF Test

```bash
# GET should set CSRF cookie
curl -v https://api.yourdomain.com/health 2>&1 | grep csrf_token
# Expected: Set-Cookie: csrf_token=...

# POST without token should fail
curl -X POST https://api.yourdomain.com/api/v1/project -d "{}"
# Expected: 403 CSRF token missing
```

### 5. Frontend Test

1. Open <https://app.yourdomain.com>
2. Verify login page loads
3. Test authentication flow
4. Test AI assistant (Frenly)
5. Test voice commands
6. Upload test receipt/invoice

### 6. Performance Test

```bash
# Run benchmark against production
cd backend
python benchmark.py --url https://api.yourdomain.com
```

**Expected:** All endpoints <200ms

---

## MONITORING SETUP

### 1. Health Check Monitoring

Add to your monitoring system (Uptime Robot, Pingdom, etc.):

```
URL: https://api.yourdomain.com/health
Interval: 1 minute
Expected: Status 200, body contains "healthy"
```

### 2. Metrics Collection (Optional)

#### Prometheus Configuration

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'zenith-api'
    static_configs:
      - targets: ['api.yourdomain.com:443']
    metrics_path: '/metrics'
    scheme: https
```

#### Grafana Dashboard

Import dashboard for:

- API response times
- Cache hit rates
- Error rates
- Active users

---

## ROLLBACK PLAN

### If Deployment Fails

1. **Stop new services**

   ```bash
   sudo systemctl stop zenith-backend
   pm2 stop zenith-frontend
   ```

2. **Restore database backup**

   ```bash
   # PostgreSQL
   psql -U postgres < backup_YYYYMMDD.sql
   
   # SQLite
   cp backup_YYYYMMDD.db zenith.db
   ```

3. **Revert to previous version**

   ```bash
   docker run -d zenith-backend:previous-version
   ```

4. **Update DNS** (if changed)
  
   Point back to old server

5. **Verify old version working**

   ```bash
   curl https://api.yourdomain.com/health
   ```

---

## SUPPORT CONTACTS

**Platform Team:** <support@yourdomain.com>  
**On-Call:** +1-XXX-XXX-XXXX  
**Slack:** #zenith-platform  

---

## SIGN-OFF

- [ ] **DevOps Lead:** Deployment validated
- [ ] **QA Lead:** All tests passed
- [ ] **Security Lead:** Security audit approved
- [ ] **Product Owner:** UAT completed

**Deployment Date:** ____________  
**Deployed By:** ____________  
**Approved By:** ____________  

---

**Status:** ✅ **READY FOR PRODUCTION**

🚀 **GO LIVE!** 🚀
