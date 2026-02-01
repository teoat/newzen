
#!/bin/bash
# Cache scaling and optimization

echo "Analyzing cache usage patterns..."

# Get current cache statistics
echo "Current Cache Stats:"
redis-cli hgetall "cache:l1:metrics"
redis-cli hgetall "cache:l2:metrics"

# Determine optimal L1 size based on hit rate
HIT_RATE=$(redis-cli hget "batch_processor:metrics" "cache_hit_rate" | cut -d. -f1)
if (( $(echo "$HIT_RATE < 70" | bc -l) )); then
    echo "Low hit rate detected - increasing L1 cache size"
    # Update configuration for larger L1 cache
    sed -i 's/L1_CACHE_SIZE=1000/L1_CACHE_SIZE=2000/' backend/.env
    echo "L1 cache size increased to 2000 entries"
fi

echo "Cache optimization complete!"
        