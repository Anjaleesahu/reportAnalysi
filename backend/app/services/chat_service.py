from typing import Any, Dict

from app.repositories import lab_value_repository
from app.services.gemini_service import get_chatbot_response
from app.schemas.chat import ChatRequest


def reply_to_user(user_id: int, chat_req: ChatRequest) -> Dict[str, Any]:
    # Fetch lab history as clinical context
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

    return {"reply": ai_reply}
