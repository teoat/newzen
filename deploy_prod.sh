#!/bin/bash
set -e

# Zenith Production Deployment Script
echo "🚀 Initializing Zenith Production Deployment..."

# 1. Validate Configuration
echo "🔍 Validating configuration..."
if [ ! -f .env ]; then
  echo "⚠️  .env file not found in root. Using default configs."
else
  source .env
fi

# 2. Build Production Images
echo "🏗️  Building optimized Docker images..."
docker-compose -f docker-compose.prod.yml build

# 3. Start Infrastructure (DB & Redis)
echo "boots  Starting database and cache..."
docker-compose -f docker-compose.prod.yml up -d db redis
echo "⏳ Waiting for database to be ready..."
sleep 10  # Simple wait, in real prod use wait-for-it

# 4. Run Database Migrations
echo "📦 Running database migrations..."
docker-compose -f docker-compose.prod.yml run --rm backend alembic upgrade head

# 5. Run Sovereign Diagnostic Suite
echo "👨‍⚖️ Running Sovereign Diagnostic Suite (Pre-flight)..."
# We run diagnostics against the newly started local backend in the container
docker-compose -f docker-compose.prod.yml run --rm backend python -m pytest tests/diagnostics/test_sovereign_gap_analysis.py -p no:cacheprovider -v

# 6. Start Application Services
echo "🚀 Launching Application (Backend + Frontend + Nginx)..."
docker-compose -f docker-compose.prod.yml up -d

echo "✅ Deployment Complete! All Sovereign Diagnostics PASSED."
echo "🌍 Access Frontend: http://localhost"
echo "🔌 Access API: http://localhost/api/docs"
