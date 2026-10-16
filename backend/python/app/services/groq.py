import httpx

from app.core.config import settings
from app.core.errors import ServiceError


class GroqClient:
    def __init__(self) -> None:
        self._base = settings.groq_base_url.rstrip("/")

    def enabled(self) -> bool:
        return bool(settings.groq_api_key.strip())

    async def health(self) -> bool:
        if not self.enabled():
            return False
        try:
            timeout = httpx.Timeout(8.0, connect=2.0)
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.get(
                    f"{self._base}/models",
                    headers=self._headers(),
                )
                return response.is_success
        except httpx.HTTPError:
            return False

    async def chat(self, messages: list[dict[str, str]]) -> str:
        if not self.enabled():
            raise ServiceError("Groq is not configured.", 503)

        payload = {
            "model": settings.groq_model,
            "messages": messages,
            "temperature": 0.2,
        }
        try:
            timeout = httpx.Timeout(60.0, connect=5.0)
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.post(
                    f"{self._base}/chat/completions",
                    headers=self._headers(),
                    json=payload,
                )
        except httpx.HTTPError as exc:
            raise ServiceError("Groq could not be reached.", 503) from exc

        if response.status_code == 401:
            raise ServiceError("The Groq API key was rejected.", 503)
        if response.status_code == 429:
            raise ServiceError("Groq's free limit is used up for now. Try again later.", 429)
        if response.status_code >= 400:
            raise ServiceError("Groq rejected the request.", 502)

        try:
            content = response.json()["choices"][0]["message"]["content"]
        except (ValueError, KeyError, IndexError, TypeError) as exc:
            raise ServiceError("Groq returned an unreadable answer.", 502) from exc

        if not isinstance(content, str) or not content.strip():
            raise ServiceError("Groq returned an empty answer.", 502)

        return content.strip()

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {settings.groq_api_key.strip()}",
            "Content-Type": "application/json",
        }
