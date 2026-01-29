import os
from pydantic_settings import BaseSettings


from pydantic import ConfigDict


class Settings(BaseSettings):
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./zenith_lite.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "7b9d8e7c8f...change_in_production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ALGORITHM: str = "HS256"
    requests_per_minute: int = 60
    ENCRYPTION_SECRET: str = os.getenv("ENCRYPTION_SECRET", "default_secret_32_bytes_long_12345")

    model_config = ConfigDict(extra="ignore", env_file=".env")


settings = Settings()
