import os
from typing import Optional


class KeyManager:
    """
    Manages API keys with load balancing and fallback rotation.
    Designed for GEMINI_API_KEYS (comma-separated).
    """

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(KeyManager, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        keys_str = os.getenv("GEMINI_API_KEYS", "")
        self.keys = [k.strip() for k in keys_str.split(",") if k.strip()]
        self.current_index = 0
        self.failed_keys = set()

    def get_key(self) -> Optional[str]:
        """Returns the next available API key in round-robin fashion."""
        if not self.keys:
            return None
        # Simple round-robin
        key = self.keys[self.current_index]
        self.current_index = (self.current_index + 1) % len(self.keys)
        return key

    def report_failure(self, key: str):
        """
        Reports a key failure. In a more complex system, this would
        quarantine the key. For now, it just logs it.
        """
        self.failed_keys.add(key)
        print(f"KeyManager: Key {key[:4]}... reported as failed.")

    def get_working_key_count(self) -> int:
        return len(self.keys)
