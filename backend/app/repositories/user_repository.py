from datetime import datetime
from typing import Any, Dict, Optional

from app.db.mongodb import users_collection, next_sequence


def get_by_email(email: str) -> Optional[Dict[str, Any]]:
    return users_collection.find_one({"email": email})


def get_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    return users_collection.find_one({"_id": user_id})


def create(
    email: str,
    hashed_password: str,
    full_name: Optional[str],
    created_at: datetime,
    sex: Optional[str] = None,
    date_of_birth: Optional[datetime] = None,
) -> Dict[str, Any]:
    doc = {
        "_id": next_sequence("users"),
        "email": email,
        "hashed_password": hashed_password,
        "full_name": full_name,
        "sex": sex,
        "date_of_birth": date_of_birth,
        "created_at": created_at,
    }
    users_collection.insert_one(doc)
    return doc


def update_fields(user_id: int, fields: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if fields:
        users_collection.update_one({"_id": user_id}, {"$set": fields})
    return users_collection.find_one({"_id": user_id})


def set_password(user_id: int, hashed_password: str) -> None:
    users_collection.update_one(
        {"_id": user_id}, {"$set": {"hashed_password": hashed_password}}
    )
