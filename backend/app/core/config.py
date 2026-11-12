"""Application configuration using pydantic-settings"""
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./rescueai.db"
    SECRET_KEY: str = "rescue-ai-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    FRONTEND_URL: str = "http://localhost:3000"
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    GOOGLE_MAPS_API_KEY: Optional[str] = None
    DEMO_MODE: bool = True
    APP_NAME: str = "RESCUE AI"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
