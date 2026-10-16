from app.services.chat import ChatService
from app.services.groq import GroqClient
from app.services.knowledge import Knowledge
from app.services.ollama import OllamaClient

knowledge = Knowledge()
ollama = OllamaClient()
groq = GroqClient()
chat_service = ChatService(knowledge, ollama, groq)
