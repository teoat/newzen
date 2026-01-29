#!/bin/bash
# redeploy.sh - Production-Grade Local Redeployment Pipeline
# Usage: ./k8s/scripts/redeploy.sh

set -euo pipefail

# --- CONFIGURATION ---
CLUSTER_NAME="desktop"
NAMESPACE="zenith-lite"
BACKEND_IMAGE="zenith-lite-backend:latest"
FRONTEND_IMAGE="zenith-lite-frontend:latest"

# --- UTILS ---
log() { echo -e "\033[1;34m[INFO]\033[0m $1"; }
warn() { echo -e "\033[1;33m[WARN]\033[0m $1"; }
err() { echo -e "\033[1;31m[ERROR]\033[0m $1"; exit 1; }

# --- PHASE 1: PRE-FLIGHT CHECK ---
log "Starting Zenith Lite Redeployment..."

# Ensure we are in the project root
if [[ ! -d "k8s" || ! -d "frontend" || ! -d "backend" ]]; then
    err "Must be run from project root."
fi

# Check dependencies
command -v kubectl >/dev/null || err "kubectl not installed"
command -v docker >/dev/null || err "docker not installed"

# --- PHASE 2: BUILD ARTIFACTS ---
log "Building Docker Images..."
docker build -t "$BACKEND_IMAGE" ./backend || err "Backend build failed"
docker build -t "$FRONTEND_IMAGE" -f frontend/Dockerfile.prod ./frontend || err "Frontend build failed"

# --- PHASE 3: TRANSPORT ---
if command -v kind >/dev/null; then
    if kind get clusters | grep -q "^${CLUSTER_NAME}$"; then
        log "Loading images into Kind cluster '${CLUSTER_NAME}'..."
        kind load docker-image "$BACKEND_IMAGE" --name "$CLUSTER_NAME"
        kind load docker-image "$FRONTEND_IMAGE" --name "$CLUSTER_NAME"
    else
        warn "Cluster '${CLUSTER_NAME}' not found. Skipping image load."
    fi
else
    warn "'kind' not found. Skipping image load."
fi

# --- PHASE 4: APPLY MUTATIONS ---
log "Applying Kubernetes Manifests..."

# Infrastructure & App
kubectl apply -f k8s/01-infrastructure.yaml
kubectl apply -f k8s/02-backend.yaml
kubectl apply -f k8s/03-frontend.yaml

# Database Migrations (Critical)
log "Triggering Database Migration..."
kubectl delete job zenith-migration -n "$NAMESPACE" --ignore-not-found=true >/dev/null
kubectl apply -f k8s/04-migration.yaml

# --- PHASE 5: RESTART & VERIFY ---
log "Rolling restart to pick up new images..."
kubectl rollout restart deployment/backend -n "$NAMESPACE"
kubectl rollout restart deployment/frontend -n "$NAMESPACE"

log "Waiting for stability..."
kubectl rollout status deployment/backend -n "$NAMESPACE" --timeout=120s
kubectl rollout status deployment/frontend -n "$NAMESPACE" --timeout=120s

echo ""
echo -e "\033[1;32m✅ DEPLOYMENT COMPLETE \033[0m"
echo -e "   Namespace: $NAMESPACE"
echo -e "   Access:    http://localhost:3200 (Requires port-forward)"
echo -e "   CMD:       kubectl port-forward -n $NAMESPACE svc/frontend 3200:3000"
