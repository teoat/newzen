import json
from typing import List, Dict
from app.core.redis_client import get_redis


class ConversationMemory:
    def __init__(self, session_id: str, limit: int = 10):
        self.session_id = f"conv:{session_id}"
        self.limit = limit
        self.redis = get_redis()

    def add_message(self, role: str, content: str):
        if not self.redis:
            return

        message = {"role": role, "content": content}
        self.redis.lpush(self.session_id, json.dumps(message))
        self.redis.ltrim(self.session_id, 0, self.limit - 1)
        # Set expiry to 1 hour
        self.redis.expire(self.session_id, 3600)

    def get_history(self) -> List[Dict[str, str]]:
        if not self.redis:
            return []

        history = self.redis.lrange(self.session_id, 0, -1)
        # Redis returns newest first due to lpush, we want chronological
        messages = [json.loads(m) for m in history]
        return messages[::-1]

    def clear(self):
        if self.redis:
            self.redis.delete(self.session_id)
