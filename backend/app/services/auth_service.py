from datetime import date, datetime, timezone
from typing import Any, Dict, Optional

from fastapi import HTTPException, status

from app.core.security import hash_password, verify_password, create_access_token
from app.repositories import user_repository
from app.db.serializers import serialize_user


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
    if "full_name" in fields and fields["full_name"] is not None:
        update["full_name"] = fields["full_name"]
    if "sex" in fields and fields["sex"] is not None:
        update["sex"] = fields["sex"]
    if "date_of_birth" in fields and fields["date_of_birth"] is not None:
        update["date_of_birth"] = _to_datetime(fields["date_of_birth"])
    updated = user_repository.update_fields(user_id, update)
    return serialize_user(updated)


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
