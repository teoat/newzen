
# Start production monitoring
export ALERT_EMAIL_ENABLED=true
export ALERT_EMAIL_RECIPIENTS=admin@zenith.local
export SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR_WEBHOOK

# Run monitoring
./scripts/health_monitor_automated.sh monitor &
