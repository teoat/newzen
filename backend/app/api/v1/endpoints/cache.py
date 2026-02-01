"""
Cache Statistics and Management Endpoints
Provides visibility into Redis cache performance
"""

from fastapi import APIRouter, Depends
from typing import Dict, Any
from app.core.cache import get_cache_stats, invalidate_cache, clear_all_cache
from app.core.auth import get_current_user
from app.models import User

router = APIRouter()


@router.get("/stats")
async def cache_statistics(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get cache performance statistics.
    
    Returns:
        - total_hits: Number of cache hits
        - total_misses: Number of cache misses
        - hit_rate: Percentage of requests served from cache
        - total_keys: Number of keys in cache
        - memory_usage: Cache memory usage in MB
    """
    stats = get_cache_stats()
    
    return {
        "status": "success",
        "stats": {
            "total_hits": stats.get("hits", 0),
            "total_misses": stats.get("misses", 0),
            "hit_rate": stats.get("hit_rate", 0.0),
            "total_keys": stats.get("total_keys", 0),
            "memory_usage_mb": stats.get("memory_usage_mb", 0),
            "uptime_seconds": stats.get("uptime", 0)
        }
    }


@router.post("/invalidate")
async def invalidate_cache_key(
    prefix: str,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Invalidate cache entries by prefix.
    
    Args:
        prefix: Cache key prefix to invalidate
        
    Returns:
        Success message with number of keys invalidated
    """
    count = invalidate_cache(prefix)
    
    return {
        "status": "success",
        "message": f"Invalidated {count} cache keys with prefix '{prefix}'",
        "count": count
    }


@router.post("/clear")
async def clear_cache(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Clear all cache entries (admin only).
    
    WARNING: This will clear the entire cache!
    """
    # Check if user is admin
    if current_user.role != "admin":
        return {
            "status": "error",
            "message": "Only administrators can clear the entire cache"
        }
    
    count = clear_all_cache()
    
    return {
        "status": "success",
        "message": f"Cleared {count} cache keys",
        "count": count
    }


@router.get("/health")
async def cache_health() -> Dict[str, Any]:
    """
    Check Redis cache connectivity and health.
    
    Returns:
        Health status of cache system
    """
    try:
        from app.core.cache import redis_client
        
        # Test Redis connection
        redis_client.ping()
        
        return {
            "status": "healthy",
            "cache_available": True,
            "message": "Redis cache is operational"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "cache_available": False,
            "error": str(e),
            "message": "Redis cache is not available"
        }
