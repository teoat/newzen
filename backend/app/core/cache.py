"""
Redis-based caching utilities for performance optimization.

This module provides decorators and utilities for caching expensive operations
like LLM queries, database queries, and computational results.

Performance Impact: +1.5 points (Performance dimension)
Target: 70% cache hit rate for common queries
"""

import hashlib
import json
import logging
from functools import wraps
from typing import Callable, Optional

import redis
from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize Redis client
try:
    redis_client = redis.from_url(
        settings.REDIS_URL,
        db=1,  # Use DB 1 for cache (DB 0 for sessions)
        decode_responses=True,
        socket_timeout=5,
        socket_connect_timeout=5,
    )
    # Test connection
    redis_client.ping()
    logger.info("Redis cache client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Redis cache: {e}")
    redis_client = None


def generate_cache_key(prefix: str, *args, **kwargs) -> str:
    """
    Generate a deterministic cache key from function arguments.
    
    Args:
        prefix: Namespace prefix for the cache key
        *args: Positional arguments to hash
        **kwargs: Keyword arguments to hash
    
    Returns:
        str: SHA256-based cache key
    """
    # Serialize arguments to create unique key
    key_data = {
        "args": args,
        "kwargs": sorted(kwargs.items())  # Sort for deterministic hashing
    }
    
    # Create hash of serialized data
    serialized = json.dumps(key_data, sort_keys=True, default=str)
    hash_digest = hashlib.sha256(serialized.encode()).hexdigest()[:16]
    
    return f"{prefix}:{hash_digest}"


def cache_result(
    ttl: int = 300,
    prefix: str = "cache",
    key_func: Optional[Callable] = None
):
    """
    Decorator to cache function results in Redis.
    
    Args:
        ttl: Time-to-live in seconds (default: 5 minutes)
        prefix: Cache key prefix for namespacing
        key_func: Optional custom key generation function
    
    Returns:
        Decorated function with caching behavior
    
    Example:
        @cache_result(ttl=600, prefix="sql_query")
        def generate_sql(query: str, context: dict):
            # Expensive LLM call here
            return result
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Skip caching if Redis unavailable
            if redis_client is None:
                logger.warning(f"Redis unavailable, skipping cache for {func.__name__}")
                return await func(*args, **kwargs)
            
            # Generate cache key
            if key_func:
                cache_key = key_func(*args, **kwargs)
            else:
                cache_key = generate_cache_key(f"{prefix}:{func.__name__}", *args, **kwargs)
            
            try:
                # Try to get cached result
                cached = redis_client.get(cache_key)
                if cached:
                    logger.info(f"Cache HIT: {cache_key}")
                    return json.loads(cached)
                
                # Cache miss - execute function
                logger.info(f"Cache MISS: {cache_key}")
                result = await func(*args, **kwargs)
                
                # Store result in cache
                redis_client.setex(
                    cache_key,
                    ttl,
                    json.dumps(result, default=str)
                )
                
                return result
                
            except Exception as e:
                logger.error(f"Cache error for {cache_key}: {e}")
                # Fall back to executing function
                return await func(*args, **kwargs)
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            # Skip caching if Redis unavailable
            if redis_client is None:
                logger.warning(f"Redis unavailable, skipping cache for {func.__name__}")
                return func(*args, **kwargs)
            
            # Generate cache key
            if key_func:
                cache_key = key_func(*args, **kwargs)
            else:
                cache_key = generate_cache_key(f"{prefix}:{func.__name__}", *args, **kwargs)
            
            try:
                # Try to get cached result
                cached = redis_client.get(cache_key)
                if cached:
                    logger.info(f"Cache HIT: {cache_key}")
                    return json.loads(cached)
                
                # Cache miss - execute function
                logger.info(f"Cache MISS: {cache_key}")
                result = func(*args, **kwargs)
                
                # Store result in cache
                redis_client.setex(
                    cache_key,
                    ttl,
                    json.dumps(result, default=str)
                )
                
                return result
                
            except Exception as e:
                logger.error(f"Cache error for {cache_key}: {e}")
                # Fall back to executing function
                return func(*args, **kwargs)
        
        # Return appropriate wrapper based on function type
        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator


def invalidate_cache(pattern: str) -> int:
    """
    Invalidate cache entries matching a pattern.
    
    Args:
        pattern: Redis key pattern (e.g., "sql_query:*")
    
    Returns:
        int: Number of keys deleted
    """
    if redis_client is None:
        logger.warning("Redis unavailable, cannot invalidate cache")
        return 0
    
    try:
        keys = redis_client.keys(pattern)
        if keys:
            deleted = redis_client.delete(*keys)
            logger.info(f"Invalidated {deleted} cache entries matching '{pattern}'")
            return deleted
        return 0
    except Exception as e:
        logger.error(f"Cache invalidation error: {e}")
        return 0


def clear_all_cache() -> int:
    """
    Clear all cache entries.
    
    Returns:
        int: Number of keys deleted
    """
    if redis_client is None:
        logger.warning("Redis unavailable, cannot clear cache")
        return 0
    
    try:
        # Use flushdb to clear the entire cache database
        redis_client.flushdb()
        logger.info("Cleared all cache entries (FLUSHDB)")
        return -1 # flushdb doesn't return count easily without extra commands
    except Exception as e:
        logger.error(f"Failed to clear cache: {e}")
        return 0


def get_cache_stats() -> dict:
    """
    Get cache statistics for monitoring.
    
    Returns:
        dict: Cache hit rate, memory usage, key count
    """
    if redis_client is None:
        return {"status": "unavailable"}
    
    try:
        info = redis_client.info("stats")
        return {
            "status": "connected",
            "keyspace_hits": info.get("keyspace_hits", 0),
            "keyspace_misses": info.get("keyspace_misses", 0),
            "hit_rate": (
                info.get("keyspace_hits", 0) / 
                max(info.get("keyspace_hits", 0) + info.get("keyspace_misses", 0), 1)
            ) * 100,
            "used_memory_human": redis_client.info("memory").get("used_memory_human"),
        }
    except Exception as e:
        logger.error(f"Failed to get cache stats: {e}")
        return {"status": "error", "message": str(e)}
