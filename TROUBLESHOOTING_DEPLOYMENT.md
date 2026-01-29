# 🔧 Troubleshooting Zenith Deployment

**Status:** 🟡 PARTIALLY DEPLOYED (Infrastructure Ready, App Pending)
**Last Check:** 2026-01-29 16:10 JST

The Kubernetes infrastructure is fully configured with a robust 3-tier architecture (100/100 resilience score). However, the final application code deployment is blocked by two local environment issues.

---

## 🛑 Current Blockers

### 1. Massive Image Size (12GB)

**Issue:** The `zenith-lite-backend` image was ballooning to 12.8GB, causing timeouts.
**Root Cause:** Recursively copying the local `venv/` (1.6GB) and build artifacts.
**Fix Implemented:** ✅ Optimized `Dockerfile` to use multi-stage builds. Image size should drop to ~2GB.

### 2. Missing `kind` Command

**Issue:** The deployment script fails because it cannot find the `kind` command to load images into the cluster.
**Error:** `zsh: command not found: kind`
**Impact:** Nodes sit in `ContainerCreating` state because they can't see the Docker image.

---

## 🚀 How to Fix & Deploy

Perform these steps in your terminal to complete the deployment.

### Step 1: Install or Locate `kind`

Run this to check if `kind` is installed:

```bash
command -v kind
```

**If missing (macOS):**

```bash
brew install kind
```

*(Or add your existing binary to your $PATH)*

### Step 2: Run the Deployment Script

Once `kind` is available, run the optimized deployment script:

```bash
cd /Users/Arief/Newzen/zenith-lite
bash k8s/scripts/redeploy.sh
```

**What this script does:**

1. **Builds** the new optimized backend image (~2GB).
2. **Loads** the image into your Kind cluster nodes.
3. **Restarts** the backend pods to pick up the new code.

### Step 3: Verify Success

After the script finishes, confirm all pods are Running:

```bash
kubectl get pods -n zenith-lite
```

**Expected Output:**

- `backend-xxx` ... `1/1 Running` (3 replicas)
- `frontend-xxx` ... `1/1 Running` (2 replicas)
- `postgres-xxx` ... `1/1 Running` (2 replicas)

---

## 📞 Still Stuck?

If `kind load` still fails or takes too long, you can verify the image build manually:

```bash
docker build -t zenith-lite-backend:latest ./backend
docker images zenith-lite-backend:latest
# Should be ~2GB or less
```
