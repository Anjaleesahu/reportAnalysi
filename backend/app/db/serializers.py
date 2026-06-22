"""Map MongoDB documents (with `_id`) to the dict shapes the API/Pydantic schemas expect."""
from typing import Any, Dict, List, Optional


def serialize_user(doc: Dict[str, Any]) -> Dict[str, Any]:
    dob = doc.get("date_of_birth")
    if hasattr(dob, "date"):  # stored as datetime in Mongo -> expose a plain date
        dob = dob.date()
    return {
        "id": doc["_id"],
        "email": doc["email"],
        "full_name": doc.get("full_name"),
        "sex": doc.get("sex"),
        "date_of_birth": dob,
        "created_at": doc.get("created_at"),
    }


def serialize_chat_message(doc: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": doc["_id"],
        "role": doc["role"],
        "content": doc["content"],
        "created_at": doc.get("created_at"),
    }


def serialize_lab_value(doc: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": doc["_id"],
        "report_id": doc.get("report_id"),
        "test_name": doc["test_name"],
        "value": doc["value"],
        "unit": doc.get("unit", ""),
        "status": doc.get("status", ""),
        "reference_range": doc.get("reference_range"),
        "tested_at": doc.get("tested_at"),
    }


def serialize_report(
    doc: Dict[str, Any],
    lab_values: Optional[List[Dict[str, Any]]] = None,
    detail: bool = False,
) -> Dict[str, Any]:
    out = {
        "id": doc["_id"],
        "filename": doc["filename"],
        "summary": doc.get("summary"),
        "created_at": doc.get("created_at"),
    }
    if detail:
        out["extracted_text"] = doc.get("extracted_text")
        out["lab_values"] = lab_values or []
    return out


def serialize_track(doc: Dict[str, Any]) -> Dict[str, Any]:
    # `date` is stored as a midnight datetime (Mongo has no date type); expose a plain date
    stored_date = doc.get("date")
    if hasattr(stored_date, "date"):
        stored_date = stored_date.date()
    return {
        "id": doc["_id"],
        "date": stored_date,
        "sleep_hours": doc.get("sleep_hours", 0.0),
        "water_ml": doc.get("water_ml", 0),
        "symptoms": doc.get("symptoms", ""),
        "created_at": doc.get("created_at"),
    }
