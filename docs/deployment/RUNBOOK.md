# 📚 ZENITH LITE DEPLOYMENT RUNBOOK

## 🎯 **OVERVIEW**

This runbook provides step-by-step instructions for deploying, managing, and troubleshooting the Zenith Lite Forensic Financial Intelligence Platform in production environments.

---

## 🚀 **INITIAL DEPLOYMENT**

### **Prerequisites**
- Docker & Docker Compose installed
- At least 8GB RAM and 50GB disk space
- Ports 3200, 8200, 5442, 6379 available
- Git access to repository

### **Step 1: Clone Repository**
```bash
git clone <repository-url> zenith-lite
cd zenith-lite
```

### **Step 2: Environment Configuration**
```bash
# Copy environment template
cp backend/.env.example backend/.env

# Edit environment variables
nano backend/.env
```

**Required Environment Variables:**
```bash
# Database
DATABASE_URL=postgresql://zenith_user:your_password@localhost:5442/zenith_db

# Security
SECRET_KEY=your-super-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here

# Redis
REDIS_URL=redis://localhost:6379/0

# Application
ENVIRONMENT=production
DEBUG=false
```

### **Step 3: Start Services**
```bash
# Start all services
docker compose up -d

# Wait for services to initialize
sleep 30

# Verify deployment
curl http://localhost:8200/health
curl http://localhost:3200
```

### **Step 4: Create Admin User**
```bash
# Register initial admin user
curl -X POST http://localhost:8200/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourcompany.com",
    "username": "admin",
    "password": "secure_admin_password"
  }'
```

---

## 🔄 **DAILY OPERATIONS**

### **Health Monitoring**
```bash
# Run comprehensive health check
./scripts/production_monitor.sh check

# Generate status report
./scripts/production_monitor.sh report

# Start continuous monitoring
./scripts/production_monitor.sh monitor
```

### **Log Management**
```bash
# View backend logs
docker logs -f zenith_backend

# View frontend logs
docker logs -f zenith_frontend

# View database logs
docker logs -f zenith_db

# Clear old logs (>7 days)
find . -name "*.log" -mtime +7 -delete
```

### **Database Maintenance**
```bash
# Connect to database
docker exec -it zenith_db psql -U zenith_user -d zenith_db

# Create database backup
docker exec zenith_db pg_dump -U zenith_user zenith_db > backup_$(date +%Y%m%d).sql

# Restore database backup
docker exec -i zenith_db psql -U zenith_user zenith_db < backup_20240131.sql
```

---

## 🛠️ **MAINTENANCE PROCEDURES**

### **Weekly Tasks**
1. **Update Dependencies**
   ```bash
   # Pull latest code
   git pull origin main
   
   # Rebuild and restart services
   docker compose down
   docker compose build --no-cache
   docker compose up -d
   ```

2. **Database Cleanup**
   ```bash
   # Clean up old sessions
   docker exec zenith_db psql -U zenith_user -d zenith_db -c "DELETE FROM sessions WHERE created_at < NOW() - INTERVAL '7 days';"
   
   # Optimize database
   docker exec zenith_db psql -U zenith_user -d zenith_db -c "VACUUM ANALYZE;"
   ```

3. **Security Audit**
   ```bash
   # Check for security vulnerabilities
   cd backend && pip-audit
   cd frontend && npm audit
   ```

### **Monthly Tasks**
1. **Performance Review**
   ```bash
   # Check container resource usage
   docker stats
   
   # Review application logs for errors
   docker logs zenith_backend --since 30d | grep ERROR
   ```

2. **Backup Verification**
   ```bash
   # Test backup restoration on staging
   # Verify backup integrity
   ```

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues**

#### **Backend Not Responding**
**Symptoms:** Health check fails, API returns 500 errors

**Diagnosis:**
```bash
# Check container status
docker ps | grep zenith_backend

# Check logs for errors
docker logs zenith_backend --tail 50

# Check resource usage
docker stats zenith_backend
```

**Solutions:**
1. **Restart container**
   ```bash
   docker restart zenith_backend
   ```

2. **Check database connection**
   ```bash
   docker exec zenith_backend python -c "from app.core.db import get_db; print('DB OK')"
   ```

3. **Verify configuration**
   ```bash
   docker exec zenith_backend env | grep DATABASE_URL
   ```

#### **Frontend Not Loading**
**Symptoms:** Browser shows 502/503 errors, blank page

**Diagnosis:**
```bash
# Check container status
docker ps | grep zenith_frontend

# Check logs
docker logs zenith_frontend --tail 50

# Check if backend is accessible
curl http://localhost:8200/health
```

**Solutions:**
1. **Rebuild frontend**
   ```bash
   docker compose build --no-cache zenith_frontend
   docker compose up -d zenith_frontend
   ```

2. **Check Node.js build**
   ```bash
   docker exec zenith_frontend npm run build
   ```

#### **Database Connection Issues**
**Symptoms:** 500 errors, "connection refused" messages

**Diagnosis:**
```bash
# Check database container
docker ps | grep zenith_db

# Test connection
docker exec zenith_db pg_isready

# Check logs
docker logs zenith_db --tail 20
```

**Solutions:**
1. **Restart database**
   ```bash
   docker restart zenith_db
   ```

2. **Check database files**
   ```bash
   docker exec zenith_db ls -la /var/lib/postgresql/data/
   ```

#### **High Memory Usage**
**Symptoms:** System slows down, OOM errors

**Diagnosis:**
```bash
# Check memory usage
free -h
docker stats

# Identify largest containers
docker ps --format "table {{.Names}}\t{{.Size}}" | sort -k2 -hr
```

**Solutions:**
1. **Clean up unused containers**
   ```bash
   docker system prune -f
   ```

2. **Increase system memory or optimize application**

---

## 🔐 **SECURITY PROCEDURES**

### **Incident Response**
1. **Security Breach Detection**
   ```bash
   # Check for unusual login attempts
   docker logs zenith_backend | grep "login failed"
   
   # Monitor API access patterns
   docker logs zenith_backend | grep "401\|403\|429"
   ```

2. **Immediate Actions**
   ```bash
   # Block suspicious IPs (configure firewall)
   # Enable maintenance mode
   # Rotate secrets
   ```

3. **Post-Incident**
   ```bash
   # Audit all user accounts
   # Review and rotate all API keys
   # Update dependencies
   ```

### **Backup Security**
```bash
# Encrypt backups
gpg --symmetric --cipher-algo AES256 backup_$(date +%Y%m%d).sql

# Store backups securely (off-site)
# Test backup restoration regularly
```

---

## 📊 **PERFORMANCE OPTIMIZATION**

### **Database Optimization**
```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_cases_created_at ON cases(created_at);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM cases WHERE status = 'active';
```

### **Application Caching**
```bash
# Check Redis usage
docker exec zenith_redis redis-cli info memory

# Clear cache if needed
docker exec zenith_redis redis-cli FLUSHALL
```

### **Container Resource Limits**
```yaml
# In docker-compose.yml, add resource limits:
services:
  zenith_backend:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
```

---

## 🔄 **DEPLOYMENT STRATEGIES**

### **Blue-Green Deployment**
1. Deploy to staging environment first
2. Run comprehensive tests
3. Switch traffic gradually
4. Monitor for issues
5. Rollback if needed

### **Rollback Procedure**
```bash
# Quick rollback to previous version
git checkout previous_stable_tag
docker compose down
docker compose up -d

# Database rollback if needed
docker exec -i zenith_db psql -U zenith_user zenith_db < backup_before_deployment.sql
```

### **Zero-Downtime Deployment**
1. Use load balancer
2. Deploy new containers
3. Health check new deployment
4. Switch traffic
5. Remove old containers

---

## 📞 **ESCALATION CONTACTS**

### **Team Contacts**
- **DevOps Lead**: [Contact Info]
- **Backend Lead**: [Contact Info]
- **Frontend Lead**: [Contact Info]
- **Security Team**: [Contact Info]

### **External Services**
- **Database Support**: [Provider Contact]
- **Cloud Provider**: [Support Contact]
- **Monitoring Service**: [Provider Contact]

---

## 📋 **CHECKLISTS**

### **Pre-Deployment Checklist**
- [ ] Code reviewed and approved
- [ ] Tests passing (unit, integration, e2e)
- [ ] Security scan completed
- [ ] Performance tests passing
- [ ] Backups verified
- [ ] Rollback plan prepared
- [ ] Team notified of deployment
- [ ] Documentation updated

### **Post-Deployment Checklist**
- [ ] Health checks passing
- [ ] Monitoring alerts verified
- [ ] Smoke tests completed
- [ ] Performance metrics collected
- [ ] User feedback gathered
- [ ] Incident report prepared (if issues)

---

## 🔄 **AUTOMATION SCRIPTS**

### **Automated Backup**
```bash
#!/bin/bash
# backup_database.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
mkdir -p $BACKUP_DIR

docker exec zenith_db pg_dump -U zenith_user zenith_db > "$BACKUP_DIR/backup_$DATE.sql"
gzip "$BACKUP_DIR/backup_$DATE.sql"

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
```

### **Health Check Cron Job**
```bash
# Add to crontab: */5 * * * * /path/to/health_check.sh
*/5 * * * * /path/to/scripts/production_monitor.sh check >> /var/log/zenith_health.log 2>&1
```

---

## 📚 **ADDITIONAL RESOURCES**

### **Documentation**
- [API Documentation](http://localhost:8200/docs)
- [Architecture Overview](./docs/ARCHITECTURE.md)
- [Security Guidelines](./docs/SECURITY.md)

### **Tools**
- [Monitoring Dashboard](./scripts/production_monitor.sh)
- [Database Migration Tools](./backend/alembic/)
- [Performance Profiling](./docs/PERFORMANCE.md)

---

*This runbook is a living document. Please update it with lessons learned from each deployment and incident.*

**Last Updated**: 2026-01-31  
**Version**: 1.0.0  
**Maintainers**: DevOps Team