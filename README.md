# Zenith Lite: Forensic Intelligence Platform

**Zenith Lite** is an autonomous AI-driven forensic analysis system designed to ingest, audit, and reconcile financial data with minimal human intervention.

## Quick Start

```bash
docker-compose up -d
```

Access the application at http://localhost:3200

## Monitoring Stack

Zenith Lite includes a complete monitoring stack with Prometheus, Grafana, and Alertmanager.

### Access URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Prometheus | http://localhost:9090 | No auth required |
| Grafana | http://localhost:3100 | admin/admin |
| Alertmanager | http://localhost:9093 | No auth required |

### Initial Setup

1. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Configure environment variables** in `.env`:
   - Set `SLACK_WEBHOOK_URL` for Slack notifications
   - Set `SENTRY_*` variables for error tracking
   - Configure `GRAFANA_API_KEY` for API access

3. **Start monitoring services:**
   ```bash
   docker-compose up -d prometheus grafana alertmanager
   ```

### Grafana Dashboard Import

1. Access Grafana at http://localhost:3100
2. Login with credentials: `admin` / `admin`
3. Navigate to **Dashboards** → **Import**
4. Import dashboards from:
   - `grafana/dashboards/` (local dashboards)
   - Grafana.com (search for "Node" or "PostgreSQL")

### Key Dashboards

Recommended dashboards to import:
- **Node Exporter Full** - System metrics (ID: 1860)
- **PostgreSQL Overview** - Database metrics (ID: 9628)
- **Redis Dashboard** - Cache metrics (ID: 763)

### Alert Configuration

Alerts are configured in `prometheus/rules/alert_rules.yml` and routed via `alertmanager/alertmanager.yml`.

Default alert routes:
- **Critical** → PagerDuty/Slack
- **Warning** → Slack only

### Custom Metrics

The frontend exposes custom metrics at `/api/metrics`:
- HTTP request duration
- Error rates
- Business process metrics

### Stopping Services

```bash
docker-compose down
docker-compose down -v  # Also remove volumes
```
