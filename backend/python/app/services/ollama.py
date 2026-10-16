import httpx

from app.core.config import settings
from app.core.errors import ServiceError


class OllamaClient:
    def __init__(self) -> None:
        self._base = settings.ollama_base_url.rstrip("/")

    async def health(self) -> bool:
        try:
            timeout = httpx.Timeout(2.0, connect=0.8)
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.get(f"{self._base}/api/tags")
                return response.is_success
        except httpx.HTTPError:
            return False

    async def chat(self, messages: list[dict[str, str]]) -> str:
        payload = {
            "model": settings.ollama_model,
            "messages": messages,
            "stream": False,
        }
        try:
            timeout = httpx.Timeout(120.0, connect=0.8)
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.post(f"{self._base}/api/chat", json=payload)
        except httpx.ConnectError as exc:
            raise ServiceError(
                "Ollama is not running. Start it on this machine, then try again.",
                503,
            ) from exc
        except httpx.HTTPError as exc:
            raise ServiceError(
                "Ollama is not running. Start it on this machine, then try again.",
                503,
            ) from exc

        if response.status_code == 404:
            raise ServiceError(
                f"Model '{settings.ollama_model}' is not installed. Pull it with Ollama, then try again.",
                503,
            )

        if response.status_code >= 400:
            raise ServiceError("The local model rejected the request.", 502)

        try:
            content = response.json().get("message", {}).get("content")
        except ValueError as exc:
            raise ServiceError("The local model returned an unreadable answer.", 502) from exc

        if not isinstance(content, str) or not content.strip():
            raise ServiceError("The local model returned an empty answer.", 502)

        return content.strip()
