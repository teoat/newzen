#!/bin/bash

# Automated Health Check System
# Provides comprehensive health monitoring with alerting

set -e

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:8200}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3200}"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
EMAIL_RECIPIENT="${EMAIL_RECIPIENT:-}"
CHECK_INTERVAL="${CHECK_INTERVAL:-300}"  # 5 minutes
LOG_FILE="${LOG_FILE:-health_checks.log}"
METRICS_FILE="${METRICS_FILE:-health_metrics.json}"
ALERT_THRESHOLD="${ALERT_THRESHOLD:-3}"  # Consecutive failures before alert

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Global variables
consecutive_failures=0
last_status="healthy"

# Logging functions
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}" | tee -a "$LOG_FILE"
}

# Alert functions
send_slack_alert() {
    local message="$1"
    local color="$2"  # good, warning, danger
    
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-type: application/json' \
            --data "{
                \"text\": \"🏥 Zenith Health Alert\",
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"text\": \"$message\",
                    \"ts\": $(date +%s)
                }]
            }" >/dev/null 2>&1 || log "Failed to send Slack alert"
    fi
}

send_email_alert() {
    local subject="$1"
    local message="$2"
    
    if [ -n "$EMAIL_RECIPIENT" ]; then
        echo "$message" | mail -s "$subject" "$EMAIL_RECIPIENT" 2>/dev/null || log "Failed to send email alert"
    fi
}

send_alert() {
    local severity="$1"
    local message="$2"
    
    case $severity in
        "critical")
            send_slack_alert "$message" "danger"
            send_email_alert "🚨 CRITICAL: Zenith Health Alert" "$message"
            ;;
        "warning")
            send_slack_alert "$message" "warning"
            send_email_alert "⚠️ WARNING: Zenith Health Alert" "$message"
            ;;
        "info")
            send_slack_alert "$message" "good"
            ;;
    esac
}

# Health check functions
check_backend_health() {
    local url="$BACKEND_URL/health"
    local start_time=$(date +%s%N)
    
    response=$(curl -s -o /dev/null -w "%{http_code};%{time_total}" "$url" 2>/dev/null)
    local curl_exit_code=$?
    
    if [ $curl_exit_code -eq 0 ]; then
        local http_code=$(echo "$response" | cut -d';' -f1)
        local response_time=$(echo "$response" | cut -d';' -f2)
        
        if [ "$http_code" = "200" ]; then
            echo "healthy;${response_time}"
            return 0
        else
            echo "unhealthy;0;HTTP $http_code"
            return 1
        fi
    else
        echo "unhealthy;0;Connection failed"
        return 1
    fi
}

check_frontend_health() {
    local url="$FRONTEND_URL"
    local start_time=$(date +%s%N)
    
    response=$(curl -s -o /dev/null -w "%{http_code};%{time_total}" "$url" 2>/dev/null)
    local curl_exit_code=$?
    
    if [ $curl_exit_code -eq 0 ]; then
        local http_code=$(echo "$response" | cut -d';' -f1)
        local response_time=$(echo "$response" | cut -d';' -f2)
        
        if [ "$http_code" = "200" ]; then
            echo "healthy;${response_time}"
            return 0
        else
            echo "unhealthy;0;HTTP $http_code"
            return 1
        fi
    else
        echo "unhealthy;0;Connection failed"
        return 1
    fi
}

check_database_health() {
    local container="zenith_db"
    
    if docker ps --format "{{.Names}}" | grep -q "^${container}$"; then
        # Check if container is healthy
        local health=$(docker inspect --format "{{.State.Health.Status}}" "$container" 2>/dev/null)
        
        if [ "$health" = "healthy" ] || [ -z "$health" ]; then
            echo "healthy"
            return 0
        else
            echo "unhealthy;Container health: $health"
            return 1
        fi
    else
        echo "unhealthy;Container not running"
        return 1
    fi
}

check_redis_health() {
    local container="zenith_redis"
    
    if docker ps --format "{{.Names}}" | grep -q "^${container}$"; then
        # Test Redis connection
        if docker exec "$container" redis-cli ping >/dev/null 2>&1; then
            echo "healthy"
            return 0
        else
            echo "unhealthy;Redis ping failed"
            return 1
        fi
    else
        echo "unhealthy;Container not running"
        return 1
    fi
}

check_disk_space() {
    local usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$usage" -lt 80 ]; then
        echo "healthy;${usage}%"
        return 0
    elif [ "$usage" -lt 90 ]; then
        echo "warning;${usage}%"
        return 1
    else
        echo "critical;${usage}%"
        return 2
    fi
}

check_memory_usage() {
    local usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    
    if [ "$usage" -lt 80 ]; then
        echo "healthy;${usage}%"
        return 0
    elif [ "$usage" -lt 90 ]; then
        echo "warning;${usage}%"
        return 1
    else
        echo "critical;${usage}%"
        return 2
    fi
}

check_container_resources() {
    local container="$1"
    
    if docker ps --format "{{.Names}}" | grep -q "^${container}$"; then
        local stats=$(docker stats --no-stream --format "table {{.CPUPerc}};{{.MemPerc}}" "$container")
        local cpu_usage=$(echo "$stats" | tail -n1 | cut -d';' -f1 | sed 's/%//')
        local mem_usage=$(echo "$stats" | tail -n1 | cut -d';' -f2 | sed 's/%//')
        
        # Check if usage is reasonable
        if (( $(echo "$cpu_usage > 90" | bc -l) )); then
            echo "warning;CPU ${cpu_usage}%, Memory ${mem_usage}%"
            return 1
        elif (( $(echo "$mem_usage > 90" | bc -l) )); then
            echo "warning;CPU ${cpu_usage}%, Memory ${mem_usage}%"
            return 1
        else
            echo "healthy;CPU ${cpu_usage}%, Memory ${mem_usage}%"
            return 0
        fi
    else
        echo "unhealthy;Container not running"
        return 1
    fi
}

# Metrics collection
record_metrics() {
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local backend_result=$(check_backend_health)
    local frontend_result=$(check_frontend_health)
    local db_result=$(check_database_health)
    local redis_result=$(check_redis_health)
    local disk_result=$(check_disk_space)
    local memory_result=$(check_memory_usage)
    
    # Extract values
    local backend_status=$(echo "$backend_result" | cut -d';' -f1)
    local backend_time=$(echo "$backend_result" | cut -d';' -f2)
    local frontend_status=$(echo "$frontend_result" | cut -d';' -f1)
    local frontend_time=$(echo "$frontend_result" | cut -d';' -f2)
    local db_status=$(echo "$db_result" | cut -d';' -f1)
    local redis_status=$(echo "$redis_result" | cut -d';' -f1)
    local disk_status=$(echo "$disk_result" | cut -d';' -f1)
    local disk_usage=$(echo "$disk_result" | cut -d';' -f2)
    local memory_status=$(echo "$memory_result" | cut -d';' -f1)
    local memory_usage=$(echo "$memory_result" | cut -d';' -f2)
    
    # Create metrics entry
    local metrics_entry="{
        \"timestamp\": \"$timestamp\",
        \"backend\": {
            \"status\": \"$backend_status\",
            \"response_time_ms\": $backend_time
        },
        \"frontend\": {
            \"status\": \"$frontend_status\",
            \"response_time_ms\": $frontend_time
        },
        \"database\": {
            \"status\": \"$db_status\"
        },
        \"redis\": {
            \"status\": \"$redis_status\"
        },
        \"disk\": {
            \"status\": \"$disk_status\",
            \"usage_percent\": $disk_usage
        },
        \"memory\": {
            \"status\": \"$memory_status\",
            \"usage_percent\": $memory_usage
        }
    }"
    
    # Write to metrics file
    if [ ! -f "$METRICS_FILE" ]; then
        echo "[]" > "$METRICS_FILE"
    fi
    
    # Append to metrics array (simple approach)
    temp_file=$(mktemp)
    jq ". + [$metrics_entry]" "$METRICS_FILE" > "$temp_file" && mv "$temp_file" "$METRICS_FILE" 2>/dev/null || {
        # Fallback if jq not available
        echo "$metrics_entry" >> "${METRICS_FILE}.raw"
    }
    
    return 0
}

# Main health check
perform_health_check() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local overall_status="healthy"
    
    # Run all checks
    log "Starting comprehensive health check..."
    
    # Backend check
    backend_result=$(check_backend_health)
    backend_status=$(echo "$backend_result" | cut -d';' -f1)
    backend_time=$(echo "$backend_result" | cut -d';' -f2)
    
    if [ "$backend_status" = "healthy" ]; then
        success "Backend: Healthy (${backend_time}ms)"
    else
        error "Backend: Unhealthy $(echo "$backend_result" | cut -d';' -f3-)"
        overall_status="unhealthy"
    fi
    
    # Frontend check
    frontend_result=$(check_frontend_health)
    frontend_status=$(echo "$frontend_result" | cut -d';' -f1)
    frontend_time=$(echo "$frontend_result" | cut -d';' -f2)
    
    if [ "$frontend_status" = "healthy" ]; then
        success "Frontend: Healthy (${frontend_time}ms)"
    else
        error "Frontend: Unhealthy $(echo "$frontend_result" | cut -d';' -f3-)"
        overall_status="unhealthy"
    fi
    
    # Database check
    db_result=$(check_database_health)
    db_status=$(echo "$db_result" | cut -d';' -f1)
    
    if [ "$db_status" = "healthy" ]; then
        success "Database: Healthy"
    else
        error "Database: Unhealthy - $(echo "$db_result" | cut -d';' -f2-)"
        overall_status="unhealthy"
    fi
    
    # Redis check
    redis_result=$(check_redis_health)
    redis_status=$(echo "$redis_result" | cut -d';' -f1)
    
    if [ "$redis_status" = "healthy" ]; then
        success "Redis: Healthy"
    else
        error "Redis: Unhealthy - $(echo "$redis_result" | cut -d';' -f2-)"
        overall_status="unhealthy"
    fi
    
    # System resource checks
    disk_result=$(check_disk_space)
    disk_status=$(echo "$disk_result" | cut -d';' -f1)
    disk_usage=$(echo "$disk_result" | cut -d';' -f2)
    
    if [ "$disk_status" = "healthy" ]; then
        success "Disk: OK (${disk_usage} usage)"
    elif [ "$disk_status" = "warning" ]; then
        warning "Disk: Warning (${disk_usage} usage)"
        overall_status="warning"
    else
        error "Disk: Critical (${disk_usage} usage)"
        overall_status="critical"
    fi
    
    memory_result=$(check_memory_usage)
    memory_status=$(echo "$memory_result" | cut -d';' -f1)
    memory_usage=$(echo "$memory_result" | cut -d';' -f2)
    
    if [ "$memory_status" = "healthy" ]; then
        success "Memory: OK (${memory_usage} usage)"
    elif [ "$memory_status" = "warning" ]; then
        warning "Memory: Warning (${memory_usage} usage)"
        overall_status="warning"
    else
        error "Memory: Critical (${memory_usage} usage)"
        overall_status="critical"
    fi
    
    # Record metrics
    record_metrics
    
    # Handle consecutive failures
    if [ "$overall_status" = "healthy" ]; then
        if [ "$consecutive_failures" -gt 0 ]; then
            send_alert "info" "✅ Zenith system is back to normal operation"
            log "System recovered after $consecutive_failures consecutive failures"
        fi
        consecutive_failures=0
        last_status="healthy"
    else
        ((consecutive_failures++))
        
        if [ "$consecutive_failures" -ge "$ALERT_THRESHOLD" ]; then
            local alert_message="🚨 Zenith System Alert - Status: $overall_status
Backend: $backend_status (${backend_time}ms)
Frontend: $frontend_status (${frontend_time}ms) 
Database: $db_status
Redis: $redis_status
Disk: $disk_usage
Memory: $memory_usage
Consecutive failures: $consecutive_failures"

            if [ "$last_status" != "alerted" ]; then
                send_alert "critical" "$alert_message"
                last_status="alerted"
            fi
        fi
    fi
    
    # Summary
    echo
    log "Health Check Summary - Status: $overall_status, Consecutive Failures: $consecutive_failures"
    
    return 0
}

# Continuous monitoring
start_monitoring() {
    log "Starting continuous health monitoring (interval: ${CHECK_INTERVAL}s)"
    
    while true; do
        perform_health_check
        sleep "$CHECK_INTERVAL"
    done
}

# Generate health dashboard
generate_dashboard() {
    local html_file="health_dashboard.html"
    
    cat > "$html_file" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zenith Health Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: #2c3e50; color: white; padding: 20px; text-align: center; margin-bottom: 20px; }
        .status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .status-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .status-healthy { border-left: 5px solid #27ae60; }
        .status-warning { border-left: 5px solid #f39c12; }
        .status-critical { border-left: 5px solid #e74c3c; }
        .metric { margin: 10px 0; }
        .metric-label { font-weight: bold; color: #7f8c8d; }
        .metric-value { font-size: 1.2em; color: #2c3e50; }
        .timestamp { text-align: center; color: #7f8c8d; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 Zenith Health Dashboard</h1>
            <div id="last-update">Loading...</div>
        </div>
        <div class="status-grid">
            <div class="status-card" id="backend-status">
                <h3>🔧 Backend API</h3>
                <div class="metric">
                    <div class="metric-label">Status:</div>
                    <div class="metric-value" id="backend-status-value">Loading...</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Response Time:</div>
                    <div class="metric-value" id="backend-response-time">Loading...</div>
                </div>
            </div>
            <div class="status-card" id="frontend-status">
                <h3>🌐 Frontend</h3>
                <div class="metric">
                    <div class="metric-label">Status:</div>
                    <div class="metric-value" id="frontend-status-value">Loading...</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Load Time:</div>
                    <div class="metric-value" id="frontend-response-time">Loading...</div>
                </div>
            </div>
            <div class="status-card" id="database-status">
                <h3>🗄️ Database</h3>
                <div class="metric">
                    <div class="metric-label">Status:</div>
                    <div class="metric-value" id="database-status-value">Loading...</div>
                </div>
            </div>
            <div class="status-card" id="redis-status">
                <h3>⚡ Redis Cache</h3>
                <div class="metric">
                    <div class="metric-label">Status:</div>
                    <div class="metric-value" id="redis-status-value">Loading...</div>
                </div>
            </div>
            <div class="status-card" id="disk-status">
                <h3>💾 Disk Usage</h3>
                <div class="metric">
                    <div class="metric-label">Status:</div>
                    <div class="metric-value" id="disk-status-value">Loading...</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Usage:</div>
                    <div class="metric-value" id="disk-usage">Loading...</div>
                </div>
            </div>
            <div class="status-card" id="memory-status">
                <h3>🧠 Memory Usage</h3>
                <div class="metric">
                    <div class="metric-label">Status:</div>
                    <div class="metric-value" id="memory-status-value">Loading...</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Usage:</div>
                    <div class="metric-value" id="memory-usage">Loading...</div>
                </div>
            </div>
        </div>
        <div class="timestamp" id="refresh-time">Auto-refresh every 30 seconds</div>
    </div>

    <script>
        async function updateDashboard() {
            try {
                const response = await fetch('./health_metrics.json');
                const metrics = await response.json();
                const latest = metrics[metrics.length - 1];
                
                if (!latest) return;
                
                // Update backend
                updateStatus('backend', latest.backend.status, latest.backend.response_time_ms + 'ms');
                
                // Update frontend
                updateStatus('frontend', latest.frontend.status, latest.frontend.response_time_ms + 'ms');
                
                // Update database
                updateStatus('database', latest.database.status, '');
                
                // Update Redis
                updateStatus('redis', latest.redis.status, '');
                
                // Update disk
                updateStatus('disk', latest.disk.status, latest.disk.usage_percent);
                
                // Update memory
                updateStatus('memory', latest.memory.status, latest.memory.usage_percent);
                
                // Update timestamp
                document.getElementById('last-update').textContent = 'Last updated: ' + new Date(latest.timestamp).toLocaleString();
                
            } catch (error) {
                console.error('Failed to load metrics:', error);
            }
        }
        
        function updateStatus(component, status, value) {
            const statusElement = document.getElementById(component + '-status');
            const statusValueElement = document.getElementById(component + '-status-value');
            const valueElement = document.getElementById(component + '-value') || 
                              document.getElementById(component + '-usage') ||
                              document.getElementById(component + '-response-time');
            
            statusElement.className = 'status-card status-' + status;
            statusValueElement.textContent = status.charAt(0).toUpperCase() + status.slice(1);
            
            if (value && valueElement) {
                valueElement.textContent = value;
            }
        }
        
        // Initial load
        updateDashboard();
        
        // Auto-refresh every 30 seconds
        setInterval(updateDashboard, 30000);
    </script>
</body>
</html>
EOF
    
    success "Health dashboard generated: $html_file"
    info "Open http://localhost:8000/health_dashboard.html to view (if serving from project root)"
}

# Help function
show_help() {
    echo "Zenith Health Monitoring System"
    echo
    echo "Usage: $0 [COMMAND]"
    echo
    echo "Commands:"
    echo "  check      Run single health check"
    echo "  monitor    Start continuous monitoring"
    echo "  dashboard  Generate HTML health dashboard"
    echo "  help       Show this help"
    echo
    echo "Environment Variables:"
    echo "  BACKEND_URL           Backend health check URL (default: http://localhost:8200)"
    echo "  FRONTEND_URL          Frontend health check URL (default: http://localhost:3200)"
    echo "  SLACK_WEBHOOK_URL     Slack webhook for alerts"
    echo "  EMAIL_RECIPIENT       Email recipient for alerts"
    echo "  CHECK_INTERVAL        Monitoring interval in seconds (default: 300)"
    echo "  ALERT_THRESHOLD       Consecutive failures before alert (default: 3)"
}

# Main function
main() {
    case "${1:-check}" in
        "check")
            perform_health_check
            ;;
        "monitor")
            start_monitoring
            ;;
        "dashboard")
            generate_dashboard
            ;;
        "help")
            show_help
            ;;
        *)
            echo "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"