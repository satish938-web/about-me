from app.core.errors import ServiceError
from app.schemas.chat import ChatMessage
from app.services.groq import GroqClient
from app.services.knowledge import Knowledge
from app.services.ollama import OllamaClient


class ChatService:
    def __init__(self, knowledge: Knowledge, ollama: OllamaClient, groq: GroqClient) -> None:
        self._knowledge = knowledge
        self._ollama = ollama
        self._groq = groq

    async def reply(self, messages: list[ChatMessage]) -> ChatMessage:
        if messages[-1].role != "user":
            raise ServiceError("The last message should be a question.", 400)

        payload = [{"role": "system", "content": self._knowledge.system_prompt()}]
        payload.extend({"role": message.role, "content": message.content} for message in messages)
        model = self._groq if self._groq.enabled() else self._ollama
        answer = await model.chat(payload)
        return ChatMessage(role="assistant", content=answer)
