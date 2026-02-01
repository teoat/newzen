import os
import redis
import json
import hashlib
import functools
from datetime import datetime, UTC
from dotenv import load_dotenv
from typing import Callable, Any

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

try:
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    # Test connection
    redis_client.ping()
    print(f"Connected to Redis at {REDIS_URL}")
except Exception as e:
    print(f"Failed to connect to Redis: {e}")
    redis_client = None


def get_redis():
    return redis_client

# Helper methods for conversation storage


def append_message(session_id: str, role: str, text: str, limit: int = 10):
    if not redis_client:
        return
    key = f"conv:{session_id}"
    msg = {"role": role, "text": text, "timestamp": datetime.now(UTC).isoformat()}
    redis_client.lpush(key, json.dumps(msg))
    redis_client.ltrim(key, 0, limit - 1)
    redis_client.expire(key, 3600)  # 1 hour expiry


def get_history(session_id: str):
    if not redis_client:
        return []
    key = f"conv:{session_id}"
    history = redis_client.lrange(key, 0, -1)
    return [json.loads(m) for m in history][::-1]


def invalidate_cache_pattern(pattern: str):
    """Invalidate all cache keys matching pattern."""
    if not redis_client:
        return
    for key in redis_client.scan_iter(match=pattern):
        redis_client.delete(key)


def cache_endpoint(ttl: int = 300):
    """
    Decorator for caching endpoint responses in Redis.
    
    Args:
        ttl: Time-to-live in seconds (default 5 minutes)
    
    Usage:
        @cache_endpoint(ttl=300)
        async def get_nexus_graph(project_id: str, ...):
            ...
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            if not redis_client:
                return await func(*args, **kwargs)
            
            # Generate cache key from function name + args
            cache_parts = [func.__name__]
            
            # Add positional args (skip 'self' or 'cls')
            for arg in args:
                if hasattr(arg, '__dict__'):
                    continue  # Skip Session, Request objects
                cache_parts.append(str(arg))
            
            # Add keyword args (sorted for consistency)
            for k, v in sorted(kwargs.items()):
                if hasattr(v, '__dict__'):
                    continue
                cache_parts.append(f"{k}={v}")
            
            # Create hash for cache key
            cache_str = ":".join(cache_parts)
            cache_hash = hashlib.md5(cache_str.encode()).hexdigest()
            cache_key = f"cache:endpoint:{func.__name__}:{cache_hash}"
            
            # Try to get from cache
            cached = redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
            
            # Execute function
            result = await func(*args, **kwargs)
            
            # Store in cache
            try:
                redis_client.setex(
                    cache_key,
                    ttl,
                    json.dumps(result, default=str)
                )
            except Exception:
                pass  # Don't fail on cache errors
            
            return result
        
        return wrapper
    return decorator


class RedisStreamClient:
    """
    V3 Event Bus Client using Redis Streams.
    Handles durable message passing between Micro-Agents.
    """
    def __init__(self, stream_key: str, group_name: str = "zenith_v3_group"):
        self.redis = redis_client
        self.stream_key = stream_key
        self.group_name = group_name
        self._ensure_group()

    def _ensure_group(self):
        """Idempotently create consumer group."""
        if not self.redis:
            return
        try:
            self.redis.xgroup_create(self.stream_key, self.group_name, mkstream=True)
        except redis.exceptions.ResponseError as e:
            if "BUSYGROUP" not in str(e):
                print(f"Redis Stream Group Error: {e}")

    def publish_event(self, event_type: str, payload: dict) -> str:
        """
        Publish an event to the stream.
        Returns the generated Message ID.
        """
        if not self.redis:
            return "ERR_NO_REDIS"
        
        # Redis streams require flat dicts of strings/bytes usually, 
        # but modern clients handle json dumping if we want, or we manually serialize.
        # Here we serialize the payload wrapper.
        msg = {
            "type": event_type,
            "payload": json.dumps(payload, default=str),
            "timestamp": datetime.now(UTC).isoformat()
        }
        return self.redis.xadd(self.stream_key, msg)

    def consume_events(self, consumer_name: str, count: int = 1, block: int = 2000):
        """
        Consume events as part of the consumer group.
        """
        if not self.redis:
            return []
            
        try:
            # text is a list of [ [stream_key, [ [message_id, data_dict], ... ]] ]
            streams = self.redis.xreadgroup(
                self.group_name, 
                consumer_name, 
                {self.stream_key: ">"}, 
                count=count, 
                block=block
            )
            
            parsed_messages = []
            if streams:
                for stream, messages in streams:
                    for message_id, data in messages:
                        parsed_messages.append({
                            "id": message_id,
                            "type": data.get("type"),
                            "payload": json.loads(data.get("payload", "{}")),
                            "timestamp": data.get("timestamp")
                        })
            return parsed_messages
            
        except Exception as e:
            print(f"Stream Consume Error: {e}")
            return []

    def ack_message(self, message_id: str):
        """Acknowledge message processing completion."""
        if self.redis:
            self.redis.xack(self.stream_key, self.group_name, message_id)

