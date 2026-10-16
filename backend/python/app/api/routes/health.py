from fastapi import APIRouter

from app.api.dependencies import groq, ollama
from app.core.config import settings

router = APIRouter()


@router.get("/health")
async def health() -> dict[str, str]:
    if groq.enabled():
        reachable = await groq.health()
        model = settings.groq_model
    else:
        reachable = await ollama.health()
        model = settings.ollama_model
    return {
        "ai": "ok",
        "ollama": "ok" if reachable else "down",
        "model": model,
    }
