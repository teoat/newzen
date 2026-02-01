import json
import functools
import hashlib
import logging
from typing import Callable
import redis
from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize Redis client
# Try to connect to Redis, fallback to None if it fails
try:
    redis_client = redis.Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        db=settings.REDIS_DB,
        decode_responses=True
    )
    redis_client.ping()
    logger.info("Successfully connected to Redis for caching")
except Exception as e:
    logger.warning(f"Failed to connect to Redis: {e}. Caching will be disabled.")
    redis_client = None

def cache_result(expire: int = 3600, key_prefix: str = "zenith:cache"):
    """
    Decorator to cache the result of a function in Redis.
    The cache key is generated from function name and arguments.
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            if not redis_client:
                return await func(*args, **kwargs)

            # Generate cache key
            key_parts = [key_prefix, func.__name__]
            # Add arguments to key, handling non-serializable objects by using their string representation
            processed_args = [str(arg) for arg in args if not hasattr(arg, 'db')] # Skip DB sessions
            processed_kwargs = {k: str(v) for k, v in kwargs.items() if k != 'db'}
            
            arg_str = json.dumps({"args": processed_args, "kwargs": processed_kwargs}, sort_keys=True)
            arg_hash = hashlib.md5(arg_str.encode()).hexdigest()
            key_parts.append(arg_hash)
            
            cache_key = ":".join(key_parts)

            try:
                # Try to get from cache
                cached_data = redis_client.get(cache_key)
                if cached_data:
                    logger.debug(f"Cache hit for key: {cache_key}")
                    return json.loads(cached_data)
            except Exception as e:
                logger.error(f"Error reading from cache: {e}")

            # Execute function
            result = await func(*args, **kwargs)

            try:
                # Save to cache
                if result is not None:
                    redis_client.setex(
                        cache_key,
                        expire,
                        json.dumps(result)
                    )
                    logger.debug(f"Cached result for key: {cache_key}")
            except Exception as e:
                logger.error(f"Error writing to cache: {e}")

            return result

        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            if not redis_client:
                return func(*args, **kwargs)

            key_parts = [key_prefix, func.__name__]
            processed_args = [str(arg) for arg in args if not hasattr(arg, 'db')]
            processed_kwargs = {k: str(v) for k, v in kwargs.items() if k != 'db'}
            
            arg_str = json.dumps({"args": processed_args, "kwargs": processed_kwargs}, sort_keys=True)
            arg_hash = hashlib.md5(arg_str.encode()).hexdigest()
            key_parts.append(arg_hash)
            
            cache_key = ":".join(key_parts)

            try:
                cached_data = redis_client.get(cache_key)
                if cached_data:
                    return json.loads(cached_data)
            except Exception as e:
                logger.error(f"Error reading from cache: {e}")

            result = func(*args, **kwargs)

            try:
                if result is not None:
                    redis_client.setex(
                        cache_key,
                        expire,
                        json.dumps(result)
                    )
            except Exception as e:
                logger.error(f"Error writing to cache: {e}")

            return result

        import inspect
        if inspect.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    return decorator
