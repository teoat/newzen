#!/bin/bash
set -e

echo "🔌 ZENITH LITE - CONNECT & ACCESS"
echo "================================================"
echo "⏳ Waiting for cluster API to respond (it may be busy loading images)..."

# 1. Wait for Cluster API
until kubectl get nodes &> /dev/null; do
    echo "   ... API server not ready yet. Retrying in 5s..."
    sleep 5
done
echo "✅ Cluster API is ONLINE."

# 2. Apply Custom Frontend Settings
echo "📦 Applying updated Frontend configuration..."
kubectl apply -f k8s/03-frontend.yaml

# 3. Restart Frontend to pick up changes
echo "🔄 Restarting Frontend to refresh environment variables..."
kubectl rollout restart deployment/frontend -n zenith-lite

# 4. Wait for Frontend to be Ready
echo "⏳ Waiting for Frontend pod to be Running..."
kubectl wait --for=condition=ready pod -l app=frontend -n zenith-lite --timeout=120s || echo "⚠️  Wait timed out, but proceeding to port-forward..."

# 5. Start Port Forwarding
echo ""
echo "🔮 ESTABLISHING TUNNEL..."
echo "👉 You can access the app at: http://localhost:3200"
echo "   (Press Ctrl+C to stop the tunnel)"
echo ""
kubectl port-forward -n zenith-lite svc/frontend 3200:3000
