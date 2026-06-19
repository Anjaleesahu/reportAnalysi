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

    # JWT auth
    JWT_SECRET: str = "supersecretjwtsecretkeychangeinproduction1234567890"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # External services
    GEMINI_API_KEY: str = ""
    TESSERACT_CMD: Optional[str] = None


settings = Settings()
