"""
Central configuration. Every module reads settings from here instead of
calling os.environ directly, so we only have ONE place to manage secrets.
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    gemini_api_key: str = ""
    gemini_model: str = "gemini-flash-lite-latest"
    fastapi_secret_key: str = "dev-secret"
    frontend_origin: str = "http://localhost:3000"

    class Config:
        env_file = ".env"


settings = Settings()
