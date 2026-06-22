from typing import List

from fastapi import APIRouter, Depends

from app.schemas.chat import ChatRequest, ChatMessageResponse
from app.services import chat_service
from app.api.deps import get_current_user

router = APIRouter(tags=["AI Health Chatbot"])


@router.post("")
@router.post("/")
def chat_with_assistant(chat_req: ChatRequest, current_user: dict = Depends(get_current_user)):
    # Registered for both "/api/chat" and "/api/chat/" so the frontend's
    # slash-less call is served directly instead of via a 307 redirect.
    return chat_service.reply_to_user(current_user["_id"], chat_req)


@router.get("/history", response_model=List[ChatMessageResponse])
def get_chat_history(current_user: dict = Depends(get_current_user)):
    return chat_service.get_history(current_user["_id"])


@router.delete("/history")
def clear_chat_history(current_user: dict = Depends(get_current_user)):
    return chat_service.clear_history(current_user["_id"])
