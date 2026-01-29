# ☸️ Zenith V4: Kubernetes Pre-Deployment Checklist

Follow this protocol strictly before running `kubectl apply`.

## 1. Environment & Dependency Integrity

- [ ] **Python Parity**: Confirm `backend/requirements.txt` contains all runtime dependencies (`thefuzz`, `google-generativeai`, `psycopg2-binary`).
- [ ] **Node.js Parity**: Ensure `NEXT_PUBLIC_API_URL` uses the cluster service name or the public Ingress IP, not `localhost`.
- [ ] **Architectural Check**: verified `--platform linux/amd64` if building locally on Mac for a cloud-based Linux cluster.

## 2. Infrastructure & Resources

- [ ] **PVC Capacity**: Ensure the `postgres-pvc` has at least 2Gi available for forensic log accumulation.
- [ ] **AI Resource Quotas**: Verify `limits.memory` is set to ≥ 4Gi for the backend to handle neural inference without OOM-Kills.
- [ ] **Registry Access**: Ensure `imagePullPolicy: IfNotPresent` is set for Minikube, or `Always` for cloud registries (ECR/GCR).

## 3. Security & Secrets

- [ ] **Secret Manifest**: Confirm `zenith-secrets` contains `postgres-password` and `backend-secret-key`.
- [ ] **Volume Permissions**: Ensure the `storage/` directory in the container has write permissions (chmod 775) for forensic artifact uploads.
- [ ] **Database Connection**: Verify the `DATABASE_URL` in `02-backend.yaml` uses the internal DNS: `postgresql://zenith:<secret>@db:5432/zenith_lite`.

## 4. Operational Readiness

- [ ] **Health Probe Logic**: Ensure the backend has an active `/api/v1/health` endpoint that checks the DB connection status.
- [ ] **Migration Strategy**: Is the first-run migration script (`migrate_and_seed.py`) set up as a `K8s Job` or entrypoint? (Recommended: Run as `Job` once postgres is available).
- [ ] **Ingress Timeouts**: Increase Nginx/GCE Ingress timeouts to 300s to support deep forensic relationship scans.

## 5. Deployment Verification

- [ ] Run `kubectl get events -n zenith-lite --sort-by='.lastTimestamp'` to catch immediate failures.
- [ ] Execute `kubectl logs -l app=backend -n zenith-lite` to monitor the Uvicorn initialization.
