"""
Advanced Multi-Level Caching System
Implements L1/L2 caching hierarchy with intelligent invalidation
"""

import json
import hashlib
import time
import asyncio
import os
import logging
from typing import Any, Dict, List, Optional, Callable, TypeVar
from dataclasses import dataclass, asdict
from enum import Enum
from functools import wraps
from app.core.redis_client import redis_client

T = TypeVar('T')

class CacheLevel(Enum):
    L1_MEMORY = "l1_memory"  # Fastest, in-process
    L2_REDIS = "l2_redis"  # Fast, shared
    L3_DATABASE = "l3_database"  # Slow, persistent

class CacheStrategy(Enum):
    WRITE_THROUGH = "write_through"  # Write to cache and DB
    WRITE_BEHIND = "write_behind"   # Write to cache, then DB async
    WRITE_AROUND = "write_around"   # Bypass cache on write
    REFRESH_AHEAD = "refresh_ahead"  # Pre-fetch likely data

@dataclass
class CacheEntry:
    key: str
    value: Any
    created_at: float
    last_accessed: float
    access_count: int
    ttl: int
    size_bytes: int
    level: CacheLevel
    dependencies: List[str] = None

@dataclass
class CacheStats:
    hits: int = 0
    misses: int = 0
    sets: int = 0
    evictions: int = 0
    size_bytes: int = 0
    hit_rate: float = 0.0
    avg_response_time: float = 0.0

class AdvancedCacheManager:
    """
    Production-ready multi-level caching with intelligent strategies
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # L1 Cache (in-memory)
        self.l1_cache = {}
        self.l1_max_size = int(os.getenv("L1_CACHE_SIZE", "1000"))
        self.l1_ttl = int(os.getenv("L1_CACHE_TTL", "300"))  # 5 minutes
        
        # L2 Cache (Redis)
        self.l2_ttl = int(os.getenv("L2_CACHE_TTL", "3600"))  # 1 hour
        self.l2_compression = os.getenv("L2_COMPRESSION", "true").lower() == "true"
        
        # Cache dependencies for invalidation
        self.dependencies = {}
        self.dependency_graph = {}
        
        # Statistics
        self.stats = CacheStats()
        self.performance_log = []
        
        # Cache warming strategy
        self.warmup_queries = []
        
    async def get(self, key: str, level: Optional[CacheLevel] = None) -> Optional[Any]:
        """Get value from cache with multi-level fallback"""
        start_time = time.time()
        
        try:
            # Try L1 (memory) first
            if level != CacheLevel.L2_REDIS and level != CacheLevel.L3_DATABASE:
                l1_result = await self._get_l1(key)
                if l1_result is not None:
                    await self._record_hit(CacheLevel.L1_MEMORY, time.time() - start_time)
                    return l1_result
            
            # Try L2 (Redis) second
            if level != CacheLevel.L1_MEMORY and level != CacheLevel.L3_DATABASE:
                l2_result = await self._get_l2(key)
                if l2_result is not None:
                    # Promote to L1
                    await self._set_l1(key, l2_result)
                    await self._record_hit(CacheLevel.L2_REDIS, time.time() - start_time)
                    return l2_result
            
            # Miss - return None
            await self._record_miss(time.time() - start_time)
            return None
            
        except Exception as e:
            self.logger.error(f"Cache get error for key {key}: {e}")
            await self._record_miss(time.time() - start_time)
            return None
    
    async def set(self, key: str, value: Any, ttl: Optional[int] = None, 
                 strategy: CacheStrategy = CacheStrategy.WRITE_THROUGH,
                 dependencies: List[str] = None, level: Optional[CacheLevel] = None):
        """Set value in cache with strategy"""
        try:
            ttl = ttl or self.l1_ttl
            len(json.dumps(value, default=str).encode('utf-8'))
            
            # Cache dependencies
            if dependencies:
                self.dependencies[key] = dependencies
                for dep in dependencies:
                    if dep not in self.dependency_graph:
                        self.dependency_graph[dep] = []
                    self.dependency_graph[dep].append(key)
            
            # Set based on strategy
            if strategy == CacheStrategy.WRITE_THROUGH:
                # Set in all levels
                await self._set_l1(key, value, ttl, level)
                await self._set_l2(key, value, ttl)
                
            elif strategy == CacheStrategy.WRITE_BEHIND:
                # Set in cache immediately, update DB async
                await self._set_l1(key, value, ttl, level)
                await self._set_l2(key, value, ttl)
                
                # Async DB update would be handled by caller
                
            elif strategy == CacheStrategy.WRITE_AROUND:
                # Only set in cache levels specified
                if level != CacheLevel.L3_DATABASE:
                    await self._set_l1(key, value, ttl, level)
                if level != CacheLevel.L1_MEMORY:
                    await self._set_l2(key, value, ttl)
                    
            await self._record_set()
            
        except Exception as e:
            self.logger.error(f"Cache set error for key {key}: {e}")
    
    async def invalidate(self, pattern: str = None, keys: List[str] = None, 
                       dependencies: List[str] = None, cascade: bool = True):
        """Invalidate cache entries with cascade support"""
        try:
            keys_to_invalidate = []
            
            if pattern:
                # Get all keys matching pattern
                all_keys = list(self.l1_cache.keys()) + await self._get_l2_keys()
                import fnmatch
                keys_to_invalidate.extend([k for k in all_keys if fnmatch.fnmatch(k, pattern)])
            
            if keys:
                keys_to_invalidate.extend(keys)
            
            if dependencies:
                # Get all dependent keys
                for dep in dependencies:
                    if dep in self.dependency_graph:
                        keys_to_invalidate.extend(self.dependency_graph[dep])
            
            # Remove duplicates
            keys_to_invalidate = list(set(keys_to_invalidate))
            
            # Invalidate from L1
            for key in keys_to_invalidate:
                if key in self.l1_cache:
                    del self.l1_cache[key]
            
            # Invalidate from L2
            if redis_client:
                for key in keys_to_invalidate:
                    await redis_client.delete(key)
            
            # Clean up dependencies
            for key in keys_to_invalidate:
                if key in self.dependencies:
                    del self.dependencies[key]
            
            self.logger.info(f"Invalidated {len(keys_to_invalidate)} cache entries")
            
        except Exception as e:
            self.logger.error(f"Cache invalidation error: {e}")
    
    async def warm_up(self, queries: List[Dict[str, Any]]):
        """Pre-populate cache with likely-accessed data"""
        try:
            self.warmup_queries = queries
            warmup_tasks = []
            
            for query in queries:
                task = self._create_warmup_task(query)
                warmup_tasks.append(task)
            
            # Execute warmup concurrently
            if warmup_tasks:
                results = await asyncio.gather(*warmup_tasks, return_exceptions=True)
                
                success_count = sum(1 for r in results if r is True)
                self.logger.info(f"Cache warmup completed: {success_count}/{len(warmup_tasks)} entries")
            
        except Exception as e:
            self.logger.error(f"Cache warmup error: {e}")
    
    def cache_result(self, key_prefix: str = "", ttl: Optional[int] = None, 
                    strategy: CacheStrategy = CacheStrategy.WRITE_THROUGH,
                    level: Optional[CacheLevel] = None):
        """Decorator for caching function results"""
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Generate cache key
                key = self._generate_cache_key(key_prefix, func.__name__, args, kwargs)
                
                # Try to get from cache
                result = await self.get(key, level=level)
                if result is not None:
                    return result
                
                # Execute function
                start_time = time.time()
                result = await func(*args, **kwargs)
                time.time() - start_time
                
                # Cache the result
                dependencies = self._extract_dependencies(result)
                await self.set(key, result, ttl, strategy, dependencies, level)
                
                return result
            return wrapper
        return decorator
    
    async def _get_l1(self, key: str) -> Optional[Any]:
        """Get from L1 (memory) cache"""
        if key in self.l1_cache:
            entry = self.l1_cache[key]
            if time.time() - entry.created_at < entry.ttl:
                entry.last_accessed = time.time()
                entry.access_count += 1
                return entry.value
            else:
                # Expired, remove
                del self.l1_cache[key]
        return None
    
    async def _set_l1(self, key: str, value: Any, ttl: int, level: Optional[CacheLevel] = None):
        """Set in L1 (memory) cache"""
        if level == CacheLevel.L2_REDIS or level == CacheLevel.L3_DATABASE:
            return
            
        # Check if we need to evict
        if len(self.l1_cache) >= self.l1_max_size:
            await self._evict_l1()
        
        entry = CacheEntry(
            key=key,
            value=value,
            created_at=time.time(),
            last_accessed=time.time(),
            access_count=0,
            ttl=ttl,
            size_bytes=len(json.dumps(value, default=str).encode('utf-8')),
            level=CacheLevel.L1_MEMORY
        )
        
        self.l1_cache[key] = entry
    
    async def _get_l2(self, key: str) -> Optional[Any]:
        """Get from L2 (Redis) cache"""
        if not redis_client:
            return None
            
        try:
            cached_data = await redis_client.get(key)
            if cached_data:
                if self.l2_compression:
                    # Decompress if needed
                    import gzip
                    import pickle
                    data = pickle.loads(gzip.decompress(cached_data))
                else:
                    data = json.loads(cached_data)
                
                # Promote to L1
                await self._set_l1(key, data)
                return data
            return None
            
        except Exception as e:
            self.logger.error(f"L2 cache get error: {e}")
            return None
    
    async def _set_l2(self, key: str, value: Any, ttl: int):
        """Set in L2 (Redis) cache"""
        if not redis_client:
            return
            
        try:
            if self.l2_compression:
                # Compress and pickle
                import gzip
                import pickle
                data = gzip.compress(pickle.dumps(value))
            else:
                data = json.dumps(value, default=str)
            
            await redis_client.setex(key, ttl or self.l2_ttl, data)
            
        except Exception as e:
            self.logger.error(f"L2 cache set error: {e}")
    
    async def _get_l2_keys(self) -> List[str]:
        """Get all keys from L2 (Redis) cache"""
        if not redis_client:
            return []
            
        try:
            return await redis_client.keys("*")
        except Exception:
            return []
    
    async def _evict_l1(self):
        """Evict entries from L1 cache using LRU"""
        if not self.l1_cache:
            return
            
        # Sort by last accessed time
        sorted_entries = sorted(self.l1_cache.items(), 
                             key=lambda x: x[1].last_accessed)
        
        # Remove oldest entries (25% of cache)
        evict_count = max(1, int(len(sorted_entries) * 0.25))
        
        for i in range(evict_count):
            key = sorted_entries[i][0]
            del self.l1_cache[key]
        
        self.stats.evictions += evict_count
    
    def _generate_cache_key(self, prefix: str, func_name: str, 
                          args: tuple, kwargs: dict) -> str:
        """Generate cache key from function parameters"""
        key_parts = [prefix, func_name]
        
        # Add args (excluding complex objects)
        for arg in args:
            if hasattr(arg, '__dict__'):
                continue  # Skip complex objects
            key_parts.append(str(arg))
        
        # Add sorted kwargs
        for k, v in sorted(kwargs.items()):
            if hasattr(v, '__dict__'):
                continue  # Skip complex objects
            key_parts.append(f"{k}:{v}")
        
        key_string = ":".join(key_parts)
        return hashlib.md5(key_string.encode()).hexdigest()
    
    def _extract_dependencies(self, result: Any) -> List[str]:
        """Extract cache dependencies from result"""
        dependencies = []
        
        # If result is a dict, look for dependency indicators
        if isinstance(result, dict):
            for key, value in result.items():
                if 'id' in key.lower() or 'user_id' in key.lower():
                    dependencies.append(f"{key}:{value}")
                elif isinstance(value, list) and value:
                    dependencies.extend([f"{key}_list:{item}" for item in value[:10]])
        
        return dependencies
    
    def _create_warmup_task(self, query: Dict[str, Any]) -> Callable:
        """Create a warmup task from query"""
        async def task():
            try:
                # Execute the warmup query
                result = await query['function'](*query.get('args', []), **query.get('kwargs', {}))
                
                # Cache the result
                key = query.get('cache_key', self._generate_cache_key(
                    "warmup", query['function'].__name__, 
                    query.get('args', []), query.get('kwargs', {})
                ))
                
                await self.set(key, result, query.get('ttl', self.l1_ttl))
                return True
                
            except Exception as e:
                self.logger.error(f"Warmup task failed: {e}")
                return False
        
        return task
    
    async def _record_hit(self, level: CacheLevel, response_time: float):
        """Record cache hit statistics"""
        self.stats.hits += 1
        self.performance_log.append({
            'type': 'hit',
            'level': level.value,
            'response_time': response_time,
            'timestamp': time.time()
        })
        
        # Update hit rate
        total = self.stats.hits + self.stats.misses
        self.stats.hit_rate = self.stats.hits / total if total > 0 else 0
        
        # Update avg response time
        if self.performance_log:
            recent_times = [log['response_time'] for log in self.performance_log[-100:]]
            self.stats.avg_response_time = sum(recent_times) / len(recent_times)
    
    async def _record_miss(self, response_time: float):
        """Record cache miss statistics"""
        self.stats.misses += 1
        self.performance_log.append({
            'type': 'miss',
            'response_time': response_time,
            'timestamp': time.time()
        })
        
        # Update hit rate
        total = self.stats.hits + self.stats.misses
        self.stats.hit_rate = self.stats.hits / total if total > 0 else 0
        
        # Update avg response time
        if self.performance_log:
            recent_times = [log['response_time'] for log in self.performance_log[-100:]]
            self.stats.avg_response_time = sum(recent_times) / len(recent_times)
    
    async def _record_set(self):
        """Record cache set statistics"""
        self.stats.sets += 1
    
    def get_stats(self) -> Dict[str, Any]:
        """Get comprehensive cache statistics"""
        return {
            **asdict(self.stats),
            'l1_size': len(self.l1_cache),
            'l1_capacity': self.l1_max_size,
            'l1_utilization': len(self.l1_cache) / self.l1_max_size if self.l1_max_size > 0 else 0,
            'dependency_count': len(self.dependencies),
            'performance_samples': len(self.performance_log)
        }
    
    def optimize_for_pattern(self, access_pattern: Dict[str, float]):
        """Optimize cache configuration based on access patterns"""
        try:
            # Analyze access patterns to optimize TTL and sizes
            hot_keys = [k for k, v in access_pattern.items() if v > 0.1]  # 10%+ access rate
            
            if hot_keys:
                # Increase TTL for hot keys
                for key_pattern in hot_keys:
                    # This would require pattern matching against actual keys
                    pass
                
                # Consider increasing L1 size for hot content
                if len(hot_keys) > self.l1_max_size * 0.8:
                    self.l1_max_size = min(self.l1_max_size * 2, 5000)  # Cap at 5000
                    self.logger.info(f"Increased L1 cache size to {self.l1_max_size}")
            
        except Exception as e:
            self.logger.error(f"Cache optimization error: {e}")

# Singleton instance
advanced_cache = AdvancedCacheManager()

# Convenience decorators
def cache_query_result(key_prefix: str = "", ttl: int = 300, 
                    strategy: CacheStrategy = CacheStrategy.WRITE_THROUGH):
    """Decorator for caching query results"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            key = advanced_cache._generate_cache_key(key_prefix, func.__name__, args, kwargs)
            
            # Try cache first
            result = await advanced_cache.get(key)
            if result is not None:
                return result
            
            # Execute function
            result = await func(*args, **kwargs)
            
            # Cache result
            await advanced_cache.set(key, result, ttl, strategy)
            
            return result
        return wrapper
    return decorator

def cache_user_data(user_id_field: str = "user_id", ttl: int = 600):
    """Decorator for caching user-specific data"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract user ID from kwargs
            user_id = kwargs.get(user_id_field)
            if not user_id:
                # Try to get from args
                for arg in args:
                    if hasattr(arg, user_id_field):
                        user_id = getattr(arg, user_id_field)
                        break
            
            if not user_id:
                return await func(*args, **kwargs)
            
            key = f"user:{user_id}:{func.__name__}"
            
            # Try cache first
            result = await advanced_cache.get(key)
            if result is not None:
                return result
            
            # Execute function
            result = await func(*args, **kwargs)
            
            # Cache with user dependency
            await advanced_cache.set(key, result, ttl, dependencies=[f"user:{user_id}"])
            
            return result
        return wrapper
    return decorator