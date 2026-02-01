
#!/bin/bash
# Database optimization

echo "Analyzing database performance..."

# Check slow queries
echo "Slow Query Analysis:"
docker exec zenith_db psql -U zenith -d zenith_lite -c "
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;"

# Check index usage
echo "Index Usage Analysis:"
docker exec zenith_db psql -U zenith -d zenith_lite -c "
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read 
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;"

echo "Database optimization recommendations:"
echo "1. Consider adding indexes on frequently queried columns"
echo "2. Optimize complex queries with proper joins"
echo "3. Use connection pooling for better resource utilization"

echo "Database optimization complete!"
        