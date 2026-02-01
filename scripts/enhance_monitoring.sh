
#!/bin/bash
# Enhanced monitoring with custom alert rules

echo "Setting up enhanced monitoring..."

# Create custom alert configuration
cat > monitoring_config.json << EOF
{
  "alert_rules": {
    "high_error_rate": {
      "condition": "error_rate > 0.1",
      "severity": "warning",
      "message": "High error rate detected"
    },
    "slow_response_time": {
      "condition": "avg_response_time > 500",
      "severity": "warning", 
      "message": "Slow response times detected"
    },
    "cache_miss_rate": {
      "condition": "cache_miss_rate > 0.3",
      "severity": "info",
      "message": "High cache miss rate"
    },
    "memory_usage": {
      "condition": "memory_usage > 0.8",
      "severity": "critical",
      "message": "High memory usage"
    }
  },
  "notification_channels": ["email", "slack", "webhook"]
}
EOF

echo "Enhanced monitoring configuration created!"
        