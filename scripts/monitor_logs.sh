#!/bin/bash

# Zenith Log Monitor
# Filters structured JSON logs for forensic patterns and errors.

LOG_FILE="backend/logs/backend.log"

if [ ! -f "$LOG_FILE" ]; then
    echo "Waiting for logs to be generated at $LOG_FILE..."
    # If in docker, we might want to tail docker logs instead
    # tail -f $(docker inspect --format='{{.LogPath}}' zenith_backend) | jq .
fi

echo "--- ZENITH FORENSIC ACTIVITY STREAM ---"
echo "Filtering for: ALERT, CRITICAL, ERROR, and SENTINEL patterns."

tail -f "$LOG_FILE" | while read -r line; do
    # Try to parse as JSON, fallback to raw if fails
    if echo "$line" | jq -e . >/dev/null 2>&1; then
        level=$(echo "$line" | jq -r .level)
        message=$(echo "$line" | jq -r .message)
        timestamp=$(echo "$line" | jq -r .timestamp)
        
        # Colorize based on level
        case $level in
            "CRITICAL") color="\033[0;31m" ;;
            "ERROR") color="\033[1;31m" ;;
            "WARNING") color="\033[1;33m" ;;
            *) color="\033[0;34m" ;;
        esac
        
        # Highlight Sentinel patterns
        if [[ "$message" == *"SENTINEL"* ]]; then
            color="\033[1;35m" # Purple for Sovereign alerts
        fi
        
        echo -e "[${timestamp}] ${color}${level}\033[0m: ${message}"
        
        # If extra data exists, show interesting bits
        extra=$(echo "$line" | jq -r .extra // "null")
        if [ "$extra" != "null" ]; then
            echo "  └─ Context: $extra"
        fi
    else
        echo "$line"
    fi
done
