#!/bin/bash
IMAGE="zenith-backend:latest"
FRONTEND_IMAGE="zenith-frontend:latest"
echo "📦 Zenith Cloud Bridge: Loading images into Kind nodes..."

# Save images to stdout and pipe to docker exec to avoid large intermediate files on disk if possible, 
# but piping to multiple nodes is hard. So we save to a temporary file.

echo "   - Saving backend image (this may take a minute)..."
docker save $IMAGE > backend.tar

echo "   - Saving frontend image..."
docker save $FRONTEND_IMAGE > frontend.tar

NODES=$(docker ps --format '{{.Names}}' | grep desktop)

for NODE in $NODES; do
  echo "🚀 Loading into $NODE..."
  docker exec -i $NODE ctr -n k8s.io images import - < backend.tar
  docker exec -i $NODE ctr -n k8s.io images import - < frontend.tar
done

rm backend.tar frontend.tar
echo "✅ Done. Images are synchronized."
