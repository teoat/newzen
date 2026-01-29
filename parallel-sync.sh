#!/bin/bash
IMAGE="zenith-backend:latest"
FRONTEND_IMAGE="zenith-frontend:latest"
echo "📦 Parallel Zenith Sync..."

echo "   - Saving backend image..."
docker save $IMAGE > backend.tar
echo "   - Saving frontend image..."
docker save $FRONTEND_IMAGE > frontend.tar

# Targeted nodes based on previous 'kubectl get pods -o wide'
TARGET_NODES="desktop-worker desktop-worker7 desktop-worker9 desktop-worker2 desktop-worker6"

echo "🚀 Loading into targeted nodes in parallel: $TARGET_NODES"

for NODE in $TARGET_NODES; do
  (
    echo "   -> Starting node $NODE..."
    docker exec -i $NODE ctr -n k8s.io images import - < backend.tar
    docker exec -i $NODE ctr -n k8s.io images import - < frontend.tar
    echo "   ✅ $NODE finished."
  ) &
done

wait
rm backend.tar frontend.tar
echo "✨ Parallel sync complete."
