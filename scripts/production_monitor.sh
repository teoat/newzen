#!/bin/bash

# 🏥 PRODUCTION MONITORING SCRIPT
# Monitors Zenith Lite production deployment

set -e

# Configuration
BACKEND_URL="http://localhost:8200"
FRONTEND_URL="http://localhost:3200"
LOG_FILE="production_monitor.log"
ALERT_THRESHOLD=3  # Number of failures before alert

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Monitoring functions
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

alert() {
    echo -e "${RED}🚨 ALERT: $1${NC}" | tee -a "$LOG_FILE"
    # Here you could add Slack, email, or other alert integrations
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

# Health checks
check_backend_health() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/health" 2>/dev/null)
    if [ "$response" = "200" ]; then
        success "Backend health check passed"
        return 0
    else
        alert "Backend health check failed (HTTP $response)"
        return 1
    fi
}

check_frontend_health() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" 2>/dev/null)
    if [ "$response" = "200" ]; then
        success "Frontend health check passed"
        return 0
    else
        alert "Frontend health check failed (HTTP $response)"
        return 1
    fi
}

check_database_connection() {
    # Check if database container is running
    if docker ps | grep -q "zenith_db.*Up"; then
        success "Database container is running"
        return 0
    else
        alert "Database container is not running"
        return 1
    fi
}

check_redis_connection() {
    # Check if Redis container is running
    if docker ps | grep -q "zenith_redis.*Up"; then
        success "Redis container is running"
        return 0
    else
        alert "Redis container is not running"
        return 1
    fi
}

check_disk_space() {
    local usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$usage" -lt 80 ]; then
        success "Disk space OK (${usage}%)"
        return 0
    else
        alert "Disk space critical (${usage}%)"
        return 1
    fi
}

check_memory_usage() {
    local memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [ "$memory_usage" -lt 90 ]; then
        success "Memory usage OK (${memory_usage}%)"
        return 0
    else
        alert "Memory usage critical (${memory_usage}%)"
        return 1
    fi
}

check_container_resources() {
    local container="$1"
    local cpu_usage=$(docker stats --no-stream --format "table {{.CPUPerc}}" "$container" | tail -n1 | sed 's/%//')
    local memory_usage=$(docker stats --no-stream --format "table {{.MemPerc}}" "$container" | tail -n1 | sed 's/%//')
    
    echo "  $container: CPU ${cpu_usage}%, Memory ${memory_usage}%"
}

# Main monitoring function
run_health_checks() {
    log "Starting health checks..."
    
    local failures=0
    
    # Basic health checks
    if ! check_backend_health; then
        ((failures++))
    fi
    
    if ! check_frontend_health; then
        ((failures++))
    fi
    
    if ! check_database_connection; then
        ((failures++))
    fi
    
    if ! check_redis_connection; then
        ((failures++))
    fi
    
    if ! check_disk_space; then
        ((failures++))
    fi
    
    if ! check_memory_usage; then
        ((failures++))
    fi
    
    # Container resource usage
    log "Container resource usage:"
    check_container_resources "zenith_backend"
    check_container_resources "zenith_frontend"
    check_container_resources "zenith_db"
    check_container_resources "zenith_redis"
    
    # API response time check
    local response_time=$(curl -o /dev/null -s -w "%{time_total}" "$BACKEND_URL/health")
    log "Backend response time: ${response_time}s"
    
    if ((failures >= ALERT_THRESHOLD)); then
        alert "Multiple critical failures detected ($failures failures)"
        return 1
    elif ((failures > 0)); then
        warning "Some issues detected ($failures failures)"
        return 0
    else
        success "All health checks passed"
        return 0
    fi
}

# System status report
generate_status_report() {
    log "Generating system status report..."
    
    echo "=== ZENITH PRODUCTION STATUS ===" | tee -a "$LOG_FILE"
    echo "Timestamp: $(date)" | tee -a "$LOG_FILE"
    echo | tee -a "$LOG_FILE"
    
    # Container status
    echo "Container Status:" | tee -a "$LOG_FILE"
    docker ps --filter "name=zenith" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | tee -a "$LOG_FILE"
    echo | tee -a "$LOG_FILE"
    
    # Recent logs
    echo "Recent Backend Logs:" | tee -a "$LOG_FILE"
    docker logs --tail 5 zenith_backend 2>&1 | tail -n 10 | tee -a "$LOG_FILE"
    echo | tee -a "$LOG_FILE"
    
    # System resources
    echo "System Resources:" | tee -a "$LOG_FILE"
    echo "Load Average: $(uptime | awk -F'load average:' '{print $2}')" | tee -a "$LOG_FILE"
    echo "Disk Usage:" | tee -a "$LOG_FILE"
    df -h | grep -E '^/dev/' | tee -a "$LOG_FILE"
    echo | tee -a "$LOG_FILE"
}

# Continuous monitoring mode
continuous_monitor() {
    log "Starting continuous monitoring..."
    while true; do
        run_health_checks
        sleep 30  # Check every 30 seconds
    done
}

# Single check mode
single_check() {
    log "Running single health check..."
    generate_status_report
    run_health_checks
}

# Help function
show_help() {
    echo "Zenith Production Monitoring Script"
    echo
    echo "Usage: $0 [OPTION]"
    echo
    echo "Options:"
    echo "  check      Run single health check"
    echo "  monitor    Run continuous monitoring"
    echo "  report     Generate status report"
    echo "  help       Show this help message"
    echo
}

# Main execution
case "${1:-check}" in
    "check")
        single_check
        ;;
    "monitor")
        continuous_monitor
        ;;
    "report")
        generate_status_report
        ;;
    "help")
        show_help
        ;;
    *)
        echo "Unknown option: $1"
        show_help
        exit 1
        ;;
esac