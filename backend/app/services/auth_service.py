from datetime import date, datetime, timezone
from typing import Any, Dict, Optional

from fastapi import HTTPException, status

from app.core.security import hash_password, verify_password, create_access_token
from app.repositories import (
    user_repository,
    report_repository,
    lab_value_repository,
    tracking_repository,
    chat_repository,
)
from app.db.serializers import (
    serialize_user,
    serialize_report,
    serialize_lab_value,
    serialize_track,
    serialize_chat_message,
)


def _to_datetime(d: Optional[date]) -> Optional[datetime]:
    """Mongo has no date type; store calendar dates as midnight UTC datetimes."""
    if d is None:
        return None
    return datetime(d.year, d.month, d.day, tzinfo=timezone.utc)


def register_user(
    email: str,
    password: str,
    full_name: Optional[str],
    sex: Optional[str] = None,
    date_of_birth: Optional[date] = None,
) -> dict:
    if user_repository.get_by_email(email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already exists")

    user_repository.create(
        email=email,
        hashed_password=hash_password(password),
        full_name=full_name,
        created_at=datetime.now(timezone.utc),
        sex=sex,
        date_of_birth=_to_datetime(date_of_birth),
    )
    return {"message": "User created successfully"}


def update_profile(user_id: int, fields: Dict[str, Any]) -> dict:
    update = {}
    if fields.get("full_name") is not None:
        update["full_name"] = fields["full_name"]
    if fields.get("sex") is not None:
        update["sex"] = fields["sex"]
    if fields.get("date_of_birth") is not None:
        update["date_of_birth"] = _to_datetime(fields["date_of_birth"])
    if fields.get("sleep_goal") is not None:
        update["sleep_goal"] = fields["sleep_goal"]
    if fields.get("water_goal") is not None:
        update["water_goal"] = fields["water_goal"]
    updated = user_repository.update_fields(user_id, update)
    return serialize_user(updated)


def export_account(user: Dict[str, Any]) -> dict:
    """Return every piece of the user's data as a JSON-serializable dict."""
    user_id = user["_id"]
    return {
        "profile": serialize_user(user),
        "reports": [
            serialize_report(r, detail=True) for r in report_repository.list_by_user(user_id)
        ],
        "lab_values": [serialize_lab_value(l) for l in lab_value_repository.list_by_user(user_id)],
        "daily_tracks": [serialize_track(t) for t in tracking_repository.list_all_by_user(user_id)],
        "chat_messages": [serialize_chat_message(m) for m in chat_repository.list_by_user(user_id, limit=10000)],
    }


def delete_account(user_id: int) -> dict:
    """Permanently delete the user and all associated data."""
    lab_value_repository.delete_by_user(user_id)
    report_repository.delete_by_user(user_id)
    tracking_repository.delete_by_user(user_id)
    chat_repository.clear_by_user(user_id)
    user_repository.delete(user_id)
    return {"message": "Account and all associated data deleted."}


def change_password(user: Dict[str, Any], current_password: str, new_password: str) -> dict:
    if not verify_password(current_password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )
    user_repository.set_password(user["_id"], hash_password(new_password))
    return {"message": "Password updated successfully"}


def authenticate(username: str, password: str) -> dict:
    user = user_repository.get_by_email(username)

    # Single generic error for both cases to avoid leaking which emails exist.
    if not user or not verify_password(password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    token = create_access_token({"sub": user["email"]})
    return {"access_token": token, "token_type": "bearer"}
