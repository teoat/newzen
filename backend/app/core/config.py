import os
from pydantic_settings import BaseSettings


from pydantic import ConfigDict
try:
    import tomllib
except ImportError:
    # Fallback for older python or missing lib, though 3.11+ is expected
    import tomli as tomllib


def load_secrets():
    """Load secrets from secrets.toml if it exists."""
    import pathlib
    
    # Check current directory and parent directory for secrets.toml
    paths = [pathlib.Path("secrets.toml"), pathlib.Path("../secrets.toml")]
    
    for path in paths:
        if path.exists():
            try:
                with open(path, "rb") as f:
                    data = tomllib.load(f)
                    # Flatten [secrets] table if present
                    secrets = data.get("secrets", data)
                    
                    if "GEMINI_API_KEY" in secrets:
                        # Only set if not already in env (allow env override)
                        if not os.getenv("GEMINI_API_KEY"):
                            os.environ["GEMINI_API_KEY"] = secrets["GEMINI_API_KEY"]
            except Exception as e:
                print(f"Warning: Verified existence of secrets.toml but failed to load: {e}")
            break

load_secrets()


class Settings(BaseSettings):
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    # Standardized AI Models
    MODEL_FLASH: str = "gemini-2.0-flash"
    MODEL_PRO: str = "gemini-1.5-pro"
    
    # Monitoring & Observability
    SENTRY_DSN: str = os.getenv("SENTRY_DSN", "")
    ENABLE_PROMETHEUS: bool = os.getenv("ENABLE_PROMETHEUS", "true").lower() == "true"
    
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./zenith_lite.db")
    TESTING: bool = os.getenv("TESTING", "false").lower() == "true"
    
    @property
    def SECRET_KEY(self) -> str:
        key = os.getenv("SECRET_KEY")
        if not key:
            raise ValueError("FATAL: SECRET_KEY environment variable is not set. Cannot start securely.")
        return key
    
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # Reduced from 7 days to 30 minutes for security
    ALGORITHM: str = "HS256"
    requests_per_minute: int = 60
    
    @property
    def ENCRYPTION_SECRET(self) -> str:
        secret = os.getenv("ENCRYPTION_SECRET")
        if not secret:
            raise ValueError("FATAL: ENCRYPTION_SECRET environment variable is not set. Cannot start securely.")
        if len(secret) < 32:
            raise ValueError("FATAL: ENCRYPTION_SECRET must be at least 32 characters long.")
        return secret

    model_config = ConfigDict(extra="ignore", env_file=".env")


settings = Settings()
