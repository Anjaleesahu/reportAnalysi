from datetime import datetime
from typing import Any, Dict, List, Optional

from app.db.mongodb import lab_values_collection, next_sequence


def create(
    user_id: int,
    report_id: int,
    test_name: str,
    value: float,
    unit: str,
    status: str,
    reference_range: Optional[str],
    tested_at: datetime,
) -> Dict[str, Any]:
    doc = {
        "_id": next_sequence("lab_values"),
        "user_id": user_id,
        "report_id": report_id,
        "test_name": test_name,
        "value": value,
        "unit": unit,
        "status": status,
        "reference_range": reference_range,
        "tested_at": tested_at,
    }
    lab_values_collection.insert_one(doc)
    return doc


def list_by_user(user_id: int) -> List[Dict[str, Any]]:
    return list(lab_values_collection.find({"user_id": user_id}).sort("tested_at", 1))


def list_by_report(report_id: int) -> List[Dict[str, Any]]:
    return list(lab_values_collection.find({"report_id": report_id}).sort("tested_at", 1))


def get_for_user(lab_id: int, user_id: int) -> Optional[Dict[str, Any]]:
    return lab_values_collection.find_one({"_id": lab_id, "user_id": user_id})


def update(lab_id: int, fields: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if fields:
        lab_values_collection.update_one({"_id": lab_id}, {"$set": fields})
    return lab_values_collection.find_one({"_id": lab_id})


def delete(lab_id: int) -> None:
    lab_values_collection.delete_one({"_id": lab_id})


def delete_by_report(report_id: int) -> None:
    lab_values_collection.delete_many({"report_id": report_id})


def delete_by_user(user_id: int) -> None:
    lab_values_collection.delete_many({"user_id": user_id})
