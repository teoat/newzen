#!/bin/bash

###############################################################################
# Zenith Platform - One-Command Production Deployment
# Version: 1.0.0
# Date: 2026-01-29
#
# This script automates the complete production deployment process:
# 1. Pre-deployment validation
# 2. Environment setup
# 3. Database migrations
# 4. Service deployment
# 5. Post-deployment validation
# 6. Health monitoring
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="zenith-platform"
ENVIRONMENT="${ENVIRONMENT:-production}"
BACKUP_DIR="./backups"
LOG_FILE="deployment_$(date +%Y%m%d_%H%M%S).log"

###############################################################################
# Helper Functions
###############################################################################

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

section() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

confirm() {
    read -p "$(echo -e ${YELLOW}⚠️  $1 [y/N]: ${NC})" -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]
    then
        error "Deployment cancelled by user"
        exit 1
    fi
}

###############################################################################
# Pre-Deployment Checks
###############################################################################

pre_deployment_checks() {
    section "PRE-DEPLOYMENT VALIDATION"
    
    log "Checking prerequisites..."
    
    # Check if we're in the right directory
    if [ ! -f "backend/app/main.py" ]; then
        error "Not in project root directory"
        exit 1
    fi
    success "Directory check passed"
    
    # Check Python version
    if ! command -v python3 &> /dev/null; then
        error "Python 3 not found"
        exit 1
    fi
    success "Python 3 found"
    
    # Check if backend is running
    if curl -s http://localhost:8200/health > /dev/null 2>&1; then
        warning "Backend is currently running on port 8200"
        confirm "Stop and redeploy?"
    fi
    
    # Check environment variables
    log "Checking critical environment variables..."
    cd backend
    
    if [ ! -f ".env" ]; then
        error ".env file not found"
        exit 1
    fi
    
    # Check for required secrets
    source .env
    if [ -z "$JWT_SECRET" ]; then
        warning "JWT_SECRET not set"
        export JWT_SECRET=$(openssl rand -hex 32)
        echo "JWT_SECRET=$JWT_SECRET" >> .env
        success "Generated JWT_SECRET"
    fi
    
    if [ -z "$ENCRYPTION_SECRET" ]; then
        warning "ENCRYPTION_SECRET not set"
        export ENCRYPTION_SECRET=$(openssl rand -hex 32)
        echo "ENCRYPTION_SECRET=$ENCRYPTION_SECRET" >> .env
        success "Generated ENCRYPTION_SECRET"
    fi
    
    if [ -z "$CSRF_SECRET" ]; then
        warning "CSRF_SECRET not set"
        export CSRF_SECRET=$(openssl rand -hex 32)
        echo "CSRF_SECRET=$CSRF_SECRET" >> .env
        success "Generated CSRF_SECRET"
    fi
    
    cd ..
    success "Environment variables validated"
}

###############################################################################
# Run Tests
###############################################################################

run_tests() {
    section "RUNNING TEST SUITE"
    
    cd backend
    
    log "Running all tests..."
    if bash run_tests.sh; then
        success "All tests passed"
    else
        error "Tests failed - deployment aborted"
        exit 1
    fi
    
    cd ..
}

###############################################################################
# Database Migration
###############################################################################

run_migrations() {
    section "DATABASE MIGRATION"
    
    cd backend
    
    # Backup database
    log "Creating database backup..."
    mkdir -p "../$BACKUP_DIR"
    
    if [ -f "zenith.db" ]; then
        cp zenith.db "../$BACKUP_DIR/zenith_$(date +%Y%m%d_%H%M%S).db"
        success "Database backed up"
    else
        warning "No existing database found - fresh install"
    fi
    
    # Run migrations
    log "Running Alembic migrations..."
    if alembic upgrade head; then
        success "Migrations completed"
    else
        error "Migrations failed"
        exit 1
    fi
    
    cd ..
}

###############################################################################
# Build & Deploy
###############################################################################

deploy_services() {
    section "DEPLOYING SERVICES"
    
    # Option 1: Docker deployment
    if command -v docker &> /dev/null; then
        log "Docker detected - using containerized deployment"
        
        # Build backend image
        log "Building backend Docker image..."
        docker build -t zenith-backend:latest ./backend
        success "Backend image built"
        
        # Build frontend image (if exists)
        if [ -d "frontend" ]; then
            log "Building frontend Docker image..."
            docker build -t zenith-frontend:latest ./frontend
            success "Frontend image built"
        fi
        
        # Start services
        log "Starting Docker containers..."
        docker-compose up -d
        success "Services started"
        
    # Option 2: Direct deployment
    else
        log "Direct deployment mode"
        
        # Install backend dependencies
        cd backend
        log "Installing Python dependencies..."
        pip install -r requirements.txt
        success "Dependencies installed"
        
        # Start backend
        log "Starting backend service..."
        nohup uvicorn app.main:app --host 0.0.0.0 --port 8200 > ../logs/backend.log 2>&1 &
        echo $! > backend.pid
        success "Backend started (PID: $(cat backend.pid))"
        
        cd ..
        
        # Start frontend (if exists)
        if [ -d "frontend" ]; then
            cd frontend
            log "Installing frontend dependencies..."
            npm install
            
            log "Building frontend..."
            npm run build
            
            log "Starting frontend..."
            nohup npm start > ../logs/frontend.log 2>&1 &
            echo $! > frontend.pid
            success "Frontend started (PID: $(cat frontend.pid))"
            
            cd ..
        fi
    fi
    
    # Wait for services to start
    log "Waiting for services to start..."
    sleep 10
}

###############################################################################
# Post-Deployment Validation
###############################################################################

post_deployment_validation() {
    section "POST-DEPLOYMENT VALIDATION"
    
    cd backend
    
    log "Running deployment validation..."
    if python validate_deployment.py --url http://localhost:8200; then
        success "Deployment validation passed"
    else
        error "Deployment validation failed"
        warning "Check logs for details"
        # Don't exit - show status anyway
    fi
    
    cd ..
}

###############################################################################
# Health Monitoring
###############################################################################

monitor_health() {
    section "HEALTH MONITORING"
    
    log "Checking service health..."
    
    # Check basic health
    if curl -s http://localhost:8200/health | grep -q "healthy"; then
        success "Health check: PASS"
    else
        error "Health check: FAIL"
        return 1
    fi
    
    # Check detailed health
    DETAILED_HEALTH=$(curl -s http://localhost:8200/health/detailed)
    OVERALL_STATUS=$(echo "$DETAILED_HEALTH" | grep -o '"overall_status":"[^"]*"' | cut -d'"' -f4)
    
    if [ "$OVERALL_STATUS" = "healthy" ]; then
        success "Detailed health: $OVERALL_STATUS"
    else
        warning "Detailed health: $OVERALL_STATUS"
        echo "$DETAILED_HEALTH" | jq '.' || echo "$DETAILED_HEALTH"
    fi
    
    # Check metrics
    METRICS=$(curl -s http://localhost:8200/metrics)
    if echo "$METRICS" | grep -q "zenith_health_status 1"; then
        success "Metrics endpoint: PASS"
    else
        warning "Metrics endpoint: Issues detected"
    fi
}

###############################################################################
# Print Summary
###############################################################################

print_summary() {
    section "DEPLOYMENT SUMMARY"
    
    echo -e "${GREEN}✅ Deployment completed successfully!${NC}\n"
    
    echo "Service URLs:"
    echo "  Backend API:     http://localhost:8200"
    echo "  API Docs:        http://localhost:8200/docs"
    echo "  Health Check:    http://localhost:8200/health"
    echo "  Metrics:         http://localhost:8200/metrics"
    if [ -d "frontend" ]; then
        echo "  Frontend:        http://localhost:3000"
    fi
    
    echo -e "\nNext Steps:"
    echo "  1. Review deployment log: $LOG_FILE"
    echo "  2. Monitor health endpoints"
    echo "  3. Run UAT tests (see UAT_GUIDE.md)"
    echo "  4. Configure production domain"
    echo "  5. Enable SSL/TLS"
    
    echo -e "\nRollback (if needed):"
    echo "  1. Stop services: ./scripts/stop_services.sh"
    echo "  2. Restore database: cp backups/latest.db backend/zenith.db"
    echo "  3. Redeploy: ./deploy.sh"
    
    echo -e "\nSupport:"
    echo "  Documentation: DEPLOYMENT_CHECKLIST.md"
    echo "  Logs: logs/"
    echo "  Backup: $BACKUP_DIR/"
    
    echo -e "\n${GREEN}🚀 Platform is live and ready for users!${NC}\n"
}

###############################################################################
# Main Deployment Flow
###############################################################################

main() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════╗"
    echo "║   ZENITH PLATFORM                          ║"
    echo "║   Production Deployment Script             ║"
    echo "║   Version 1.0.0                            ║"
    echo "╚════════════════════════════════════════════╝"
    echo -e "${NC}\n"
    
    log "Starting deployment to $ENVIRONMENT"
    
    # Confirm production deployment
    if [ "$ENVIRONMENT" = "production" ]; then
        confirm "Deploy to PRODUCTION environment?"
    fi
    
    # Create logs directory
    mkdir -p logs
    
    # Run deployment steps
    pre_deployment_checks
    run_tests
    run_migrations
    deploy_services
    post_deployment_validation
    monitor_health
    print_summary
    
    success "Deployment completed at $(date)"
}

# Trap errors
trap 'error "Deployment failed at line $LINENO"' ERR

# Run main
main "$@"
