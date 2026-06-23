from datetime import datetime
from typing import Any, Dict, List, Optional

from app.db.mongodb import reports_collection, next_sequence


def create(
    user_id: int,
    filename: str,
    file_path: str,
    extracted_text: Optional[str],
    created_at: datetime,
    summary: Optional[str] = None,
) -> Dict[str, Any]:
    doc = {
        "_id": next_sequence("medical_reports"),
        "user_id": user_id,
        "filename": filename,
        "file_path": file_path,
        "extracted_text": extracted_text,
        "summary": summary,
        "created_at": created_at,
    }
    reports_collection.insert_one(doc)
    return doc


def list_by_user(user_id: int, skip: int = 0, limit: int = 0) -> List[Dict[str, Any]]:
    cursor = reports_collection.find({"user_id": user_id}).sort("created_at", -1)
    if skip:
        cursor = cursor.skip(skip)
    if limit:
        cursor = cursor.limit(limit)
    return list(cursor)


def count_by_user(user_id: int) -> int:
    return reports_collection.count_documents({"user_id": user_id})


def get_for_user(report_id: int, user_id: int) -> Optional[Dict[str, Any]]:
    return reports_collection.find_one({"_id": report_id, "user_id": user_id})


def delete(report_id: int) -> None:
    reports_collection.delete_one({"_id": report_id})


def delete_by_user(user_id: int) -> None:
    reports_collection.delete_many({"user_id": user_id})
