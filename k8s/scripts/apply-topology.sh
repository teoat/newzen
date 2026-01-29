#!/bin/bash
# apply-topology.sh - Apply tiered topology configuration
# Execute: bash k8s/scripts/apply-topology.sh

set -e

echo "🚀 Applying Kubernetes Tiered Topology..."
echo ""

# Step 1: Label and taint nodes
echo "📋 Step 1: Labeling and tainting nodes..."
bash "$(dirname "$0")/label-nodes.sh"
echo ""

# Step 2: Check if namespace exists
echo "🔍 Step 2: Ensuring zenith-lite namespace exists..."
kubectl create namespace zenith-lite --dry-run=client -o yaml | kubectl apply -f -
echo "   ✅ Namespace ready"
echo ""

# Step 3: Delete existing deployments (to force rescheduling)
echo "🗑️  Step 3: Deleting existing deployments for rescheduling..."
kubectl delete deployment backend -n zenith-lite --ignore-not-found=true
kubectl delete deployment frontend -n zenith-lite --ignore-not-found=true
kubectl delete deployment postgres -n zenith-lite --ignore-not-found=true
kubectl delete deployment nginx -n default --ignore-not-found=true

echo "   ⏳ Waiting for pods to terminate..."
sleep 5
echo ""

# Step 4: Apply new deployment manifests
echo "📦 Step 4: Applying new deployment manifests..."

MANIFEST_DIR="$(dirname "$0")/../manifests"

if [ -f "$MANIFEST_DIR/postgres-deployment.yaml" ]; then
    kubectl apply -f "$MANIFEST_DIR/postgres-deployment.yaml"
    echo "   ✅ PostgreSQL deployment applied"
else
    echo "   ⚠️  Warning: postgres-deployment.yaml not found"
fi

if [ -f "$MANIFEST_DIR/backend-deployment.yaml" ]; then
    kubectl apply -f "$MANIFEST_DIR/backend-deployment.yaml"
    echo "   ✅ Backend deployment applied"
else
    echo "   ⚠️  Warning: backend-deployment.yaml not found"
fi

if [ -f "$MANIFEST_DIR/frontend-deployment.yaml" ]; then
    kubectl apply -f "$MANIFEST_DIR/frontend-deployment.yaml"
    echo "   ✅ Frontend deployment applied"
else
    echo "   ⚠️  Warning: frontend-deployment.yaml not found"
fi

if [ -f "$MANIFEST_DIR/nginx-deployment.yaml" ]; then
    kubectl apply -f "$MANIFEST_DIR/nginx-deployment.yaml"
    echo "   ✅ Nginx deployment applied"
else
    echo "   ⚠️  Warning: nginx-deployment.yaml not found"
fi

echo ""

# Step 5: Wait for rollout
echo "⏳ Step 5: Waiting for deployments to be ready..."

kubectl rollout status deployment/postgres -n zenith-lite --timeout=300s || echo "   ⚠️  Postgres rollout timeout"
kubectl rollout status deployment/backend -n zenith-lite --timeout=300s || echo "   ⚠️  Backend rollout timeout"
kubectl rollout status deployment/frontend -n zenith-lite --timeout=300s || echo "   ⚠️  Frontend rollout timeout"
kubectl rollout status deployment/nginx -n default --timeout=300s || echo "   ⚠️  Nginx rollout timeout"

echo ""
echo "✅ Topology applied successfully!"
echo ""

# Step 6: Verify distribution
echo "📊 Step 6: Verifying pod distribution..."
echo ""
echo "=== ZENITH-LITE NAMESPACE ==="
kubectl get pods -n zenith-lite -o wide
echo ""
echo "=== DEFAULT NAMESPACE (Nginx) ==="
kubectl get pods -n default -o wide | grep -E "NAME|nginx" || echo "No nginx pods found"
echo ""

echo "🎯 VERIFICATION CHECKLIST:"
echo "   [ ] Backend pods should be on worker4, worker6, worker7 (COMPUTE tier)"
echo "   [ ] Frontend pods should be on worker, worker9 (EDGE tier)"
echo "   [ ] Postgres pod should be on worker2 or worker3 (DATA tier)"
echo "   [ ] Nginx pods should be on worker, worker5, or worker9 (EDGE tier)"
echo ""
echo "🔍 To view node labels:"
echo "   kubectl get nodes --show-labels | grep workload-tier"
echo ""
echo "📈 To monitor resource usage (requires metrics-server):"
echo "   kubectl top nodes"
echo "   kubectl top pods -n zenith-lite"
