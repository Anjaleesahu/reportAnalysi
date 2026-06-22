from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class ChatMessage(BaseModel):
    role: str  # "user" or "model" / "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []


class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: str
    content: str
    created_at: Optional[datetime] = None
