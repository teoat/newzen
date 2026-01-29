#!/bin/bash
set -e

echo "🚀 Zenith V5: Local Kubernetes Deployment (Setup & Deploy)"
echo "========================================================"

# Check for kubectl
if ! command -v kubectl &> /dev/null; then
    echo "❌ Error: kubectl is not installed."
    exit 1
fi

# Build Images
echo "📦 Building Docker images..."
echo "   - Building Backend (zenith-lite-backend:latest) [Optimized]..."
docker build -t zenith-lite-backend:latest ./backend

echo "   - Building Frontend (zenith-lite-frontend:latest) [Production]..."
docker build -t zenith-lite-frontend:latest -f frontend/Dockerfile.prod frontend/

# If using Kind, load images (optional logic if user wants to use this script for Kind)
if command -v kind &> /dev/null; then
    echo "🚚 Loading images into Kind (desktop)..."
    kind load docker-image zenith-lite-backend:latest --name desktop
    kind load docker-image zenith-lite-frontend:latest --name desktop
else
     echo "⚠️  Kind not found. If using Minikube, remember to load images manually or use eval \$(minikube docker-env)"
fi

# Apply Manifests
echo "☸️  Applying Kubernetes manifests..."
kubectl apply -f k8s/01-infrastructure.yaml
kubectl apply -f k8s/02-backend.yaml
kubectl apply -f k8s/03-frontend.yaml

# Run Migration Job
echo "🔄 Running Database Migration..."
kubectl delete job zenith-migration -n zenith-lite --ignore-not-found=true
kubectl apply -f k8s/04-migration.yaml

echo "========================================"
echo "✅ Deployment requested."
echo ""
echo "🔍 Status Check:"
echo "   kubectl get pods -n zenith-lite"
echo ""
echo "🔌 Port Forwarding (Recommended for Local Access):"
echo "   Backend:  kubectl port-forward svc/backend -n zenith-lite 8200:8000"
echo "   Frontend: kubectl port-forward svc/frontend -n zenith-lite 3200:3000"
echo ""
