import os
import redis
import json
from datetime import datetime
from dotenv import load_dotenv

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
    msg = {"role": role, "text": text, "timestamp": datetime.utcnow().isoformat()}
    redis_client.lpush(key, json.dumps(msg))
    redis_client.ltrim(key, 0, limit - 1)
    redis_client.expire(key, 3600)  # 1 hour expiry


def get_history(session_id: str):
    if not redis_client:
        return []
    key = f"conv:{session_id}"
    history = redis_client.lrange(key, 0, -1)
    return [json.loads(m) for m in history][::-1]
