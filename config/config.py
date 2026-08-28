import os
import secrets
from dataclasses import dataclass, field
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()


def _origins(value: str) -> list[str]:
    return [origin.strip() for origin in value.split(",") if origin.strip()]


@dataclass(frozen=True)
class Settings:
    mongo_uri: str = os.getenv("MONGO_URI", "")
    database_name: str = os.getenv("MONGO_DB_NAME", "agriGuideAI")
    ai_api_key: str = os.getenv("AI_API_KEY") or os.getenv("GROQ_API_KEY", "")
    ai_api_url: str = os.getenv("AI_API_URL") or ("https://api.groq.com/openai/v1/chat/completions" if os.getenv("GROQ_API_KEY") else "")
    ai_model: str = os.getenv("AI_MODEL", "openai/gpt-oss-20b")
    ai_vision_model: str = os.getenv("AI_VISION_MODEL", "")
    hf_api_key: str = os.getenv("HF_API_KEY", "")
    hf_image_model: str = os.getenv("HF_IMAGE_MODEL", "Salesforce/blip-image-captioning-base")
    hf_image_api_url: str = os.getenv("HF_IMAGE_API_URL", "https://router.huggingface.co/hf-inference/models")
    weather_api_key: str = os.getenv("WEATHER_API_KEY", "")
    weather_api_url: str = os.getenv("WEATHER_API_URL", "https://api.openweathermap.org/data/2.5/weather")
    speech_api_key: str = os.getenv("SPEECH_API_KEY", "")
    allowed_origins: list[str] = field(default_factory=lambda: _origins(os.getenv("ALLOWED_ORIGINS", "http://127.0.0.1:5000,http://localhost:5000")))
    max_upload_bytes: int = int(os.getenv("MAX_UPLOAD_MB", "8")) * 1024 * 1024
    host: str = os.getenv("HOST", "127.0.0.1")
    port: int = int(os.getenv("PORT", "5000"))
    debug: bool = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    secret_key: str = os.getenv("FLASK_SECRET_KEY") or secrets.token_urlsafe(48)
    session_cookie_secure: bool = os.getenv("SESSION_COOKIE_SECURE", "false").lower() == "true"


settings = Settings()
