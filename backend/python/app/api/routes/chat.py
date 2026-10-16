from fastapi import APIRouter

from app.api.dependencies import chat_service
from app.schemas.chat import ChatRequest, ChatResponse

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest) -> ChatResponse:
    message = await chat_service.reply(body.messages)
    return ChatResponse(message=message)
