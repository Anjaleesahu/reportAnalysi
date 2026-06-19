from typing import List

from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: str  # "user" or "model" / "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []
