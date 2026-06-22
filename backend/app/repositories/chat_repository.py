from datetime import datetime
from typing import Any, Dict, List

from app.db.mongodb import chat_messages_collection, next_sequence


def add_message(user_id: int, role: str, content: str, created_at: datetime) -> Dict[str, Any]:
    doc = {
        "_id": next_sequence("chat_messages"),
        "user_id": user_id,
        "role": role,
        "content": content,
        "created_at": created_at,
    }
    chat_messages_collection.insert_one(doc)
    return doc


def list_by_user(user_id: int, limit: int = 100) -> List[Dict[str, Any]]:
    # Most recent `limit` messages, returned in chronological order.
    cursor = (
        chat_messages_collection.find({"user_id": user_id})
        .sort("created_at", -1)
        .limit(limit)
    )
    return list(reversed(list(cursor)))


def clear_by_user(user_id: int) -> int:
    result = chat_messages_collection.delete_many({"user_id": user_id})
    return result.deleted_count
