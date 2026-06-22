from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/.env  (config.py lives at backend/app/core/config.py -> parents[2] == backend)
ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # MongoDB connection
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB_NAME: str = "health_companion"

    # JWT auth — REQUIRED (no default): must be supplied via .env / environment
    # so a known secret is never shipped in source. App fails fast if missing.
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # External services
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    # Used automatically when the primary model is overloaded (503/UNAVAILABLE)
    GEMINI_FALLBACK_MODEL: str = "gemini-2.0-flash"
    TESSERACT_CMD: Optional[str] = None


settings = Settings()
