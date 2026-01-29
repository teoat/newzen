"""
Redis Query Cache Module
Provides caching layer for expensive database queries.
"""

from typing import Optional, Any, Callable
from functools import wraps
import json
import hashlib
from app.core.redis_client import redis_client


class QueryCache:
    """
    Redis-backed query result cache with TTL support.
    """

    def __init__(self, default_ttl: int = 300):
        """
        Args:
            default_ttl: Default time-to-live in seconds (5 minutes)
        """
        self.default_ttl = default_ttl
        self.prefix = "query_cache:"

    def _generate_key(self, func_name: str, *args, **kwargs) -> str:
        """Generate unique cache key from function and arguments"""
        # Create deterministic hash from arguments
        key_data = {
            "func": func_name,
            "args": str(args),
            "kwargs": sorted(kwargs.items())
        }
        key_json = json.dumps(key_data, sort_keys=True)
        key_hash = hashlib.md5(key_json.encode()).hexdigest()
        return f"{self.prefix}{func_name}:{key_hash}"

    def get(self, key: str) -> Optional[Any]:
        """Get cached value"""
        try:
            cached = redis_client.client.get(key)
            if cached:
                return json.loads(cached)
            return None
        except Exception as e:
            print(f"Cache get error: {e}")
            return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set cached value with TTL"""
        try:
            ttl = ttl or self.default_ttl
            serialized = json.dumps(value, default=str)
            redis_client.client.setex(key, ttl, serialized)
            return True
        except Exception as e:
            print(f"Cache set error: {e}")
            return False

    def invalidate(self, pattern: str) -> int:
        """Invalidate all keys matching pattern"""
        try:
            keys = redis_client.client.keys(f"{self.prefix}{pattern}*")
            if keys:
                return redis_client.client.delete(*keys)
            return 0
        except Exception as e:
            print(f"Cache invalidate error: {e}")
            return 0

    def cached(self, ttl: Optional[int] = None):
        """
        Decorator to cache function results.

        Usage:
            @query_cache.cached(ttl=600)
            async def expensive_query(project_id: str):
                # ... expensive operation
                return results
        """
        def decorator(func: Callable):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Generate cache key
                cache_key = self._generate_key(func.__name__, *args, **kwargs)

                # Try to get from cache
                cached_result = self.get(cache_key)
                if cached_result is not None:
                    print(f"Cache HIT: {func.__name__}")
                    return cached_result

                # Cache miss - execute function
                print(f"Cache MISS: {func.__name__}")
                result = await func(*args, **kwargs)

                # Store in cache
                self.set(cache_key, result, ttl)

                return result
            return wrapper
        return decorator


# Global cache instance
query_cache = QueryCache(default_ttl=300)  # 5 minutes default


# Convenience functions
def invalidate_project_cache(project_id: str):
    """Invalidate all cached queries for a project"""
    query_cache.invalidate(f"*project_id={project_id}*")


def invalidate_transaction_cache(project_id: str):
    """Invalidate transaction-related caches"""
    query_cache.invalidate(f"*transaction*{project_id}*")
    query_cache.invalidate(f"*scurve*{project_id}*")


def invalidate_user_cache(user_id: str):
    """Invalidate user-specific caches"""
    query_cache.invalidate(f"*user_id={user_id}*")
