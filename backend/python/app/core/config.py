from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

SERVICE_ROOT = Path(__file__).resolve().parents[2]
REPO_ROOT = SERVICE_ROOT.parents[1]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=SERVICE_ROOT / ".env",
        extra="ignore",
    )

    ollama_base_url: str = "http://127.0.0.1:11434"
    ollama_model: str = "llama3.2"
    groq_api_key: str = ""
    groq_model: str = "openai/gpt-oss-20b"
    groq_base_url: str = "https://api.groq.com/openai/v1"
    content_dir: Path | None = None
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_origins(cls, value: object) -> object:
        if isinstance(value, str):
            text = value.strip()
            if text.startswith("["):
                return value
            return [part.strip() for part in text.split(",") if part.strip()]
        return value

    @property
    def resolved_content_dir(self) -> Path:
        if self.content_dir is not None:
            return self.content_dir
        return REPO_ROOT / "content"


settings = Settings()
