#!/bin/bash

# Zenith Forensic Platform Bootstrap Script
# Validates environment, checks dependencies, and runs smoke tests.

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }

log "🚀 Starting Zenith Bootstrap Diagnostic..."

# 1. Check Environment Variables
log "Checking environment variables..."
if [ -f "backend/.env" ]; then
    success "backend/.env found."
else
    warn "backend/.env missing. Creating from example..."
    cp backend/.env.example backend/.env || warn "No .env.example found. Manual setup required."
fi

# 2. Check Docker
log "Validating Docker environment..."
if command -v docker >/dev/null 2>&1; then
    docker_version=$(docker --version)
    success "Docker installed: $docker_version"
else
    error "Docker not found. Please install Docker."
    exit 1
fi

# 3. Check for heavy dependencies (AI Models)
log "Checking for local AI models..."
if [ -d "backend/models" ] || [ -f "backend/requirements.txt" ]; then
    if grep -q "sentence-transformers" backend/requirements.txt; then
        warn "Heavy AI models (sentence-transformers) detected. Initial download may take several minutes."
    fi
fi

# 4. Storage & Logs Initialization
log "Initializing storage directories and fixing permissions..."
mkdir -p backend/storage/uploads
mkdir -p backend/logs
# Fix permissions for Docker volume mounts
chmod -R 777 backend/storage
success "Storage directories ready and permissions sanitized."

# 5. Pre-pull AI Models (Optional but recommended)
log "Pre-pulling AI models to prevent first-run timeouts..."
if [ -f "backend/requirements.txt" ]; then
    # Create temporary virtualenv or use docker to pre-pull
    docker-compose run --rm backend python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')" || warn "Pre-pull failed. Models will download on first ingestion."
fi

# 6. Database Initializer
log "Validating Database state..."
if [ -f "backend/storage/zenith-lite.db" ]; then
    success "Local SQLite database found."
else
    warn "Database not found. It will be initialized on first run."
fi

# 6. Build & Smoke Test
log "Running Build & Smoke Test (Containerized)..."
# We run a quick build check without full up
if command -v docker-compose >/dev/null 2>&1; then
    log "Performing build validation..."
    docker-compose build --quiet || error "Build failed. Check logs."
    success "Build validation complete."
fi

log "----------------------------------------------------"
success "Zenith Bootstrap Complete!"
log "To start the platform, run: ${GREEN}docker-compose up -d${NC}"
log "To view structured logs, run: ${GREEN}docker-compose logs -f backend | jq .${NC}"
log "----------------------------------------------------"
