from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    SECRET_KEY: str = "scholarfill.ai_super_secret_key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    DATABASE_URL: str = "sqlite+aiosqlite:///./scholarfill.ai.db"
    GROQ_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    # AI provider: "groq" or "gemini"
    AI_PROVIDER: str = "groq"
    # Optional model override — leave empty to use provider default
    AI_MODEL: str = ""
    UPLOAD_DIR: str = "./uploads"
    FRONTEND_URL: str = "http://localhost:5173"

    # Google OAuth 2.0 — fill in after creating credentials at console.cloud.google.com
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/auth/google/callback"

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
