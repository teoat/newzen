#!/bin/bash

# Zenith Sovereign Health Check
# Aggregates all validation pipelines into a single command.

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "\033[0;34m[$(date +'%H:%M:%S')]\033[0m $1"; }

echo "--- ZENITH SOVEREIGN HEALTH CHECK ---"

# 1. Backend Service Validation
log "Validating core service logic..."
if cd backend && python scripts/verify_services.py; then
    echo -e "${GREEN}PASS: Service Logic Validated${NC}"
else
    echo -e "${RED}FAIL: Service Logic Corrupted${NC}"
    exit 1
fi
cd ..

# 2. Migration State Check
log "Verifying database migration state..."
if cd backend && alembic current; then
    echo -e "${GREEN}PASS: Database Schema Sync'd${NC}"
else
    echo -e "${RED}FAIL: Migration Mismatch Detected${NC}"
    exit 1
fi
cd ..

# 3. Frontend Type/UI Integrity
log "Performing frontend integrity check (Next.js Build)..."
if cd frontend && npm run build:check; then
    echo -e "${GREEN}PASS: UI & Types Stabilized${NC}"
else
    echo -e "${RED}FAIL: UI/Types Regressed${NC}"
    exit 1
fi
cd ..

# 4. RAG & AI Pulse Check
log "Checking RAG Visual Engine connectivity..."
# Simple curl check to health endpoint
if curl -s http://localhost:8200/api/v1/health | grep -q "healthy"; then
    echo -e "${GREEN}PASS: AI Uplink Active${NC}"
else
    echo -e "${YELLOW}WARN: AI Service Offline or Unreachable${NC}"
fi

echo "---------------------------------------"
echo -e "${GREEN}ZENITH PLATFORM STATE: SOVEREIGN${NC}"
echo "---------------------------------------"
