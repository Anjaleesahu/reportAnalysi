from datetime import datetime
from typing import Any, Dict, List, Optional

from app.db.mongodb import daily_tracks_collection, next_sequence


def get_by_user_and_date(user_id: int, date_dt: datetime) -> Optional[Dict[str, Any]]:
    return daily_tracks_collection.find_one({"user_id": user_id, "date": date_dt})


def update(track_id: int, fields: Dict[str, Any]) -> Dict[str, Any]:
    daily_tracks_collection.update_one({"_id": track_id}, {"$set": fields})
    return daily_tracks_collection.find_one({"_id": track_id})


def create(
    user_id: int,
    date_dt: datetime,
    sleep_hours: float,
    water_ml: int,
    symptoms: str,
    created_at: datetime,
) -> Dict[str, Any]:
    doc = {
        "_id": next_sequence("daily_tracks"),
        "user_id": user_id,
        "date": date_dt,
        "sleep_hours": sleep_hours,
        "water_ml": water_ml,
        "symptoms": symptoms,
        "created_at": created_at,
    }
    daily_tracks_collection.insert_one(doc)
    return doc


def list_by_user(user_id: int, limit: int) -> List[Dict[str, Any]]:
    return list(
        daily_tracks_collection.find({"user_id": user_id}).sort("date", -1).limit(limit)
    )


def list_since(user_id: int, since_dt: datetime) -> List[Dict[str, Any]]:
    return list(
        daily_tracks_collection.find({"user_id": user_id, "date": {"$gte": since_dt}})
    )
