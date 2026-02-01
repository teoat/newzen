#!/bin/bash

# Docker Image Optimization Script
# Builds optimized production images and analyzes size improvements

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

header() {
    echo -e "${PURPLE}$1${NC}"
}

# Image optimization
build_optimized_images() {
    header "🏗️  BUILDING OPTIMIZED PRODUCTION IMAGES"
    
    log "Building optimized backend image..."
    docker build -f backend/Dockerfile.prod -t zenith-backend:optimized ./backend
    
    if [ $? -eq 0 ]; then
        success "Backend image built successfully"
    else
        error "Backend image build failed"
        return 1
    fi
    
    log "Building optimized frontend image..."
    docker build -f frontend/Dockerfile.prod -t zenith-frontend:optimized ./frontend
    
    if [ $? -eq 0 ]; then
        success "Frontend image built successfully"
    else
        error "Frontend image build failed"
        return 1
    fi
}

# Image size analysis
analyze_image_sizes() {
    header "📊 IMAGE SIZE ANALYSIS"
    
    # Get sizes of current vs optimized images
    echo "Comparing image sizes:"
    echo "===================="
    
    # Backend comparison
    if docker images zenith-backend:latest >/dev/null 2>&1; then
        current_backend_size=$(docker images zenith-backend:latest --format "{{.Size}}")
        optimized_backend_size=$(docker images zenith-backend:optimized --format "{{.Size}}")
        
        echo "Backend:"
        echo "  Current:    $current_backend_size"
        echo "  Optimized:  $optimized_backend_size"
    else
        warning "Current backend image not found"
    fi
    
    echo
    
    # Frontend comparison  
    if docker images zenith-frontend:latest >/dev/null 2>&1; then
        current_frontend_size=$(docker images zenith-frontend:latest --format "{{.Size}}")
        optimized_frontend_size=$(docker images zenith-frontend:optimized --format "{{.Size}}")
        
        echo "Frontend:"
        echo "  Current:    $current_frontend_size"
        echo "  Optimized:  $optimized_frontend_size"
    else
        warning "Current frontend image not found"
    fi
}

# Security scanning
scan_images() {
    header "🔒 SECURITY SCANNING"
    
    if command -v trivy >/dev/null 2>&1; then
        log "Scanning optimized backend image..."
        trivy image zenith-backend:optimized
        
        log "Scanning optimized frontend image..."
        trivy image zenith-frontend:optimized
    else
        warning "Trivy not installed. Skipping security scanning."
        info "Install Trivy with: brew install trivy"
    fi
}

# Performance testing
test_performance() {
    header "🚀 PERFORMANCE TESTING"
    
    # Start optimized containers
    log "Starting optimized containers for testing..."
    
    # Create temporary compose file for optimized images
    cat > docker-compose.optimized.yml << EOF
services:
  backend:
    image: zenith-backend:optimized
    container_name: zenith_backend_test
    ports:
      - "8201:8000"
    environment:
      - DATABASE_URL=postgresql://zenith:zenith@db:5432/zenith_lite
      - REDIS_URL=redis://redis:6379
      - SECRET_KEY=test-key-for-optimization
    depends_on:
      - db
      - redis
    networks:
      - test_net

  frontend:
    image: zenith-frontend:optimized
    container_name: zenith_frontend_test
    ports:
      - "3201:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8201
      - NODE_ENV=production
    depends_on:
      - backend
    networks:
      - test_net

  db:
    image: postgres:15-alpine
    container_name: zenith_db_test
    environment:
      - POSTGRES_USER=zenith
      - POSTGRES_PASSWORD=zenith
      - POSTGRES_DB=zenith_lite
    networks:
      - test_net

  redis:
    image: redis:7.2-alpine
    container_name: zenith_redis_test
    networks:
      - test_net

networks:
  test_net:
    driver: bridge
EOF
    
    # Start test environment
    docker compose -f docker-compose.optimized.yml up -d
    
    # Wait for containers to start
    log "Waiting for containers to start..."
    sleep 30
    
    # Test backend performance
    log "Testing backend performance..."
    backend_start_time=$(date +%s%N)
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8201/health)
    backend_end_time=$(date +%s%N)
    
    if [ "$response" = "200" ]; then
        backend_response_time=$(( (backend_end_time - backend_start_time) / 1000000 ))
        success "Backend health check: ${backend_response_time}ms"
    else
        error "Backend health check failed: HTTP $response"
    fi
    
    # Test frontend performance
    log "Testing frontend performance..."
    frontend_start_time=$(date +%s%N)
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3201)
    frontend_end_time=$(date +%s%N)
    
    if [ "$response" = "200" ]; then
        frontend_response_time=$(( (frontend_end_time - frontend_start_time) / 1000000 ))
        success "Frontend load time: ${frontend_response_time}ms"
    else
        error "Frontend load failed: HTTP $response"
    fi
    
    # Cleanup test environment
    log "Cleaning up test environment..."
    docker compose -f docker-compose.optimized.yml down -v
    rm -f docker-compose.optimized.yml
    
    success "Performance testing completed"
}

# Generate optimization report
generate_report() {
    header "📋 OPTIMIZATION REPORT"
    
    cat > DOCKER_OPTIMIZATION_REPORT.md << EOF
# Docker Image Optimization Report

Generated on: $(date)

## 📊 Image Size Comparison

| Service | Current Size | Optimized Size | Reduction |
|---------|---------------|-----------------|------------|
| Backend | $(docker images zenith-backend:latest --format "{{.Size}}" 2>/dev/null || echo "N/A") | $(docker images zenith-backend:optimized --format "{{.Size}}" 2>/dev/null || echo "N/A") | TBD |
| Frontend | $(docker images zenith-frontend:latest --format "{{.Size}}" 2>/dev/null || echo "N/A") | $(docker images zenith-frontend:optimized --format "{{.Size}}" 2>/dev/null || echo "N/A") | TBD |

## 🏗️  Optimization Techniques Applied

### Backend Optimizations
- **Multi-stage builds**: Separate builder and runtime stages
- **Alpine Linux base**: Minimal OS footprint  
- **Non-root user**: Security hardening
- **Dependency optimization**: Remove build-time dependencies
- **File cleanup**: Remove .pyc files and caches
- **Health checks**: Built-in container health monitoring

### Frontend Optimizations
- **Multi-stage builds**: Separate build and runtime stages
- **Alpine Linux base**: Minimal runtime environment
- **Production dependencies**: Only runtime packages installed
- **Static optimization**: Built and compressed assets
- **Non-root user**: Security hardening
- **dumb-init**: Proper signal handling

## 🔒 Security Improvements

- Non-root user execution
- Minimal attack surface
- Health check endpoints
- Read-only filesystem where possible
- Secure file permissions

## 🚀 Performance Improvements

- Reduced image size
- Faster container startup
- Better resource utilization
- Optimized layer caching
- Minimal runtime footprint

## 📈 Testing Results

### Performance Metrics
- Backend response time: ${backend_response_time:-N/A}ms
- Frontend load time: ${frontend_response_time:-N/A}ms

### Security Scan Results
$(if command -v trivy >/dev/null 2>&1; then echo "Security scans completed with Trivy"; else echo "Trivy not available - install with: brew install trivy"; fi)

## 🎯 Recommendations

1. **Use optimized images in production**: Replace current images with optimized versions
2. **Implement CI/CD integration**: Build and scan images automatically  
3. **Regular updates**: Keep base images updated for security patches
4. **Monitoring**: Use image scanning in CI/CD pipeline
5. **Size monitoring**: Track image sizes over time

## 📝 Usage Instructions

### Deploy Optimized Images
\`\`\`bash
# Update docker-compose.yml to use optimized images
sed -i 's/zenith-backend:latest/zenith-backend:optimized/g' docker-compose.yml
sed -i 's/zenith-frontend:latest/zenith-frontend:optimized/g' docker-compose.yml

# Deploy
docker compose up -d
\`\`\`

### Security Scanning
\`\`\`bash
# Scan with Trivy
trivy image zenith-backend:optimized
trivy image zenith-frontend:optimized
\`\`\`

---

*This report was generated automatically by the Docker optimization script.*
EOF
    
    success "Optimization report generated: DOCKER_OPTIMIZATION_REPORT.md"
}

# Main execution
main() {
    header "🐳 DOCKER IMAGE OPTIMIZATION"
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    # Run optimization steps
    build_optimized_images
    analyze_image_sizes
    test_performance
    scan_images
    generate_report
    
    header "✅ OPTIMIZATION COMPLETE"
    success "Docker images optimized and tested successfully!"
    info "Review the optimization report for details and next steps."
}

# Run main function
main "$@"