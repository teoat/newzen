
#!/bin/bash
# Performance monitoring with cache analytics

echo "Cache Performance Analysis:"
echo "L1 Cache Hit Rate: $(redis-cli hget monitoring:metrics cache_hit_rate || echo '0')"
echo "Average Response Time: $(redis-cli hget monitoring:metrics avg_response_time || echo '0')"
echo "Current L1 Utilization: $(redis-cli hget monitoring:metrics l1_utilization || echo '0')"

echo "Database Performance:"
docker stats zenith_db --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo "API Performance:"
curl -w "@%{{time_total}}" -o /dev/null -s http://localhost:8200/health
        