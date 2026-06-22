from datetime import datetime, timezone
from typing import Any, Dict, List

from app.repositories import lab_value_repository, chat_repository
from app.services.gemini_service import get_chatbot_response
from app.db.serializers import serialize_chat_message
from app.schemas.chat import ChatRequest


def get_history(user_id: int) -> List[Dict[str, Any]]:
    return [serialize_chat_message(m) for m in chat_repository.list_by_user(user_id)]


def clear_history(user_id: int) -> Dict[str, int]:
    return {"deleted": chat_repository.clear_by_user(user_id)}


def reply_to_user(user_id: int, chat_req: ChatRequest) -> Dict[str, Any]:
    # Build lab history as clinical context
    lab_history = []
    for lab in lab_value_repository.list_by_user(user_id):
        tested_at = lab.get("tested_at")
        lab_history.append({
            "test_name": lab["test_name"],
            "value": lab["value"],
            "unit": lab.get("unit"),
            "status": lab.get("status"),
            "reference_range": lab.get("reference_range"),
            "tested_at": tested_at.strftime("%Y-%m-%d") if tested_at else None,
        })

    chat_history_dicts = [{"role": msg.role, "content": msg.content} for msg in chat_req.history]

    ai_reply = get_chatbot_response(
        user_message=chat_req.message,
        chat_history=chat_history_dicts,
        lab_history=lab_history,
    )

    # Persist the exchange (only after a successful reply)
    now = datetime.now(timezone.utc)
    chat_repository.add_message(user_id, "user", chat_req.message, now)
    chat_repository.add_message(user_id, "model", ai_reply, now)

    return {"reply": ai_reply}
