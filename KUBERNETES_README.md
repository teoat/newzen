# ☸️ Kubernetes Deployment Guide (Local)

This project is configured for deployment on a local Kubernetes cluster (e.g., Docker Desktop, Minikube, Kind).

## 📂 Configuration Files

- **Application Changes**:
  - `frontend/Dockerfile.prod`: Multi-stage build for Next.js production.
  - `backend/Dockerfile.prod`: Streamlined Python runner for FastAPI.

- **Infrastructure (`/k8s`)**:
  - `01-infrastructure.yaml`: Namespace, Postgres (Stateful), Secrets, PVC.
  - `02-backend.yaml`: Backend Deployment & Service.
  - `03-frontend.yaml`: Frontend Deployment & Service (LoadBalancer).

## 🚀 How to Deploy

### 1. Prerequisites

- Docker installed and running.
- Kubernetes enabled (e.g., in Docker Desktop settings).
- `kubectl` installed and configured to point to your local cluster.

### 2. Auto-Deploy Script

Run the helper script which builds the production images and applies all manifests:

```bash
./deploy-local-k8s.sh
```

### 3. Verification

Check the status of your pods:

```bash
kubectl get pods -n zenith-lite
```

### 4. Accessing Services

Likely urls (dependent on your local K8s provider):

- **Frontend**: <http://localhost:3200>
- **Backend API**: <http://localhost:8200>

*Note: If services are stuck in "Pending", ensure you have Port Forwarding running:*

```bash
kubectl port-forward svc/frontend -n zenith-lite 3200:3000
kubectl port-forward svc/backend -n zenith-lite 8200:8000
```
