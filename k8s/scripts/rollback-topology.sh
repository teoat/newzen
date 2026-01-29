#!/bin/bash
# rollback-topology.sh - Remove tiered topology configuration
# Execute: bash k8s/scripts/rollback-topology.sh

set -e

echo "⏪ Rolling back Kubernetes Tiered Topology..."
echo ""

# Step 1: Remove taints
echo "🧹 Step 1: Removing node taints..."

for node in desktop-worker desktop-worker2 desktop-worker3 desktop-worker4 \
            desktop-worker5 desktop-worker6 desktop-worker7 desktop-worker8 desktop-worker9; do
    kubectl taint nodes $node workload-tier- --ignore-not-found=true 2>/dev/null && \
        echo "   ✅ Removed taint from $node" || \
        echo "   ℹ️  No taint on $node"
done

echo ""

# Step 2: Remove labels
echo "🏷️  Step 2: Removing workload-tier labels..."

for node in desktop-worker desktop-worker2 desktop-worker3 desktop-worker4 \
            desktop-worker5 desktop-worker6 desktop-worker7 desktop-worker8 desktop-worker9; do
    kubectl label nodes $node workload-tier- --ignore-not-found=true 2>/dev/null && \
        echo "   ✅ Removed label from $node" || \
        echo "   ℹ️  No label on $node"
done

echo ""

# Step 3: Restart deployments (to allow normal scheduling)
echo "🔄 Step 3: Restarting deployments..."

kubectl rollout restart deployment/backend -n zenith-lite --ignore-not-found=true
kubectl rollout restart deployment/frontend -n zenith-lite --ignore-not-found=true
kubectl rollout restart deployment/postgres -n zenith-lite --ignore-not-found=true
kubectl rollout restart deployment/nginx -n default --ignore-not-found=true

echo ""
echo "⏳ Waiting for rollouts to complete..."

kubectl rollout status deployment/backend -n zenith-lite --timeout=300s || echo "   ⚠️  Backend rollout timeout"
kubectl rollout status deployment/frontend -n zenith-lite --timeout=300s || echo "   ⚠️  Frontend rollout timeout"
kubectl rollout status deployment/postgres -n zenith-lite --timeout=300s || echo "   ⚠️  Postgres rollout timeout"
kubectl rollout status deployment/nginx -n default --timeout=300s || echo "   ⚠️  Nginx rollout timeout"

echo ""
echo "✅ Rollback complete!"
echo ""
echo "📊 Current pod distribution:"
kubectl get pods -n zenith-lite -o wide
echo ""
echo "Note: Pods can now schedule on any worker node without tier restrictions."
